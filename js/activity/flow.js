define([
    'd3utils',
    './activity',
    './../utils/aStarSearch',
    'd3'
],

function (helpers, ActivityViewModel, astar) {
    'use strict';

    var constants = {
        direction: {
            right: 1,
            down: 2,
            left: 3,
            up: 4,
            opposite: {
                "1": 3,
                "2": 4,
                "3": 1,
                "4": 2
            }
        },
        margin: 20,
        connection: {
            source: 0,
            target: 10
        },
        straitMistake: 2,
        hitMargin: 5
    };

    var viewConfig = {
        'stroke-width': 2,
        'stroke': '#888',
        selected: {
            'stroke': 'black'
        },
        invalid: {
            'stroke': 'red'
        }
    };

    var FlowViewModel = ActivityViewModel.extend({
        initialize: function (cfg) {

            this.model = cfg.model;

            if (this.model) {

                if (!this.model.get("points")) {
                    this.model.set(
                        {
                            points: [
                                {x: 0, y: 0},
                                {x: 50, y: 0},
                                {x: 50, y: 50},
                                {x: 100, y: 50}
                            ]
                        },
                        {silent: true});
                }
            }

            this.fromAlignment = 'right';
            this.toAlignment = 'left';

            !this.sourceCfg && (this.sourceCfg = {});
            !this.targetCfg && (this.targetCfg = {});

            ActivityViewModel.prototype.initialize.apply(this, [cfg]);

            this.defaultDrag = false;
            this.drawMarkerArrow();
        },

        offset: 20,
        isMultiSelectable: false,
        isGridAware: false,
        isNeedInfoBtn: true,

        getClasses: function () {
            return { 'activity': true };
        },

        bindEvents: function () {
            var self = this;
            var binded = this.connectorMouseDown.bind(this);
            this.rootNode.selectAll('.js-diagram-connector').on('mousedown', function() { binded(this); });
            this.activityG.on('click', this.activityOnclick.bind(this));
            this.activityG.selectAll('.flow-line-dragContainer').on('mousedown', this.flowLineMouseDown.bind(this));
            this.activityG.selectAll('.flow-line-dragPoint').on('mousedown', this.dragPointMouseDown.bind(this));
            this.activityG.selectAll('.flow-line-dragPoint').on('dblclick', this.dragPointDoubleClick.bind(this));
            this.activityG.selectAll('.flow-line-dragPoint').on('mouseenter', this.dragPointMouseEnter.bind(this));
            this.rootNode.on('mouseleave', this.dragPointMouseLeave.bind(this));

            if (this.infoBtn) {
                this.infoBtn.on('click', this.infoBtnOnclick.bind(this));
            }

            this.off("finishDrag");
            this.on('finishDrag', this.onFinishDrag.bind(this));
            this.off("connector-near");
            this.on('connector-near', this.showHighlightedConnectors.bind(this));
        },

        getCharge: function () {
            return 1;
        },

        dragPointMouseEnter: function() {

            if (!this.isNeedInfoBtn)
                return;

            var d3Target = d3.select(d3.event.target);
            this.mouseEnterSegment = {
                index: d3Target.property('index'),
                isHorizontal: d3Target.property('isHorizontal'),
                position: this.getEventPosition()
            };

            this.infoBtnShowTimer = setTimeout(this.showInfoBtnUser.bind(this), 200);

            d3Target.on("mousemove", function() {
                this.moveEvent = this.moveEvent || {};
                this.moveEvent.clientX = d3.event.clientX;
                this.moveEvent.clientY = d3.event.clientY;
                this.moveInfoButtonCloser();
            }.bind(this));
            d3Target.on("mouseleave", function() { this.moveEvent = null; d3Target.on("mousemove", null);}.bind(this));

        },

        debugRects: function() {
            _.each(this.getAffectedRects(), function(rect) {
                this.debugRect(rect);
            }.bind(this));
        },

        moveInfoButtonCloser: _.debounce(function() {
            if (!this.moveEvent)
                return;

            this.parent.hideActivityInfo();

            var closerTo = this.getEventPosition(this.moveEvent);
            var dx = helpers.substractPoint(closerTo, this.mouseEnterSegment.position);
            helpers.transformPoint(
                this.mouseEnterSegment.position,
                dx,
                this.mouseEnterSegment.isHorizontal ? [1, 0] : [0, 1]);

            this.syncInfoButtonPosition();

        }, 600),

        dragPointMouseLeave: function() {
            this.infoBtnShowTimer && clearTimeout(this.infoBtnShowTimer);
            this.hideInfoBtnUser();
        },

        bindHoverEvents: function() {
        },

        getInfoBtnPosition: function() {
            if (!this.mouseEnterSegment)
                //throw "I never expected you would call me before mouse actually enters one of my drag regions (dragPointMouseEnter)";
                return { x: 0, y: 0};

            var mouse = this.mouseEnterSegment.position;
            var isHorizontal = this.mouseEnterSegment.isHorizontal;

            if (this.mouseEnterSegment.index) {
                var rect = this.getPathSegmentVirtualBorders(this.currentPath[this.mouseEnterSegment.index]);

                if (rect == null) {
                    return {
                        x: 0,
                        y: 0
                    }
                }
            }
            else if (this.getPoints().length > 1) {
                var points = this.getPoints();

                var almostEnd = this.almostEnd(points[points.length-1], points[points.length-2], 10);
                rect = {
                    x: almostEnd.x - 10,
                    y: almostEnd.y - 10,
                    width: 20,
                    height: 20
                };

                isHorizontal = almostEnd.x == points[points.length-1].x;
            }


            var position = this.mouseEnterSegment.isHorizontal
                ? helpers.sumPoints([mouse.x, rect.y], [0, -5])
                : helpers.sumPoints([rect.x + rect.width, mouse.y], [0, 0]);

            return position;

        },

        getDraggedConnectors: function () {
            if (this.draggedConnector)
                return this.getD3ConnectorByIndex(this.draggedConnector.index);

            return this.connectorsG.selectAll('*');
        },

        clearDraggedStates: function() {
            delete this.preservedPoints;
            delete this.draggedConnector;
            delete this.draggedPathSegment;
        },

        onFinishDrag: function (cfg) {
            if (this.parent.activeEmbeddedProcessId)
                this.model.set("ownerEmbeddedProcessActivityId", this.parent.activeEmbeddedProcessId);


            if (!cfg.isLinked && this.draggedConnector)
                this.removeLinkPermament(this.draggedConnector.index);
            this.optimize();
            this.parent.setConnectorsVisibility(false);
            this.clearDraggedStates();
            this.setPoints();
        },

        getParentAffectedRange: function() {
            var points = _.chain(this.getPoints());

            var pointsX = points.pluck("x");
            var pointsY = points.pluck("y");

            var range = {
                x: pointsX.min().value(),
                y: pointsY.min().value()
            };

            range.width = pointsX.max().value() - range.x;
            range.height = pointsY.max().value() - range.y;

            range.x += this.getPosition().x;
            range.y += this.getPosition().y;

            return range;

        },

        changePath: function(p1, p2, newPath) {
            this.executeHopAwareAction(function() {
                var points = this.getPoints();
                var head = _.first(points, points.indexOf(p1)+1);
                var tail = _.rest(points, points.indexOf(p2));
                this.model.set({ "points": _.union(head, _.initial(_.rest(newPath)), tail)  });
            }.bind(this));
        },

        getDesiredDirection: function(x1, y1, x2, y2) {
            return x1 > x2 ? constants.direction.left : x1 < x2 ? constants.direction.right :
                y1 > y2 ? constants.direction.up : constants.direction.down;
        },

        // only for axis-oriented lines!
        doLineIntersectsRect: function(line, rect) {
            var direction = this.getDesiredDirection(line.x1, line.y1, line.x2, line.y2);

            if (direction == constants.direction.up)
                return rect.x < line.x1 && rect.x + rect.width > line.x1
                    && rect.y < line.y1
                    && rect.y + rect.height > line.y2;

            if (direction == constants.direction.down)
                return rect.x < line.x1 && rect.x + rect.width > line.x1
                    && rect.y < line.y2
                    && rect.y > line.y1;

            if (direction == constants.direction.left)
                    return rect.y < line.y1 && rect.y + rect.height > line.y1
                        && rect.x + rect.width > line.x2
                        && rect.x < line.x1;

            if (direction == constants.direction.right)
                return rect.y < line.y1 && rect.y + rect.height > line.y1
                    && rect.x > line.x1
                    && rect.x < line.x2;
        },

        getLineIntersectedRect: function(line, rects) {
            var self = this;
            return _.find(rects, function(rect) {
                return self.doLineIntersectsRect(line, rect);
            });
        },

        getViewModelsMarginated: function(list, effectiveMargin) {
            return _.map(list, function(viewModel) {
                var rect = viewModel.getPlacedRect();

                rect.x -= effectiveMargin;
                rect.y -= effectiveMargin;
                rect.width += 2 * effectiveMargin;
                rect.height += 2 * effectiveMargin;

                return this.localizeRect(rect);

            }, this);
        },

        getAllRects: function(margin) {
            var effectiveMargin = margin || constants.margin || 0;

            var viewModels = _.filter(
                this.parent.viewModels,
                function(viewModel) {
                    return !viewModel.isOfMetaType("Flow") && !viewModel.isOfType("Pool") && !viewModel.isOfType("Lane");
                }
            );

            return this.getViewModelsMarginated(viewModels, effectiveMargin);

        },

        getAffectedRectsInRange: function(rangeRect, margin) {
            var effectiveMargin = margin || constants.margin || 0;
            var effectiveRect = {
                x: rangeRect.x - effectiveMargin,
                y: rangeRect.y - effectiveMargin,
                width: rangeRect.width + effectiveMargin * 2,
                height: rangeRect.height + effectiveMargin * 2
            };

            var viewModels = _.filter(
                this.parent.getViewModelsInRange(effectiveRect),
                function(viewModel) {
                    return !viewModel.isOfMetaType("Flow") && !viewModel.isOfType("Pool") && !viewModel.isOfType("Lane");
                }
            );

            return this.getViewModelsMarginated(viewModels, effectiveMargin);
        },

        localizeRect: function(rect) {
            return _.extend({}, rect, helpers.substractPoint(rect, this.getPosition()));
        },

        getAffectedRects: function(margin) {
            return this.getAffectedRectsInRange(this.getParentAffectedRange());
        },

        getOptimizableConfig: function() {
            var points = this.getPoints();

            var sourceCfg = this.getLinkedSourceCfg();
            var targetCfg = this.getLinkedTargetCfg();

            var cfg = {
                startIdx: sourceCfg ? 1 : 0,
                endIdx: targetCfg ? points.length - 2 : points.length - 1,
                startAlign: sourceCfg ? this.getSourceMatchingConnector().alignment : null,
                endAlign: targetCfg ? this.getTargetMatchingConnector().alignment : null
            };
            cfg.start = points[cfg.startIdx];
            cfg.end = points[cfg.endIdx];
            cfg.tailSequence = _.last(points, points.length - 1 - cfg.endIdx);
            cfg.headSequence = _.first(points, cfg.startIdx + 1);

            return cfg;
        },

        getStandartAffectedRects: function(p1, p2, margin) {
            //return this.getAffectedRects();
            return this.getAllRects(margin)
        },

        optimizeHits: function() {
            var fullOptimize = true;

            var points = this.model.get("points");
            var changed = false;

            var rects = this.getStandartAffectedRects(constants.hitMargin);

            var cp = this.getOptimizableConfig().startIdx;

            while(cp < this.getOptimizableConfig().endIdx) {
                var p = points[cp];
                var hit = this.getRectOfPoint(p, rects);
                if (hit) {
                    changed = true;
                    if (fullOptimize)
                        break;

                    var head = this.getFirstOutboundPoint(points, rects);
                    var tail = this.getFirstOutboundPoint(_.rest(points, cp+1), rects);
                    var path = this.findPathFromPoints(head, tail, rects);
                    this.changePath(head, tail, path);

                    cp = points.indexOf(tail) + 1;
                    continue;
                }

                var np = points[cp+1];
                var line = {
                    x1: p.x,
                    y1: p.y,
                    x2: np.x,
                    y2: np.y
                };

                var lineHit = this.getLineIntersectedRect(line, rects);
                if (lineHit) {
                    changed = true;

                    if (fullOptimize)
                        break;

                    var sPath = this.findPathFromPoints(p, np, rects);
                    this.changePath(p, np, sPath);

                    cp = points.indexOf(np);

                    continue;
                }

                cp++;
            }

            if (fullOptimize && changed) {
                var cfg = this.getOptimizableConfig();
                //this.changePath(cfg.start, cfg.end, this.findDefaultPath(cfg.start, cfg.end));
                this.changePath(cfg.start, cfg.end, this.findDefaultPath(cfg.start, cfg.end));
            }

            return changed;
        },

        setDraggedConnector: function(index) {
            var d3con = this.getD3ConnectorByIndex(index);
            this.draggedConnector =  d3con.property('model');
            this.d3DragConnector = d3con;
            this.draggedPathSegment = false;
        },

        connectorMouseDown: function (d3this) {
            var index = d3this.getAttribute("index");
            this.setDraggedConnector(index);

            this.parent.onGlobalMouseUpOnce(function() {
                this.debouncingForMouseUp = false;
            }.bind(this));

            this.debouncingForMouseUp = true;
            this.debounceInitializeDrag(d3.event);

            d3.event.stopPropagation();
            return false;

        },



        getRectOfPoint: function(point, rects) {
            return _.find(rects, function(rect) {
                return (rect.x < point.x && rect.x + rect.width > point.x) &&
                    (rect.y < point.y && rect.y + rect.height > point.y);
            });
        },

        marginateRect: function(rect) {
            return {
                x: rect.x - constants.margin,
                y: rect.y - constants.margin,
                width: rect.width + constants.margin * 2,
                height: rect.height + constants.margin * 2
            }
        },

        getFirstOutboundPoint: function(points, rects) {
            var self = this;
            return _.find(points, function(p){
                return !self.getRectOfPoint(p, rects);
            });
        },

        getLastOutboundPoint: function(points, rects) {
            var self = this;
            var reversed = _.map(points, function(x) { return x; });
            reversed.reverse();

            return this.getFirstOutboundPoint(reversed, rects);
        },

        updateFromAlignment: function(linkedTarget, isTranslated) {
            if (this.preservedPoints)
                return;

            this.preservePoints();

            var cfg = this.getOptimizableConfig();
            var points = this.model.get("points");
            var start = points[cfg.endIdx];
            var end = isTranslated ? points[0] : helpers.substractPoint({ x: linkedTarget.x0, y: linkedTarget.y0 }, this.getPosition());
            var mount = this.getOffsetPoint(end, linkedTarget.alignment);
            var path = this.findDefaultPath(start, mount, this.alignmentVectors[cfg.endAlign], this.oppositeAlignmentVectors[linkedTarget.alignment]);
            path.reverse();
            this.changePoints(_.union([end], path, cfg.tailSequence));
            this.optimizePoints();
            this.drawCurve();
        },

        preservePoints: function() {
            this.preservedPoints = _.map(this.model.get("points"), function(p) { return _.extend({}, p); });
        },

        restorePreservedPoints: function() {
            if (!this.preservedPoints)
                return;

            this.changePoints(this.preservedPoints);
            delete this.preservedPoints;
        },

        setPoints: function(points) {
            if (points) this.model.set({ "points" : points}, { silent: true });
            else this.model.set("isModified", true);
        },

        isDefault: function() {
            return this.model.get("sequenceDefinition") && this.model.get("sequenceDefinition").isDefault;
        },

        updateToAlignment: function (linkedTarget, isTranslated) {
            if (this.preservedPoints)
                return;

            this.preservePoints();

            var cfg = this.getOptimizableConfig();
            var points = this.model.get("points");
            var start = _.last(cfg.headSequence);
            var end = isTranslated ? points[points.length-1] : helpers.substractPoint({ x: linkedTarget.x0, y: linkedTarget.y0 }, this.getPosition());
            var mount = this.getOffsetPoint(end, linkedTarget.alignment);
            var path = this.findDefaultPath(start, mount, this.alignmentVectors[cfg.startAlign]);
            this.changePoints(_.union(cfg.headSequence, path, [mount, end]));
            this.optimizePoints();
            this.drawCurve();
        },

        updateDraggedConnectorPosition: function(deltaMove) {
            this.setDraggedConnectorPosition(helpers.sumPoints(this.draggedConnector, deltaMove));
        },

        updateConnectorPosition: function(connector, deltaMove) {
            helpers.transformPoint(connector, deltaMove);
            ActivityViewModel.prototype.updateConnectorPosition.apply(this, arguments);
            this.connectorMoved(connector);
        },

        setDraggedConnectorPosition: function(position) {
            helpers.updatePoint(this.draggedConnector, position);
            this.syncConnectorNode(this.draggedConnector);
            this.draggedConnectorMoved();
        },

        setConnectorLinkedPosition: function(position, targetConnectorConfig) {
            if (this.draggedConnector.index == constants.connection.source)
                this.updateFromAlignment(targetConnectorConfig);
            else if (this.draggedConnector.index == constants.connection.target)
                this.updateToAlignment(targetConnectorConfig);

            this.syncConnectorNode(_.extend({}, this.draggedConnector, position));
        },

        updatePathSegmentPosition: function(delta, segment) {
            var effectiveSegment = segment || this.draggedPathSegment;

            this.executeHopAwareAction(function() {
                helpers.transformPoint(effectiveSegment.p1, delta, effectiveSegment.vector);
                helpers.transformPoint(effectiveSegment.p2, delta, effectiveSegment.vector);
            });

            this.redrawActivityG();
        },

        updatePosition: function (delta) {
            if (this.draggedConnector)
                this.updateDraggedConnectorPosition(delta);
            else if (this.draggedPathSegment)
                this.updatePathSegmentPosition(delta);
            else {
                this.executeHopAwareAction(function() {
                    ActivityViewModel.prototype.updatePosition.call(this, delta);
                    if (!this.parent.linked) {
                        this.restorePreservedPoints();
                        this.drawCurve();
                    }
                }.bind(this));
            }
        },

        setModelPosition: function (position) {
            if (!this.draggedConnector) {
                ActivityViewModel.prototype.setModelPosition.apply(this, arguments);
                return;
            }
            helpers.updatePoint(this.draggedConnector, position);
        },

        setDrawingPosition: function (position, targetConnectorConfig) {
            if (this.draggedConnector)
                return;

            ActivityViewModel.prototype.setDrawingPosition.apply(this, arguments);
        },

        drawCurve: function () {
            this.redrawActivityG();
            this.whenSelected(this.selected);
        },

        whenSelected: function(isSelected, isUserAction) {
            ActivityViewModel.prototype.whenSelected.apply(this, arguments);
            this.updateVisibleFlow();
            this.rootNode.selectAll('.when-flow-drag').classed("dev-diagram-flow-visible", isSelected);
        },

        updateVisibleFlow: function() {
            this.activityG.selectAll('.user-visible').attr(this.getStrokeAttrs());
            this.activityG.selectAll("[islast='1']").attr(this.getStrokeAttrs(true));
        },

        alignmentVectors: {
            'right': { x: 1, y: 0 },
            'left': { x: -1, y: 0 },
            'top': { x: 0, y: -1 },
            'bottom': { x: 0, y: 1 },
            'right-top': { x: 1, y: -1 },
            'right-bottom': { x: 1, y: 1 },
            'left-top': { x: -1, y: -1 },
            'left-bottom': { x: -1, y: 1 }
        },

        oppositeAlignmentVectors: {
            'right': { x: -1, y: 0 },
            'left': { x: 1, y: 0 },
            'top': { x: 0, y: 1 },
            'bottom': { x: 0, y: -1 },
            'right-top': { x: -1, y: 1 },
            'right-bottom': { x: -1, y: -1 },
            'left-top': { x: 1, y: 1 },
            'left-bottom': { x: 1, y: -1 }
        },

        findPathFromPoints: function(startPoint, endPoint, rects, startVector, finalVector) {
            var result = [];

            if (helpers.getDistance(startPoint.x, startPoint.y, endPoint.x, endPoint.y) < 20) {
                return [startPoint, endPoint];
            }

            var effectiveInitialVector = startVector || this.alignmentVectors[this.fromAlignment] || { x: 0, y: 0};
            var effectiveFinalVector = finalVector || this.oppositeAlignmentVectors[this.toAlignment] || { x: 0, y: 0};

            var hashCode = function(s){
                return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
            };

            var gridOptions = this.parent.grid && _.extend(
                {
                    hashOffset:
                    {
                        //x: (hashCode(this.getId()) % this.parent.grid.x) * 2,
                        //y: (hashCode(this.getId()) % this.parent.grid.y) * 2
                        x: 0,
                        y: 0
                    }
                },
                this.parent.grid);


            var path = astar.make(
                startPoint,
                endPoint,
                rects,
                gridOptions,
                effectiveInitialVector,
                effectiveFinalVector);

            result.push(startPoint);
            _.each(path, function(pathArc) {
                result.push({ x: pathArc.p2.x, y: pathArc.p2.y })
            });

            var i = 0;
            while (i < result.length-2) {
                var p = result[i];
                var np = result[i+1];
                var npp = result[i+2];

                if (Math.abs(p.y - np.y) < 1 && Math.abs(np.y - npp.y) < 1)
                    result.splice(i+1, 1);
                else if (Math.abs(p.x - np.x) < 1 && Math.abs(np.x - npp.x) < 1)
                    result.splice(i+1, 1);
                else i++;
            }

            return result;
        },

        findPath: function (startPointIdx, endPointIdx, rects) {
            var source = _.compact(this.getPoints());
            var inverse = false;

            if (endPointIdx < startPointIdx) {
                source.reverse();
                inverse = true;
                startPointIdx = source.length - 1 - startPointIdx;
                endPointIdx = source.length - 1 - endPointIdx;
            }

            var initialVector = false;
            var finalVector = false;
            if (startPointIdx > 0)
                initialVector = astar.vector(source[startPointIdx-1], source[startPointIdx])

            if (endPointIdx  < source.length-1 && endPointIdx > 0)
                finalVector = astar.vector(source[endPointIdx], source[endPointIdx+1])

            var result = this.findPathFromPoints(source[startPointIdx], source[endPointIdx], rects, initialVector, finalVector);

            if (inverse)
                result.reverse();

            return result;
        },

        getCurve: function () {
            var startIdx = 0;
            var endIdx = this.getPoints().length - 1;
            return this.findPath(startIdx, endIdx);
        },

        roundPoints: function (points) {
            for (var i = 0; i < points.length; i++) {
                points[i].x = Math.ceil(points[i].x);
                points[i].y = Math.ceil(points[i].y);
            }

            return points;
        },

        isPointOnLine: function (lineStart, lineEnd, point) {
            var minX, maxX, minY, maxY,
                isOnLine = false;

            if (lineStart.x == lineEnd.x) {
                minY = Math.min(lineStart.y, lineEnd.y);
                maxY = Math.max(lineStart.y, lineEnd.y);

                if (lineStart.x == point.x && minY <= point.y && point.y <= maxY)
                    isOnLine = true;

            } else {
                minX = Math.min(lineStart.x, lineEnd.x);
                maxX = Math.max(lineStart.x, lineEnd.x);

                if (lineStart.y == point.y && minX <= point.x && point.x <= maxX)
                    isOnLine = true;
            }

            return isOnLine;
        },

        setVirtualPosition: function (sourceCon, targetCon) {
            if (!this.draggedConnector) {
                ActivityViewModel.prototype.setVirtualPosition.apply(this, arguments);

                if (sourceCon.index === constants.connection.source)
                    this.updateFromAlignment(targetCon, true);
                else
                    this.updateToAlignment(targetCon, true);

                return;
            }

            if (this.draggedConnector != sourceCon)
                return;

            if (this.draggedConnector.index == constants.connection.source)
                this.fromAlignment = targetCon.alignment;
            else
                this.toAlignment = targetCon.alignment;

            var distance = helpers.getDistance(targetCon.x0, targetCon.y0, sourceCon.x0, sourceCon.y0);
            if (distance < helpers.LinkedDistance)
                this.setConnectorLinkedPosition(
                    helpers.substractPoint([targetCon.x0, targetCon.y0], this.getPosition()),
                    targetCon);

            this.drawCurve();
        },

        isLinkedWithActivity: function() {
            return this.model.get("connectors") && this.model.get("connectors").length > 0;
        },

        flowLineMouseDown: function () {
            if (this.isLinkedWithActivity())
                return;

            this.parent.onGlobalMouseUpOnce(function() {
                this.debouncingForMouseUp = false;
            }.bind(this));

            this.debouncingForMouseUp = true;
            this.debounceInitializeDrag(d3.event);

            d3.event.stopPropagation();
            return false;
            //
            //this.initializeDrag(event);
        },

        getStrokeAttrs: function(isLast) {
            var basic = _.extend({}, viewConfig);
            if (this.selected) _.extend(basic, basic.selected);

            if (isLast && this.isOfType("Flow"))
                _.extend(
                    basic,
                    {
                        'marker-end': this.selected ? 'url(#selectedArrowPath)' : 'url(#arrowPath)',
                        'islast': '1'
                    });

            return basic;
        },

        almostEnd: function(p, previousP, amount) {
            var dx = Math.abs(previousP.x - p.x);
            var dy = Math.abs(previousP.y - p.y);

            return {
                x: dx > 0 ? (p.x - amount * (p.x - previousP.x) / Math.abs(previousP.x - p.x)) : p.x,
                y: dy > 0 ? (p.y - amount * (p.y - previousP.y) / Math.abs(previousP.y - p.y)) : p.y
            }
        },

        getPoints: function() {
            return this.model.attributes.points;
        },

        getClonedPoints: function() {
            return _.map(this.model.attributes.points, function(p) { return { x: p.x, y: p.y }; });
        },

        getChainedPoints: function() {
            return _.chain(this.getPoints());
        },

        getPointsPairs: function() {
            return this.getChainedPoints().initial().map(function(p, idx) {
                return {
                    p1: p,
                    p2: this.getPoints()[idx+1],
                    index: idx
                }
            }.bind(this));
        },

        getHorizontalPairs: function() {
            return this.getPointsPairs().filter(function(pair) {
                if (pair.p1.y == pair.p2.y) {
                    pair.y = pair.p1.y;
                    pair.length = Math.abs(pair.p2.x - pair.p1.x);
                    return true;
                }
            });
        },

        getVerticalPairs: function() {
            return this.getPointsPairs().filter(function(pair) {
                if (pair.p1.x == pair.p2.x) {
                    pair.x = pair.p1.x;
                    pair.length = Math.abs(pair.p2.y - pair.p1.y)
                    return true;
                }
            });
        },

        rebasePoint: function(viewModel, point) {
            return {
                x: point.x + viewModel.model.attributes.position.x - this.model.attributes.position.x,
                y: point.y + viewModel.model.attributes.position.y - this.model.attributes.position.y
            }
        },

        rebasePair: function(viewModel, pair) {
            return {
                p1: this.rebasePoint(viewModel, pair.p1),
                p2: this.rebasePoint(viewModel, pair.p2),
                length: pair.length,
                x: pair.x ? this.rebasePoint(viewModel, { x: pair.x, y: 0 }).x : null,
                y: pair.y ? this.rebasePoint(viewModel, { x: 0, y: pair.y }).y : null
            }
        },

        findHops: function(flow) {

            var minLengthC = 10;
            function minLength(pair) {
                return pair.length > minLengthC;
            }

            var targetVerticals = flow.getVerticalPairs()
                .map(this.rebasePair.bind(this, flow))
                .filter(minLength);

            var localHorizontals = this.getHorizontalPairs().filter(minLength);

            var hops = [];
            var epsilon = 20;

            localHorizontals.each(function(localPair) {
                var match = targetVerticals.filter(function(targetPair) {
                    var targetNormalized = {
                        x: targetPair.x,
                        y1: Math.min(targetPair.p1.y, targetPair.p2.y),
                        y2: Math.max(targetPair.p1.y, targetPair.p2.y)
                    };

                    var localNormalized = {
                        y: localPair.y,
                        x1: Math.min(localPair.p1.x, localPair.p2.x),
                        x2: Math.max(localPair.p1.x, localPair.p2.x)
                    };

                    return (targetNormalized.y1 + epsilon < localNormalized.y) && (targetNormalized.y2 - epsilon > localNormalized.y) &&
                        (targetNormalized.x - epsilon > localNormalized.x1) && (targetNormalized.x + epsilon < localNormalized.x2)
                });

                match.each(function(targetPair) {
                    hops.push({
                        x: targetPair.x,
                        y: localPair.y,
                        index: localPair.index
                    })
                });
            });

            return hops;
        },

        findAllHops: function() {
            var hops = [];
            this.parent.getAllFlows().without(this).each(function(flow) {
                hops = _.union(hops, this.findHops(flow))
            }.bind(this));
            return hops;
        },

        getJoint: function(lastP, p, nextP) {
            var pdx = p.x - lastP.x;
            var pdy = p.y - lastP.y;
            var ndx = nextP.x - p.x;
            var ndy = nextP.y - p.y;

            if (Math.abs(pdx) > 0) {
                if (Math.abs(ndx) > 0)
                    return null;

                if (Math.abs(ndy) == 0)
                    return null;

                if (pdx > 0) {
                    if (ndy > 0)
                        return "0,1";
                    else
                        return "0,0"
                }
                else {
                    if (ndy > 0)
                        return "0,0";
                    else
                        return "0,1"
                }
            }

            if (Math.abs(pdy) > 0) {
                if (Math.abs(ndy) >  0)
                    return null;

                if (Math.abs(ndx) == 0)
                    return null;

                if (pdy < 0) {
                    if (ndx > 0)
                        return "0,1";
                    else
                        return "0,0"
                }
                else {
                    if (ndx > 0)
                        return "0,0";
                    else
                        return "0,1"
                }
            }

            return "0,0"
        },

        straightPathTo: function(source, target, index, hops) {
            if (source.y != target.y) {
                return "L" + target.x + "," + target.y + " ";
            }

            var path = [];



            var effectiveHops = _.where(hops, {index: index - 1});
            var orderedHops = _.sortBy(effectiveHops, function(hop) {
                return hop.x * (target.x - source.x) / Math.abs(target.x - source.x);
            });

            _.each(orderedHops, function(hop) {
                var almostHop = this.almostEnd(hop, source, 8);
                var almostAfterHop = this.almostEnd(hop, target, 8);
                path.push("L" + almostHop.x + "," + almostHop.y);
                path.push("A8,8 0 0,1" );
                path.push(almostAfterHop.x + "," + almostAfterHop.y);
            }.bind(this));

            path.push("L" + target.x + "," + target.y);

            return path.join(" ");
        },

        getSvgPathFromPoints: function(points, hops) {
            var svgPathD = ["M" + points[0].x + "," + points[0].y];
            var lastP = points[0];

            _.each(points, function(p, idx) {
                if (idx == 0)
                    return;

                var nextP = points[idx+1];

                var joint = nextP ? this.getJoint(lastP, p, nextP) : null;
                if (joint) {

                    if (idx != points.length - 1 && helpers.getDistance(p.x, p.y, lastP.x, lastP.y) < 8)
                        svgPathD.push(this.straightPathTo(lastP, p, idx, hops));
                    else if (idx != points.length - 1 && helpers.getDistance(p.x, p.y, nextP.x, nextP.y) < 8)
                        svgPathD.push(this.straightPathTo(lastP, p, idx, hops));
                    else {

                        var almostP = this.almostEnd(p, lastP, 8);
                        var almostPP = this.almostEnd(p, nextP, 8);
                        svgPathD.push(this.straightPathTo(lastP, almostP, idx, hops));
                        svgPathD.push("A8,8 0 " + joint + " " + almostPP.x + "," + almostPP.y);
                    }
                }
                else {
                    var ap = (idx == points.length - 1) ? this.almostEnd(p, lastP, 4) : p;
                    svgPathD.push(this.straightPathTo(lastP, ap, idx, hops));
                }

                lastP = p;

            }.bind(this));

            return svgPathD;
        },

        getSvgPath: function(ignoreHops) {
            return this.getSvgPathFromPoints(
                this.getPoints(),
                ignoreHops ? [] : this.findAllHops());
        },

        redrawPath: function() {

            var svgPathD = this.getSvgPath(false);

            var pathAttr = _.extend({
                'flow-line': true,
                'd': svgPathD.join(" "),
                'stroke-linejoin': 'round',
                'fill': 'none'
            }, this.getStrokeAttrs(true));

            var selector = this.activityG.select("path.js-diagram-flow-path");
            if (!selector.node()) {
                this.activityG.append("path")
                    .attr({
                        'd': svgPathD.join(" "),
                        'stroke-linejoin': 'round',
                        'fill': 'none'
                    })
                    .classed(
                    {
                        "diagram-activity-background": true
                    });

                this.activityG.append("path")
                    .attr(pathAttr)
                    .classed(
                    {
                        "js-diagram-flow-path": true,
                        "js-activity-shape": true,
                        "user-visible": true
                    });


            }
            else selector.attr(pathAttr);
        },

        appendViewItems: function (firstPointAlignment, lastPointAlignment) {
            this.redrawPath();

            var self = this;
            var path = self.getPath();
            var rectDragMargin = 12;

            self.currentPath = path;

            for (var i = 0, pathL = path.length; i < pathL; i++) {
                var line = path[i],
                    isLastPoint = i == path.length - 1;

                var startX = line.x1 > line.x2 ? line.x2 : (line.x1 - rectDragMargin / 2),
                    startY = line.y1 > line.y2 ? line.y2 : (line.y1 - rectDragMargin / 2),
                    dx = Math.abs(line.x1 - line.x2),
                    dy = Math.abs(line.y1 - line.y2),
                    rectWidth = dx || rectDragMargin,
                    rectHeight = dy || rectDragMargin;


                self.activityG
                    .append('rect')
                    .attr({
                        x: startX,
                        y: startY,
                        width: rectWidth,
                        height: rectHeight,
                        fill: '#BFBEBE',
                        opacity: 0.0
                    })
                    .classed({
                        'flow-line-dragContainer': !this.parent.isReadOnly,
                        'js-activity-shape': true
                    });

                if (i == 0) {
                    var center = {x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2};
                    var angle = (center.x == line.x1) ? 0 : (Math.PI / 2);
                    if (this.isDefault()) {
                        angle = angle + Math.PI / 4;
                        var dEnd = helpers.getTransformedPoint(center, helpers.unitVector, [Math.sin(angle) * 10, Math.cos(angle) * 10]);
                        var dStart = helpers.getTransformedPoint(center, helpers.negativeUnitVector, [Math.sin(angle) * 10, Math.cos(angle) * 10]);

                        var defaultLineAttrs =
                            _.extend({
                                x1: dStart.x,
                                y1: dStart.y,
                                x2: dEnd.x,
                                y2: dEnd.y
                            }, self.getStrokeAttrs(false));
                        self.activityG.append("line")
                            .attr(defaultLineAttrs)
                            .classed({
                                'flow-line': true,
                                'js-activity-shape': true,
                                'user-visible': true
                            });
                    }

                    if (this.model.get("isTitleSet")) {

                        var title = this.getTitle();
                        var offset = {x: 10, y: 0};
                        if (center.x < line.x1)
                            offset.x = -title.length * 5.5;
                        if (center.x != line.x1)
                            offset.y = -10;
                        else if (center.y < line.y1)
                            offset.y = 0;
                        else if (center.y > line.y1)
                            offset.y = 15;


                        var textAttr = _.extend({
                            x: center.x + offset.x,
                            y: center.y + offset.y,
                            'stroke-width': '1px',
                            'stroke': 'black'
                        });

                        var text = self.activityG.append("text")
                            .attr(textAttr)
                            .classed({
                                'no-select': true,
                                'js-activity-shape': true
                            })
                            .text(this.getTitle());
                    }
                }

                if (line.isDraggable) {
                    this.appendLineDragPoint(line);
                }
            }

            if (!_.find(path, function(x) {
                    return x.isDraggable &&
                        this.getPathSegmentVirtualBorders(x).width > 0 &&
                        this.getPathSegmentVirtualBorders(x).height > 0
                }.bind(this)) && path.length > 0)
            {
                var points = this.getPoints();

                var rect = {
                    x: points[0].x,
                    y: points[0].y,
                    width: points[points.length-1].x - points[0].x,
                    height: points[points.length-1].y - points[0].y
                };

                rect = helpers.regularizeRect(rect);

                if (rect.width < 20) {
                    var dw = 20 - rect.width;
                    rect.x = rect.x - dw/2;
                    rect.width = rect.width + dw;
                }

                if (rect.height < 20) {
                    var dh = 20 - rect.height;
                    rect.y = rect.y - dh/2;
                    rect.height = rect.height + dh;
                }

                var attrs = _.extend(rect, { opacity: 0 });

                var enterRect = this.activityG
                    .append('rect')
                    .attr(attrs)
                    .property("isHorizontal", rect.width > rect.height)
                    .classed({
                        'js-activity-shape': true,
                        'flow-line-enterZone': !this.parent.isReadOnly
                    });

                enterRect.on("mouseenter", this.dragPointMouseEnter.bind(this));
            }

            this.__appendServiceNodes();
        },

        getPathSegmentVirtualBorders: function(line) {
            if (line == null)
                return null;

            var minX = Math.min(line.x1, line.x2);
            var maxX = Math.max(line.x1, line.x2);
            var minY = Math.min(line.y1, line.y2);
            var maxY = Math.max(line.y1, line.y2);
            var dy = Math.abs(line.y1 - line.y2);

            return {
                x: dy == 0 ? minX + constants.margin : minX - constants.margin,
                y: dy == 0 ? minY - constants.margin : minY + constants.margin,
                width: Math.max(dy == 0 ? (maxX - minX - 2 * constants.margin) : 2 * constants.margin, 0),
                height: Math.max(dy == 0 ? 2 * constants.margin : (maxY - minY - 2 * constants.margin), 0)
            }

        },

        appendLineDragPoint: function (line) {
            var dragRectAttrs = _.extend(
                {
                    ry: 5,
                    fill: '#BFBEBE',
                    stroke: '#fff',
                    'stroke-width': 2,
                    opacity: 0
                },
                this.getPathSegmentVirtualBorders(line));

            if (dragRectAttrs.width == 0 && dragRectAttrs.height == 0)
                return;

            this.activityG
                .append('rect')
                .attr(dragRectAttrs)
                .property('index', line.index)
                .property("isHorizontal", line.isHorizontal)
                .classed({
                    'js-activity-shape': this.parent.isReadOnly,
                    'flow-line-dragPoint': !this.parent.isReadOnly,
                    'drag-point-horizontal': !this.parent.isReadOnly && line.isHorizontal,
                    'drag-point-vertical': !this.parent.isReadOnly && !line.isHorizontal
                });
        },

        getPath: function () {
            var points = this.getPoints();
            var pointsL = points.length;
            var path = [];

            for (var i = 0; i < pointsL - 1; i++) {
                var isDraggable = (i != 0) && (i != pointsL - 2),
                    isHorizontal = points[i].y - points[i + 1].y === 0;

                path.push({
                    index: i,
                    isDraggable: isDraggable,
                    isHorizontal: isHorizontal,
                    'x1': points[i].x,
                    'y1': points[i].y,
                    'x2': points[i + 1].x,
                    'y2': points[i + 1].y
                });
            }

            return path;
        },

        drawMarkerArrow: function () {
            if (this.parent.markerArrow)
                return;

            var cfg = _.extend({},  viewConfig);

            var markerAttrs = {
                    refX: 3,
                    refY: 2,
                    markerWidth: 4,
                    markerHeight: 4,
                    orient: 'auto',
                    id: 'arrowPath',
                    fill: cfg.stroke
                };

            var markerPathAttrs = {
                    d: 'M 0,0 V 4 L4,2 Z'
                };

            var container = this.parent.getContainer(this.getType());

            this.parent.markerArrow = container
                .append('marker')
                .attr(markerAttrs)
                .append('path')
                .attr(markerPathAttrs);

            var selectedMarkerAttrs = _.extend(markerAttrs, { fill: cfg.selected.stroke, id: 'selectedArrowPath' });

            this.parent.selectedMarkerArrow = container
                .append('marker')
                .attr(selectedMarkerAttrs)
                .append('path')
                .attr(markerPathAttrs);
        },

        getConnectors: function () {
            return [
                {x: this.start().x, y: this.start().y, index: 0},
                {x: this.end().x, y: this.end().y, index: 10}
            ];
        },

        start: function() {
            return this.getPoints()[0];
        },

        end: function () {
            var points = this.getPoints();
            return points[points.length - 1];
        },

        optimizePoints: function() {
            var points = this.getPoints();
            var changed = false;

            var startIdx = this.getLinkedSourceCfg() ? 2 : 1;
            var endIdx = this.getLinkedTargetCfg() ? points.length - 2 : points.length - 1;

            for (var i = startIdx; i < endIdx; i++) {
                var c = points[i];
                var p = points[i-1];
                var n = points[i+1];

                var d = {
                    cpy: Math.abs(c.y - p.y),
                    pny: Math.abs(p.y - n.y),
                    cpx: Math.abs(c.x - p.x),
                    pnx: Math.abs(p.x - n.x)
                };

                if ((d.cpy <= constants.straitMistake && d.pny <= constants.straitMistake) ||
                    (d.cpx <= constants.straitMistake && d.pnx <= constants.straitMistake))
                {
                    if (d.cpy <= constants.straitMistake && d.pny <= constants.straitMistake) {
                        if (i === endIdx - 1 && i !== startIdx)
                            p.y = n.y;
                        else if (i !== startIdx)
                            n.y = p.y;
                        else if (d.cpy !== 0 || d.pny !== 0)
                            continue;
                    }
                    else {
                        if (i === endIdx - 1 && i !== startIdx)
                            p.x = n.x;
                        else if (i !== startIdx)
                            n.x = p.x;
                        else if (d.cpx !== 0 || d.pnx !== 0)
                            continue;
                    }

                    points.splice(i, 1);
                    changed = true;
                    i--;
                    endIdx--;
                }
            }

            return changed;
        },

        getEndpointConfig: function(cfgPart) {
            var result = _.chain([]);

            if (cfgPart.activity) {
                var position = cfgPart.activity.getPosition();

                result = _.chain(cfgPart.activity.connectors).map(function(c) {
                    return {
                        x: c.x + position.x,
                        y: c.y + position.y,
                        connector: c,
                        preferredIn: c.preferredIn,
                        preferredOut: c.preferredOut
                    }
                });
            }
            else if (cfgPart.point) {
                result = _.chain([cfgPart.point]);
            }

            return result;
        },

        config: function(cfg) {
            var sourceCandidates = this.getEndpointConfig(cfg.source);
            var filteredSource = sourceCandidates.filter(function(cnd) {
                return cnd.connector && cnd.connector.preferredOut;
            });
            if (filteredSource._wrapped.length > 0)
                sourceCandidates = filteredSource;

            var targetCandidates = this.getEndpointConfig(cfg.target);
            var filteredTarget = targetCandidates.filter(function(cnd) {
                return cnd.connector && cnd.connector.preferredIn;
            });
            if (filteredTarget._wrapped.length > 0)
                targetCandidates = filteredTarget;

            var sourceChosen, targetChosen;

            if (sourceCandidates.size().value() == 0 && targetCandidates.size().value() == 0)
                return;

            if (sourceCandidates.size().value() == 0) {
                targetChosen = targetCandidates.find(function(x) {
                    return x.c && x.c.alignment === "top";
                });
                targetChosen = targetChosen || targetCandidates.first();
                sourceChosen = this.getOffsetPoint(targetChosen, targetChosen.connector ? targetChosen.connector.alignment : "top");
            }
            else if (targetCandidates.size().value() == 0) {
                sourceChosen = targetCandidates.find(function(x) {
                    return x.c && x.c.alignment === "top";
                });
                sourceChosen = sourceChosen || targetCandidates.first();
                targetChosen = this.getOffsetPoint(sourceChosen, sourceChosen.connector ? sourceChosen.connector.alignment : "top");
            } else {
                var distance = helpers.getReciprocalDistance(
                    sourceCandidates.value(),
                    targetCandidates.value());

                var minDistanceNode = _.min(distance, function(d) { return d.distance; });

                sourceChosen = minDistanceNode.p1;
                targetChosen = minDistanceNode.p2;
            }

            var points = [];
            var optimizeStart = 0;
            var optimizeEnd = 0;
            this.setModelPosition({ x: sourceChosen.x, y: sourceChosen.y });

            if (sourceChosen.connector) {

                this.setConnectorReciprocal({
                    ownIndex: constants.connection.source,
                    targetConnectorIndex: sourceChosen.connector.index,
                    target: cfg.source.activity
                });

                points.push({ x: 0, y: 0 });
                var sourceP2 = this.getOffsetPoint(points[0], sourceChosen.connector.alignment);
                points.push(sourceP2);

                optimizeStart = 1;

                this.fromAlignment = sourceChosen.connector.alignment;
            }
            else {
                points.push({ x: 0, y: 0 });
                optimizeStart = 0;
            }

            var targetPoint = helpers.substractPoint(targetChosen, this.getPosition());

            if (targetChosen.connector) {
                this.setConnectorReciprocal({
                    ownIndex: constants.connection.target,
                    targetConnectorIndex: targetChosen.connector.index,
                    target: cfg.target.activity
                });

                var targetP2 = this.getOffsetPoint(targetPoint, targetChosen.connector.alignment);
                points.push(targetP2);

                optimizeEnd = points.length - 1;

                this.toAlignment = targetChosen.connector.alignment;
            } else optimizeEnd = points.length;
            points.push(targetPoint);

            this.changePoints(points);

            var path = this.findDefaultPath(points[optimizeStart], points[optimizeEnd]);
            this.changePath(points[optimizeStart], points[optimizeEnd], path);

            this.setPoints();

            this.redrawAll();
        },

        removeLinkPermament: function(connectorOwnIndex) {
            var existingConnector = this.getConnectorsMatch({ ownIndex: connectorOwnIndex });
            if (!existingConnector)
                return;

            var previousLink = this.parent.getViewModelById(existingConnector.targetId);
            previousLink.deleteConnectorsMatch({ targetId: this.getId() });
            this.deleteConnectorsMatch({ ownIndex: connectorOwnIndex });
        },

        setConnector: function(cfg) {
            this.removeLinkPermament(cfg.ownIndex);
            ActivityViewModel.prototype.setConnector.apply(this, arguments);
        },

        connectorsUpdated: function() {
            var connectors = _.chain(this.model.allConnectors()).map(function(connector) {
                return {
                    activityId: connector.targetId,
                    index: connector.targetConnectorIndex,
                    ownIndex: connector.ownIndex
                }
            });

            this.model.set("targetCfg", connectors.find(_.matches({ ownIndex: constants.connection.target })).value());
            this.model.set("sourceCfg", connectors.find(_.matches({ ownIndex: constants.connection.source })).value());
        },

        configActivities: function(activitySource, activityTarget) {
            this.config({
                source: activitySource ? { activity: activitySource } : null,
                target: activityTarget ? { activity: activityTarget } : null
            });

        },

        startDrag: function() {
            ActivityViewModel.prototype.startDrag.apply(this, arguments);

            this.parent.setConnectorsVisibility(true);

            if (this.isTemp && this.parent.draggedRelativeActivity) {
                var targetPoint = this.parent.clientToContainerXY({ x: event.clientX, y: event.clientY});
                this.config({
                    source: {
                        activity: this.parent.draggedRelativeActivity
                    },
                    target: {
                        point: targetPoint
                    },
                    evadeParentsOnly: true });

                this.setDraggedConnector(constants.connection.target);
            }
        },

        getSourceMatchingConnector: function() {
            var source = this.getLinkedSourceActivity();
            var sourceCfg = this.getLinkedSourceCfg();
            if (!source)
                return "none";

            var sourcePosition = source.getPosition();
            var sourceConnector = source.getConnectorByIndex(sourceCfg.index);

            if (!source)
                return "none";

            return sourceConnector;
        },

        getTargetMatchingConnector: function() {
            var source = this.getLinkedTargetActivity();
            var sourceCfg = this.getLinkedTargetCfg();
            if (!source)
                return "none";

            var sourcePosition = source.getPosition();
            var sourceConnector = source.getConnectorByIndex(sourceCfg.index);

            if (!source)
                return "none";

            return sourceConnector;
        },

        rebuild: function(optimizeConnectors) {
            var points = this.getPoints();
            var position = this.getPosition();

            var linkedSource = this.getLinkedSourceCfg();
            var linkedTarget = this.getLinkedTargetCfg();

            var p1, p2, p3, p4, vector, finalVector;

            if (!linkedSource) {
                p1 = points[0];
                p2 = null;
            }
            else {
                var source = this.getLinkedSourceActivity();
                var sourcePosition = source.getPosition();
                var sourceConnector = source.getConnectorByIndex(linkedSource.index);
                var sourceConnectorPosition = { x: sourcePosition.x + sourceConnector.x, y: sourcePosition.y + sourceConnector.y };
                var localSourceConnector = { x: sourceConnectorPosition.x - position.x, y: sourceConnectorPosition.y - position.y };

                p1 = localSourceConnector;
                p2 = this.getOffsetPoint(p1, sourceConnector.alignment);
                vector = this.alignmentVectors[sourceConnector.alignment];

                this.fromAlignment = sourceConnector.alignment;
            }

            if (!linkedTarget) {
                p4 = points[points.length - 1];
                p3 = null;
            } else {
                var target = this.getLinkedTargetActivity();
                var targetPosition = target.getPosition();
                var targetConnector = target.getConnectorByIndex(linkedTarget.index);
                var targetConnectorPosition = { x: targetPosition.x + targetConnector.x, y: targetPosition.y + targetConnector.y };
                var localTargetConnector = { x: targetConnectorPosition.x - position.x, y: targetConnectorPosition.y - position.y };

                p4 = localTargetConnector;
                p3 = this.getOffsetPoint(p4, targetConnector.alignment);

                finalVector = this.oppositeAlignmentVectors[targetConnector.alignment];

                this.toAlignment = targetConnector.alignment;
            }

            var path = this.findDefaultPath(p2 || p1, p3 || p4, vector, finalVector);

            points = _.union(
                    p2 ? [p1] : [],
                    path,
                    p3 ? [p4] : []
                );

            var connectorDescSource = this.getConnectorByIndex(constants.connection.source);
            connectorDescSource.x = p1.x;
            connectorDescSource.y = p1.y;

            var connectorDescTarget = this.getConnectorByIndex(constants.connection.target);
            connectorDescTarget.x = p4.x;
            connectorDescTarget.y = p4.y;

            this.changePoints(points);

            this.redrawAll();

        },

        beforeModelUpdated: function() {
            ActivityViewModel.prototype.beforeModelUpdated.apply(this, arguments);
            this.captureHoppers();
        },

        modelUpdated: function() {
            ActivityViewModel.prototype.modelUpdated.apply(this, arguments);
            if (this.hadHops)
                this.updateHoppers();
        },

        captureHoppers: function() {
            var hops = this.findAllWhoHops();

            // que for cases when multiple flows get their model updated
            // (when undo/redo executed, for example)
            // to avoid redraw same flow multuple times
            this.parent.addToInvokeQue("redrawPath", hops);
            this.hadHops = hops.value().length > 0;
        },

        updateHoppers: function() {
            this.parent.addToInvokeQue("redrawPath", this.findAllWhoHops(), true);
        },

        executeHopAwareAction: function(fn) {
            this.captureHoppers();
            fn();
            this.updateHoppers();
        },

        changePoints: function(points) {
            this.executeHopAwareAction(this.setPoints.bind(this, points));
        },

        findAllWhoHops: function() {
            return this.parent.getAllFlows().without(this).filter(function(flow) {
                var hops = flow.findHops(this);
                return hops.length > 0;
            }.bind(this));
        },

        __pushConnector: function (connector) {
            ActivityViewModel.prototype.__pushConnector.apply(this, arguments);

            var flowConnector = connector.ownIndex === 0 ? 'sourceCfg' : 'targetCfg';

            this[flowConnector] = {
                activityId: connector.targetId,
                index: connector.targetConnectorIndex
            };
        },


        getParentRectFromPoints: function(p1, p2) {
            var rect = {
                x: Math.min(p1.x, p2.x),
                y: Math.min(p1.y, p2.y)
            };

            rect.width = Math.max(p1.x, p2.x) - rect.x;
            rect.height = Math.max(p1.y, p2.y) - rect.y;

            return this.getParentTranslated(rect);
        },

        getAffectedRectsForPoints: function(p1, p2) {
            var rects = this.getAffectedRectsInRange(this.getParentRectFromPoints(p1, p2));

            rects = _.reject(rects, function(x) {
                return helpers.doesRectContains(x, p1) || helpers.doesRectContains(x, p2);
            });

            return rects;
        },

        findDefaultPath: function(p1, p2, vector, finalVector) {
            //return this.findPathFromPoints(p1, p2, this.getAffectedRectsForPoints(p1, p2));
            return this.findPathFromPoints(p1, p2, this.getStandartAffectedRects(p1, p2), vector, finalVector);
        },

        calcFreeHead: function(deltaMove) {
            var points = this.getPoints();

            var cfg = this.getOptimizableConfig();

            var p0 = helpers.sumPoints(points[0], deltaMove);
            var path = this.findDefaultPath(cfg.end, p0, cfg.endAlign);
            path.reverse();

            this.changePoints(_.union([p0], path, cfg.tailSequence));
        },

        calcFreeTail: function(deltaMove) {
            var points = this.getPoints();

            var cfg = this.getOptimizableConfig();

            var p0 = helpers.sumPoints(points[points.length-1], deltaMove);
            var path = this.findDefaultPath(cfg.start, p0, cfg.startAlign);

            this.changePoints(_.union(cfg.headSequence, path, [p0]));
        },

        getReversedPoints: function() {
            var points = _.uniq(this.getPoints());
            points.reverse();
            return points;
        },

        connectorMoved: function(connector) {
            this.rebuild();
            this.setPoints();
        },

        draggedConnectorMoved: function () {
            var effectiveConnector = this.draggedConnector;

            this.restorePreservedPoints();

            var points = this.getPoints();
            var total = points.length;

            var updatedConnector = effectiveConnector.index == 0 ? _.first(points) : _.last(points);
            var deltaMove = helpers.substractPoint(effectiveConnector, updatedConnector);

            if (!deltaMove.x && !deltaMove.y)
                return;

            if (effectiveConnector.index == constants.connection.source)
                this.calcFreeHead(deltaMove);
            else
                this.calcFreeTail(deltaMove);

            this.optimizePoints();

            this.redrawActivityG();
        },


        getOffsetPoint: function (point, targetAlignment) {
            var offsetPoint = {},
                offset = this.offset;

            var vector = this.alignmentVectors[targetAlignment];
            return helpers.getTransformedPoint(point, vector, [offset, offset]);
        },

        optimize: function(force) {
            var changed = this.optimizePoints();
            var hitsChanged = this.optimizeHits();
            changed = changed || hitsChanged;
            if (hitsChanged)
                this.optimizePoints();

            changed = changed || force;

            changed && this.redrawActivityG();
        },

        draggedPathSegment: false,

        normalizePathSegment: function(index) {
            var points = this.getPoints();
            if (index == 1) {
                points.splice(1, 0, {x: points[1].x, y: points[1].y});
                index++;
            }

            if (index == points.length - 3) {
                var fix = points[points.length - 2];
                points.splice(points.length - 2, 0, {x: fix.x, y: fix.y});
            }

            return index;
        },

        dragPointMouseDown: function () {
            this.select(true);

            var userSegmentIndex = d3.select(d3.event.target).property('index');
            var effectiveIndex = this.normalizePathSegment(userSegmentIndex);
            var currentPoints = this.getPoints();

            this.draggedPathSegment = {
                index: effectiveIndex,
                p1: currentPoints[effectiveIndex],
                p2: currentPoints[effectiveIndex + 1]
            };
            this.draggedPathSegment.vector = ((this.draggedPathSegment.p1.y - this.draggedPathSegment.p2.y) === 0) ? [0, 1] : [1, 0];
            //this.initializeDrag(d3.event);
            //
            this.parent.onGlobalMouseUpOnce(function() {
                this.debouncingForMouseUp = false;
            }.bind(this));

            this.debouncingForMouseUp = true;
            this.debounceInitializeDrag(d3.event);

            d3.event.stopPropagation();
            return false;
        },

        appendSelectBorder: function () {
        },

        rememberSpecificPoints: function (pathIndex) {
        },

        isConnectorsAlignmentChanged: function () {
        },

        setSpecificPoints: function () {
        },

        getLinkedIds: function() {
            return _.pluck(this.model.attributes.connectors, "targetId");
        },

        getLinkedSourceCfg: function() {
            return this.mapMatchedConnector({ ownIndex: 0 }, this.connectorToCfg.bind(this));
        },

        mapMatchedConnector: function(match, mapper) {
            var connector = this.getConnectorsMatch(match);
            if (!connector)
                return null;

            return mapper(connector);
        },

        connectorToCfg: function(connector) {
            return {
                activityId: connector.targetId,
                index: connector.targetConnectorIndex
            }
        },

        connectorToActivity: function(connector) {
            return this.parent.getViewModelById(connector.targetId)
        },

        getLinkedSourceActivity: function() {
            return this.mapMatchedConnector({ ownIndex: 0}, this.connectorToActivity.bind(this));
        },


        getLinkedTargetActivity: function() {
            return this.mapMatchedConnector({ ownIndex: 10}, this.connectorToActivity.bind(this));
        },

        getLinkedTargetCfg: function() {
            return this.mapMatchedConnector({ ownIndex: 10 }, this.connectorToCfg.bind(this));
        },

        areConnectionEventsTriggered: function() {
            return !this.draggedPathSegment;
        },

        areDragOverEventsTriggered: function() {
            return false;
        },

        isOfMetaType: function(metaType) {
            return metaType == "Flow";
        },

        isBetweenActivities: function(activityFromId, activityToId) {
            var fromCfg = this.getLinkedSourceCfg();
            if (!fromCfg) return false;
            var toCfg = this.getLinkedTargetCfg();
            if (!toCfg) return false;
            return fromCfg.activityId == activityFromId && toCfg.activityId == activityToId;
        },

        dragPointDoubleClick: function() {
            var event = d3.event;
            if(document.selection && document.selection.empty) {
                document.selection.empty();
            } else if(window.getSelection) {
                var sel = window.getSelection();
                sel.removeAllRanges();
            }

            var anyModifierPressed = (event.altKey || event.ctrlKey || event.shiftKey);

            this.rebuildOptimize(anyModifierPressed);

        },

        rebuildOptimize: function(inverse) {
            var source = this.getLinkedSourceActivity();
            var target = this.getLinkedTargetActivity();
            if (source && target) {
                if (inverse)
                    target = [source, source=target][0]; // swap source and target
                this.configActivities(source, target);
            }
            else {
                this.rebuild();
                this.setPoints();
            }
        },

        onCancelDrag: function() {
            this.clearDraggedStates();
        },

        remove: function() {
            this.hops = this.findAllWhoHops();

            ActivityViewModel.prototype.remove.apply(this, arguments);
        },

        afterRemoved: function() {
            this.hops.invoke("redrawActivityG");
            ActivityViewModel.prototype.afterRemoved.apply(this, arguments);
        }

    });

    FlowViewModel.prototype.constants = constants;

    return FlowViewModel;
});
