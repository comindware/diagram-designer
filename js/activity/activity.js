define([
    '../utils/d3utils'
], function (helpers) {
    'use strict';
    var titleAreaTemplate = "<div></div>";

    var SelfHostedModel = function(initialAttributes) {
        this.attributes = {
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 100,
                height: 80
            }
        };

        this.connectors = [];

        if (initialAttributes) {
            _.extend(this.attributes, initialAttributes);

            if (initialAttributes.id)
                this.id = initialAttributes.id;
        }

        if (!this.id)
            this.id = this.attributes.id = helpers.getNewId();

        this.get = function(key) {
            return this.attributes[key];
        };
        this.toJSON = function() {
            return this.attributes;
        };

        this.allConnectors = function() {
            return _.uniq(this.attributes.connectors);
        };

        this.set = function(attributes, val) {
            if (_.isObject(attributes))
                _.extend(this.attributes, attributes);
            else
            {
                this.attributes[attributes] = val;
            }
        }

    };

    var Activity = Marionette.Object.extend({
        getElementStub: function () {
            if (this.rootNode)
                return this.rootNode;

            return d3.select(window.document.createElementNS('http://www.w3.org/2000/svg', 'g'));
        },

        __readConfig: function(cfg) {
            this.isTemp = cfg.isTemp || false;
            this.model = cfg.model || (new SelfHostedModel());
            this.parent = cfg.parent;
            this.isHidden = !cfg.parent || cfg.isHidden;

            if (cfg.template) {
                this.handlebarTemplate = Handlebars.compile(cfg.template);
            }
        },

        initialize: function (cfg) {
            this.__readConfig(cfg || {});
            this.debounceInitializeDrag = helpers.getDebouncedHandler(this.initializeDrag, 100, this);
            if (!this.isHidden)
                this.render();
        },

        __doBeforeActivityResize: function(size) {
            this.beforeActivityResize();
            this.trigger("before:resize", size);

        },

        __doBeforeUpdateSize: function(size) {
            this.beforeUpdateSize(size);
            this.trigger("before:updateSize", size);
        },

        __doFinishResize: function() {
            this.onfinishResize();
            this.trigger("finish:resize");
        },

        __doStartDrag: function() {
            this.startDrag();
            this.trigger("start:drag");
        },

        __doFinishDrag: function(e) {
            this.onFinishDrag(e);
            this.trigger("finish:drag");
        },

        isNeedInfoBtn: false,

        isMultiSelectable: true,

        hasDimensions: true,

        canBeConnected: true,

        doSelectLinked: true,

        layer: 10,

        isGridAware: true,

        selectedClassName: "g-selected js-activity-selected",

        setKind: function (kind) {
            this.model.set("kind", kind);
        },

        setType: function (type) {
            this.model.set("type", type);
        },

        areConnectionEventsTriggered: function() {
            return !this.__ghostEntity;
        },

        areDragOverEventsTriggered: function() {
            return true;
        },

        beforeActivityResize: function () {
            this.__hideControlElements();
            this.__applyGhostSize();
        },

        afterResize: function(e) {

        },

        __syncScalableComponents: function() {
            this.__setupComponentScale(this.activityG);
            this.__setupComponentScale(this.resizersG);
            this.activityG.selectAll(".js-activity-body").attr({
                width: this.getDimensions().width,
                height: this.getDimensions().height
            });
        },

        __updateControlNodes: function() {
        },

        __syncD3Elements: function() {
            this.__setActualDrawingPosition();
            this.__syncScalableComponents();
            this.__syncConnectorNodes();
            this.__updateControlNodes();
        },

        __getEventPosition: function(optionalEvent) {
            var parentPosition = this.parent.getEventPosition(optionalEvent);
            return helpers.getTransformedPoint(parentPosition, this.getPosition(), [-1, -1]);
        },

        onfinishResize: function () {
            if (this.__ghostEntity) {
                this.setEffectiveRect(
                    {
                        x: this.__ghostPosition.x,
                        y: this.__ghostPosition.y,
                        width: this.__ghostWidth,
                        height: this.__ghostHeight
                    },
                    true);

                this.__hideGhostEntity();
                delete this.__ghostPosition;

                this.__syncD3Elements();
            }

            var dimensions = this.getDimensions();

            var dHeight = dimensions.height - this.startHeight;
            var dWidth = dimensions.width - this.startWidth;

            this.resizeChildNodes(dWidth, dHeight);

            this.afterResize({
                deltaDimensions: {
                    width: dWidth,
                    height: dHeight
                },
                deltaPosition: helpers.substractPoint(this.getPosition(), this.dragStartPosition)
            });

            this.owner && this.owner.trigger('childFinishResize', {child: this, dHeight: dHeight, dWidth: dWidth});
            delete this.startHeight;
            delete this.startWidth;
            delete this.dragStartPosition;

            this.selected && this.select();
            this.__updateControlNodes();
            this.updateFlow();
        },

        resizeChildNodes: function () {
        },

        beforeUpdateSize: function (newPosition) {
            if (this.minHeight && newPosition.height < this.minHeight)
                newPosition.height = this.minHeight;
            if (this.minWidth && newPosition.width < this.minWidth)
                newPosition.width = this.minWidth;
        },

        updateSize: function (delta) {
            if (this.__ghostEntity) {
                this.__updateGhostSize(delta);
                return;
            }
            var place = this.getPlacedRect();

            var newPosition = {
                x: place.x + (this.resizeVector.x < 0 ? delta.x : 0),
                y: place.y + (this.resizeVector.y < 0 ? delta.y : 0),
                width: place.width + delta.x * this.resizeVector.x,
                height: place.height + delta.y * this.resizeVector.y
            };

            this.__doBeforeActivityResize(newPosition);
            this.setEffectiveRect(newPosition, true);
            this.updateFlow();
        },

        __updateGhostSize: function (delta) {
            var place = this.getPlacedRect();

            !this.__ghostWidth && (this.__ghostWidth = place.width);
            !this.__ghostHeight && (this.__ghostHeight = place.height);

            var newPosition = {
                x: this.__ghostPosition.x + (this.resizeVector.x < 0 ? delta.x : 0),
                y: this.__ghostPosition.y + (this.resizeVector.y < 0 ? delta.y : 0),
                width: this.__ghostWidth + delta.x * this.resizeVector.x,
                height: this.__ghostHeight + delta.y * this.resizeVector.y
            };

            this.__doBeforeUpdateSize(newPosition);

            this.__ghostPosition = { x: newPosition.x, y: newPosition.y };
            this.__setGhostPosition();
            this.__applyGhostSize(newPosition.width, newPosition.height);
        },

        __applyGhostSize: function (width, height) {

            if (!this.hasDimensions)
                return;

            var dimensions = this.getDimensions();
            this.__ghostWidth = width || dimensions.width;
            this.__ghostHeight = height || dimensions.height;

            this.__ghostEntity && this.__ghostEntity.attr({
                'width': this.__ghostWidth,
                'height': this.__ghostHeight
            });

            this.__ghostEntity && this.__setupComponentScale(this.__ghostEntity,
                { width: this.__ghostWidth, height: this.__ghostHeight });
        },

        __setupComponentScale: function(node, dimensions) {
            var effectiveDimensions = dimensions || this.getDimensions();
            node.selectAll(".js-activity-resize-root")
                .attr("transform", this.getDimensionTranslation(effectiveDimensions));
            node.selectAll(".js-activity-resize-root-y")
                .attr("transform", this.getDimensionTranslation(_.extend({}, effectiveDimensions, { width: 100.0 })));
            node.selectAll(".js-activity-resize-root-anti-y")
                .attr("transform", this.getDimensionBackTranslation(_.extend({}, effectiveDimensions, { width: 100.0 })));
            node.selectAll(".js-activity-resize-root-x")
                .attr("transform", this.getDimensionTranslation(_.extend({}, effectiveDimensions, { height: 100.0 })));
            node.selectAll(".js-activity-resize-root-anti-x")
                .attr("transform", this.getDimensionBackTranslation(_.extend({}, effectiveDimensions, { height: 100.0 })));
            node.selectAll(".js-activity-right-zone")
                .attr(helpers.getTranslationAttribute({ x: effectiveDimensions.width, y: 0 }));
            node.selectAll(".js-activity-bottom-zone")
                .attr(helpers.getTranslationAttribute({ x: 0, y: effectiveDimensions.height }));

            node.selectAll(".js-activity-resize-root-anti")
                .attr("transform", this.getDimensionBackTranslation(effectiveDimensions))

        },

        setEffectiveRect: function (rect, skipRedraw) {
            var effectiveSize = _.clone(this.model.get("size"));

            var update = {
            };

            if (rect.width || rect.height) {

                if (!this.model.get("size"))
                    effectiveSize = { width: 0, height: 0 };

                effectiveSize.width = rect.width;
                effectiveSize.height = rect.height;

                update.size = effectiveSize;
            }

            if (rect.x !== undefined || rect.y !== undefined)
                update.position = {};

            if (rect.x !== undefined)
                update.position.x = rect.x;

            if (rect.y !== undefined)
                update.position.y = rect.y;

            this.model.set(update);

            if ((update.position || update.size) && !skipRedraw)
                this.redrawAll();

            this.__syncScalableComponents();
        },

        redrawActivityG: function () {
            this.activityG.selectAll('*').remove();
            this.appendViewItems();
            this.resizeRoot = this.activityG.select(".js-activity-resize-root");
            this.__bindEvents();
        },

        __pushConnector: function(connector) {
            var connectors = _.reject(this.model.get("connectors"),
                _.matches({
                    targetId: connector.targetId,
                    targetConnectorIndex: connector.targetConnectorIndex
                }));
            connectors.push(connector);
            this.model.set({ connectors: connectors });
        },

        redrawSelectBorder: function () {
            this.selectBorder.remove();
            this.appendSelectBorder();
        },

        redrawAll: function () {
            if (this.rootNode) {
                this.rootNode.selectAll('*').remove();
                this.removeEnities();
            }

            this.render();
        },

        appendToTargetContainer: function () {
            var self = this;
            this.parentContainer = this.parent.getContainer(this.model.get('type'));

            this.parentContainer.select(function () {
                return this.appendChild(self.rootNode[0][0]);
            });
        },

        removeEnities: function () {
            this.__ghostEntity && this.__ghostEntity.remove();
            this.selectBorder && this.selectBorder.remove();
            this.futureRect && this.futureRect.remove();
        },

        __beforeModelUpdated: function() {

        },

        modelUpdated: function () {
            this.redrawAll();
            this.__ghostEntity && this.__applyGhostSize();

            if (this.model.get("owner"))
                this.owner = this.parent.getViewModelById(this.model.get("owner"));
        },

        addOwner: function (owner) {
            var lastOwner = this.owner;

            this.owner = owner ? owner : null;
            this.model.set({ "owner": owner ? owner.getId() : null });
        },

        getOwner: function() {
            return this.owner || (this.owner = this.parent.getViewModelById(this.model.get("owner")));
        },

        isDragDisabled: function () {
            return false;
        },

        isDropDisabled: function () {
            return false;
        },

        startDrag: function () {
            this.moveToFront();
            this.__ghostPosition = this.getPosition();
            this.__ghostEntity && !this.isTemp && this.__showGhostEntity();
            this.__hideControlElements();
        },

        onPlaced: function () {
            if (this.canBeConnected) {
                this.updateFlowCrossing();
            }

            if (this.parent.activeEmbeddedProcessId)
                this.model.set("ownerEmbeddedProcessActivityId", this.parent.activeEmbeddedProcessId);

            this.select(true);
        },

        alignToGrid: function() {
            if (this.parent.grid && this.isGridAware) {
                this.updatePosition(this.getSymmetryAlignedVector(this.getPosition()));
            }
        },

        onFinishDrag: function (e) {
            if (this.parent.grid && this.isGridAware) {
                var dropped = this.getPlacedDraggedPosition();
                var symmetryVector = this.getSymmetryAlignedVector(dropped);
                var gridAligned = helpers.sumPoints(dropped, symmetryVector);
                this.setDraggedEffectivePosition(gridAligned);
            }

            if (this.__ghostEntity)
                this.__hideGhostEntity();

            if (this.__ghostPosition && !this.isTemp) {
                this.setRealPosition(this.__ghostPosition);
            }
            delete this.__ghostPosition;

            if (this.isTemp)
                this.onPlaced(e);
        },

        updateFlowCrossing: function () {
            var flows = this.parent.getFlowsCrossingRect(this.getPlacedRect());

            if (flows.length !== 1)
                return;

            this.parent.enforceFlowLinkedActivity(_.first(flows), this);
        },

        __updateGhostPosition: function (positionDelta) {
            if (!this.__ghostPosition)
                this.__ghostPosition = this.getPosition();
            helpers.transformPoint(this.__ghostPosition, positionDelta);
            this.__setGhostPosition();
        },

        setRealPosition: function(position) {
            this.setDrawingPosition(position);
            this.setModelPosition(position);
        },

        moveActivity: function (positionDelta) {
            var newPosition = helpers.sumPoints(this.getPosition(), positionDelta);
            this.setRealPosition(newPosition);
        },

        updatePosition: function (positionDelta) {
            if (!this.isTemp && this.__ghostEntity) {
                this.__updateGhostPosition(positionDelta);
                return;
            }
            this.moveActivity(positionDelta);
        },

        __setActualDrawingPosition: function () {
            this.setDrawingPosition(this.getPosition());
        },

        setModelPosition: function (position) {
            this.model.set("position", position);
        },

        getDraggedConnectors: function () {
            return this.connectorsG.selectAll('*');
        },

        updateFlow: function () {
            var self = this;
            var connectors = this.model.allConnectors();
            _.each(connectors, function (connector) {
                self.parent.linkedConnectorMoved({
                    eventSource: self.getConnectorByIndex(connector.ownIndex),
                    eventViewModel: self,
                    sourceActivityId: connector.targetId,
                    sourceIndex: connector.targetConnectorIndex
                });
            });
        },

        getConnectorByAlignment: function (alignment) {
            return _.find(this.connectors, function (con) {
                return con.alignment === alignment;
            });
        },

        getConnectorByIndex: function (index) {
            return _.find(this.connectors, _.matches({ index: index }));
        },

        getPosition: function () {
            return _.extend({}, this.model.attributes.position || helpers.nullVector );
        },

        __resolveParentContainer: function(containerClass) {
            return this.parent.containers[containerClass];
        },

        __updateParentContainers: function() {
            this.ghostG = this.__resolveParentContainer('ghost-g');
            this.selectG = this.__resolveParentContainer('select-g');
            this.overlayG = this.__resolveParentContainer('overlay-g');
        },

        __createNodes: function(node) {
            if (this.activityG)
                this.activityG.remove();
            this.activityG = node.append('g').classed({'activity-g': true});

            if (this.connectorsG)
                this.connectorsG.remove();
            this.connectorsG = node.append('g').classed({'connectors-g': true});

            if (this.resizersG)
                this.resizersG.remove();
            this.resizersG = node.append('g').classed({'resizers-g': true });

            if (this.nodeOverlayG)
                this.nodeOverlayG.remove();
            this.nodeOverlayG = node.append('g').classed({'node-overlay-g': true });
        },

        generateView: function () {
            var attributes = this.getLayout();
            var classes = this.getClasses();
            var node = this.getElementStub();
            var position = this.getPosition();

            this.__createNodes(node);
            this.__updateParentContainers();

            node.attr({'transform': 'translate(' + position.x + ',' + position.y + ')' });

            node.classed(classes);
            node.attr(attributes);
            node.datum(this);

            this.appendViewItems(node);
            this.__ghostEntity && this.__setGhostPosition(position);

            return node;
        },

        receiveDragOver: false,

        containsPoint: function (point) {
            return helpers.doesRectContains(this.getPlacedRect(), point);
        },

        getPlacedRect: function () {
            var pos = this.model.get("position");
            var size = this.model.get("size");

            return { x: pos.x, y: pos.y, width: size ? size.width : 0, height: size ? size.height : 0};
        },

        getLocalPlacedRect: function() {
            var position = this.getPosition();
            var rect = this.getPlacedRect();

            return {
                x: rect.x - position.x,
                y: rect.y - position.y,
                width: rect.width,
                height: rect.height
            }
        },

        getSymmetry: function(position) {

            var xAxis = _.findWhere(this.connectors, { axisAttractor: "x" } );
            var yAxis = _.findWhere(this.connectors, { axisAttractor: "y" } );

            var mostLeft = xAxis || _.min(this.connectors, function(c) { return c.x + position.x; });
            var mostRight = xAxis ||  _.max(this.connectors, function(c) { return c.x + position.x; });
            var mostTop = yAxis ||  _.min(this.connectors, function(c) { return c.y + position.y; });
            var mostBottom = yAxis ||  _.max(this.connectors, function(c) { return c.y + position.y; });

            mostBottom = mostBottom || mostTop;
            mostRight = mostRight || mostLeft;

            // assuming most left and most right are on the same line - maybe not true later
            var symmetry = {
                x: mostBottom ?  (mostBottom.x + position.x) : null,
                y: mostRight ? (mostRight.y + position.y) : null
            };

            if (_.isNaN(symmetry.x) || _.isUndefined(symmetry.x) || _.isNull(symmetry.x))
                symmetry.x = null;
            if (_.isNaN(symmetry.y) || _.isUndefined(symmetry.y) || _.isNull(symmetry.y))
                symmetry.y = null;

            return symmetry;
        },

        getSymmetricalCenter: function() {
            var symmetry = this.getSymmetry(this.getPosition());
            var place = this.getPlacedRect();
            return {
                x: symmetry.x || (place.x + place.width/2),
                y: symmetry.y || (place.y + place.height/2)
            }
        },

        getSymmetryAlignedVector: function(position) {
            var symmetry = this.getSymmetry(position);
            var symmetryShouldBe = this.parent.getGridAligned(symmetry);

            return helpers.substractPoint(symmetryShouldBe, symmetry);
        },

        getDimensions: function () {
            return {
                x: 0,
                y: 0,
                width: (this.model.get("size") ? this.model.get("size").width : 0) || 0,
                height: (this.model.get("size") ? this.model.get("size").height : 0) || 0
            }
        },

        addFutureRect: function (rect) {
            var pos = this.getPosition();

            this.futureRect = this.ghostG.append('rect')
                .attr({
                    'x': 0,
                    'y': 0,
                    width: rect.width,
                    height: rect.height,
                    stroke: '#009d28',
                    fill: '#87c540',
                    'stroke-width': 6,
                    'stroke-dasharray': '15 10',
                    'opacity': 0.3,
                    transform: this.rootNode.attr('transform')
                })
                .classed({'future-rect': true});
        },


        __showGhostEntity: function () {
            if (!this.__ghostEntity)
                return;

            this.__ghostPosition = this.getPosition();
            this.__setGhostPosition();

            this.__ghostMode = true;

            this.activityG.attr({'opacity': '0.4'});
            this.__ghostEntity.style({'display': 'block'});
        },

        __hideGhostEntity: function () {
            this.activityG.attr({'opacity': '1'});
            this.__ghostEntity.style({'display': 'none'});
            this.__ghostMode = true;
        },

        removeFutureRect: function () {
            if (!this.futureRect)
                return;

            this.futureRect.remove();
            delete this.futureRect;
        },

        debugLine: function (x1, y1, x2, y2) {
            this.activityG.append("circle")
                .classed("debug", true)
                .attr({
                    fill: 'red',
                    cx: x1,
                    cy: y1,
                    r: 5
                });

            if (x2 !== undefined && y2 !== undefined)
                this.debugLine(x2, y2);
        },

        debugLine2: function (line) {
            this.debugLine(line.x1, line.y1, line.x2, line.y2);
        },

        debugRect: function (rect) {
            this.debugLine(rect.x, rect.y, rect.x + rect.width, rect.y);
            this.debugLine(rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height);
        },

        debugClear: function () {
            this.activityG.selectAll(".debug").remove();
        },

        __bindEvents: function () {
            var self = this ;

            function handleResize() {
                var d3this = d3.select(this);
                self.resizeVector = d3this.property('vector');
                self.resizerMouseDown({ startX: d3.event.clientX, startY: d3.event.clientY });
                d3.event.stopPropagation();
            }

            this.activityG.on('mousedown', this.mousedown.bind(this));
            this.activityG.on('click', this.activityOnclick.bind(this));
            this.rootNode.selectAll('.js-diagram-connector').on('mousedown', this.connectorMouseDown.bind(this));

            this.resizersG.selectAll('.svg-resizer').on('mousedown', handleResize);
            this.activityG.selectAll('.js-resizer').on('mousedown', handleResize);
        },

        destroy: function() {
            this.rootNode && this.rootNode.selectAll("*").remove();
            this.rootNode && this.rootNode.remove();
        },

        switchSelected: function(isUserAction) {
            this.selected = !this.selected;

            isUserAction && this.parent.trigger(this.selected ? 'additionalActivitySelected' : 'additionalActivityDeselected', {
                sourceActivity: this
            });

            this.whenSelected(this.selected, isUserAction);

            this.selected && this.bringToFront();

            if (isUserAction && this.doSelectLinked) {
                _.invoke(this.getLinkedActivities(), this.selected ? "select" : "deselect", false);
                _.invoke(this.getMounted(), this.selected ? "select" : "deselect", false);
            }
        },

        selectableClick: function(d3event) {
            if (this.isMultiSelectable && d3event.ctrlKey) {
                this.switchSelected(true);
                return;
            }

            this.select(true);
        },

        activityOnclick: function () {
            var selector = d3.select(d3.event.target);

            if (selector.classed('js-activity-shape'))
                this.selectableClick(d3.event);
            else if (selector.classed('null-space'))
                this.parent.nullSpaceClick({ sourceActivity: this, d3event: d3.event });
        },

        __hideControlElements: function() {
        },

        resizerMouseDown: function (e) {
            e = $.extend(e, { sourceActivity: this });
            this.parent.trigger('activityResize', e);

            if (e.cancel)
                return;

            this.__ghostEntity && this.__showGhostEntity();

            var size = this.getDimensions();
            this.startHeight = size.height;
            this.startWidth = size.width;
            this.dragStartPosition = this.getPosition();
        },

        showLinkedConnector: function (conCfg) {
            this.rootNode
                .selectAll('.js-diagram-connector-visible[index="' + conCfg.index + '"]')
                .classed('js-diagram-connector-linked', true);
        },

        showHighlightedConnectors: function (conCfg) {

        },

        setTempLinked: function (source, target) {
            this.showLinkedConnector(target);
            source.parent.setVirtualPosition(source, target);

            this.tempLinked = {
                source: source,
                target: target
            };
        },

        updateLinkedPermanent: function () {
            this.addPermanentLink(this.tempLinked.source, this.tempLinked.target);
            if (this.virtualPosition) {
                this.setModelPosition(this.virtualPosition);
                delete this.virtualPosition;
            }
            if (this.tempLinked.source.parent.virtualPosition) {
                this.tempLinked.source.parent.setModelPosition(this.tempLinked.source.parent.virtualPosition);
                delete this.tempLinked.source.parent.virtualPosition;
            }
        },

        addPermanentLink: function (source, target) {
            if (this.parent.currentCommand)
                this.parent.history.addNested(this.parent.currentCommand.originalState, target.parent);

            this.setConnectorReciprocal({
                ownIndex: target.index,
                targetConnectorIndex: source.index,
                targetId: source.parent.model.attributes.id,
                targetConnectorAlignment: target.alignment
            });
        },

        addNewConnector: function (cfg) {
        },

        setConnector: function (cfg) {
            var connector = _.pick(cfg, "ownIndex", "targetConnectorIndex", "targetId");
            connector.targetId || (connector.targetId = cfg.target.getId());

            this.__pushConnector(connector);

            this.connectorsUpdated();
        },

        setConnectorReciprocal: function(cfg) {
            var effectiveTarget = cfg.target || this.parent.getViewModelById(cfg.targetId);

            if (!effectiveTarget.isOfMetaType("Flow"))
                this.setConnector(cfg);

            var cfgTarget = {
                ownIndex: cfg.targetConnectorIndex,
                targetConnectorIndex: cfg.ownIndex,
                target: this
            };

            var ownAlignment = this.getConnectorByIndex(cfg.ownIndex).alignment;
            ownAlignment && (cfgTarget.targetConnectorAlignment = ownAlignment);

            effectiveTarget.setConnector(cfgTarget);

            if (effectiveTarget.isOfMetaType("Flow"))
                this.setConnector(cfg);
        },

        getConnectorsMatch: function(match) {
            return _.find(this.model.get("connectors") || [], _.matches(match));
        },

        deleteConnectorsMatch: function(match) {
            var layout = this.model.set({
                    connectors: _.reject(this.model.get("connectors"), _.matches(match))
                });

            this.connectorsUpdated();
        },

        connectorsUpdated: function() {
        },

        setVirtualPosition: function (sourceCon, targetCon) {
            var distance = helpers.getDistance(targetCon.x0, targetCon.y0, sourceCon.x0, sourceCon.y0);
            if (distance < helpers.LinkedDistance) {
                this.virtualPosition = {
                    x: targetCon.x0 - sourceCon.x,
                    y: targetCon.y0 - sourceCon.y
                };

                this.setDrawingPosition(
                    this.virtualPosition,
                    sourceCon,
                    targetCon);
            }
        },

        setDrawingPosition: function(position) {
            helpers.applyTranslation(this.rootNode, position);
            this.setSelectBorderPosition(position);
        },

        isDraggedWithGhost: function () {
            return this.__ghostMode;
        },

        setDraggedVirtualPosition: function (position) {
            if (this.isDraggedWithGhost())
                this.__setGhostPosition(position);
            else
                this.setDrawingPosition(position);

            this.virtualCorrection = helpers.substractPoint(position, this.getPosition());
        },

        setDraggedEffectivePosition: function (position) {
            var dimensions = this.getDimensions();
            var original = this.isDraggedWithGhost() ? this.__ghostPosition : this.getPosition();
            var method = this.isDraggedWithGhost() ? this.__updateGhostPosition : this.moveActivity;
            var newPosition = helpers.substractPoint(position, original);

            method.apply(this, [newPosition]);

            _.each(this.getMountedChildren(), function(c) {
                var childMethod = c.isDraggedWithGhost() ? c.__updateGhostPosition : c.moveActivity;
                childMethod.apply(c, [newPosition]);
            });
        },

        getMountedChildren: function() {
            var id = this.getId();
            return _.filter(this.parent.viewModels, function(c) {
                return c.isMounted && c.isMounted() && c.model.get("mountedOn") == id;
            });
        },

        __setGhostPosition: function (newGhostPosition) {
            var effectivePosition = newGhostPosition || this.__ghostPosition;
            this.__ghostEntity && helpers.applyTranslation(this.__ghostEntity, effectivePosition);
        },

        setSelectBorderPosition: function (position) {
            var effectivePosition = position || this.getPosition();
            this.selectBorder && helpers.applyTranslation(this.selectBorder, effectivePosition);
        },

        getMounted: function() {
            return this.parent.getMountedSet([this.getId()]);
        },

        bringToFront: function() {
            this.rootNode.bringToFront();
            if (this.receiveDragOver)
                _.invoke(this.getMounted(), "bringToFront");
       },

        select: function (isUserAction) {
            isUserAction && this.parent.trigger('activityExclusivelySelected', {
                sourceActivity: this
            });

            this.selected = true;
            this.whenSelected(this.selected, isUserAction);

            this.bringToFront();

            if (isUserAction && this.doSelectLinked) {
                _.invoke(this.getLinkedActivities(), "select", false);
                _.invoke(this.getMounted(), "select", false);
            }
        },

        deselect: function (userAction) {
            if (!this.selected)
                return;

            this.selected = false;
            this.whenSelected(this.selected, userAction);

            if (userAction)
                _.invoke(this.getLinkedActivities(), "deselect", false);
        },

        __showDefaultControlElement: function() {

        },

        whenSelected: function (isShown, userAction) {
            isShown && userAction
                ? this.__showDefaultControlElement()
                : this.__hideControlElements();

            this.rootNode.selectAll('.when-selected').style({'display': isShown ? 'block' : 'none'});
            this.selectBorder && this.selectBorder.style({'display': isShown ? 'block' : 'none'});

            var classed = {};
            classed[this.selectedClassName] = isShown;
            this.activityG.classed(classed);
        },


        connectorMouseDown: function () {
        },

        initializeDrag: function(d3event) {
            if (!this.debouncingForMouseUp)
                return;

            this.parent.existingActivityDrag({
                startX: d3event.clientX,
                startY: d3event.clientY,
                sourceActivity: this
            });

            d3event.stopPropagation();
        },

        mousedown: function () {
            if (d3.select(d3.event.toElement).classed("null-space")) {
                this.parent.nullspaceMousedown(d3.event);
                d3.event.stopPropagation();
                return;
            }

            this.parent.onGlobalMouseUpOnce(function() {
                this.debouncingForMouseUp = false;
            }.bind(this));

            this.debouncingForMouseUp = true;
            this.debounceInitializeDrag(d3.event);

            d3.event.stopPropagation();
            return false;
        },

        getLayout: function () {
            return {
                'id': this.getId()
            };
        },

        getClasses: function () {
            return { 'activity': true };
        },

        getConnectors: function () {
            return [];
        },

        appendConnectorsNodes: function () {
            var connectors = this.connectors = this.getConnectors();

            _.each(connectors, function (connectorCfg) {
                connectorCfg.parent = this;
                this.__appendConnectorNode(connectorCfg);
            }.bind(this));
        },

        getCharge: function () {
            return -1;
        },

        __syncConnectorNodes: function() {
            var self = this;

            var updatedConnectors = this.getConnectors();
            _.each(updatedConnectors, function(c) {
                var old = _.find(this.connectors, { index: c.index });
                _.extend(old, c);
                this.__syncConnectorNode(old);
            }.bind(this));

            this.__appendTemplateConnectors();
        },

        __syncConnectorNode: function(connectorCfg) {
            var effectiveNode = this.getD3ConnectorNodesByIndex(connectorCfg.index);

            if (effectiveNode)
                effectiveNode.attr({ 'cx' : connectorCfg.x, 'cy': connectorCfg.y })
                    .property('model', connectorCfg);

            else this.__appendConnectorNode(connectorCfg);
        },

        __appendConnectorNode: function (connectorCfg) {
            var model = this.model.attributes;

            var displayNode =
                this.connectorsG
                    .append('circle')
                    .property('model', connectorCfg)
                    .attr({'r': 4,
                        'cx': connectorCfg.x,
                        'cy': connectorCfg.y,
                        'index': connectorCfg.index,
                        'alignment': connectorCfg.alignment,
                        'charge': this.getCharge()
                    })
                    .classed({
                        'when-flow-drag': true,
                        'dev-diagram-connector': true,
                        'js-diagram-connector-visible': true
                    });

            this.connectorsG
                .append('circle')
                .property('model', connectorCfg)
                .attr({'r': 11,
                    'cx': connectorCfg.x,
                    'cy': connectorCfg.y,
                    'index': connectorCfg.index,
                    'alignment': connectorCfg.alignment,
                    'charge': this.getCharge()
                })
                .classed({
                    'js-diagram-connector': true,
                    'dev-diagram-connector': true})
                .on("mouseenter", function() {
                    this.getD3ConnectorNodesByIndex(connectorCfg.index).classed( { 'js-diagram-connector-highlighted': true });
                }.bind(this))
                .on("mouseleave", function() {
                    this.getD3ConnectorNodesByIndex(connectorCfg.index).classed( { 'js-diagram-connector-highlighted': false });
                }.bind(this));

        },

        appendClass: function(className) {
            var x = {}; x[className] = true;
            this.rootNode.classed(x);
        },


        removeClass: function(className) {
            var x = {}; x[className] = false;
            this.rootNode.classed(x);
        },

        __updateContainer: function() {
            if (!this.parentContainer)
                this.parentContainer = this.parent.getContainer(this.model.attributes.type, this.isTemp);
        },

        __appendServiceNodes: function() {
            this.appendConnectorsNodes();
            this.appendResizers();
            this.__updateControlNodes();
        },

        __appendOverlayNodes: function() {
            this.appendSelectBorder();
        },

        render: function () {
            var node = this.generateView();
            this.__updateContainer();
            this.parentContainer.select(function () {
                return this.appendChild(node[0][0]);
            });

            this.rootNode = node;

            if (this.isInvalid)
                this.invalidate();

            this.__bindEvents();

            this.onShow();
        },

        __appendTemplateConnectors: function() {
            var templateConnectors = [];
            var self = this;
            this.activityG.selectAll('.js-diagram-connector').each(function() {
                var selector = d3.select(this);
                var local = self.__getGaugePosition(this);
                var cfg = {
                    x: local.x + +selector.attr("cx"),
                    y: local.y + +selector.attr("cy"),
                    alignment: selector.attr("alignment"),
                    index: +selector.attr("index"),
                    axisAttractor: selector.attr("axis-attractor"),
                    preferredIn: !!selector.attr("preferred-in"),
                    preferredOut: !!selector.attr("preferred-out"),
                    parent: self
                };
                templateConnectors.push(cfg);
                d3.select(this).property("model", cfg);
            });

            this.connectors = _.reject(this.connectors, function(c) { return _.find(templateConnectors, { index: c.index}); });

            this.connectors = _.union(templateConnectors, this.connectors);
        },

        onShow: function() {
            this.__appendTemplateConnectors();
        },

        __getGaugePosition: function(node) {
            var ctm = this.activityG.node().getScreenCTM();
            var nodeCTM = node.parentNode.getScreenCTM();
            var p1 = this.parent.gaugePoint.matrixTransform(nodeCTM);
            var p2 = this.parent.gaugePoint.matrixTransform(ctm);
            return helpers.substractPoint(p1, p2);
        },

        appendResizers: function () {
            this.activityG.selectAll(".js-north-resizer").each(function() { d3.select(this).property("vector", {x: 0, y: -1})});
            this.activityG.selectAll(".js-south-resizer").each(function() { d3.select(this).property("vector", {x: 0, y: 1})});
            this.activityG.selectAll(".js-east-resizer").each(function() { d3.select(this).property("vector", {x: 1, y: 0})});
            this.activityG.selectAll(".js-west-resizer").each(function() { d3.select(this).property("vector", {x: -1, y: 0})});
        },

        appendSelectBorder: function () {
            var size = this.getDimensions();

            if (!(size.height && !size.width)) {
                this.renderSelectBBoxBorder();
                return;
            }

            this.selectBorder = this.selectG.append('rect')
                .attr({
                    'width': size.width,
                    'height': size.height,
                    'x': 0,
                    'y': 0,
                    rx: 4,
                    ry: 4,
                    'stroke': '#009bfe',
                    'fill': 'none',
                    'fill-opacity': '0'
                })
                .style({'display': this.selected ? 'block' : 'none'})
                .classed({'when-selected': true });

            this.setSelectBorderPosition();
        },



        showSelectBorder: function () {
            this.selectBorder.style({'display': 'block' });
        },

        hideSelectBorder: function () {
            this.selectBorder.style({'display': 'none' });
        },

        renderSelectBBoxBorder: function () {
            var size = this.activityG[0][0].getBBox(),
                position = this.getPosition();

            this.selectBorder = this.selectG.append('rect')
                .attr({'width': size.width,
                    'height': size.height,
                    'x': size.x,
                    'y': size.y,
                    'stroke': '#009bfe',
                    'fill': '#009bfe',
                    'fill-opacity': '0.03',
                    'stroke-width': '2',
                    'rx': 4,
                    'ry': 4
                })
                .style({
                    'display': this.selected ? 'block' : 'none',
                    'pointer-events': 'none'
                })
                .classed({'when-selected': true });

            this.setSelectBorderPosition();
        },

        invalidate: function() {
            this.isInvalid = true;
            this.appendClass("diagram-token-node-error");
        },

        validate: function() {
            this.isInvalid = false;
            this.removeClass("diagram-token-node-error")
        },

        appendViewItems: function () {
            if (!this.handlebarTemplate)
                return;

            this.activityG.html(this.handlebarTemplate(this.getTemplateHelpers()));
            this.__appendTemplatedGhost();
            this.__appendServiceNodes();
        },

        getD3ConnectorByIndex: function (index) {
            return this.rootNode.selectAll('.js-diagram-connector[index="' + index + '"]');
        },

        getD3ConnectorNodesByIndex: function(index) {
            return this.rootNode.selectAll('circle[index="' + index + '"]');
        },

        updateConnectorPosition: function (connector) {
            connector || (connector = this.affectedConnectorCfg);
            this.getD3ConnectorNodesByIndex(connector.index).each(function() {
                var d3x = d3.select(this);
                d3x.attr({
                    'cx': connector.x,
                    'cy': connector.y
                });
            })
        },

        clear: function () {
            this.rootNode.remove();
            this.__ghostEntity && this.__ghostEntity.remove();
            this.futureRect && this.futureRect.remove();
            this.selectBorder && this.selectBorder.remove();
        },

        remove: function () {
            this.clear();
        },

        afterRemoved: function() {
            this.destroy();
        },

        isDeleteDisabled: function () {
            return false;
        },

        __appendTemplatedGhost: function() {
            if (this.__ghostEntity)
                this.__ghostEntity.remove();

            this.__ghostEntity = this.ghostG.append("g").attr({ opacity: 0.2 })
                .style({
                    'display': this.__ghostPosition ? 'block' : 'none'
                });

            this.__ghostPosition && this.__setGhostPosition();
            this.__ghostEntity.html(this.handlebarTemplate(this.getTemplateHelpers()));
            this.__ghostPosition && this.__setGhostPosition();
        },

        appendGhost: function () {
            var size = this.getDimensions();

            this.__ghostEntity = this.ghostG.append('rect')
                .attr({
                    x: 0,
                    y: 0,
                    width: size.width,
                    height: size.height,
                    stroke: '#009bfe',
                    fill: '#8BCCF6',
                    'stroke-width': 2,
                    'stroke-dasharray': '10 3',
                    'opacity': 0.2
                })
                .style({
                    'display': this.__ghostPosition ? 'block' : 'none'
                });

            this.__ghostPosition && this.__setGhostPosition();
        },

        getId: function () {
            return this.model.id;
        },

        getGlobalId: function() {
            return this.model.get("globalId");
        },

        removeOrphanedLinks: function() {
            _.each(this.model.allConnectors(),
                function (x, idx) {
                    var viewModel = this.parent.getViewModelById(x.targetId);
                    if (viewModel == null)
                        this.deleteConnectorsMatch({targetId: x.targetId});

                    viewModel.linkedIndex = x.targetConnectorIndex;
                    return viewModel;
                }.bind(this));
        },

        getLinkedActivities: function () {
            var self = this;
            return _.union(_.map(this.model.allConnectors(),
                function (x) {
                    var viewModel = self.parent.getViewModelById(x.targetId);
                    viewModel.linkedIndex = x.targetConnectorIndex;
                    return viewModel;
                }));
        },

        getLinkedActivityIds: function () {
            var self = this;
            return _.union(_.map(this.model.allConnectors(), function (x) { return x.targetId; }));
        },

        moveToFront: function () {
            var node = this.rootNode.node();
            node.parentNode.appendChild(node);
        },

        getClientPosition: function (localPosition) {
            var position = this.getPosition();
            if (localPosition) position = helpers.sumPoints(position, localPosition);
            return this.parent.containerToClientXY(position);
        },

        $root: function (selector, d3obj) {
            return $(selector, d3obj ? $(d3obj[0][0]) : $(this.activityG[0][0]));
        },

        getSvgPlacedRect: function (drect) {
            return this.transformSvgRect(this.getPlacedRect());
        },

        transformSvgRect: function (rect) {
            return {
                x: (rect.x + this.parent.scroll.x) * this.parent.scale,
                y: (rect.y + this.parent.scroll.y) * this.parent.scale,
                width: this.parent.scale * rect.width,
                height: this.parent.scale * rect.height
            }
        },

        getTitle: function () {
            return this.model.get("title");
        },

        getType: function () {
            return this.model.get("type");
        },

        getKind: function() {
            return this.model.get("kind");
        },

        getChildren: function () {
            return this.parent.getChildren(this);
        },

        isOfType: function (type) {
            return this.getType() == type;
        },

        linkedActivityRemoved: function (activity) {
            this.deleteConnectorsMatch({ targetId: activity.getId()});
            this.connectorsUpdated();
        },

        childrenUpdated: function () {
        },

        getRelativePosition: function (relativeActivity) {
            var rel = relativeActivity || this.owner;

            var rect = this.getPlacedRect();
            var relRect = rel.getPlacedRect();

            return {
                x: rect.x - relRect.x,
                y: rect.y - relRect.y,
                width: rect.width,
                height: rect.height
            };
        },

        isInRange: function (rect) {
            var place = this.getPlacedRect();

            if (rect.width && rect.height)
                return helpers.doRectsIntersect(rect, place);
            else return helpers.doesRectContains(rect, place);
        },

        getParentTranslated: function (primitive) {
            return helpers.sumPoints(primitive, this.getPosition());
        },

        getLocalized: function(primitive) {
            return helpers.substractPoint(primitive, this.getPosition());
        },

        isOfMetaType: function (metaType) {
            return false;
        },

        isMountable: function () {
            return false;
        },

        getPlacedPosition: function () {
            var rect = this.getPlacedRect();
            return helpers.getTransformedPoint(
                [rect.x, rect.y],
                [rect.width / 2, rect.height / 2]);
        },

        getPlacedDraggedPosition: function () {
            var dimensions = this.getDimensions();
            return this.isDraggedWithGhost() ? this.__ghostPosition : this.getPosition();
        },

        cancelDrag: function() {
            this.parent.removeDragStateVariables();
            this.onCancelDrag();
        },

        onCancelDrag: function() {
        },

        getTranslation: function() {
            return helpers.getTranslation(this.getPosition());
        },

        growDimensions: function(dimensions) {
            var rect = this.getPlacedRect();
            rect.width = dimensions.width ? (dimensions.width + rect.width) : rect.width;
            rect.height = dimensions.height ? (dimensions.height + rect.height) : rect.height;
            this.setEffectiveRect(rect);
        },

        save: function() {
            this.model.set("isModified", true);
        },

        getDimensionTranslation: function(dimensions, unit) {
            var effectiveDimensions = dimensions || this.getDimensions();
            var effectiveUnit = unit || { x: 100.0, y: 100.0 };
            return "scale(" + effectiveDimensions.width / effectiveUnit.x + ", " + effectiveDimensions.height / effectiveUnit.y + ")";
        },

        getDimensionBackTranslation: function(dimensions, unit) {
            var effectiveDimensions = dimensions || this.getDimensions();
            var effectiveUnit = unit || { x: 100.0, y: 100.0 };
            return "scale(" + effectiveUnit.x / effectiveDimensions.width + ", " + effectiveUnit.y / effectiveDimensions.height + ")";
        },

        getTemplateHelpers: function(extraOptions) {
            return _.extend(
                {
                    dimScale: this.getDimensionTranslation(),
                    dimScaleY: this.getDimensionTranslation(_.extend(this.getDimensions(), { width: 100.0 })),
                    dimScaleAY: this.getDimensionBackTranslation(_.extend(this.getDimensions(), { width: 100.0 })),
                    dimScaleX: this.getDimensionTranslation(_.extend(this.getDimensions(), { height: 100.0 })),
                    dimScaleAX: this.getDimensionBackTranslation(_.extend(this.getDimensions(), { height: 100.0 })),
                    dimScaleA: this.getDimensionBackTranslation(this.getDimensions())
                },
                this.model.toJSON(),
                extraOptions || {});
        }
    });

    Activity.SelfHostedModel = SelfHostedModel;

    return Activity;

});
