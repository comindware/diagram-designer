define([
    './subActivity',
    'd3utils',
    'd3',
    'handlebars',
    'marionette'
], function (SubactivityView, helpers) {
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

            this.subActivities = new SubactivityView({ parent: this });
            this.listenTo(this.subActivities, 'subactivitydrag', this.subActivityDrag.bind(this));

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
            return !this.ghostEntity;
        },

        areDragOverEventsTriggered: function() {
            return true;
        },

        beforeActivityResize: function () {
            this.hideInfoBtn();
            this.hideSubActivities();
            this.applyGhostSize();
        },

        afterResize: function(e) {

        },

        syncD3Elements: function() {
            this.setActualDrawingPosition();
            this.setupComponentScale(this.activityG);
            this.setupComponentScale(this.resizersG);
            this.activityG.selectAll(".js-activity-body").attr({
                width: this.getDimensions().width,
                height: this.getDimensions().height
            });
            this.syncConnectorNodes();
            this.appendTitle();
            this.syncInfoButtonPosition();
        },

        syncInfoButtonPosition: function() {
            this.infoBtn && this.infoBtn.attr(helpers.getTranslationAttribute(this.getInfoBtnPosition()));
        },

        getEventPosition: function(optionalEvent) {
            var parentPosition = this.parent.getEventPosition(optionalEvent);
            return helpers.getTransformedPoint(parentPosition, this.getPosition(), [-1, -1]);
        },

        onfinishResize: function () {
            if (this.ghostEntity) {
                this.setEffectiveRect(
                    {
                        x: this.ghostPosition.x,
                        y: this.ghostPosition.y,
                        width: this.ghostWidth,
                        height: this.ghostHeight
                    },
                    true);

                this.hideGhostEntity();
                delete this.ghostPosition;

                this.syncD3Elements();
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
            this.infoBtn && this.showInfoBtn();
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
            if (this.ghostEntity) {
                this.updateGhostSize(delta);
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

            this.setupComponentScale(this.activityG);
            this.setupComponentScale(this.resizersG);

            this.setActualDrawingPosition();
            this.updateFlow();
        },

        updateGhostSize: function (delta) {
            var place = this.getPlacedRect();

            !this.ghostWidth && (this.ghostWidth = place.width);
            !this.ghostHeight && (this.ghostHeight = place.height);

            var newPosition = {
                x: this.ghostPosition.x + (this.resizeVector.x < 0 ? delta.x : 0),
                y: this.ghostPosition.y + (this.resizeVector.y < 0 ? delta.y : 0),
                width: this.ghostWidth + delta.x * this.resizeVector.x,
                height: this.ghostHeight + delta.y * this.resizeVector.y
            };

            this.__doBeforeUpdateSize(newPosition);

            this.ghostPosition = { x: newPosition.x, y: newPosition.y };
            this.setGhostPosition();
            this.applyGhostSize(newPosition.width, newPosition.height);
        },

        applyGhostSize: function (width, height) {

            if (!this.hasDimensions)
                return;

            var dimensions = this.getDimensions();
            this.ghostWidth = width || dimensions.width;
            this.ghostHeight = height || dimensions.height;

            this.ghostEntity && this.ghostEntity.attr({
                'width': this.ghostWidth,
                'height': this.ghostHeight
            });

            this.ghostEntity && this.setupComponentScale(this.ghostEntity,
                { width: this.ghostWidth, height: this.ghostHeight });
        },

        setupComponentScale: function(node, dimensions) {
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
        },

        redrawActivityG: function () {
            this.activityG.selectAll('*').remove();
            this.appendViewItems();
            this.resizeRoot = this.activityG.select(".js-activity-resize-root");
            this.appendTitle();
            this.bindEvents();
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
            this.ghostEntity && this.ghostEntity.remove();
            this.selectBorder && this.selectBorder.remove();
            this.futureRect && this.futureRect.remove();
        },

        subActivityDrag: function (e) {
            $.extend(e, { sourceActivity: this, subActivity: true });

            this.parent.trigger('newActivityDrag', e);
        },

        appendSubActivities: function () {
        },

        beforeModelUpdated: function() {

        },

        modelUpdated: function () {
            this.redrawAll();
            this.ghostEntity && this.applyGhostSize();

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
            this.hideSubActivities();
            this.ghostPosition = this.getPosition();
            this.ghostEntity && !this.isTemp && this.showGhostEntity();
            this.infoBtn && this.hideInfoBtnUser(0);
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

            if (this.ghostEntity)
                this.hideGhostEntity();

            if (this.ghostPosition && !this.isTemp) {
                this.setRealPosition(this.ghostPosition);
            }
            delete this.ghostPosition;

            if (this.isTemp)
                this.onPlaced(e);
        },

        updateFlowCrossing: function () {
            var flows = this.parent.getFlowsCrossingRect(this.getPlacedRect());

            if (flows.length !== 1)
                return;

            this.parent.enforceFlowLinkedActivity(_.first(flows), this);
        },

        updateGhostPosition: function (positionDelta) {
            if (!this.ghostPosition)
                this.ghostPosition = this.getPosition();
            helpers.transformPoint(this.ghostPosition, positionDelta);
            this.setGhostPosition();
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
            if (!this.isTemp && this.ghostEntity) {
                this.updateGhostPosition(positionDelta);
                return;
            }
            this.moveActivity(positionDelta);
        },

        setActualDrawingPosition: function () {
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
            this.subActivityG = this.__resolveParentContainer('subactivity-g');
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
            this.ghostEntity && this.setGhostPosition(position);

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


        showGhostEntity: function () {
            if (!this.ghostEntity)
                return;

            this.ghostPosition = this.getPosition();
            this.setGhostPosition();

            this.ghostMode = true;

            this.activityG.attr({'opacity': '0.4'});
            this.ghostEntity.style({'display': 'block'});
        },

        hideGhostEntity: function () {
            this.activityG.attr({'opacity': '1'});
            this.ghostEntity.style({'display': 'none'});
            this.ghostMode = true;
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

        bindEvents: function () {
            var self = this;

            function handleResize() {
                var d3this = d3.select(this);
                self.resizeVector = d3this.property('vector');
                self.resizerMouseDown({ startX: d3.event.clientX, startY: d3.event.clientY });
                d3.event.stopPropagation();
            }

            this.activityG.on('mousedown', this.mousedown.bind(this));
            this.activityG.on('click', this.activityOnclick.bind(this));
            this.infoBtn && this.infoBtn.on('click', this.infoBtnOnclick.bind(this));
            this.rootNode.selectAll('.js-diagram-connector').on('mousedown', this.connectorMouseDown.bind(this));

            this.resizersG.selectAll('.svg-resizer').on('mousedown', handleResize);
            this.activityG.selectAll('.js-resizer').on('mousedown', handleResize);

            this.bindHoverEvents();
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

        showActivityInfo: function () {
            this.infoBtn.isActive = true;
            this.selected && this.hideSubActivities();
            this.activityInfo.show();
        },

        resizerMouseDown: function (e) {
            e = $.extend(e, { sourceActivity: this });
            this.parent.trigger('activityResize', e);

            if (e.cancel)
                return;

            this.ghostEntity && this.showGhostEntity();

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
            //this.rootNode
            //    .selectAll('.js-diagram-connector-visible[index="' + conCfg.index + '"]')
            //    .classed('js-diagram-connector-highlighted', true);
        },

        clearConnectorState: function (conCfg) {
            //this.rootNode
            //    .selectAll('.js-diagram-connector-visible[index="' + conCfg.index + '"]')
            //    .classed('.js-diagram-connector-highlighted', false);
            delete this.tempLinked;
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
            if (distance < helpers.LinkedDistance)
                this.setDrawingPosition(
                    {
                        x: targetCon.x0 - sourceCon.x,
                        y: targetCon.y0 - sourceCon.y
                    },
                    sourceCon,
                    targetCon);
        },

        setDrawingPosition: function(position) {
            helpers.applyTranslation(this.rootNode, position);
            this.setSelectBorderPosition(position);
        },

        isDraggedWithGhost: function () {
            return this.ghostMode;
        },

        setDraggedVirtualPosition: function (position) {
            if (this.isDraggedWithGhost())
                this.setGhostPosition(position);
            else
                this.setDrawingPosition(position);

            this.virtualCorrection = helpers.substractPoint(position, this.getPosition());
        },

        setDraggedEffectivePosition: function (position) {
            var dimensions = this.getDimensions();
            var original = this.isDraggedWithGhost() ? this.ghostPosition : this.getPosition();
            var method = this.isDraggedWithGhost() ? this.updateGhostPosition : this.moveActivity;
            var newPosition = helpers.substractPoint(position, original);

            method.apply(this, [newPosition]);

            _.each(this.getMountedChildren(), function(c) {
                var childMethod = c.isDraggedWithGhost() ? c.updateGhostPosition : c.moveActivity;
                childMethod.apply(c, [newPosition]);
            });
        },

        getMountedChildren: function() {
            var id = this.getId();
            return _.filter(this.parent.viewModels, function(c) {
                return c.isMounted && c.isMounted() && c.model.get("mountedOn") == id;
            });
        },

        setSubActivityPosition: function (position) {
            var effectivePosition = position || this.getPosition();
            helpers.applyTranslation(this.subActivities.rootNode, effectivePosition);
        },

        setGhostPosition: function (newGhostPosition) {
            var effectivePosition = newGhostPosition || this.ghostPosition;
            this.ghostEntity && helpers.applyTranslation(this.ghostEntity, effectivePosition);
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

        whenSelected: function (isShown, userAction) {
            isShown && userAction ? this.showSubActivities() : this.hideSubActivities();
            this.rootNode.selectAll('.when-selected')
                .style({'display': isShown ? 'block' : 'none'});
            this.selectBorder && this.selectBorder.style({'display': isShown ? 'block' : 'none'});
            var classed = {};
            classed[this.selectedClassName] = isShown;
            this.activityG.classed(classed);
        },

        showSubActivities: function () {
            if (this.parent.isReadOnly)
                return;

            this.subActivities.removeAll();
            this.appendSubActivities();
            this.subActivities.render();

            var pos = this.getPosition();

            this.subActivities.rootNode
                .style({'display': 'block'});
        },

        hideSubActivities: function () {
            this.subActivities.hide();
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
            var self = this;

            return {
                'id': self.model.attributes.id
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
                this.appendConnectorNode(connectorCfg);
            }.bind(this));
        },

        getCharge: function () {
            return -1;
        },

        syncConnectorNodes: function() {
            var self = this;

            var updatedConnectors = this.getConnectors();
            _.each(updatedConnectors, function(c) {
                var old = _.find(this.connectors, { index: c.index });
                _.extend(old, c);
                this.syncConnectorNode(old);
            }.bind(this));

            this.appendTemplateConnectors();
        },

        syncConnectorNode: function(connectorCfg) {
            var effectiveNode = this.getD3ConnectorNodesByIndex(connectorCfg.index);

            if (effectiveNode)
                effectiveNode.attr({ 'cx' : connectorCfg.x, 'cy': connectorCfg.y })
                    .property('model', connectorCfg);

            else this.appendConnectorNode(connectorCfg);
        },

        appendConnectorNode: function (connectorCfg) {
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
            this.appendTitle();
        },

        __appendOverlayNodes: function() {
            this.appendSelectBorder();
            this.appendInfoBtn();
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

            this.bindEvents();

            this.onShow();
        },

        appendTemplateConnectors: function() {
            var templateConnectors = [];
            var self = this;
            this.activityG.selectAll('.js-diagram-connector').each(function() {
                var selector = d3.select(this);
                var local = self.getGaugePosition(this);
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
            this.appendTemplateConnectors();
        },

        getGaugePosition: function(node) {
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
            this.appendTemplatedGhost();
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

                //if (d3x.node() == 'circle')
                //    d3x.attr({
                //        'cx': connector.x,
                //        'cy': connector.y
                //    });
                //else if (d3x.node() == 'g')
                //    d3x.attr(helpers.getTranslationAttribute(connector));
                //
            })
        },

        clear: function () {
            this.rootNode.remove();
            this.ghostEntity && this.ghostEntity.remove();
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

        appendTemplatedGhost: function() {
            if (this.ghostEntity)
                this.ghostEntity.remove();

            this.ghostEntity = this.ghostG.append("g").attr({ opacity: 0.2 })
                .style({
                    'display': this.ghostPosition ? 'block' : 'none'
                });

            this.ghostPosition && this.setGhostPosition();
            this.ghostEntity.html(this.handlebarTemplate(this.getTemplateHelpers()));
            this.ghostPosition && this.setGhostPosition();
        },

        appendGhost: function () {
            var size = this.getDimensions();

            this.ghostEntity = this.ghostG.append('rect')
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
                    'display': this.ghostPosition ? 'block' : 'none'
                });

            this.ghostPosition && this.setGhostPosition();
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

        getInfoBtnPosition: function () {
            return {x: 0, y: 0};
        },

        getClientPosition: function (localPosition) {
            var position = this.getPosition();
            if (localPosition) position = helpers.sumPoints(position, localPosition);
            return this.parent.containerToClientXY(position);
        },

        infoBtnOnmouseover: function () {
            this.infoBtn.hoverCircle
                .style({'opacity': 1});

            this.infoBtn.btnPoints.selectAll('*')
                .attr({'fill': '#FFF'});
        },

        infoBtnOnclick: function () {
            this.parent.activityInfoClicked(this);
        },

        infoBtnOnmouseout: function () {
            if (this.infoBtn.isActive)
                return;

            this.infoBtn.hoverCircle
                .style({'opacity': 0});

            this.infoBtn.btnPoints.selectAll('*')
                .attr({'fill': '#3e94cc'});
        },

        showInfoBtn: function () {
            this.infoBtn.attr(helpers.getTranslationAttribute(this.getInfoBtnPosition()));
            this.infoBtn.style({'opacity': 1});
        },

        hideInfoBtn: function () {
            this.infoBtn && this.infoBtn.selectAll('*').attr({'opacity': 0});
        },

        appendInfoBtn: function () {
            if (!this.isNeedInfoBtn)
                return;

            var pos = this.getInfoBtnPosition();

            this.infoBtn = this.nodeOverlayG.append('g')
                .attr(helpers.getTranslationAttribute(pos))
                .style({'display': 'none'})
                .classed('activity-info-btn', true)
                .on('mouseover', this.infoBtnOnmouseover.bind(this))
                .on('mouseout', this.infoBtnOnmouseout.bind(this));

            var pointAttrs = {
                width: 2,
                height: 2,
                fill: '#3e94cc'
            };

            this.infoBtn.hoverCircle = this.infoBtn.append('circle')
                .attr({
                    cx: 1,
                    cy:  4,
                    r: 8,
                    fill: '#3e94cc',
                    opacity: 0
                });

            this.infoBtn.btnPoints = this.infoBtn.append('g').classed('activity-info-btn-points', true);

            for (var i = 0; i < 3; i++) {
                this.infoBtn.btnPoints.append('rect')
                    .attr(pointAttrs)
                    .attr({
                        x: 0,
                        y: 3 * i
                    });
            }
        },

        showInfoBtnUser: function() {
            if (!this.infoBtn)
                return;

            clearTimeout(this.activityInfiBtnTimer);
            this.infoBtn.style({'display': 'block'});
            this.showInfoBtn();
        },

        hideInfoBtnUser: function(timeout) {
            if (!this.infoBtn)
                return;

            var delayedHide = function () {
                if (this.parent.activityInfo.isShowingActivity(this.getId()))
                {
                    this.activityInfiBtnTimer = setTimeout(delayedHide, timeout || 500);
                    return;
                }
                this.infoBtn.style({'display': 'none'});
            }.bind(this);

            this.activityInfiBtnTimer = setTimeout(delayedHide, timeout || 500);
        },

        onActivityInfoBtnMouseenter: function () {
            this.parent.givenActivityInfoAvailable(this, this.showInfoBtnUser.bind(this));
        },

        onActivityInfoBtnMouseleave: function () {
            this.hideInfoBtnUser();
        },

        bindHoverEvents: function () {
            if (this.infoBtn && this.isNeedInfoBtn ) {
                this.parent.givenActivityInfoAvailable(this, function() {
                    this.rootNode.on('mouseenter', this.onActivityInfoBtnMouseenter.bind(this));
                    this.rootNode.on('mouseleave', this.onActivityInfoBtnMouseleave.bind(this));
                }.bind(this));
            }
        },

        getTitleLayout: function () {
            // abstract
            return {
                exists: false,
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                textWidth: 0,
                isMandatory: false
            }
        },

        titleTemplate: Handlebars.compile(titleAreaTemplate),

        appendTitle: function () {
            var self = this;

            var titleLayout = self.getTitleLayout();
            if (!titleLayout || !titleLayout.exists)
                return;

            var textWidth = titleLayout.textWidth;
            var containerWidth = titleLayout.width;
            var title = this.getTitle() || "No title";

            var titleHtml;
            if (!self.model.attributes.isTitleSet && !titleLayout.isMandatory) titleHtml = "";
            else titleHtml = self.getTitleDisplayHtml();

            if (self.titleContainer)
                self.titleContainer.remove();

            this.titleG = this.activityG.select(".js-title-content");
            if (!this.titleG.empty()) {
                self.titleContainer = self.titleG.append("foreignObject");
            }
            else
                self.titleContainer = self.activityG.append("foreignObject");

            self.titleContainer.attr("x", titleLayout.x)
                .attr("y", titleLayout.y)
                .attr("width", containerWidth)
                .attr("height", titleLayout.height)
                .classed({ "null-space": true })
                .html(titleHtml);



            this.activityG.on("dblclick", self.activityDblClick.bind(self));

        },

        $root: function (selector, d3obj) {
            return $(selector, d3obj ? $(d3obj[0][0]) : $(this.activityG[0][0]));
        },

        getTitleDisplayHtml: function () {
            var titleLayout = this.getTitleLayout();
            return this.titleTemplate({
                titleWidth: titleLayout.textWidth,
                width: titleLayout.width,
                height: titleLayout.height,
                title: this.model.attributes.title,
                isEdited: false,
                isCenterAligned: titleLayout.isCenterAligned,
                isVerticalCenterAligned: titleLayout.isVerticalCenterAligned
            });
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

        activityDblClick: function () {
            if (this.parent.isReadOnly)
                return;

            var self = this;

            var titleLayout = self.getTitleLayout();
            if (!titleLayout || !titleLayout.exists)
                return;

            var foreign = self.titleContainer;

            var rect = this.getPlacedRect();
            rect.x += (titleLayout.overlayEditorX || titleLayout.x);
            rect.y += (titleLayout.overlayEditorY || titleLayout.y);
            rect.width = titleLayout.width;
            rect.height = titleLayout.height;
            rect = self.transformSvgRect(rect);

            self.hideSubActivities();

            var editorHtml = self.titleTemplate(_.extend({ titleWidth: titleLayout.textWidth, title: self.model.attributes.title, isEdited: true }, titleLayout));

            var overlayEditor = self.overlayG.append("foreignObject")
                .attr("x", rect.x)
                .attr("y", rect.y)
                .attr("width", rect.width)
                .attr("height", rect.height)
                .append("xhtml:body")
                .classed({
                    'activity-text-center-vertical': titleLayout.isVerticalCenterAligned,
                    'non-selectable': true,
                    'js-activity-shape': true
                })
                .html(editorHtml);

            foreign.html("");
            self.$root(".js-bpmn-titleAreaEdit", overlayEditor).focus();
            self.$root(".js-bpmn-titleAreaEdit", overlayEditor).select();

            self.$root(".js-bpmn-titleAreaEdit", overlayEditor).on("blur", function () {
                var oldTitle = self.model.get("title");
                var newTitle = self.$root(".js-bpmn-titleAreaEdit", overlayEditor).val();
                self.model.set({"title": newTitle, isTitleSet: self.model.get("isTitleSet") || (oldTitle != newTitle) });

                overlayEditor.remove();

                foreign.html(self.getTitleDisplayHtml());
            });
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
            return this.isDraggedWithGhost() ? this.ghostPosition : this.getPosition();
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
