(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["diagram-designer-core"] = factory();
	else
		root["diagram-designer-core"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Created by Nikolay Volf on 11.01.2016.
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(1),
	    __webpack_require__(3),
	    __webpack_require__(5),
	    __webpack_require__(6),
	    __webpack_require__(17),
	    __webpack_require__(25),
	    __webpack_require__(19),
	    __webpack_require__(26)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(activity, flow, sequence, behaviors, diagram, primitivesPalette, toolboxGroup, toolboxElement) {

	    return {

	        activities: {
	            Activity: activity,
	            Flow: flow,
	            Sequence: sequence
	        },

	        Diagram: diagram,

	        toolbox: {
	            Group: toolboxGroup,
	            Element: toolboxElement
	        },

	        palettes: {
	            PrimitivesPalette: primitivesPalette
	        },

	        behaviors: behaviors
	    }

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers) {
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

	        defaultModelAttributes: {
	        },

	        __readConfig: function(cfg) {
	            this.isTemp = cfg.isTemp || false;
	            this.model = cfg.model || (new SelfHostedModel(JSON.parse(JSON.stringify(this.defaultModelAttributes))));
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

	        __doAfterResize: function(options) {
	            this.__afterResize(options);
	            this.trigger("after:resize");
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

	        __afterResize: function(e) {

	        },

	        dragOver: function(args) {
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

	        finishResize: function () {
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

	            this.owner && this.owner.trigger('childFinishResize', {child: this, dHeight: dHeight, dWidth: dWidth});
	            delete this.startHeight;
	            delete this.startWidth;
	            delete this.dragStartPosition;

	            this.selected && this.select();
	            this.__updateControlNodes();
	            this.updateFlow();

	            this.__doAfterResize({
	                deltaDimensions: {
	                    width: dWidth,
	                    height: dHeight
	                },
	                deltaPosition: helpers.substractPoint(this.getPosition(), this.dragStartPosition)
	            });


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

	        __createNodes: function() {
	            if (this.activityG)
	                this.activityG.remove();
	            this.activityG = this.rootNode.append('g').classed({'activity-g': true});

	            if (this.connectorsG)
	                this.connectorsG.remove();
	            this.connectorsG = this.rootNode.append('g').classed({'connectors-g': true});

	            if (this.resizersG)
	                this.resizersG.remove();
	            this.resizersG = this.rootNode.append('g').classed({'resizers-g': true });

	            if (this.nodeOverlayG)
	                this.nodeOverlayG.remove();
	            this.nodeOverlayG = this.rootNode.append('g').classed({'node-overlay-g': true });
	        },

	        generateView: function () {
	            var attributes = this.getLayout();
	            var classes = this.getClasses();
	            var position = this.getPosition();

	            this.__updateParentContainers();
	            this.rootNode = helpers.appendTranslatedGroup(this.parentContainer, position);
	            this.rootNode
	                .classed(classes)
	                .attr(attributes)
	                .datum(this);

	            this.__createNodes();
	            this.appendViewItems();
	            this.__ghostEntity && this.__setGhostPosition(position);
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

	        hideControlElements: function(){
	            this.__hideControlElements();
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
	            this.isHidden = false;

	            this.__updateContainer();
	            this.generateView();

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
	            this.__syncScalableComponents();
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

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    'use strict';

	    d3.selection.prototype.bringToFront = function() {
	        return this.each(function(){
	            this.parentNode.appendChild(this);
	        });
	    };

	    var d3DesignerHelpers = {};

	    d3DesignerHelpers.getNewId = function () {
	        var randomValues = new Uint8Array(36);
	        crypto.getRandomValues(randomValues);
	        var index = 0;

	        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
	            var r = (randomValues[index]/16) | 0;
	            var v = c === 'x' ? r : (r & 0x3 | 0x8);
	            index ++;
	            return v.toString(16);
	        });
	    };

	    d3DesignerHelpers.getPointsOfPath = function (path) {
	        var segments = path.pathSegList,
	            segCount = segments.numberOfItems,
	            arr = [];

	        for (var i = 0; i < segCount; i++) {
	            var seg = segments.getItem(i);
	            arr.push({x: seg.x, y: seg.y});
	        }

	        return arr;
	    };

	    d3DesignerHelpers.LinkedDistance = 20;

	    d3DesignerHelpers.getDistance = function (x1, y1, x2, y2) {
	        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
	    };

	    d3DesignerHelpers.getPathPoints = function (d) {
	        return (d3.svg.line()
	            .x(function (v) {
	                return v.x;
	            })
	            .y(function (v) {
	                return v.y;
	            })
	            (d));
	    };

	    d3DesignerHelpers.selectConnector = function (con) {
	        d3.selectAll('.selectedConnector')
	            .attr('fill', '#fff')
	            .style({'display': 'block'})
	            .classed('selectedConnector', false);

	        d3.select(con)
	            .classed('selectedConnector', true)
	            .attr('fill', '#64aad0');
	    };

	    d3DesignerHelpers.unselectConnector = function (con) {
	        setTimeout(function () {
	            d3.select(con)
	                .attr('fill', '#fff')
	                .classed('selectedConnector', false);
	        }, 250);
	    };

	    d3DesignerHelpers.getTranslation = function(position) {
	        var effectivePoint = this.getPointFromParameter(position);
	        return 'translate(' + effectivePoint.x + ',' + effectivePoint.y + ')';
	    };

	    d3DesignerHelpers.getTranslationAttribute = function(position) {
	        return {
	            'transform': d3DesignerHelpers.getTranslation(position)
	        };
	    };

	    d3DesignerHelpers.applyTranslation = function (d3Obj, position) {
	        d3Obj.attr(d3DesignerHelpers.getTranslationAttribute(position));
	    };

	    d3DesignerHelpers.appendSimpleGroup = function(container, attr) {
	        var newG = container.append("g").classed({ 'no-select': true });
	        attr && newG.attr(attr);
	        return newG;
	    };

	    d3DesignerHelpers.appendTranslatedGroup = function(container, position, attr) {
	        var newG = d3DesignerHelpers.appendSimpleGroup(container, attr);
	        newG.attr(d3DesignerHelpers.getTranslationAttribute(position));
	        return newG;
	    };

	    d3DesignerHelpers.regularizeRect = function(rect) {
	        return {
	            x: rect.width >= 0 ? rect.x : (rect.x + rect.width),
	            y: rect.height >= 0 ? rect.y : (rect.y + rect.height),
	            width: Math.abs(rect.width),
	            height: Math.abs(rect.height)
	        }
	    };

	    d3DesignerHelpers.doRectsIntersect = function(r1, r2) {
	        return !(r2.x > r1.x + r1.width ||
	            r2.x + r2.width < r1.x ||
	            r2.y > r1.y + r1.height ||
	            r2.y + r2.height < r1.y);
	    };

	    d3DesignerHelpers.doesRectContains = function (rect, point) {
	        return point.x > rect.x && point.x < rect.x + rect.width &&
	               point.y > rect.y && point.y < rect.y + rect.height;
	    };

	    d3DesignerHelpers.sumPoints = function(p1, p2) {
	        var result = { x: 0, y: 0 };
	        _.each(arguments, function(arg) {
	            d3DesignerHelpers.transformPoint(result, arg);
	        });
	        return _.extend({}, p1, result);
	    };

	    d3DesignerHelpers.getVerticalAxis = function(rect) {
	        return {
	            x1: rect.x + rect.width/2,
	            x2: rect.x + rect.width/2,
	            y1: rect.y,
	            y2: rect.y + rect.height
	        }
	    };

	    d3DesignerHelpers.getHorizontalAxis = function(rect) {
	        return {
	            x1: rect.x,
	            x2: rect.x + rect.width,
	            y1: rect.y + rect.height/2,
	            y2: rect.y + rect.height/2
	        }
	    };

	    var getPointParam = d3DesignerHelpers.getPointFromParameter = function(paramValue, defaultValue) {
	        if (_.isArray(paramValue))
	            return {
	                x: paramValue[0],
	                y: paramValue[1]
	            };

	        var effectiveDefault = defaultValue ? getPointParam(defaultValue) : undefined;

	        return paramValue || effectiveDefault;
	    };

	    d3DesignerHelpers.negativeUnitVector = [-1, -1];
	    d3DesignerHelpers.unitVector = [1, 1];
	    d3DesignerHelpers.nullVector = [0, 0];

	    d3DesignerHelpers.maxVector = [Number.MAX_VALUE, Number.MAX_VALUE];
	    d3DesignerHelpers.minVector = [-Number.MAX_VALUE, -Number.MAX_VALUE];


	    d3DesignerHelpers.getTransformedPoint = function(point, add, multiply) {
	        var pPoint = getPointParam(point);
	        var pAdd = getPointParam(add, d3DesignerHelpers.nullVector);
	        var pMultiply = getPointParam(multiply, d3DesignerHelpers.unitVector);

	        return {
	            x: pPoint.x + pAdd.x * pMultiply.x,
	            y: pPoint.y + pAdd.y * pMultiply.y
	        };
	    };

	    d3DesignerHelpers.substractPoint = function(p1, p2) {
	        var pp1 = getPointParam(p1);
	        var pp2 = getPointParam(p2);

	        return d3DesignerHelpers.getTransformedPoint(pp1, pp2, d3DesignerHelpers.negativeUnitVector);
	    };

	    d3DesignerHelpers.getReciprocalDistance = function(points1, points2) {
	        var mix = _.map(points1, function(p1) {
	            return _.map(points2, (function(p2) {
	                return {
	                    p1: p1,
	                    p2: p2,
	                    distance: d3DesignerHelpers.getDistance(p1.x, p1.y, p2.x, p2.y)
	                }
	            }));
	        });

	        return _.flatten(mix);
	    };

	    d3DesignerHelpers.getDistances = function(points, targetPoint) {
	        return _.map(points, function(x) {
	            return {
	                c: x,
	                distance: d3DesignerHelpers.getDistance(x.x, x.y, targetPoint.x, targetPoint.y)
	            }
	        });
	    };

	    d3DesignerHelpers.transformPoint = function(point, add, multiply) {
	        d3DesignerHelpers.updatePoint(
	            point,
	            d3DesignerHelpers.getTransformedPoint(point, add, multiply));
	    };

	    d3DesignerHelpers.updatePoint = function(point, setParam, xKey, yKey) {
	        var effectiveXKey = xKey || "x";
	        var effectiveYKey = yKey || "y";

	        var param = getPointParam(setParam);

	        var extender = {};
	        extender[effectiveXKey] = param.x;
	        extender[effectiveYKey] = param.y;

	        return _.extend(point, extender);
	    };

	    d3DesignerHelpers.isZeroPoint = function(point) {
	        return Math.abs(point.x) == 0 && Math.abs(point.y) == 0;
	    };

	    d3DesignerHelpers.multiplyPoint = function(point, multiplier) {
	        if (multiplier.x && multiplier.y)
	            d3DesignerHelpers.updatePoint(point, { x: point.x * multiplier.x, y: point.y * multiplier.y });
	        else
	            d3DesignerHelpers.updatePoint(point, { x: point.x * multiplier, y: point.y * multiplier });
	    };

	    d3DesignerHelpers.getMultipledPoint = function(point, multipler) {
	        var p =  _.extend({}, point);
	        d3DesignerHelpers.multiplyPoint(p, getPointParam(multipler));
	        return p;
	    };

	    d3DesignerHelpers.getRebasedPoint = function(originalPoint, newBase) {
	        var originalLength = d3DesignerHelpers.getDistance(originalPoint.x, originalPoint.y, 0, 0);
	        var scale = newBase / originalLength;
	        return d3DesignerHelpers.getMultipledPoint(originalPoint, scale);
	    };

	    d3DesignerHelpers.distance = function(p1, p2) {
	        var pp1 = getPointParam(p1);
	        var pp2 = getPointParam(p2);
	        return d3DesignerHelpers.getDistance(pp1.x, pp1.y, pp2.x, pp2.y);
	    };

	    d3DesignerHelpers.getDebouncedHandler = function(fn, wait, context, stopPropagation){
	        var that = this;
	        var fnEffective = context ? fn.bind(context) : fn;
	        var debounced = _.debounce(fnEffective, wait);

	        return function() {
	            var eventArg = d3.event;
	            if (stopPropagation)
	                eventArg.stopPropagation();
	            debounced.apply(that, [eventArg]);
	        };
	    };

	    d3DesignerHelpers.getGrownRect = function(rect, growthVector) {
	        return {
	            x: rect.x - growthVector.x,
	            y: rect.y - growthVector.y,
	            width: rect.width + growthVector.x*2,
	            height: rect.height + growthVector.y*2
	        }
	    };

	    return d3DesignerHelpers;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2),
	    __webpack_require__(1),
	    __webpack_require__(4)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers, ActivityViewModel, astar) {
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

	        __bindEvents: function () {
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
	                position: this.__getEventPosition()
	            };

	            d3Target.on("mousemove", function() {
	                this.moveEvent = this.moveEvent || {};
	                this.moveEvent.clientX = d3.event.clientX;
	                this.moveEvent.clientY = d3.event.clientY;
	                this.__moveAttractionPoint();
	            }.bind(this));
	            d3Target.on("mouseleave", function() { this.moveEvent = null; d3Target.on("mousemove", null);}.bind(this));

	        },

	        debugRects: function() {
	            _.each(this.getAffectedRects(), function(rect) {
	                this.debugRect(rect);
	            }.bind(this));
	        },

	        __moveAttractionPoint: _.debounce(function() {
	            if (!this.moveEvent)
	                return;

	            var closerTo = this.__getEventPosition(this.moveEvent);
	            var dx = helpers.substractPoint(closerTo, this.mouseEnterSegment.position);
	            helpers.transformPoint(
	                this.mouseEnterSegment.position,
	                dx,
	                this.mouseEnterSegment.isHorizontal ? [1, 0] : [0, 1]);

	            this.__setAttractionPoint();

	        }, 600),

	        __setAttractionPoint: function() {
	            if (!this.mouseEnterSegment) {
	                //throw "I never expected you would call me before mouse actually enters one of my drag regions (dragPointMouseEnter)";
	                this.__attractionPoint = {x: 0, y: 0};
	                return;
	            }

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


	            this.__attractionPoint = this.mouseEnterSegment.isHorizontal
	                ? helpers.sumPoints([mouse.x, rect.y], [0, -5])
	                : helpers.sumPoints([rect.x + rect.width, mouse.y], [0, 0]);
	        },

	        dragPointMouseLeave: function() {
	        },

	        bindHoverEvents: function() {
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
	            this.__syncConnectorNode(this.draggedConnector);
	            this.draggedConnectorMoved();
	        },

	        setConnectorLinkedPosition: function(position, targetConnectorConfig) {
	            if (this.draggedConnector.index == constants.connection.source)
	                this.updateFromAlignment(targetConnectorConfig);
	            else if (this.draggedConnector.index == constants.connection.target)
	                this.updateToAlignment(targetConnectorConfig);

	            this.__syncConnectorNode(_.extend({}, this.draggedConnector, position));
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
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	    var end = { x: 340, y: 50 };

	    var nodes = [];
	    var arcs = [];

	    function pointsEqual(p1, p2) {
	        return p1.x == p2.x && p1.y == p2.y;
	    }

	    function addNode(p1) {
	        var existing = _.findWhere(nodes, { x: p1.x, y: p1.y });
	        if (existing == null) {
	            nodes.push(p1);
	            return true;
	        }
	    }

	    function addArc(p1, p2) {
	        addNode(p1);
	        addNode(p2);

	        var d = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
	        var existing = _.find(arcs, function(arc) {
	            return pointsEqual(arc.p1, p1) && pointsEqual(arc.p2, p2);
	        });
	        if (existing == null)
	        {
	            arcs.push({
	                p1: p1,
	                p2: p2,
	                weight: d * 1.5
	            })
	        }
	    }

	    function nodeHits(node, rects) {
	        return _.find(rects, function(rect) {
	            return node.x > rect.x && node.x < rect.x + rect.width &&
	                node.y > rect.y && node.y < rect.y + rect.height;
	        });
	    }

	    function xRelate(node, rect) {
	        return node.x <= rect.x ? -1 : (node.x >= rect.x + rect.width ? 1 : 0);
	    }

	    function yRelate(node, rect) {
	        return node.y <= rect.y ? -1 : (node.y >= rect.y + rect.height ? 1 : 0);
	    }

	    function relate(node, rect) {
	        return {
	            x: xRelate(node, rect),
	            y: yRelate(node, rect)
	        }
	    }

	    function arcHits(arc, rects) {
	        return _.find(rects, function(rect) {
	            var r1 = relate(arc.p1, rect);
	            var r2 = relate(arc.p2, rect);
	            return (r1.x == 0 && r2.x == 0 && r1.y != r2.y) ||
	                (r1.y == 0 && r2.y == 0 && r1.x != r2.x);
	        });
	    }

	    function positionHeuristic(position, goal) {
	        return distance(position, goal);
	    }

	    function distance(position, goal) {
	        return Math.sqrt((position.x - goal.x) * (position.x - goal.x) + (position.y - goal.y) * (position.y - goal.y));
	    }

	    function manhattanDistance(position, goal) {
	        return Math.abs(position.x - goal.x) + Math.abs(position.y - goal.y);
	    }


	    var config = {
	        hitPenalty: 5.0,
	        passingCost: 1.0,
	        insidePassingCost: 2.5,
	        hitEvade: 1.3,
	        offroad: {
	            use: false,
	            step: 50.0
	        },
	        shortCost: 50,
	        shortThreshold: 10,
	        passCharge: 0,
	        turnCharge: 30,
	        backCharge: 120,
	        goalBackCharge: 200,
	        splitThreshold: 5200
	    };

	    function vector(position1, position2) {
	        var dx = position2.x - position1.x;
	        var dy = position2.y - position1.y;
	        return {
	            x: dx == 0 ? 0 : (dx/Math.abs(dx)),
	            y: dy == 0 ? 0 : (dy/Math.abs(dy))
	        }
	    }

	    function inverseVector(position1, position2) {
	        var v = vector(position1, position2);
	        return {
	            x: -v.x,
	            y: -v.y
	        }
	    }

	    function vectorDiff(vector1, vector2) {
	        return Math.max(Math.abs(vector2.x - vector1.x), Math.abs(vector2.y - vector1.y));
	    }

	    function calcCost(state, goal, p, rects) {
	        var p1h = nodeHits(state.position, rects);
	        var p2h = nodeHits(p, rects);
	        var ah = arcHits({ p1: state.position, p2: p }, rects);

	        var goalSprint = (goal.x == p.x && goal.y == p.y);
	        if (goalSprint && p2h) {
	            ah = false;
	            p2h = false;
	        }

	        var d = distance(state.position, p);
	        var result = 0;

	        if (d > 0 && d < config.shortThreshold)
	            result = state.cost + 1/d * config.shortCost;

	        else if (!p1h && !p2h && !ah)
	            result = state.cost + config.passCharge + d * config.passingCost;

	        else if (p1h && p2h)
	            result = state.cost + d * config.insidePassingCost;

	        else if (p2h || ah)
	            result = state.cost + d * config.hitPenalty;

	        else if (p1h && !p2h)
	            return state.cost + d * config.hitEvade;
	        else
	            result = state.cost + d * config.passingCost;

	        if (state.vector) {
	            var v = vector(state.position, p);
	            var diff = vectorDiff(v, state.vector);
	            if (diff == 1) result += config.turnCharge;
	            else if (diff == 2) result += config.backCharge;
	        }

	        if (goal.vector && goal.x == p.x && goal.y == p.y) {
	            var vG = vector(state.position, p);
	            var diffG = vectorDiff(v, goal.vector);
	            if (diffG == 2) {
	                result += config.goalBackCharge;
	            }
	        }

	        return result;
	    }

	    function nextOffroadStates(state, goal, rects) {
	        var dx = goal.x - state.position.x;
	        var dy = goal.x - state.position.y;

	        if (dx == 0 && dy == 0)
	            return;

	        var variants = [
	            {
	                x: state.position.x,
	                y: state.position.y - config.offroad.step,
	                d: 0
	            },
	            {
	                x: state.position.x + config.offroad.step,
	                y: state.position.y,
	                d: 1
	            },
	            {
	                x: state.position.x,
	                y: state.position.y + config.offroad.step,
	                d: 2
	            },
	            {
	                x: state.position.x - config.offroad.step,
	                y: state.position.y,
	                d: 3
	            }
	        ];

	        if (Math.abs(dx) < config.offroad.step) {
	            variants.push({
	                x: goal.x,
	                y: state.position.y,
	                d: dx > 0 ? 1 : 3
	            });
	        }

	        if (Math.abs(dy) < config.offroad.step) {
	            variants.push({
	                x: state.position.x,
	                y: goal.y,
	                d: dy > 0 ? 2 : 0
	            })
	        }

	        var result = [];

	        _.each(variants, function(px) {
	            var pd = state.d || -1;
	            var cd = px.d;
	            result.push({
	                position: px,
	                heuristic: positionHeuristic(px, goal),
	                cost: calcCost(state.cost, state.position, px, rects) * (pd == cd ? 1.0 : 1.01),
	                previous: state,
	                d: cd
	            });
	        });

	        return result;
	    }

	    function gridAware(position, grid) {
	        if (!grid)
	            return position;

	        return {
	            x: grid.x ? Math.round(position.x / grid.x) * grid.x + grid.hashOffset.x : position.x,
	            y: grid.y ? Math.round(position.y / grid.y) * grid.y + grid.hashOffset.y : position.y
	        }
	    }

	    function goalGridAware(position, goal, grid) {
	        if (position.x == goal.x || position.y == goal.y)
	            return position;

	        return gridAware(position, grid);
	    }

	    function goalGridAwareX(position, goal, grid) {
	        var aware = goalGridAware(position, goal, grid);

	        return {
	            x: aware.x,
	            y: position.y
	        }
	    }

	    function goalGridAwareY(position, goal, grid) {
	        var aware = goalGridAware(position, goal, grid);

	        return {
	            x: position.x,
	            y: aware.y
	        }
	    }

	    function nextStates(state, goal, rects, grid) {

	        var dx = goal.x - state.position.x;
	        var dy = goal.y - state.position.y;

	        var result = [];

	        if (Math.abs(dx) > 0) {
	            var nextDx = { x: goal.x, y: state.position.y };
	            var dxHit = nodeHits(nextDx, rects) || arcHits({ p1: state.position, p2: nextDx }, rects);

	            result.push({
	                position: nextDx,
	                heuristic: positionHeuristic(nextDx, goal),
	                cost: calcCost(state, goal, nextDx, rects),
	                previous: state,
	                vector: vector(state.position, nextDx),
	                type: "moving straight by x"
	            });

	            if (dxHit) {
	                var dx1 = goalGridAwareX({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y : state.position.y }, goal, grid);

	                if (state.position.x != dx1.x) {
	                    result.push({
	                        position: dx1,
	                        heuristic: positionHeuristic(dx1, goal),
	                        cost: calcCost(state, goal, dx1, rects),
	                        previous: state,
	                        vector: vector(state.position, dx1),
	                        type: "closing down rect"
	                    });

	                    var dx21 = goalGridAwareY({x: state.position.x, y: dxHit.y}, goal, grid);
	                    result.push({
	                        position: dx21,
	                        heuristic: positionHeuristic(dx21, goal),
	                        cost: calcCost(state, goal, dx21, rects),
	                        previous: state,
	                        vector: vector(state.position, dx21),
	                        type: "evading distant rect by top"
	                    });
	                    var dx31 = goalGridAwareY({x: state.position.x, y: dxHit.y + dxHit.height}, goal, grid);
	                    result.push({
	                        position: dx31,
	                        heuristic: positionHeuristic(dx31, goal),
	                        cost: calcCost(state, goal, dx31, rects),
	                        previous: state,
	                        vector: vector(state.position, dx31),
	                        type: "evading distant rect by bottom"
	                    });
	                }
	                else {
	                    var dx2 = goalGridAwareY({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y }, goal, grid);
	                    result.push({
	                        position: dx2,
	                        heuristic: positionHeuristic(dx2, goal),
	                        cost: calcCost(state, goal, dx2, rects),
	                        previous: state,
	                        vector: vector(state.position, dx2),
	                        type: "evading close rect by top"
	                    });
	                    var dx3 = goalGridAwareY({ x: dxHit.x + (dx < 0 ? dxHit.width : 0), y: dxHit.y + dxHit.height }, goal, grid);
	                    result.push({
	                        position: dx3,
	                        heuristic: positionHeuristic(dx3, goal),
	                        cost: calcCost(state, goal, dx3, rects),
	                        previous: state,
	                        vector: vector(state.position, dx3),
	                        type: "evading close rect by bottom"
	                    });
	                }
	            }
	            else if (Math.abs(dx) > config.splitThreshold && !state.isSplit) {
	                var sdx = { x: state.position.x + dx/2, y: state.position.y };
	                result.push({
	                    position: sdx,
	                    heuristic: positionHeuristic(sdx, goal),
	                    cost: calcCost(state, goal, sdx, rects),
	                    previous: state,
	                    vector: vector(state.position, sdx),
	                    type: "moving halfway straight by x",
	                    isSplit: true
	                });
	            }
	        }

	        if (Math.abs(dy) > 0) {
	            var nextDy = { x: state.position.x, y: goal.y };
	            var dyHit = nodeHits(nextDy, rects) || arcHits({ p1: state.position, p2: nextDy }, rects);

	            result.push({
	                position: nextDy,
	                heuristic: positionHeuristic(nextDy, goal),
	                cost: calcCost(state, goal, nextDy, rects),
	                previous: state,
	                vector: vector(state.position, nextDy),
	                type: "moving straight by y"
	            });

	            if (dyHit) {
	                var dy1 = goalGridAwareY({ x: state.position.x, y : dyHit.y + (dy < 0 ? dyHit.height : 0)}, goal, grid);

	                if (dy1.y != state.position.y) {
	                    result.push({
	                        position: dy1,
	                        heuristic: positionHeuristic(dy1, goal),
	                        cost: calcCost(state, goal, dy1, rects),
	                        previous: state,
	                        vector: vector(state.position, dy1),
	                        type: "closing down rect"
	                    });

	                    var dy21 = goalGridAwareX({x: dyHit.x, y: state.position.y}, goal, grid);
	                    result.push({
	                        position: dy21,
	                        heuristic: positionHeuristic(dy21, goal),
	                        cost: calcCost(state, goal, dy21, rects),
	                        previous: state,
	                        vector: vector(state.position, dy21),
	                        type: "evading distant rect by left"
	                    });
	                    var dy31 = goalGridAwareX({x: dyHit.x + dyHit.width, y: state.position.y}, goal, grid);
	                    result.push({
	                        position: dy31,
	                        heuristic: positionHeuristic(dy31, goal),
	                        cost: calcCost(state, goal, dy31, rects),
	                        previous: state,
	                        vector: vector(state.position, dy31),
	                        type: "evading distant rect by right"
	                    });

	                }
	                else {

	                    var dy2 = goalGridAwareX({x: dyHit.x, y: state.position.y}, goal, grid);
	                    result.push({
	                        position: dy2,
	                        heuristic: positionHeuristic(dy2, goal),
	                        cost: calcCost(state, goal, dy2, rects),
	                        previous: state,
	                        vector: vector(state.position, dy2),
	                        type: "evading close rect by left"
	                    });
	                    var dy3 = goalGridAwareX({x: dyHit.x + dyHit.width, y: state.position.y}, goal, grid);
	                    result.push({
	                        position: dy3,
	                        heuristic: positionHeuristic(dy3, goal),
	                        cost: calcCost(state, goal, dy3, rects),
	                        previous: state,
	                        vector: vector(state.position, dy3),
	                        type: "evading close rect by right"
	                    });
	                }
	            }
	            else if (Math.abs(dy) > config.splitThreshold && !state.isSplit) {
	                var sdy = { x: state.position.x, y: state.position.y + dy/2};
	                result.push({
	                    position: sdy,
	                    heuristic: positionHeuristic(sdy, goal),
	                    cost: calcCost(state, goal, sdy, rects),
	                    previous: state,
	                    vector: vector(state.position, sdy),
	                    type: "moving halfway by y",
	                    isSplit: true
	                });
	            }
	        }

	        return result;
	    }

	    function fringePopper(fringe) {
	        var min = _.sortBy(fringe, function(state) {
	            return state.cost + state.heuristic;
	        })[0];

	        fringe.splice(fringe.indexOf(min), 1);

	        return min;
	    }

	    function positionOnStateList(states, position) {
	        return _.any(states, function(state) { return state.position.x == position.x && state.position.y == position.y; });
	    }

	    function graphSearch(p1, p2, rects, grid, initialVector, finalVector, statePushedCallback) {
	        var closed = [];
	        var fringe = [];
	        var arcs = [];

	        fringe.push({
	            position: p1,
	            heuristic: positionHeuristic(p1, p2),
	            cost: 0.0,
	            previous: null,
	            vector: initialVector
	        });

	        var next;
	        var success = false;

	        p2 = _.extend({}, p2, { vector: finalVector });

	        while (true) {
	            if (fringe.length == 0) break;
	            next = fringePopper(fringe);

	            if (goalTest(next, p2)) {
	                success = true;
	                break;
	            }

	            if (positionOnStateList(closed, next.position))
	                continue;

	            closed.push(next);

	            var children = config.offroad.use ? nextOffroadStates(next, p2, rects) : nextStates(next, p2, rects, grid);
	            if (statePushedCallback)
	                _.each(children, statePushedCallback);
	            fringe = _.union(fringe, children);
	        }

	        if (success) {
	            while (next.previous != null) {
	                arcs.push({p2: next.position, p1: next.previous.position, cost: next.cost - next.previous.cost });
	                next = next.previous;
	            }

	            arcs.reverse();

	            return arcs;
	        }
	    }

	    function goalTest(state, finalPoint) {
	        return (state.position.x == finalPoint.x) && (state.position.y == finalPoint.y);
	    }

	    return {
	        config: config,
	        make: graphSearch,
	        vector: vector,
	        inverseVector: inverseVector
	    }
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));



/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers) {
	    'use strict';

	    var ActivitySequence = Marionette.Object.extend({
	        initialize: function (cfg) {
	            this.container = cfg.container;
	            this.items = cfg.items || [];
	            this.layoutFunc = cfg.layoutFunc || this.layoutFuncDefault;

	            if (cfg.position)
	                this.position = cfg.position;
	        },

	        render: function () {
	            if (this.rootNode)
	                this.rootNode.remove();

	            if (!this.drawingContainer)
	                this.drawingContainer = _.result(this, "container");

	            var position = _.result(this, "position");

	            this.rootNode = helpers.appendTranslatedGroup(this.drawingContainer, position)
	                .classed({
	                    'subActivities': true,
	                    'when-selected': true
	                });
	            _.each(this.items, function (item) {
	                item.container = this.rootNode;
	                item.render();
	            }.bind(this));
	        },

	        addItem: function (item) {
	            item.parent = this;
	            this.items.push(item);
	        },

	        removeAll: function () {
	            this.items = [];
	        },

	        remove: function() {
	            this.rootNode.remove();
	        },

	        hide: function() {
	            this.rootNode && this.rootNode.style({'display': 'none'});
	        },

	        layoutFuncDefault: function(index) {
	            return { x: 0, y: index * 30 }
	        }
	    });

	    ActivitySequence.create = function(options, items) {
	        var effectiveItems = _.map(items, function(item) {
	            var extender = ActivitySequence.BaseSequenceMember.extend(item);
	            return new extender(item);
	        });

	        var sequence = new ActivitySequence(_.extend(options, { items: effectiveItems }));

	        _.each(sequence.items, function(item, index) {
	            var newPosition = sequence.layoutFuncDefault(index);
	            _.extend(item, newPosition);

	            sequence.listenTo(item, "element:drag", function(options) {
	                _.extend(options, { sequence: sequence });
	                sequence.trigger("element:drag", options);
	            });
	            sequence.listenTo(item, "element:click", function(options) {
	                _.extend(options, { sequence: sequence });
	                sequence.trigger("element:click", options);
	            });

	            if (!item.type)
	                item.type = options.type;
	        });

	        return sequence;
	    };

	    ActivitySequence.height = 30;
	    ActivitySequence.width = 30;

	    ActivitySequence.mousedown = function () {

	        this.dragX = event.clientX;
	        this.dragY = event.clientY;
	        this.dragInitiated = true;
	        this.backElement.on("mousemove", null);
	        this.backElement.on("mousemove", function() {

	            if (Math.abs(this.dragX - event.clientX) < 3 &&
	                Math.abs(this.dragY - event.clientY) < 3)

	                return;

	            this.trigger("element:drag",
	                {
	                    clientX: event.clientX,
	                    clientY: event.clientY,
	                    originalEvent: event,
	                    source: this
	                }
	            );


	            d3.event.stopPropagation();

	            this.dragInitiated = false;

	        }.bind(this));

	        this.backElement.on("mouseup", function() {
	            if (this.dragInitiated) {
	                ActivitySequence.mouseclick.apply(this, [event]);
	            }
	            this.backElement.on("mouseup", null);
	            this.backElement.on("mousemove", null);
	            this.dragInititated = false;
	        }.bind(this));

	        d3.event.stopPropagation();

	    };

	    ActivitySequence.mouseclick = function (e) {
	        this.dragInititated = false;

	        if (this.type == "Flow")
	            return;

	        this.trigger("element:click",
	            {
	                clientX: event.clientX,
	                clientY: event.clientY,
	                originalEvent: e,
	                source: this
	            }
	        );
	        d3.event.stopPropagation();
	    };

	    ActivitySequence.onmouseover = function () {
	        this.hoverShadow.style('display', 'block');
	    };

	    ActivitySequence.onmouseout = function () {
	        this.hoverShadow.style('display', 'none');
	    };

	    ActivitySequence.BaseSequenceMember = Marionette.Object.extend({
	        backWidth: 30,
	        backHeight: 30,

	        initialize: function(options) {
	            _.extend(this, options);
	            if (!this.x)
	                this.x = 0;
	            if (!this.y)
	                this.y = 0;

	            this.options = options;
	        },

	        getHelper: function() {
	            return JSON.stringify(this.options || {});
	        },

	        getPosition: function() {
	            return { x: this.x, y: this.y };
	        },

	        getScale: function() {
	            return 0.67;
	        },

	        render: function () {

	            var position = this.getPosition();

	            this.backElement = helpers
	                .appendTranslatedGroup(this.container, position);
	            this.backElement.classed({ "sequence-back-container" : true });

	            this.backElement.append("rect").attr({
	                width: this.backWidth,
	                height: this.backHeight,
	                x: 0,
	                y: 0,
	                opacity: 0.0,
	                fill: 'black',
	                stroke: 'none'
	            })
	                .classed( { "rect-hover": true });

	            this.contentElement = helpers.appendTranslatedGroup(this.backElement, { x: 0, y: 0 });
	            this.contentElement.attr({ "transform": this.contentElement.attr("transform") });
	            this.contentElement.html(this.tpl(this.getHelper()));


	            this.backElement
	                .on('mousedown', ActivitySequence.mousedown.bind(this))
	                .on('mouseclick', ActivitySequence.mouseclick.bind(this))

	        }
	    });

	    return ActivitySequence;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(8),
	    __webpack_require__(12),
	    __webpack_require__(9),
	    __webpack_require__(10),
	    __webpack_require__(11),
	    __webpack_require__(7),
	    __webpack_require__(13),
	    __webpack_require__(14),
	    __webpack_require__(15),
	    __webpack_require__(16)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(
	    MountSurfaceBehavior,
	    TemplatedSelectBorderBehavior,
	    RectangularShapedConnectorSetBehavior,
	    CenterAlignedTitleLayoutBehavior,
	    RollingSubactivitySetBehavior,
	    RectangularResizers,
	    SubActivitySpawnSequence,
	    InfoButton,
	    InfoWindow,
	    Titled)
	{
	    var behaviors = {
	        mountSurface: MountSurfaceBehavior,
	        templatedSelectBorder: TemplatedSelectBorderBehavior,
	        rectangularShapedConnectorSet: RectangularShapedConnectorSetBehavior,
	        centerAlignedTitleLayout: CenterAlignedTitleLayoutBehavior,
	        rollingSubactivitySet: RollingSubactivitySetBehavior,
	        rectangularResizers: RectangularResizers,
	        subActivitySpawnSequence: SubActivitySpawnSequence,
	        infoButton: InfoButton,
	        infoWindow: InfoWindow,
	        titled: Titled,
	        setupDeclarative: function(activity) {
	            var args = _.rest(arguments, 1);
	            _.each(this, function(behavior) {
	                if (behavior.prototype.id && _.indexOf(args, behavior.prototype.id) >= 0)
	                    behavior.setup(activity);
	            })
	        }
	    };

	    _.each(behaviors, function(behavior, behaviorKey) {
	        _.wrapThrough = function(obj, fnName, spy, context) {
	            var preserve = obj[fnName];
	            obj[fnName] = function() {
	                var result = preserve.apply(obj, arguments);
	                spy.apply(context || obj, arguments);
	                return result;
	            };

	        };

	        _.bindAllTo = function(newContext, currentContext) {
	            var keys = _.rest(arguments, 2);
	            _.each(keys, function(key) {
	                newContext[key] = currentContext[key].bind(newContext);
	            });
	        };

	        behavior.setup = function(activity) {
	            var restArguments = _.without(arguments, activity);
	            var bind = behavior.bind.apply(this, arguments);
	            var behaviorInstance = new bind(restArguments);
	            behaviorInstance.apply.apply(behaviorInstance, arguments);
	            activity[behaviorKey] = behaviorInstance;
	            return behaviorInstance;
	        };
	    });

	    return behaviors;

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'rectangular-resizers',

	        apply: function(activity) {
	            activity.appendResizers = this.appendResizers.bind(activity);
	        },

	        appendResizers: function () {
	            var size = this.getDimensions();

	            this.resizersG.append("g").classed({ "js-activity-resizers" : true, "js-activity-resize-root": true }).html(
	                '<rect class="svg-resizer svg-north-resizer js-north-resizer js-resizer" x="0" y="-5" width="100" height="10"></rect>' +
	                '<rect class="svg-resizer svg-south-resizer js-south-resizer js-resizer" x="0" y="95" width="100" height="10"></rect>' +
	                '<rect class="svg-resizer svg-east-resizer js-east-resizer js-resizer" x="95" y="0" width="10" height="100"></rect>' +
	                '<rect class="svg-resizer svg-west-resizer js-west-resizer js-resizer" x="-5" y="0" width="10" height="100"></rect>');

	            this.resizersG.selectAll(".js-north-resizer").each(function() { d3.select(this).property("vector", {x: 0, y: -1})});
	            this.resizersG.selectAll(".js-south-resizer").each(function() { d3.select(this).property("vector", {x: 0, y: 1})});
	            this.resizersG.selectAll(".js-east-resizer").each(function() { d3.select(this).property("vector", {x: 1, y: 0})});
	            this.resizersG.selectAll(".js-west-resizer").each(function() { d3.select(this).property("vector", {x: -1, y: 0})});

	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'mount-surface',

	        apply: function(activity) {
	            activity.on('dragOver', this.dragOver.bind(activity));
	            activity.on('finishDragOver', this.finishDragOver.bind(activity));
	            activity.on('dragOverLeave', this.dragOverLeave.bind(activity));

	            activity.afterResize = _.wrap(activity.afterResize, this.afterResize.bind(activity));
	            activity.getMountArea = this.getMountArea.bind(activity);
	            activity.getMountedPosition = this.getMountedPosition.bind(activity);
	            activity.mountedActivityReplaced = this.mountedActivityReplaced.bind(activity);
	        },

	        getMountArea: function() {
	            var area = this.getDimensions();
	            area.y = area.height - this.mountAreaHeight / 2;
	            area.x = this.mountAreaMargin;
	            area.width -= (this.mountAreaMargin * 2);
	            area.height = this.mountAreaHeight;

	            return area;
	        },

	        getMountedPosition: function(position) {
	            var mountArea = this.getMountArea();
	            var mountLine = mountArea.y + mountArea.height / 2;
	            var waterLineDelta = this.getPosition().y + mountLine - position.y;
	            var symmetryDelta = this.getSymmetryAlignedVector(position);

	            return {
	                x: position.x + symmetryDelta.x,
	                y: position.y + waterLineDelta
	            }

	        },

	        dragOver: function(e) {
	            var activity = e.draggedViewModel;

	            if (!activity.isMountable())
	                return;

	            var localPosition = d3Graphics.helpers.substractPoint(e.position, this.getPosition());

	            var mountArea = this.getMountArea();
	            if (!d3Graphics.helpers.doesRectContains(mountArea, localPosition))
	                return;

	            this.virtualActivityPosition = this.getMountedPosition(activity.getPlacedDraggedPosition());
	            activity.setDraggedVirtualPosition(this.virtualActivityPosition);

	            this.whenSelected(true, false);

	            e.stop = true;
	        },

	        finishDragOver: function(e) {
	            var activity = e.sourceActivity;

	            activity.setDraggedEffectivePosition(this.virtualActivityPosition);

	            if (activity.isMounted())
	                return;

	            activity.mount(this);

	            this.whenSelected(false, false);

	            e.stop = true;
	        },

	        dragOverLeave: function(e) {
	            var activity = e.draggedViewModel;

	            if (activity.isMounted())
	                activity.dismount(this);


	            this.whenSelected(false, false)
	        },

	        mountedActivityReplaced: function(e) {
	            this.whenSelected(false, false)
	        },

	        containsPoint: function(point) {
	            var rect = this.getPlacedRect();
	            rect.height += this.mountAreaHeight / 2;
	            return d3Graphics.helpers.doesRectContains(rect, point);
	        },

	        afterResize: function(origin, e) {
	            var mounted = _.chain(this.getMountedChildren());
	            if (e.deltaDimensions.height != 0 && e.deltaPosition.y != -e.deltaDimensions.height) {
	                mounted.invoke("moveActivity", { x: 0, y: e.deltaDimensions.height } );
	                mounted.invoke("updateFlow");
	            }
	            mounted.invoke("bringToFront");
	        }

	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'rectangular-shaped-connector-set',

	        apply: function(activity) {
	            activity.getConnectors = this.getConnectors.bind(activity);
	        },

	        getConnectors: function () {
	            var size = this.getDimensions();

	            return [
	                //top connectors
	                { x: size.width / 2, y: 0, alignment: 'top', index: 10 },
	                //right connectors
	                { x: size.width, y: size.height / 2, alignment: 'right', index: 40 },
	                //bottom connectors
	                { x: size.width / 2, y: size.height, alignment: 'bottom', index: 70 },
	                //left connectors
	                { x: 0, y: size.height / 2, alignment: 'left', index: 100 }
	            ];
	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'center-aligned-title-layout',

	        apply: function(activity) {
	            activity.getTitleLayout = this.getTitleLayout.bind(activity);
	        },

	        getTitleLayout: function () {
	            var size = this.getDimensions();

	            return {
	                exists: true,
	                x: 20,
	                y: 15,
	                width: size.width - 35,
	                height: size.height - 30,
	                textWidth: size.width - 35,
	                isMandatory: true,
	                isVerticalCenterAligned: true,
	                isCenterAligned: true
	            }
	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2),
	    __webpack_require__(5)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers, SubactivityView) {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'rolling-subactivity-set',

	        apply: function(activity) {
	            activity.appendSubActivities = this.appendSubActivities.bind(activity);
	            activity.getSubActivityNewPosition = this.getSubActivityNewPosition.bind(activity);
	        },

	        appendSubActivities: function () {
	            var width = this.getDimensions().width;

	            this.lastIsVertical = true;
	            this.lastSubActivityX = width + 10;
	            this.lastSubActivityY = -SubactivityView.height * 2;
	            this.subActivities.addItem(new SubactivityView.UserTask(this.getSubActivityNewPosition()));
	            this.subActivities.addItem(new SubactivityView.ExclusiveGateway(this.getSubActivityNewPosition()));
	            this.subActivities.addItem(new SubactivityView.IntermediateEvent(this.getSubActivityNewPosition()));
	            this.subActivities.addItem(new SubactivityView.EndEvent(this.getSubActivityNewPosition()));
	            this.subActivities.addItem(new SubactivityView.Flow(this.getSubActivityNewPosition()));
	        },

	        getSubActivityNewPosition: function () {
	            this.lastSubActivityY += SubactivityView.height;
	            return { x: this.lastSubActivityX, y: this.lastSubActivityY};
	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'templated-select-border',

	        apply: function(activity) {
	            activity.appendSelectBorder = this.appendSelectBorder.bind(activity);
	        },

	        appendSelectBorder: function () {
	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'subactivity-spawn-sequence',

	        apply: function(activity, options) {

	            activity.afterResize = _.wrap(activity.afterResize, this.afterResize);
	            activity.startDrag = _.wrap(activity.startDrag, this.startDrag);
	            activity.beforeActivityResize = _.wrap(activity.beforeActivityResize, this.beforeActivityResize);
	            activity.__hideControlElements = _.wrap(activity.__hideControlElements, this.__hideControlElements);
	            activity.__showDefaultControlElement = _.wrap(activity.__showDefaultControlElement, this.__showDefaultControlElement);
	            activity.setDrawingPosition = _.wrap(activity.setDrawingPosition, this.setDrawingPosition);

	            activity.subActivities = options.sequence;
	            activity.subActivities.container = activity.overlayG;


	            if (!options.position)
	                activity.subActivities.position = this.getSequencePosition.bind(this, activity);

	            if (!options.container)
	                activity.subActivities.container = this.getSequenceContainer.bind(this, activity);

	            activity.subActivities.on("element:drag", this.spawnDrag.bind(activity));
	            activity.subActivities.on("element:click", this.spawnClick.bind(activity));
	        },

	        setDrawingPosition: function(setDrawingPositionOriginal, position) {
	            if (this.subActivityG)
	                helpers.applyTranslation(this.subActivityG, position || this.getPosition());
	            setDrawingPositionOriginal.apply(this, _.without(arguments, setDrawingPositionOriginal));
	        },


	        getSequencePosition: function(activity) {
	            return  { x: activity.getDimensions().width, y : 0 };
	        },

	        getSequenceContainer: function(activity) {
	            if (!this.subActivityG)
	                this.subActivityG = activity.subActivityG = helpers.appendTranslatedGroup(activity.__resolveParentContainer('subactivity-g'), activity.getPosition());

	            return this.subActivityG;
	        },

	        afterResize: function(afterResizeOriginal) {
	            this.subActivities.render();
	            afterResizeOriginal.apply(this, _.without(arguments, afterResizeOriginal));
	        },

	        spawnDrag: function(options) {
	            this.parent.addActiveType({
	                type: options.source.type,
	                kind: options.source.kind,
	                clientX: options.originalEvent.clientX,
	                clientY: options.originalEvent.clientY,
	                sourceActivity: this
	            });
	        },

	        spawnClick: function(options) {
	            this.parent.initNewCommand();

	            var newActivity =
	                this.parent.addNewActivity({
	                        type: options.source.type,
	                        kind: options.source.kind
	                    },
	                    {
	                        connect: this,
	                        inverse: options.originalEvent.shiftKey,
	                        direction: { x: 1, y: 0 },
	                        align: true,
	                        select: true,
	                        currentOwner: true
	                    });

	            this.parent.finalizeNewOrUpdateCommand([newActivity]);
	        },

	        startDrag: function (startDragOriginal) {
	            this.subActivities.hide();
	            startDragOriginal.apply(this, _.without(arguments, startDragOriginal));

	        },

	        beforeActivityResize: function(beforeActivityResizeOriginal) {
	            this.subActivities.hide();
	            beforeActivityResizeOriginal.apply(this, _.without(arguments, beforeActivityResizeOriginal));
	        },

	        __hideControlElements: function(__hideControlElementsOriginal) {
	            this.subActivities.hide();
	            __hideControlElementsOriginal.apply(this, _.without(arguments, __hideControlElementsOriginal));
	        },

	        __showDefaultControlElement: function(__showDefaultControlElementOriginal) {
	            this.subActivities.render();
	            __showDefaultControlElementOriginal.apply(this, _.without(arguments, __showDefaultControlElementOriginal));
	        }
	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    return Marionette.Object.extend({

	        id: 'info-button',

	        defaultPosition: {
	            x: -15,
	            y: 10
	        },

	        apply: function(activity, position) {
	            _.wrapThrough(activity, "__updateControlNodes", this.__updateControlNodes);
	            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);

	            _.bindAllTo(activity, this,
	                "__syncInfoButtonPosition",
	                "__infoBtnOnmouseover",
	                "__infoBtnOnclick",
	                "__activateInfoBtn",
	                "__deactivateInfoBtn",
	                "__infoBtnOnmouseout",
	                "__showInfoBtn",
	                "__hideInfoBtn",
	                "__appendInfoBtn",
	                "__showInfoBtnUser",
	                "__hideInfoBtnUser",
	                "__onActivityInfoBtnMouseenter",
	                "__onActivityInfoBtnMouseleave",
	                "__getInfoBtnPosition");

	            activity.infoButtonPosition = position;
	            if (!position) {
	                activity.infoButtonPosition = { x: this.defaultPosition.x, y: this.defaultPosition.y };
	            }
	        },

	        __getInfoBtnPosition: function() {
	            var dimensions = this.getDimensions();
	            return { x: dimensions.width + this.infoButtonPosition.x, y: this.infoButtonPosition.y }
	        },

	        __syncInfoButtonPosition: function() {
	            this.infoBtn.attr(helpers.getTranslationAttribute());
	        },

	        __updateControlNodes: function() {
	            this.__appendInfoBtn();
	        },

	        __infoBtnOnmouseover: function () {
	            this.infoBtn.hoverCircle
	                .style({'opacity': 1});

	            this.infoBtn.btnPoints.selectAll('*')
	                .attr({'fill': '#FFF'});
	        },


	        __infoBtnOnclick: function () {
	        },

	        __infoBtnOnmouseout: function () {
	            if (this.__persistInfoButton)
	                return;

	            this.infoBtn.hoverCircle
	                .style({'opacity': 0});

	            this.infoBtn.btnPoints.selectAll('*')
	                .attr({'fill': '#3e94cc'});
	        },

	        __showInfoBtn: function () {
	            this.infoBtn.attr(helpers.getTranslationAttribute(this.__getInfoBtnPosition()));
	            this.infoBtn.style({'opacity': 1});
	        },

	        __hideInfoBtn: function () {
	            this.infoBtn.style({'display': 'none'});
	        },

	        __appendInfoBtn: function () {
	            if (!this.nodeOverlayG)
	                return;

	            this.nodeOverlayG.selectAll(".activity-info-btn").remove();

	            this.infoBtn = helpers.appendTranslatedGroup(this.nodeOverlayG, this.__getInfoBtnPosition());
	            this.infoBtn
	                .style({'display': 'none'})
	                .classed('activity-info-btn', true)
	                .on('mouseover', this.__infoBtnOnmouseover)
	                .on('mouseout', this.__infoBtnOnmouseout)
	                .on('click', this.__infoBtnOnclick)

	            var pointAttrs = {
	                width: 2,
	                height: 2,
	                fill: '#3e94cc'
	            };

	            this.infoBtn.hoverCircle = this.infoBtn.append('circle')
	                .attr({
	                    cx: 1,
	                    cy: 4,
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

	        __activateInfoBtn: function() {
	            this.__persistInfoButton = true;

	            this.infoBtn.style({'display': 'block'});
	            this.__showInfoBtn();
	        },

	        __deactivateInfoBtn: function() {
	            this.__persistInfoButton = false;

	            this.infoBtn.hoverCircle
	                .style({'opacity': 0});

	            this.infoBtn.btnPoints.selectAll('*')
	                .attr({'fill': '#3e94cc'});

	        },

	        __showInfoBtnUser: function() {
	            clearTimeout(this.__activityInfiBtnTimer);
	            this.infoBtn.style({'display': 'block'});
	            this.__showInfoBtn();
	        },

	        __hideInfoBtnUser: function(timeout) {
	            if (this.__persistInfoButton)
	                return;

	            var delayedHide = function () {
	                this.infoBtn.style({'display': 'none'});
	            }.bind(this);

	            this.__activityInfiBtnTimer = setTimeout(delayedHide, timeout || 500);
	        },

	        __onActivityInfoBtnMouseenter: function () {
	            this.__showInfoBtnUser();
	        },

	        __onActivityInfoBtnMouseleave: function () {
	            this.__hideInfoBtnUser();
	        },

	        __bindEvents: function () {
	            this.rootNode.on('mouseenter', this.__onActivityInfoBtnMouseenter);
	            this.rootNode.on('mouseleave', this.__onActivityInfoBtnMouseleave);
	        }


	    });


	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    var config = {

	        defaultWidth: "150px",
	        defaultHeight: "100px",
	        defaultOffsetLeft: 25,
	        defaultOffsetTop: -20
	    };

	    return Marionette.Object.extend({

	        id: 'info-window',


	        apply: function (activity, options) {
	            _.wrapThrough(activity, "__hideControlElements", this.__hideControlElements);
	            _.wrapThrough(activity, "__infoBtnOnclick", this.__infoBtnOnclick);
	            _.wrapThrough(activity, "__showDefaultControlElement", this.__showDefaultControlElement);

	            _.bindAllTo(activity, this,
	                "showInfo",
	                "hideInfo");

	            if (options && options.template)
	                activity.infoWindowTemplate = Handlebars.compile(options.template);

	            activity.infoWindowOptions = options || {};
	        },


	        __hideControlElements: function() {
	            this.hideInfo();
	            if (this.__persistInfoButton) {
	                this.__deactivateInfoBtn();
	            }
	        },

	        __showDefaultControlElement: function() {
	            this.hideInfo();
	            if (this.__persistInfoButton) {
	                this.__deactivateInfoBtn();
	            }
	        },

	        __infoBtnOnclick: function() {
	            if (this.__persistInfoButton) {
	                this.hideInfo();
	                this.__deactivateInfoBtn();
	            }
	            else {
	                this.__hideControlElements();
	                this.parent.leaveSingleControlElements(this);
	                this.__activateInfoBtn();
	                this.showInfo();

	            }

	        },

	        showInfo: function() {
	            var rect = this.getPlacedRect();
	            helpers.transformPoint(rect, this.__getInfoBtnPosition());
	            helpers.transformPoint(rect, this.infoWindowOptions.offset || { x: config.defaultOffsetLeft, y: config.defaultOffsetTop });
	            rect = this.transformSvgRect(rect);

	            if (!this.overlayInfoWindow) {
	                this.overlayInfoWindow = this.parent.htmlContainer
	                    .append("div");
	            };

	            var html = this.infoWindowOptions.html
	                ? _.result(this.infoWindowOptions, "html")
	                : this.infoWindowTemplate(this.getTemplateHelpers());

	            this.overlayInfoWindow
	                .style({
	                    "position": "absolute",
	                    "left": rect.x + "px",
	                    "top": rect.y + "px",
	                    "width": this.infoWindowOptions.width || config.defaultWidth,
	                    "height": this.infoWindowOptions.height || config.defaultHeight
	                })
	                .classed({
	                    'dd-info-window': true
	                })
	                .html(html);

	            this.__infoWindowAfterShow && this.__infoWindowAfterShow();
	        },

	        hideInfo: function() {
	            if (!this.overlayInfoWindow)
	                return;

	            this.overlayInfoWindow.remove();
	            this.overlayInfoWindow = null;
	        }

	    });

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    var TitledBehavior = Marionette.Object.extend({

	        id: 'titled',

	        displayTemplate: Handlebars.compile(""),

	        editTemplate: Handlebars.compile(""),

	        apply: function(activity, layout) {
	            activity.__titleLayout = _.isFunction(layout) ? layout.bind(activity) : layout;
	            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
	//            _.wrapThrough(activity, "__appendServiceNodes", this.__appendServiceNodes);
	            _.wrapThrough(activity, "__doAfterResize", this.__doAfterResize);
	            _.wrapThrough(activity, "onShow", this.onShow);

	            _.bindAllTo(activity, this,
	                "__getTitleLayout",
	                "__createMultiline",
	                "__appendTitle",
	                "__activityDblClick",
	                "__stopEditTitle",
	                "__doAfterResize",
	                "__resizeTitleNode",
	                "__alignSpan",
	                "__alignText",
	                "getDisplayTitle"
	                );

	            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
	        },

	        getDisplayTitle: function() {
	            var modelTitle = this.getTitle();
	            var layout = this.__getTitleLayout();
	            if (layout.isMandatory)
	                return modelTitle || "No title";

	            return modelTitle;
	        },

	        onShow: function() {
	            this.__appendTitle();
	        },

	        __getTitleLayout: function () {
	            var size = this.getDimensions();

	            var defaults = {
	                exists: true,
	                x: 10,
	                y: 10,
	                width: size.width - 20,
	                height: size.height - 20,
	                isMandatory: true,
	                isVerticalCenterAligned: true,
	                isHorizontalCenterAligned: true,
	                overlayEditorX: 5,
	                overlayEditorY: 10,
	                overlayEditorWidth: size.width - 15,
	                overlayEditorHeight: size.height - 30,
	                lineHeight: 18
	            };

	            if (this.__titleLayout)
	                _.extend(defaults, _.result(this, "__titleLayout"));

	            return defaults;
	        },

	        __bindEvents: function() {
	            this.activityG.on("dblclick", this.__activityDblClick);
	        },

	        __alignSpan: function(layout, tspan_element) {
	            if (layout.isHorizontalCenterAligned) {
	                var alignedLength = tspan_element.node().getComputedTextLength();
	                tspan_element.attr({ x : layout.x + (layout.width - alignedLength) / 2})
	            }
	        },

	        __createMultiline: function (text, layout) {
	            layout = layout || this.__getTitleLayout();
	            text = text || this.getDisplayTitle();

	            var textClasses = { 'js-activity-shape' : true, 'no-select': true, 'activity-title': true };
	            var words = text.split(' ');
	            var tspan_element = this.titleNode
	                .append("tspan")
	                .classed(textClasses)
	                .text(words[0]);

	            this.totalLines = 1;

	            for (var i = 1; i < words.length; i++) {
	                var current = tspan_element.text();
	                var len = current.length;
	                tspan_element.text(current + " "  + words[i]);

	                var currentTextLength = tspan_element.node().getComputedTextLength();

	                if (currentTextLength > layout.width) {
	                    tspan_element.text(current.slice(0, len));

	                    this.__alignSpan(layout, tspan_element);

	                    tspan_element = this.titleNode.append("tspan")
	                        .text(words[i])
	                        .classed(textClasses)
	                        .attr(
	                        {
	                            x: layout.x,
	                            dy: layout.lineHeight
	                        });

	                    this.totalLines ++;
	                }
	            }

	            this.__alignSpan(layout, tspan_element);

	        },

	        __appendTitle: function () {
	            var titleLayout = this.__getTitleLayout();

	            var title = this.getDisplayTitle();
	            if (!title)
	                return;

	            this.titleG = this.activityG.select(".js-title-content");

	            if (this.titleG.empty())
	                this.titleG  = this.activityG.append("g").classed({ "js-title-content": true, 'null-spaced': true });

	            this.titleNode = this.titleG.append("text")
	                .attr("x", titleLayout.x)
	                .attr("y", titleLayout.y + titleLayout.lineHeight)
	                .attr("width", titleLayout.width)
	                .attr("height", titleLayout.height)
	                .classed({ "js-activity-shape" : true });

	            this.__createMultiline(title, titleLayout);

	            this.__alignText();
	        },

	        __alignText: function(titleLayout) {
	            titleLayout = titleLayout || this.__getTitleLayout();
	            if (titleLayout.isVerticalCenterAligned) {

	                var verticalSpan = this.totalLines * titleLayout.lineHeight;
	                if (verticalSpan < titleLayout.height)
	                {
	                    helpers.applyTranslation(this.titleNode, {
	                        x : 0,
	                        y: (titleLayout.height - verticalSpan - titleLayout.lineHeight) / 2
	                    });
	                }

	            }
	        },

	        __stopEditTitle: function() {
	            var newTitle = this.overlayEditorBox.node().value;
	            this.model.attributes.title = newTitle;

	            this.overlayEditor.remove();

	            if (!this.titleG) {
	                this.__appendTitle();
	                return;
	            }

	            this.titleG.style({ 'display' : 'block'});
	            this.titleNode.selectAll("*").remove();
	            this.__createMultiline(newTitle);
	            this.__alignText();

	        },

	        __resizeTitleNode: function() {
	            if (!this.titleNode)
	                return;

	            this.titleNode.selectAll("*").remove();
	            this.__createMultiline();
	            this.__alignText();
	        },

	        __doAfterResize: function() {
	            this.__resizeTitleNode();
	        },

	        __activityDblClick: function () {
	            var self = this;

	            var titleLayout = this.__getTitleLayout();

	            var rect = this.getPlacedRect();
	            rect.x += (titleLayout.overlayEditorX || titleLayout.x);
	            rect.y += (titleLayout.overlayEditorY || titleLayout.y);
	            rect.width = (titleLayout.overlayEditorWidth || titleLayout.width);
	            rect.height = (titleLayout.overlayEditorHeight || titleLayout.height);
	            rect = this.transformSvgRect(rect);

	            this.__hideControlElements();

	            if (this.titleG)
	                this.titleG.style({ 'display' : 'none'});


	            this.overlayEditor = this.parent.htmlContainer
	                .append("div")
	                .style({
	                    "position": "absolute",
	                    "left": rect.x + "px",
	                    "top": rect.y + "px",
	                    "width": rect.width + "px",
	                    "height": rect.height + "px"
	                })
	                .classed({
	                    'non-selectable': true,
	                    'dd-overlay-editor': true
	                });

	            this.overlayEditorBox =  this.overlayEditor
	                .append("textarea")
	                .style({
	                    "width": rect.width + "px",
	                    "height": rect.height + "px",
	                    "pointer-events": "auto"
	                })
	                .classed({
	                    'dd-overlay-editor-area': true
	                })
	                .on("blur", this.__stopEditTitle);

	            this.overlayEditorBox.node().value =  this.getDisplayTitle() || "";

	            this.overlayEditorBox.node().focus();



	        },
	    });

	    TitledBehavior.undersideLayoutPreset = function() {
	        var size = this.getDimensions();
	        return {
	            exists: true,
	            x: 10,
	            y: size.height + 5,
	            width: size.width - 20,
	            height: 60,
	            isMandatory: false,
	            isVerticalCenterAligned: false,
	            isHorizontalCenterAligned: true,
	            overlayEditorX: 5,
	            overlayEditorY: size.height + 5,
	            overlayEditorWidth: size.width - 15,
	            overlayEditorHeight: 60,
	            lineHeight: 18
	        }
	    };

	    return TitledBehavior;



	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2),
	    __webpack_require__(1),
	    __webpack_require__(18),
	    __webpack_require__(20),
	    __webpack_require__(21),
	    __webpack_require__(22),
	    __webpack_require__(23),
	    __webpack_require__(24)

	], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers,
	             Activity,
	             ToolboxView,
	             SelectFrameView,
	             ModelMapper,
	             UndoRedoHelper,
	             ClipboardHelper,
	             DeleteZoneView,
	             ActivityInfoView)
	{
	    'use strict';

	    var disabledMessageTemplate = '<text x="60" y="80" class="empty-grid" >{{message}}</text>';

	    var svgTemplate = '<defs>' +
	        '<clipPath id="clipPath"><rect x="0" y="-5" width="190" height="40" />' +
	        '</clipPath>' +
	        '<linearGradient id="gradient-overflow"><stop offset="0%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff"/> ' +
	        '</linearGradient> ' +
	        '</defs>';

	    var SelfHostedCollection = function(initialModels) {
	        this.models = [];

	        if (initialModels)
	            this.models = _.map(initialModels, function(initialModel) {
	                return new Activity.SelfHostedModel(initialModel)
	            });

	        this.add = function(model) {
	            var existing = _.findWhere(this.models, { id: model.id });
	            if (existing) {
	                _.extend(existing.attributes, model.attributes);
	                return existing;
	            }
	            else {
	                var newModel = new Activity.SelfHostedModel(model);
	                this.models.push(newModel);
	                return newModel;
	            }
	        };

	        this.postponeUpdates = function() {
	        };

	        this.resumeUpdates = function() {
	        };

	        this.remove = function(model) {
	            this.models.slice(_.indexOf(model), 1);
	        };

	        this.model = function(attributes) {
	            return new Activity.SelfHostedModel(attributes);
	        };

	        this.saveModel = function(model) {
	        };

	        this.export = function() {
	            return _.invoke(this.models, "toJSON");
	        };
	    };

	    return Marionette.Object.extend({

	        laneCnt: 0,

	        viewModels: [],

	        viewModelsHash: {},

	        svgTemplate: Handlebars.compile(svgTemplate),

	        initialize: function (cfg) {
	            this.__readConfig(cfg || {});
	            this.__createContainers();
	            this.isReadOnly || this.createToolbox();

	            this.wireInternalEvents();
	            this.wireSelectorEvents();
	            this.appendLayers();
	            this.setDefaultFormOffset();

	            this.history = new UndoRedoHelper(this);
	            this.clipboard = new ClipboardHelper(this);
	            this.modelMapper = new ModelMapper();

	            this.activeEmbeddedProcessId = null;
	            this.initCollection();
	        },

	        __readConfig: function(cfg) {
	            this.scroll = cfg.scroll || { x: 60, y: 0 };
	            this.isReadOnly = cfg.isReadOnly;
	            this.grid = cfg.grid || {
	                x: 20,
	                y: 20
	            };
	            this.isEnterprise = cfg.isEnterprise;
	            this.collection = cfg.collection;

	            this.container = cfg.container;

	            this.size = cfg.size || { width: "800px", height: "600px" };

	            this.toolboxWidth = cfg.toolboxWidth;
	            this.toolboxHeight = cfg.toolboxHeight;
	        },

	        __createContainers: function(cfg) {
	            this.graphContainer = this.container || $('.js-graphContainer');

	            this.svg = d3.select(this.graphContainer[0])
	                .append('svg')
	                .html(this.svgTemplate)
	                .attr("width", this.size.width)
	                .attr("height", this.size.height);
	            this.formContainer = this.svg.append('g').classed({'form-container': true});

	            this.isReadOnly || (this.toolboxContainer = this.svg.append('g').classed({'toolbox-container': true}));
	            this.tempActivityContainer = this.svg.append('g').classed({'temp-activity-container': true});

	            this.$el = $(this.svg[0]);

	            this.svgNode = this.svg.node();

	            this.htmlContainer = d3
	                .select(this.graphContainer[0])
	                .style({ position: 'relative' })
	                .append("div")
	                .classed({ "dd-html-container" : true })
	                .style({
	                    position: 'absolute',
	                    'z-index': 1000,
	                    top: '0px',
	                    bottom: '0px',
	                    left: '0px',
	                    right: '0px',
	                    'background-color': 'rgba(255, 255, 255, 0.0)',
	                    opacity: 1.0,
	                    'pointer-events': 'none'
	                });
	        },


	        /** sets scroll to default or the provided one */
	        setDefaultScroll: function(options) {
	            this.scroll = options.scroll || { x: 60, y: 0 };

	            if (options.update)
	                this.updateRootTransform();

	        },

	        setReadOnly: function(isReadOnly) {
	            this.isReadOnly = isReadOnly;
	            if (this.isReadOnly && this.deleteZoneView)
	                this.deleteZoneView.remove();

	            if (this.isReadOnly)
	                this.containers['object-g'].bringToFront();

	        },

	        wireInternalEvents: function() {
	            this.on('activityExclusivelySelected', this.activityExclusivelySelected.bind(this));
	            this.on('additionalActivitySelected', this.additionalActivitySelected.bind(this));
	            this.on('additionalActivityDeselected', this.additionalActivityDeselected.bind(this));
	            this.on('activityResize', this.activityResize.bind(this));
	        },

	        leaveSingleControlElements: function(viewModel) {
	            this.foreachViewModels(function (vm) {
	                if (vm != viewModel)
	                    viewModel.hideControlElements();
	            });
	        },

	        additionalActivitySelected: function(options) {
	            if (this.selected)
	                this.selected = _.isArray(this.selected) ? this.selected : [this.selected];
	            else this.selected = [];

	            if (_.indexOf(this.selected, options.sourceActivity) < 0)
	                this.selected.push(options.sourceActivity);

	            this.leaveSingleControlElements(options.sourceActivity);
	        },

	        additionalActivityDeselected: function(options) {
	            this.selected = _.isArray(this.selected) ? this.selected : [this.selected];
	            this.selected = _.without(this.selected, options.sourceActivity);
	        },

	        wireSelectorEvents: function() {
	            this.$el.on("mousewheel DOMMouseScroll", this.mouseWheel.bind(this));
	            this.$el.on('click', this.clickOnDiagram.bind(this));
	            this.$el.on('mousedown', this.diagramMouseDown.bind(this));
	        },

	        destroy: function() {
	            this.$el.off('mousewheel');
	            this.$el.off('DOMMouseScroll');
	            this.$el.off('click');
	            this.$el.off('mousedown');
	            _.each(this.viewModels, function(x) { x.destroy && x.destroy(); } );

	            this.$el.remove();

	            this.trigger("destroy");
	        },

	        setCollection: function(collection) {
	            if (_.isArray(collection))
	                this.collection = new SelfHostedCollection(collection);

	            else
	                this.collection = collection;

	            this.updateFromCollection();
	        },

	        updateFromCollection: function() {
	            if (!this.collection)
	                return;

	            if (this.viewModels.length > 0)
	                this.purge();

	            _.chain(this.collection.models)
	                .each(function(activityModel) {
	                    if (this.isActivityModelInScope(activityModel))
	                        this.addNewActivity(activityModel.attributes);
	                }.bind(this));

	            this.updateViewModelStates();
	        },

	        isActivityModelInScope: function(activityModel) {
	            return (!this.activeEmbeddedProcessId && !activityModel.get("ownerEmbeddedProcessActivityId") ||
	            this.activeEmbeddedProcessId == activityModel.get("ownerEmbeddedProcessActivityId"))
	        },

	        scopeToContainActivityModel: function(activityModel) {
	            if (!this.isActivityModelInScope(activityModel))
	                this.browseEmbeddedProcessId(activityModel.get("ownerEmbeddedProcessActivityId"));
	        },

	        scopeToContainActivityId: function(activityId) {
	            var model = this.collection.get(activityId);
	            this.scopeToContainActivityModel(model);
	        },

	        __doCollectionInitialized: function() {
	            this.trigger("collection:initialized", this);
	        },

	        initCollection: function() {
	            if (this.collection == null)
	                this.collection = new SelfHostedCollection();

	            this.updateFromCollection();
	            this.__doCollectionInitialized();
	            this.history.clear();
	            this.createDeleteZone();
	        },

	        invalidate: function(ids) {
	            this.invalidIds = ids;

	            var effectiveIds = ids || _.invoke(this.viewModels, "getId");

	            var extraIds = [];

	            var collection = this.collection;
	            var viewModelsHash = this.viewModelsHash;

	            _.each(effectiveIds, function(id) {
	                var model = collection.get(id);
	                if (model == null)
	                    return;

	                var viewModel = viewModelsHash[id];
	                if (viewModel)
	                    viewModel.invalidate();

	                if (model.get("ownerEmbeddedProcessActivityId"))
	                    extraIds.push(model.get("ownerEmbeddedProcessActivityId"));
	            });

	            if (extraIds && extraIds.length > 0)
	                this.invalidate(extraIds);
	        },

	        validate: function(ids) {
	            var effectiveIds = ids || _.invoke(this.viewModels, "getId");

	            var extraIds = [];

	            this.invokeForIds(effectiveIds, function() {
	                this.validate();
	                this.model.get("ownerEmbeddedProcessActivityId") &&
	                extraIds.push(this.model.get("ownerEmbeddedProcessActivityId"));
	            });

	            if (extraIds && extraIds.length > 0)
	                this.validate(extraIds);
	        },

	        invokeForIds: function(ids, fn, params, fnOther, paramsOther) {
	            _.each(this.viewModels, function(vm) {
	                if (_.contains(ids, vm.getId())) {
	                    if (_.isFunction(fn))
	                        fn.apply(vm, params || []);
	                    else
	                        vm[fn].apply(vm, params || []);
	                }
	                else if (fnOther) {
	                    if (_.isFunction(fnOther))
	                        fn.apply(vm, paramsOther || []);
	                    else
	                        vm[fnOther].apply(vm, paramsOther || []);
	                }
	            });

	        },

	        updateInvalid: function(ids) {
	            this.validate();
	            this.invalidate(ids);
	        },

	        createToolbox: function() {
	            this.toolboxView = new ToolboxView({ parent: this, width: this.toolboxWidth, height: this.toolboxHeight });


	            this.listenTo(this.toolboxView, "element:drag", this.__toolboxElementStartDrag);

	            this.toolboxView.on('dragStart', this.addActiveType.bind(this));
	            this.toolboxView.on("activityTypeClick", this.activityTypeClick.bind(this))
	        },

	        __toolboxElementStartDrag: function(eventArgs) {
	            this.addActiveType(eventArgs);
	        },

	        getChildrenSpan: function() {

	        },

	        activityTypeClick: function(el) {
	            var activitySet = this.getSelectedSet();

	            if (el.type == "EmbeddedProcess" && activitySet.length >= 1) {

	                this.initNewCommand();

	                var pointSum = { x: 0, y: 0 };
	                var div = [1/this.selected.length, 1/this.selected.length];
	                this.eachSelected(function(vm) {
	                    helpers.transformPoint(pointSum, vm.getPosition(), div);
	                }.bind(this));

	                var baseLine = { x: 100, y: 100 };
	                var serviceMargin = this.getGridAligned({ x: 80, y: 0 });
	                var span = helpers.getGrownRect(this.getSetSpan(activitySet), serviceMargin);
	                var setUpdate = helpers.getTransformedPoint(baseLine, span, helpers.negativeUnitVector);
	                var embeddedSpan = _.extend({}, span, baseLine);
	                var hAxis = helpers.getHorizontalAxis(embeddedSpan);

	                var embedded = this.addNewActivity(
	                    {
	                        type: "EmbeddedProcess",
	                        position: pointSum,
	                        ownerEmbeddedProcessActivityId: this.activeEmbeddedProcessId
	                    },
	                    {
	                        align: true
	                    }
	                );

	                var startEvent = this.addNewActivity(
	                    {
	                        type: "StartEvent",
	                        kind: "None",
	                        position: {
	                            x: hAxis.x1,
	                            y: hAxis.y1
	                        },
	                        ownerEmbeddedProcessActivityId: embedded.getId()
	                    },
	                    {
	                        align: true
	                    }
	                );


	                var endEvent = this.addNewActivity(
	                    {
	                        type: "EndEvent",
	                        kind: "None",
	                        position: {
	                            x: hAxis.x2,
	                            y: hAxis.y2
	                        },
	                        ownerEmbeddedProcessActivityId: embedded.getId()
	                    },
	                    {
	                        align: true
	                    }
	                );

	                _.each(activitySet, function(vm) {
	                    this.currentCommand.pick(vm.getId());
	                    this.currentCommand.pick(vm.getLinkedActivityIds());
	                    vm.model.set({
	                        "ownerEmbeddedProcessActivityId": embedded.getId(),
	                        "owner": null,
	                        "position": helpers.getTransformedPoint(vm.getPosition(), setUpdate)
	                    });
	                }.bind(this));

	                var externalSet = this.getSelectedSetExternals();

	                _.each(externalSet, function(f) {
	                    this.currentCommand.pick(f.getId());
	                    var outer = _.filter(activitySet, function(a) { return a == f.getLinkedSourceActivity() }).length > 0;
	                    var inner = _.filter(activitySet, function(a) { return a == f.getLinkedTargetActivity() }).length > 0;

	                    if (outer) {
	                        var source = f.getLinkedSourceActivity();
	                        f.configActivities(embedded, f.getLinkedTargetActivity());
	                        source.linkedActivityRemoved(f);
	                        var endFlow = this.connectNewActivities(source, endEvent);
	                        endFlow.model.set({ ownerEmbeddedProcessActivityId: embedded.getId() });

	                    }
	                    else if (inner) {
	                        var target = f.getLinkedTargetActivity();
	                        f.configActivities(f.getLinkedSourceActivity(), embedded);
	                        target.linkedActivityRemoved(f);
	                        var startFlow = this.connectNewActivities(startEvent, target);
	                        startFlow.model.set({ ownerEmbeddedProcessActivityId: embedded.getId() });
	                    }
	                }.bind(this));

	                embedded.select(true);

	                this.finalizeNewOrUpdateCommand([embedded]);


	                this.updateFromCollection();

	                this.collection.saveModel(embedded.model);
	                this.collection.saveModel(startEvent.model);
	                this.collection.saveModel(endEvent.model);

	            }
	        },

	        setEnterpriseToolbox: function() {
	            this.toolboxView.setPalette("enterprise");
	        },

	        createDeleteZone: function() {
	            if (this.isReadOnly)
	                return;

	            this.deleteZoneView = new DeleteZoneView( { parent: this });
	            this.deleteZoneView.appendControls();
	        },

	        setDefaultFormOffset: function () {
	            this.updateRootTransform();
	        },

	        setScroll: function(position) {
	            if (position) {
	                this.scroll.x = position.x;
	                this.scroll.y = position.y
	            }
	            this.updateRootTransform();
	        },

	        startDrag: { x: 0, y: 0},

	        scale: 1,

	        mouseWheel: function(event) {
	            if (event.ctrlKey) {
	                var around = this.clientToContainerXY({x: event.clientX, y: event.clientY});
	                if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
	                    this.zoomIn(around);
	                }
	                else {
	                    this.zoomOut(around);
	                }
	                event.stopPropagation();
	                event.preventDefault();
	            }
	            else {

	                var delta = [event.originalEvent.wheelDeltaX, event.originalEvent.wheelDeltaY];
	                helpers.transformPoint(this.scroll, delta, [this.scale / 3.0, this.scale / 3.0]);
	                this.limitScroll();
	                this.updateRootTransform();
	            }
	        },

	        bindMouseenterEvents: function () {
	            this.unbindMouseenterEvents();
	            this.$el.mouseenter(this.onmouseenter.bind(this));
	            this.$el.mouseleave(this.onmmouseleave.bind(this));
	        },

	        unbindMouseenterEvents: function () {
	            this.$el.unbind('mouseenter');
	            this.$el.unbind('mouseleave');
	        },

	        nullSpaceClick: function() {
	            if (event.altKey || event.ctrlKey || event.shiftKey) {
	                return;
	            }
	            _.invoke(this.viewModels, "hideControlElements");
	            this.deselectAll();
	        },

	        nullspaceMousedown: function(event) {
	            if (window.document.activeElement && window.document.activeElement.tagName &&
	                window.document.activeElement.tagName.toUpperCase() == 'TEXTAREA')
	                return;

	            if (event.altKey || event.ctrlKey || event.shiftKey) {
	                this.beginSelectRange(event);
	            }
	            else this.beginScroll(event);
	        },

	        initNewCommand: function() {
	            this.currentCommand = this.history.newNewObjectCommand();
	            this.currentCommand.captureOriginalState();
	        },

	        getSetSpan: function(activitySet) {
	            var maxX = 0, maxY = 0, minX = 100500, minY = 100500;

	            if (_.isArray(activitySet))
	                activitySet = _.chain(activitySet);

	            activitySet.each(function(child) {
	                var childRect = child.getPlacedRect();
	                maxX = Math.max(maxX, childRect.x + (childRect.width || 0));
	                maxY = Math.max(maxY, childRect.y + (childRect.height || 0));
	                minX = Math.min(minX, childRect.x);
	                minY = Math.min(minY, childRect.y);
	            });

	            return {
	                x: minX,
	                y: minY,
	                width: maxX - minX,
	                height: maxY - minY
	            }
	        },

	        addActivity: function(activity) {
	            this.__pushViewModel();
	            if (!activity.isHidden)
	                activity.render();
	        },

	        addActiveType: function (event) {
	            if (this.isReadOnly)
	                return;

	            this.initNewCommand();

	            this.deselectAll();

	            var clientXY = helpers.getPointFromParameter([event.clientX, event.clientY]);

	            this.activeType = event.id;
	            var data = {
	                'type': event.type,
	                'kind': event.kind,
	                'isTitleSet': false,
	                'position':  this.clientToContainerXY(clientXY),
	                'isTemp' : true
	            };
	            _.extend(data, event.options);

	            var model = this.collection.add(data);
	            this.startDrag = clientXY;

	            if (event.sourceActivity)
	                this.draggedRelativeActivity = event.sourceActivity;

	            this.addTempViewModel(model);
	        },

	        removeActiveType: function () {
	            $(window).unbind('mouseup');
	            delete this.activeType;
	        },

	        updateViewModelStates: function() {
	            _.invoke(this.viewModels, "modelUpdated");
	            _.invoke(this.viewModels, "removeOrphanedLinks");
	        },

	        realignLanes: function () {
	            var self = this;
	            _.each(this.viewModels, function (vm) {

	                var vmModel = vm.model;
	                if (vmModel.type === 'Lane') {
	                    var owner = self.getViewModelById(vmModel.owner);
	                    var index = vmModel.get("index");

	                    vm.owner = vm.previousOwner = owner;
	                    owner.childLanes.splice(index, 0, vm);
	                }
	            });
	            this.defaultPool.realignLanes();
	        },

	        purge: function () {
	            var self = this;
	            self.formContainer.selectAll('*').remove();
	            self.appendLayers();
	            self.viewModels = [];
	            self.viewModelsHash = {};
	            self.markerArrow = false;
	        },

	        startExisting: function (id) {
	            this.purge();
	            this.id = id;
	        },

	        pushUpdatedObjectHistory: function(viewModel) {
	            this.pushUpdatedObjectsHistory([viewModel]);
	        },

	        pushUpdatedObjectsHistory: function(viewModels) {
	            this.currentCommand = this.history.newUpdateObjectCommand();
	            this.currentCommand.captureOriginalState(viewModels);
	        },


	        activityResize: function (e) {
	            if (this.isReadOnly) {
	                e.cancel = true;
	                return;
	            }

	            this.resizedActivity = e.sourceActivity;

	            this.pushUpdatedObjectHistory(this.resizedActivity);

	            this.startDrag = helpers.getPointFromParameter([e.startX, e.startY]);

	            this.resizedActivity.beforeActivityResize();
	            this.unbindMouseenterEvents();

	            this.collection.postponeUpdates();
	            this.$el.on('mousemove', this.onresizemousemove.bind(this));
	            this.$el.on('mouseup', this.onresizemouseup.bind(this));
	        },

	        onresizemousemove: function (event) {
	            if (this.resizedActivity) {
	                var clientXY = helpers.getPointFromParameter([event.clientX, event.clientY]);
	                var delta = helpers.substractPoint(clientXY, this.startDrag);
	                helpers.multiplyPoint(delta, 1 / this.scale);

	                this.startDrag = clientXY;

	                this.resizedActivity.updateSize(delta);
	            }
	        },

	        onresizemouseup: function () {
	            this.collection.resumeUpdates();

	            this.$el.unbind('mousemove');
	            this.$el.unbind('mouseup');

	            this.resizedActivity.finishResize();

	            this.currentCommand && this.currentCommand.captureNewState([this.resizedActivity]);

	            delete this.resizedActivity;

	        },

	        linkedConnectorMoved: function (e) {
	            var viewModel = this.getViewModelById(e.sourceActivityId);
	            var connector = viewModel.getConnectorByIndex(e.sourceIndex);
	            var eventConnector = e.eventSource;
	            var eventViewModel = e.eventViewModel;

	            var newPosition = eventViewModel.getParentTranslated(eventConnector);
	            helpers.updatePoint(connector,  viewModel.getLocalized(newPosition));

	            if (viewModel.connectorMoved) {
	                viewModel.connectorMoved(connector);
	                viewModel.updateConnectorPosition(connector);
	            }
	        },

	        activityExclusivelySelected: function (e) {
	            this.selected = e.sourceActivity;
	            this.foreachViewModels(function (viewModel) {
	                if (e.sourceActivity != viewModel)
	                    viewModel.deselect(true);
	            });
	        },

	        deselectAll: function(isUserAction) {
	            isUserAction = isUserAction !== false;
	            delete this.selected;
	            this.foreachViewModels(function (viewModel) {
	                viewModel.deselect(isUserAction);
	            });
	        },

	        clickOnDiagram: function (event) {
	            if (event.target.tagName !== 'svg')
	                return;

	            if (event.altKey || event.ctrlKey || event.shiftKey)
	                return;

	            if (!this.willHandleClick)
	                return;

	            this.nullSpaceClick();
	        },

	        beginScroll: function(event) {
	            this.isDragConsumated = false;
	            this.anchor = { x: event.clientX, y: event.clientY };
	            this.$el.on('mousemove', this.moveAnchored.bind(this));
	            this.$el.on('mouseup', this.moveAnchoredFinish.bind(this));
	        },

	        beginSelectRange: function(event) {
	            this.isDragConsumated = false;
	            this.anchor = { x: event.clientX, y: event.clientY };
	            this.$el.on('mousemove', this.moveMultiSelect.bind(this));
	            this.$el.on('mouseup', this.moveMultiSelectFinish.bind(this));
	        },

	        diagramMouseDown: function (event) {
	            this.willHandleClick = true;
	            this.nullspaceMousedown(event);
	        },

	        onGlobalMouseUp: function(fn) {
	            this.$el.off("mouseup");
	            this.$el.on('mouseup', fn);
	        },

	        onGlobalMouseUpOnce: function(fn) {
	            var that = this;
	            this.$el.off("mouseup");
	            this.$el.on('mouseup', function(){
	                fn.apply(null, arguments);
	                this.$el.off("mouseup");
	            }.bind(this));
	        },

	        offGlobalMouseUp: function(fn) {
	            this.$el.off("mouseup");
	        },

	        moveAnchoredFinish: function () {
	            this.$el.unbind('mousemove');
	            this.$el.unbind('mouseup');
	        },

	        createSelectFrame: function() {
	            this.selectFrame = new SelectFrameView({ parent: this });
	        },

	        moveMultiSelect: function(event) {
	            if (!this.isDragConsumated) {
	                this.isDragConsumated = true;
	                this.hideActivityInfo();
	                this.createSelectFrame();
	            }

	            var newTranslatedPosition = this.clientToContainerXY({ x: event.clientX, y: event.clientY });

	            this.selectFrame.moved(newTranslatedPosition);
	        },

	        moveMultiSelectFinish: function() {
	            this.selectRange(this.selectFrame.getTranslatedRect());

	            this.selectFrame.destroy();
	            delete this.selectFrame;

	            this.$el.unbind('mousemove');
	            this.$el.unbind('mouseup');
	        },

	        getViewModelsInRange: function(rect) {
	            return _.filter(this.viewModels, function(vm) {
	                return vm.isInRange(rect);
	            });
	        },

	        getSelectableModelsInRange: function(rect) {
	            return _.filter(this.viewModels, function(vm) {
	                return vm.isMultiSelectable && (!rect || vm.isInRange(rect) );
	            });
	        },

	        selectRange: function(rect) {
	            var discovered = this.getSelectableModelsInRange(rect);
	            this.deselectAll();

	            _.invoke(discovered, "select");

	            this.selected = discovered;
	        },

	        selectActivityById: function(id, moveViewBox, isUserAction) {
	            isUserAction = isUserAction !== false;

	            this.scopeToContainActivityId(id);

	            var activity = this.getViewModelById(id);
	            activity.select(isUserAction);

	            if (!moveViewBox)
	                return;

	            var activityRect = activity.getPlacedRect();
	            var viewBox = this.getViewBox();

	            if (!helpers.doRectsIntersect(activityRect, viewBox)) {
	                this.targetScroll = {
	                    x: -(activityRect.x + activityRect.width/2) + viewBox.width / 2 ,
	                    y: -(activityRect.y + activityRect.height/2) + viewBox.height / 2
	                };
	                this.limitScroll(this.targetScroll);
	                this.runToTargetScroll();
	            }
	        },

	        moveAnchored: function (event) {

	            var clientXY = helpers.getPointFromParameter([event.clientX, event.clientY]);
	            var delta = helpers.substractPoint(clientXY, this.anchor);

	            if (helpers.isZeroPoint(delta))
	                return;

	            _.invoke(this.viewModels, "hideControlElements");

	            this.isDragConsumated = true;
	            this.anchor = clientXY;
	            helpers.transformPoint(this.scroll, delta, [1 / this.scale, 1 / this.scale ]);
	            this.limitScroll();
	            this.updateRootTransform();
	        },

	        zoomIn: function (around) {
	            this.zoom(1, around);
	        },

	        zoomOut: function (around) {
	            this.zoom(-1, around);
	        },

	        getCenter: function() {
	            return {
	                x: this.$el.width() / this.scale / 2 - this.scroll.x,
	                y: this.$el.height() / this.scale / 2 - this.scroll.y
	            };
	        },

	        getGridAligned: function(position) {
	            if (!this.grid)
	                return { x: position.x, y: position.y };
	            return {
	                x: _.isNull(position.x) ? 0 : (Math.round(position.x / this.grid.x) * this.grid.x),
	                y: _.isNull(position.y) ? 0 : (Math.round(position.y / this.grid.y) * this.grid.y)
	            };
	        },

	        runToTargetScale: function() {
	            if (Math.abs(this.targetScale - this.scale) < 0.0001)
	            {
	                this.setScale(this.targetScale, this.around);
	                delete this.targetScale;

	                return;
	            }

	            if (!this.targetScale)
	                return;

	            this.setScale(this.scale + (this.targetScale - this.scale) / 15, this.around);

	            setTimeout(this.runToTargetScale.bind(this), 30);
	        },

	        runToTargetScroll: function() {
	            if (!this.targetScroll)
	                return;

	            if (helpers.distance(this.scroll, this.targetScroll) < 2)
	            {
	                this.scroll = this.targetScroll;
	                this.updateRootTransform();
	                delete this.targetScroll;
	                return;
	            }

	            var vector = helpers.getRebasedPoint(
	                helpers.substractPoint(this.targetScroll, this.scroll),
	                Math.max(helpers.distance(this.scroll, this.targetScroll) / 5, 1));

	            helpers.transformPoint(this.scroll, vector);
	            this.updateRootTransform();

	            setTimeout(this.runToTargetScroll.bind(this), 30);
	        },

	        zoom: function (p, around) {
	            this.around = around;
	            this.targetScale = Math.min(Math.max(this.scale + 0.3 * p, 0.3), 5);
	            this.runToTargetScale();
	        },

	        getSvgDimensions: function () {
	            return { w: this.$el.width(), h: this.$el.height() };
	        },

	        getScaledSvgDimensions: function () {
	            var sizes = this.getSvgDimensions();
	            sizes.width = sizes.w / this.scale;
	            sizes.height = sizes.h / this.scale;

	            return sizes;
	        },

	        getViewBox: function() {
	            var dim = this.getScaledSvgDimensions();
	            return _.extend({}, helpers.getMultipledPoint(this.scroll, helpers.negativeUnitVector), this.getScaledSvgDimensions());
	        },

	        setScale: function (scale, around) {
	            var originalScale = this.scale;
	            var newScale = scale;

	            this.scale = scale;

	            if (Math.abs(originalScale - newScale) > 0.0001) {
	                // idea is what was under mouse before zoom, should stay under mouse after zoom
	                // so client = (p + s) * z and client = (p + s') * z'   (/ from reversed clientToContainer transform) /)
	                // -> (p + s) * z = (p + s') * z'
	                // -> s' = (p (z - z') + zs) / z'
	                // where z  - original scale scalar
	                //       z' - new scale scalar
	                //       s  - original scroll
	                //       p  - zoomed point (invariant) in diagram coords
	                // and   s' - new scroll, what we are looking for

	                around = around || this.getCenter();

	                var pzz = helpers.getMultipledPoint(around, originalScale - newScale);
	                var zs = helpers.getMultipledPoint(this.scroll, originalScale);
	                var numerator = helpers.sumPoints(pzz, zs);
	                this.scroll = helpers.getMultipledPoint(numerator, 1 / newScale);
	            }

	            this.limitScroll();

	            this.updateRootTransform();
	        },

	        limitScroll: function(target) {
	            var effectiveTarget = target || this.scroll;

	            effectiveTarget.x = Math.min(600 / this.scale, effectiveTarget.x);
	            effectiveTarget.y = Math.min(600, effectiveTarget.y);
	        },

	        updateRootTransform: function () {
	            var translation = helpers.getTranslation(this.scroll);
	            var scale = 'scale(' + this.scale + ')';
	            var transform = scale + ' ' + translation;
	            var dropZonesTranslation = helpers.getTranslation(
	                helpers.getTransformedPoint(helpers.nullVector, this.scroll, [-this.scale, -this.scale]));

	            this.formContainer.attr({ transform: transform });
	            this.containers["dropzones-g"].attr({
	                'transform': 'scale(' + 1 / this.scale + ') ' + dropZonesTranslation
	            });
	            this.tempActivityContainer.attr({ transform: transform });

	            this.svgNode = this.svg.node();
	            if (this.svgNode)
	                this.gaugePoint = this.svg.node().createSVGPoint();
	        },

	        foreachViewModels: function (fn) {
	            _.each(this.viewModels, fn);
	        },

	        onmmouseleave: function () {
	            this.$el.unbind('mousemove');
	            this.$el.unbind('mouseup');

	            if (this.activeType) {
	                this.removeDraggedViewModel();
	            }
	        },

	        removeDraggedViewModel: function () {
	            if (!this.draggedViewModel) return;

	            this.draggedViewModel.clear();
	            delete this.draggedViewModel;
	        },

	        debugPoint: function(x, y, x2, y2) {
	            if (x.x) {
	                this.debugPoint(x.x, x.y);
	                if (y && y.x)
	                    this.debugPoint(y.x, y.y);
	                return;
	            }
	            else {
	                this.containers["flow-g"]
	                    .append("g")
	                    .append("circle")
	                    .classed("debug", true)
	                    .attr({
	                        fill: 'red',
	                        cx: x,
	                        cy: y,
	                        r: 5
	                    });
	                if (x2)
	                    this.debugPoint(x2, y2);
	            }
	        },

	        selectAll: function() {
	            this.selectRange();
	        },

	        debugClear: function() {
	            _.invoke(this.viewModels, "debugClear");
	            this.containers["flow-g"].selectAll(".debug").remove();
	        },

	        existingActivityDrag: function (e) {
	            if (this.isReadOnly || e.sourceActivity.isDragDisabled()) {
	                this.beginScroll({ clientX: e.startX, clientY: e.startY });
	                return;
	            }

	            this.draggedViewModel = e.sourceActivity;

	            if (this.getSelectedSet().indexOf(this.draggedViewModel) == -1)
	                this.selected = [this.draggedViewModel];

	            this.unbindMouseenterEvents();

	            this.isDragConsumated = false;

	            this.startDrag = helpers.getPointFromParameter([e.startX, e.startY]);

	            this.collection.postponeUpdates();

	            this.$el.on('mousemove', this.dragIt.bind(this));
	            this.$el.on('mouseup', this.onMouseUp.bind(this));

	        },

	        getLaneAmount: function () {
	            var amount = 0;
	            _.each(this.viewModels, function (vm) {
	                vm.model.attributes.type === 'Lane' && amount++;
	            });
	            return amount;
	        },

	        setMousedownTimeout: function (fn) {
	            this.mousedownTimeout = setTimeout(fn, 100);
	        },

	        clearMousedownTimeout: function () {
	            clearTimeout(this.mousedownTimeout);
	            this.$el.unbind('mouseup');
	        },

	        setConnectorsVisibility: function (isShown) {
	            this.svg.selectAll('.when-flow-drag').classed("dev-diagram-flow-visible", isShown);
	        },

	        getEventPosition: function(optionalEvent) {
	            var effectiveEvent = optionalEvent || d3.event;
	            if (!effectiveEvent)
	                throw "No event scope and we are looking for some vent properties";
	            return this.clientToContainerXY({ x: effectiveEvent.clientX, y: effectiveEvent.clientY });
	        },

	        clientToContainerXY: function (position) {
	            var offset = this.$el.offset();

	            if (!offset)
	                return position;

	            return {
	                x: (position.x - offset.left) / this.scale - this.scroll.x,
	                y: (position.y - offset.top) / this.scale - this.scroll.y
	            };
	        },

	        containerToClientXY: function (position) {
	            var offset = this.$el.offset();

	            return {
	                x: (position.x + this.scroll.x) * this.scale + offset.left,
	                y: (position.y + this.scroll.y) * this.scale + offset.top
	            };
	        },

	        containerToElementXY: function(position) {
	            return {
	                x: (position.x + this.scroll.x) * this.scale,
	                y: (position.y + this.scroll.y) * this.scale
	            };
	        },

	        render: function () {
	            _.each(this.viewModels, function (viewModel) {
	                viewModel.render();
	            });

	            this.draggedViewModel && this.draggedViewModel.render();

	            if (!this.graphWidth) {
	                this.resize();
	            }
	        },

	        appendLayers: function () {
	            this.containers = {
	                'pool-g': this.formContainer.append('g').classed('pool-g', true),
	                'lane-g': this.formContainer.append('g').classed('lane-g', true),
	                'object-g': this.formContainer.append('g').classed('object-g', true),
	                'select-g': this.formContainer.append('g').classed('select-g', true),
	                'mounted-g': this.formContainer.append('g').classed('mounted-g', true),
	                'flow-g': this.formContainer.append('g').classed('flow-g', true),
	                'subactivity-g': this.formContainer.append('g').classed('subactivity-g', true),
	                'overlay-g': this.svg.append('g').classed('overlay-g', true),
	                'dropzones-g': this.formContainer.append('g').classed('dropzones-g', true),
	                'ghost-g': this.formContainer.append('g').classed('ghost-g', true)
	            };

	            this.formContainer.attr({ "fill": "#eee" } );

	            this.updateRootTransform();
	            this.trigger("layersRecreated");
	        },

	        disabledPoint: { x: 60, y: 0 },

	        getViewModelById: function (id) {
	            var visibleViewModel = this.viewModelsHash[id];

	            if (!visibleViewModel) {
	                var model = this.collection.get(id);
	                if (model != null) {
	                    return _.extend(this.viewModelByModel(model), { isHidden: true });
	                }

	                return null;
	            }

	            return visibleViewModel;
	        },

	        addIfVisible: function(viewModel) {
	            if (!viewModel.model.get("ownerEmbeddedProcessActivityId") && !this.activeEmbeddedProcessId ||
	                viewModel.model.get("ownerEmbeddedProcessActivityId") == this.activeEmbeddedProcessId) {

	                this.viewModels.push(viewModel);
	                this.viewModelsHash[viewModel.getId()] = viewModel;

	                viewModel.isHidden = false;

	                viewModel.modelUpdated();
	            }
	        },

	        captureLanesState: function() {
	            this.defaultPool && this.defaultPool.captureOriginalState();
	        },

	        createViewByModel: function(model) {
	            var viewConstructor = this.modelMapper.matchModel(model);
	            return new viewConstructor ({ model: model, parent: this, isHidden: true });

	        },

	        addTempViewModel: function (model) {
	            var self = this;

	            var viewConstructor = this.modelMapper.matchModel(model);
	            if (viewConstructor.prototype.defaultModelAttributes)
	                _.extend(model.attributes, JSON.parse(JSON.stringify(viewConstructor.prototype.defaultModelAttributes)));

	            this.draggedViewModel = new viewConstructor ({ model: model, parent: this });
	            this.draggedViewModel.isTemp = true;

	            this.draggedViewModel.render();

	            if (!this.draggedViewModel)
	                throw "View model for " + JSON.stringify(model) + " was not resolved, cannnot create activity";

	            this.viewModelsHash[this.draggedViewModel.getId()] = this.draggedViewModel;

	            if (this.draggedViewModel.isOfType("Lane"))
	                this.captureLanesState();

	            this.collection.postponeUpdates();

	            this.$el.on('mousemove', this.dragIt.bind(this));
	            this.$el.on('mouseup', this.onTempMouseUp.bind(this));
	        },

	        addNewActivity: function (obj, options) {
	            if (!obj)
	                throw "Cannot add empty object as an activity";

	            options = options || {};

	            if (options.client) {
	                obj.position = _.extend({}, this.clientToContainerXY(options.client) );
	            }

	            if (options.currentOwner) {
	                obj.ownerEmbeddedProcessActivityId = this.activeEmbeddedProcessId;
	            }

	            if (options.direction && options.connect) {
	                var symmetry = options.connect.getSymmetricalCenter();
	                helpers.transformPoint(symmetry, options.direction, [200, 150]);
	                obj.position = symmetry;
	            }

	            var model = this.collection.add(obj);
	            var viewModel = this.addNewActivityViaModel(model, true);

	            if (options.direction && options.connect) {
	                var rect = viewModel.getDimensions();
	                var update = helpers.getTransformedPoint(
	                    helpers.nullVector,
	                    { x: -rect.width / 2, y: -rect.height / 2 },
	                    helpers.unitVector);

	                viewModel.moveActivity(update);
	            }

	            if (options.align) {
	                viewModel.alignToGrid();
	            }

	            if (options.connect) {
	                var firstOne = options.inverse ? viewModel : options.connect;
	                var lastOne = options.inverse ? options.connect : viewModel;
	                this.connectNewActivities(firstOne, lastOne);
	            }

	            if (options.select) {
	                viewModel.select(true);
	            }

	            return viewModel;
	        },

	        __pushViewModel: function(viewModel) {
	            this.viewModels.push(viewModel);
	            this.viewModelsHash[viewModel.getId()] = viewModel;
	        },

	        addNewActivityViaModel: function(model, isNew) {
	            var ActivityView = this.modelMapper.matchModel(model);

	            if (isNew && ActivityView.prototype.defaultModelAttributes)
	                _.extend(model.attributes, JSON.parse(JSON.stringify(ActivityView.prototype.defaultModelAttributes)));


	            var view = new ActivityView(
	                {
	                    model: model,
	                    parent: this,
	                    isTemp: false,
	                    isHidden: false
	                }
	            );
	            this.__pushViewModel(view);
	            return view;
	        },

	        add: function(activity) {
	            this.__pushViewModel(activity);
	            activity.parent = this;
	            activity.isHidden = false;
	            activity.render();
	        },

	        isDropAllowed: function (e) {
	            return true;
	        },

	        findControlPanel: function(clientPosition) {
	            var result = null;

	            this.svg.selectAll('.diagram-drop-zone').each(function() {
	                var view = d3.select(this).property("zoneView");
	                var clientRect = view.getClientPlacedRect();
	                if (clientPosition.x > clientRect.x && clientPosition.x < clientRect.x + clientRect.width &&
	                    clientPosition.y > clientRect.y && clientPosition.y < clientRect.y + clientRect.height)

	                    result = view;
	            });

	            return result;
	        },

	        fireControlZonesEvents: function(event) {
	            var self = this;
	            var originalControlZone = self.controlZoneEntered;

	            self.controlZoneEntered = self.findControlPanel({ x: event.clientX, y: event.clientY });
	            self.controlZoneEntered && self.controlZoneEntered.draggedActivityEnter(self.draggedViewModel);

	            if (originalControlZone && self.controlZoneEntered != originalControlZone)
	                originalControlZone.draggedActivityLeave(self.draggedViewModel);
	        },

	        eachSelectedExceptDragged: function(fn) {
	            if (!$.isArray(this.selected))
	                return;

	            _.each(_.without(this.selected, this.draggedViewModel), fn);
	        },

	        selectedDragStart: function(event) {
	            this.draggedViewModel.initialDragPosition = this.draggedViewModel.getPosition();

	            this.eachSelectedAndDragged(function(selected) {
	                selected.startDrag(event);
	            });

	            !this.draggedViewModel.isTemp && this.pushUpdatedObjectsHistory(this.getSelectedSet());

	            if (this.draggedViewModel.isMountable())
	                this.lastDragOwner = this.draggedViewModel.getMountedOwner();
	        },

	        dragIt: function (event) {
	            this.fireControlZonesEvents(event);

	            var clientXY = helpers.getPointFromParameter([event.clientX, event.clientY]);
	            var delta = helpers.substractPoint(clientXY, this.startDrag);
	            this.startDrag = clientXY;

	            helpers.multiplyPoint(delta, 1 / this.scale);

	            if (helpers.isZeroPoint(delta))
	                return;

	            if (!this.isDragConsumated)
	                this.selectedDragStart(event);

	            this.isDragConsumated = true;
	            this.willHandleClick = false;

	            this.eachSelectedAndDragged().invoke("updatePosition", delta);

	            this.triggerDragEvents(event);
	        },

	        triggerDragOverEvents: function (event) {
	            var position = this.clientToContainerXY({ x: event.clientX, y: event.clientY }),
	                self = this,
	                eventArgs = {
	                    event: event,
	                    draggedViewModel: this.draggedViewModel,
	                    position: position
	                };

	            var currentDragOwner = null;

	            var viewModelsQue = _.chain(this.viewModels);
	            var stop = viewModelsQue
	                .filter(_.matches({ receiveDragOver: true }))
	                .filter(function(viewModel) {
	                    return viewModel.containsPoint(position);
	                })
	                .indexBy("layer")
	                .some(
	                function (viewModel) {
	                    viewModel.dragOver(eventArgs);
	                    if (eventArgs.stop)
	                        currentDragOwner = eventArgs.owner || viewModel;

	                    return eventArgs.stop;
	                });

	            if (this.lastDragOwner && currentDragOwner != this.lastDragOwner)
	                this.lastDragOwner.trigger("dragOverLeave", eventArgs);

	            this.lastDragOwner = currentDragOwner;

	            if (!stop.value() && this.isNeedTriggerPreviousOwner(eventArgs.draggedViewModel)) {
	                eventArgs.draggedViewModel.previousOwner.trigger('dragOver', eventArgs);
	            }
	        },


	        isNeedTriggerPreviousOwner: function (draggedActivity) {
	            return !draggedActivity.isTemp && draggedActivity.previousOwner;
	        },

	        triggerDragEvents: function (event) {
	            this.draggedViewModel.areConnectionEventsTriggered() && this.triggerConnectionEvents(event);
	            this.draggedViewModel.areDragOverEventsTriggered() && this.triggerDragOverEvents(event);
	        },

	        clearAllConnectorsState: function () {
	            this._cachedConnectors = [];
	            delete this.linked;
	        },

	        _cachedConnectors: [],

	        getConnectorsBound: function (viewModel, margin) {
	            var bound = {
	                leftUp: helpers.getPointFromParameter(helpers.maxVector),
	                rightBottom: helpers.getPointFromParameter(helpers.minVector)
	            };

	            this.foreachConnector(function (conCfg) {
	                if (conCfg.x0 < bound.leftUp.x)
	                    bound.leftUp.x = conCfg.x0;

	                if (conCfg.x0 > bound.rightBottom.x)
	                    bound.rightBottom.x = conCfg.x0;

	                if (conCfg.y0 < bound.leftUp.y)
	                    bound.leftUp.y = conCfg.y0;

	                if (conCfg.y0 > bound.rightBottom.y)
	                    bound.rightBottom.y = conCfg.y0;
	            }, 0, this.draggedViewModel);

	            helpers.transformPoint(bound.leftUp, [ -margin, -margin ]);
	            helpers.transformPoint(bound.rightBottom, [ margin, margin ]);
	            return bound;

	        },

	        triggerConnectionEvents: function (event) {
	            this.clearAllConnectorsState();

	            var margin = 70;
	            var bound = this.getConnectorsBound(this.draggedViewModel, margin);

	            var self = this;
	            var linkedCandidates = [], linked = void 0;

	            this.foreachConnector(function (conCfg) {
	                var inbound =
	                    (conCfg.x0 > bound.leftUp.x && conCfg.x0 < bound.rightBottom.x &&
	                    conCfg.y0 > bound.leftUp.y && conCfg.y0 < bound.rightBottom.y) &&
	                    conCfg.parent != self.draggedViewModel;

	                if (!inbound)
	                    return;

	                self.foreachConnector(function (draggedConCfg) {
	                    var intersections = self.getConnectorsIntersect(conCfg, draggedConCfg);

	                    if (intersections.linked < 10) {
	                        linkedCandidates.push({
	                            source: draggedConCfg,
	                            target: conCfg,
	                            dist: intersections.linked
	                        });
	                    }
	                    if (intersections.nearest) {
	                        conCfg.parent.showHighlightedConnectors(conCfg);
	                        self._cachedConnectors.push(conCfg);
	                    }
	                }, 0, self.draggedViewModel);

	            }, -self.draggedViewModel.getCharge());

	            _.each(linkedCandidates, function (el) {
	                if (!linked || linked.dist > el.dist) {
	                    linked = el;
	                }
	            });

	            if (linked) {
	                self._cachedConnectors.push(linked.target);
	                linked.target.parent.setTempLinked(linked.source, linked.target);

	                this.linked = linked;
	            }

	        },

	        getConnectorsIntersect: function (c1, c2) {
	            var dist = Math.sqrt((c1.x0 - c2.x0) * (c1.x0 - c2.x0) + (c1.y0 - c2.y0) * (c1.y0 - c2.y0));
	            return  {
	                linked: dist,
	                nearest: dist < 100
	            };
	        },

	        foreachConnector: function (fn, desiredCharge, viewModel) {
	            var connectors;
	            if (viewModel) {
	                connectors = viewModel.getDraggedConnectors();
	            } else {
	                connectors = this.svg.selectAll('.js-diagram-connector');
	            }

	            connectors.each(function () {
	                var connector = d3.select(this);
	                var connectorCfg = connector.property('model');
	                var charge = connector.attr('charge');
	                if (desiredCharge && (charge != desiredCharge))
	                    return;

	                var p0 = helpers.sumPoints(connectorCfg, connectorCfg.parent.getPosition());
	                helpers.updatePoint(connectorCfg, p0, "x0", "y0");

	                fn(connectorCfg);
	            });
	        },

	        onTempMouseUp: function (event) {
	            if (this.isDropAllowed() && this.draggedViewModel) {
	                this.draggedViewModel.appendToTargetContainer();
	                this.viewModels.push(this.draggedViewModel);
	            }
	            else {
	                this.draggedViewModel && this.draggedViewModel.clear();
	            }

	            this.onMouseUp(event);
	        },

	        ensureQue: function(action) {
	            this.invokeQue = this.invokeQue || {};
	            this.invokeQue[action] = this.invokeQue[action] || { scheduled: false, viewModels: _.chain([]) };
	            return this.invokeQue[action];
	        },

	        addToInvokeQue: function(action, viewModels, invokeRightNow) {
	            var que = this.ensureQue(action);
	            if (_.isArray(viewModels))
	                que.viewModels = que.viewModels.union(viewModels);
	            else
	                que.viewModels = que.viewModels.union(viewModels.value());
	            invokeRightNow && this.invokeQued(action);
	        },

	        addIdsToInvokeQue: function(action, viewModels, invokeRightNow) {
	            var objs = [];
	            _.each(viewModels, function(viewModelId) {
	                this.viewModelsHash[viewModelId] && objs.push(viewModelId);
	            }.bind(this));
	            this.addToInvokeQue(action, objs, invokeRightNow);
	        },

	        invokeQued: function(action) {
	            var que = this.ensureQue(action);

	            if (!que.scheduled) {
	                que.scheduled = true;
	                setTimeout(function() {
	                    que.viewModels.unique().invoke(action);
	                    que.viewModels = _.chain([]);
	                    que.scheduled = false;
	                }.bind(this), 0);
	            }
	        },

	        onMouseUp: function (event) {
	            event.stopImmediatePropagation();
	            event.stopPropagation();
	            event.preventDefault();

	            this.collection.resumeUpdates();

	            // somehow it vanished
	            if (!this.draggedViewModel)
	                return;

	            if (!this.isDragConsumated) {
	                this.removeDragStateVariables();
	                return;
	            }

	            var clientPos = { x: event.clientX, y: event.clientY};
	            var pos = this.clientToContainerXY(clientPos);
	            var eventCfg = { position: pos, sourceActivity: this.draggedViewModel, original: event };

	            var controlZone = this.findControlPanel(clientPos);
	            if (controlZone && controlZone.isActivityDropValid(this.draggedViewModel) && controlZone.doActivityDrop(this.draggedViewModel)) {
	                this.controlZoneEntered = null;
	                this.removeDragStateVariables();
	                return;
	            }

	            this.draggedViewModel.removeFutureRect();

	            if (this.draggedViewModel.isDropDisabled()) {

	                this.draggedViewModel.trigger("dragAborted");

	                if (this.isNeedTriggerPreviousOwner(this.draggedViewModel)) {
	                    this.draggedViewModel.previousOwner.trigger('finishDragOver', eventCfg);
	                }
	                else if (this.draggedViewModel.isTemp) {
	                    this.draggedViewModel.clear();
	                    this.deleteViewModel(this.draggedViewModel);
	                }

	                this.afterDragEnd();
	                return;
	            }

	            if (this.linked) {
	                var flowConnector = this.linked.source.index === 0 ? 'sourceCfg' : 'targetCfg',
	                    currentLinkedActivity = this.linked.source.parent.model.attributes[flowConnector],
	                    isNeedChange = false;

	                if (currentLinkedActivity) {
	                    var newTarget = this.linked.target.parent.model.attributes.id,
	                        newTargetIndex = this.linked.target.parent.tempLinked.target.index;
	                    isNeedChange = (currentLinkedActivity.activityId === newTarget && currentLinkedActivity.index !== newTargetIndex );
	                }

	                this.linked.target.parent.updateLinkedPermanent(isNeedChange);
	            }

	            this.dispatchDragFinishEvents(eventCfg);

	        },

	        finalizeNewOrUpdateCommand: function(viewModels) {
	            if (!this.currentCommand)
	                this.currentCommand = this.history.newNewObjectCommand();

	            this.currentCommand.captureNewState(viewModels);
	        },

	        eachSelected: function(fn) {
	            _.each(this.selected, fn);
	        },

	        eachSelectedAndDragged: function(fn) {
	            var result = [];
	            if (!this.selected || !$.isArray(this.selected))
	                result = [this.draggedViewModel || this.selected];
	            else result = _.union(this.selected, this.draggedViewModel ? [this.draggedViewModel] : []);

	            if (!result[0]) result = [];

	            var ids = _.invoke(result, "getId");
	            var mounted = this.getMountedSet(ids);

	            result = _.union(result, mounted);

	            if (fn)
	                _.each(result, fn);
	            else return _.chain(result);
	        },

	        updateFlowsAfterMove: function(eventCfg) {
	            var self = this;

	            var singular = self.getSelectedSingular();
	            if (singular && (singular.isOfMetaType("Flow") || !singular.isMultiSelectable))
	                return;

	            var activitySet = _.chain(this.getSelectedSet());

	            var dragDistance = helpers.substractPoint(
	                this.draggedViewModel.getPosition(),
	                this.draggedViewModel.initialDragPosition);

	            if (eventCfg && eventCfg.original && eventCfg.original.shiftKey) {
	                this.rebuildActivitiesFlowsAfterMove(activitySet, dragDistance);
	                return;
	            }
	            this.updateActivitiesFlowsAfterMove(activitySet, dragDistance);
	        },

	        rebuildActivitiesFlowsAfterMove: function(activitySet, momentum) {
	            var internalFlows = activitySet.filter(function(f) {
	                return f.isOfMetaType("Flow");
	            });
	            var externalFlows = this.getGroupExternals(activitySet);
	            internalFlows.invoke("moveActivity", momentum);
	            _.invoke(externalFlows, "rebuildOptimize");
	        },

	        updateActivitiesFlowsAfterMove: function(activitySet, momentum) {
	            var internalFlows = activitySet.filter(function(f) {
	                return f.isOfMetaType("Flow");
	            });
	            var externalFlows = this.getGroupExternals(activitySet);

	            internalFlows.invoke("moveActivity", momentum);

	            _.each(externalFlows, function(flow) {
	                flow.updateConnectorPosition(flow.affectedConnectorCfg, momentum);
	            });
	        },

	        groupMove: function(group, momentum) {
	            this.groupTranslate(null, momentum, group);
	            this.updateActivitiesFlowsAfterMove(this.getGroupSet(group), momentum);
	        },

	        groupMoveWithMounted: function(group, momentum) {
	            var activitySet = group.union(this.getMountedSet(group.invoke("getId").value()));
	            this.groupTranslate(null, momentum, activitySet);
	            this.updateActivitiesFlowsAfterMove(this.getGroupSet(activitySet), momentum);
	        },

	        groupTranslate: function(group, momentum, activitySet) {
	            var effectiveSet = activitySet || group.union(this.getMountedSet(group.invoke("getId").value()));
	            effectiveSet.invoke("moveActivity", momentum);
	        },

	        landSelectedSet: function(newOwner) {
	            var previousOwners = this.eachSelectedAndDragged().pluck("owner").compact().uniq();
	            previousOwners.invoke("childrenUpdated");

	            this.eachSelectedAndDragged().invoke("addOwner", newOwner);

	            try {
	                newOwner && newOwner.fitChildren(false);
	            }
	            catch(e) {
	                debugger;
	            }
	        },

	        connectNewActivities: function(activitySource, activityTarget, flow) {
	            var layout = { position: { x: 0, y: 0 }},
	                effectiveFlow = flow || this.addNewActivity({type: 'Flow', layout: layout, ownerEmbeddedProcessActivityId: this.activeEmbeddedProcessId});

	            effectiveFlow.configActivities(activitySource, activityTarget);

	            return effectiveFlow;
	        },

	        dispatchDragOverFinishEvents: function(eventCfg) {
	            if (this.lastDragOwner) {
	                this.lastDragOwner.trigger('finishDragOver', eventCfg);
	            }
	        },

	        dispatchDragFinishEvents: function (eventCfg) {
	            var self = this;
	            this.dispatchDragOverFinishEvents(eventCfg);

	            var eachSelectedAndDragged = this.eachSelectedAndDragged();
	            var isGroupMove = eachSelectedAndDragged.value().length > 1;

	            eachSelectedAndDragged.invoke(
	                "onFinishDrag",
	                {
	                    isLinked: self.linked,
	                    isGroupMove: isGroupMove
	                });

	            if (!this.draggedViewModel.isTemp)
	                this.updateFlowsAfterMove(eventCfg);

	            if (!eventCfg.stop) {
	                if (!this.draggedViewModel.isOfType('Lane') && this.lastDragOwner && this.lastDragOwner.isContainer)
	                    this.landSelectedSet(this.lastDragOwner);
	            }

	            if (this.draggedRelativeActivity && !this.draggedViewModel.isOfMetaType("Flow")) {
	                var firstOne = eventCfg.original.shiftKey ? this.draggedViewModel : this.draggedRelativeActivity;
	                var lastOne = eventCfg.original.shiftKey ? this.draggedRelativeActivity : this.draggedViewModel;
	                this.connectNewActivities(firstOne, lastOne);
	            }

	            this.finalizeNewOrUpdateCommand(this.getSelectedSet());

	            this.afterDragEnd();
	        },

	        removeDragStateVariables: function() {
	            this.$el.unbind('mousemove');
	            this.$el.unbind('mouseup');
	            delete this.lastDragOwner;
	            this.draggedViewModel && this.draggedViewModel.isTemp && (delete this.draggedViewModel.isTemp);
	            this.draggedViewModel.model.set("isTemp", false);
	            delete this.draggedViewModel;
	            delete this.draggedRelativeActivity;
	            delete this.linked;
	            delete this.isDragConsumated;

	        },

	        afterDragEnd: function () {
	            this.removeDragStateVariables();
	            this.clearAllConnectorsState();
	        },

	        addTempActivity: function (type, kind, position) {
	            var data = { 'type': type, 'kind': kind, isTitleSet: false, isTemp: true };
	            var model = this.collection.add(data);
	            this.addTempViewModel(model);
	            this.draggedViewModel.updatePosition(position);
	        },

	        getContainer: function (targetType, isTemp) {
	            var containerName;
	            if (isTemp)
	                return this.tempActivityContainer;

	            containerName = this.modelMapper.matchTypeContainer(targetType);
	            return this.containers[containerName];
	        },

	        getActivityContainer: function(activity) {
	            if (activity.isTemp)
	                return this.tempActivityContainer;

	            var containerName = this.modelMapper.matchModelContainer(activity.model);
	            return this.containers[containerName];
	        },

	        getSelectedSingular: function() {
	            var firstSelected  = _.first(this.selected) || this.selected;
	            if (firstSelected && !firstSelected.isMultiSelectable)
	                return firstSelected;

	            if (this.draggedViewModel && !this.draggedViewModel.isMultiSelectable)
	                return this.draggedViewModel;

	            return null;

	        },

	        getGroupExternals: function(group) {
	            var result = [];
	            var selectedIds = group.invoke("getId");
	            group.each(function(activity) {
	                _.each(activity.getLinkedActivities(), function(linked) {
	                    if (!linked.isOfMetaType("Flow"))
	                        return;

	                    var sourceId = linked.getLinkedSourceCfg();
	                    var sourceIdIndex = selectedIds._wrapped.indexOf(sourceId && sourceId.activityId || 0);
	                    var targetId = linked.getLinkedTargetCfg();
	                    var targetIdIndex = selectedIds._wrapped.indexOf(targetId && targetId.activityId || 0);

	                    if (sourceIdIndex >= 0 && targetIdIndex >= 0)
	                        return;

	                    if (!sourceId || !targetId)
	                        return;

	                    if (sourceIdIndex >= 0 && targetIdIndex == -1) {
	                        var affectedIndex =
	                            activity
	                                .getConnectorsMatch({ ownIndex: sourceId.index, targetId: linked.getId() })
	                                .targetConnectorIndex;

	                        linked.affectedConnectorCfg = _.find(linked.connectors, _.matches({ index: affectedIndex }));
	                    }

	                    if (sourceIdIndex == -1 && targetIdIndex >= 0) {
	                        var affectedIndex2 =
	                            activity
	                                .getConnectorsMatch({ ownIndex: targetId.index, targetId: linked.getId() })
	                                .targetConnectorIndex;

	                        linked.affectedConnectorCfg = _.find(linked.connectors, _.matches({ index: affectedIndex2 }));
	                    }

	                    result.push(linked);
	                });
	            });

	            return _.uniq(result);

	        },

	        getSelectedSetExternals: function() {
	            var singular = this.getSelectedSingular();
	            if (singular)
	                return singular.isMultiSelectable ? singular.getLinkedActivities() : [];

	            return this.getGroupExternals(this.eachSelectedAndDragged());

	        },

	        getMountedSet: function(ids) {
	            return _.filter(this.viewModels, function(x) {
	                var mounted = x.model.get("mountedOn");
	                return mounted && (ids.indexOf(mounted) >= 0)
	            });
	        },

	        getGroupSet: function(activities) {
	            var effectiveActivities = activities.union(this.getMountedSet(activities.invoke("getId").value()));
	            var result = [];
	            var selectedIds = effectiveActivities.invoke("getId").value();
	            effectiveActivities.each(function(activity) {
	                result.push(activity);
	                _.each(activity.getLinkedActivities(), function(linked) {
	                    if (_.every(linked.getLinkedIds(),
	                            function(id) {
	                                return selectedIds.indexOf(id) >= 0;
	                            })) result.push(linked);
	                });
	            });

	            return _.chain(result).uniq();
	        },

	        getSelectedSet: function() {
	            var singular = this.getSelectedSingular();
	            if (singular)
	                return _.union([singular], this.getMountedSet([singular.getId()]));

	            return this.getGroupSet(this.eachSelectedAndDragged()).value();

	        },

	        deleteSelected: function() {
	            if (this.isReadOnly)
	                return;

	            var self = this;

	            var selectedSet = self.getSelectedSet();

	            if (selectedSet.length == 0)
	                return;

	            var deleteCommand = this.history.newDeleteObjectCommand();
	            deleteCommand.captureOriginalState(selectedSet);

	            _.each(selectedSet, this.deleteActivity.bind(this));

	            delete this.selected;
	        },

	        deleteActivityById: function(activityId) {
	            this.deleteActivity(this.getViewModelById(activityId));
	        },

	        deleteActivityByTitle: function(title) {
	            this.deleteActivity(_.find(this.viewModels, function(x) { return x.getTitle() == title}));
	        },

	        deleteActivity: function (activity) {
	            var subject = activity;

	            if (!subject || subject.isDeleteDisabled())
	                return;

	            subject.trigger("before:delete");

	            subject.deselect();
	            subject.remove();
	            this.deleteViewModel(subject);
	            subject.afterRemoved();

	            this.collection.remove(subject.model);
	        },

	        deleteViewModel: function (viewModelToDelete) {

	            var linked = viewModelToDelete.getLinkedActivities();
	            _.each(linked, function (linkedActivity) {
	                linkedActivity.linkedActivityRemoved(viewModelToDelete);
	            });

	            this.viewModels.splice(this.viewModels.indexOf(viewModelToDelete), 1);

	            viewModelToDelete.owner && viewModelToDelete.owner.childrenUpdated();

	        },

	        resize: function () {
	            this.graphWidth = this.$el.outerWidth();
	            this.graphHeight = this.$el.outerHeight();

	            $(this.graphContainer).width(this.graphWidth);
	            $(this.graphContainer).height(this.graphHeight);

	            this.trigger("resize");
	        },

	        getChildren: function(owner) {
	            return _.filter(this.viewModels, function(x) { return x.owner == owner; });
	        },

	        getActivityByTitle: function(title) {
	            return _.find(this.viewModels, function(x) { return x.model.attributes.title == title; });
	        },

	        getFilteredViewModelsByType: function(type) {
	            var query = _.chain(this.viewModels);
	            return query.filter(function(x) { return x.isOfType(type); });
	        },

	        getFilteredViewModelsByMetaType: function(type) {
	            var query = _.chain(this.viewModels);
	            return query.filter(function(x) { return x.isOfMetaType(type); });
	        },

	        getAllFlows: function() {
	            return this.getFilteredViewModelsByMetaType("Flow");
	        },

	        getFlowsCrossingRect: function(rect) {
	            var result = this.getAllFlows().filter(function(flow) {
	                var localizedRect = flow.localizeRect(rect);
	                return !!_.find(flow.getPath(), function(pathSegment) {
	                    return !!flow.getLineIntersectedRect(pathSegment, [localizedRect]);
	                });
	            });

	            return result.value();
	        },

	        pushViewModel: function(viewModel) {
	            this.viewModels.push(viewModel);
	            this.viewModelsHash[viewModel.getId()] = viewModel;
	        },

	        enforceFlowLinkedActivity: function(flow, activity) {
	            var originalLinked = flow.getLinkedActivities();
	            if (originalLinked.length == 0)
	                return;

	            if (originalLinked.length == 2) {
	                var originalSource = flow.getLinkedSourceActivity();
	                var originalTarget = flow.getLinkedTargetActivity();

	                originalTarget.linkedActivityRemoved(flow);
	                originalSource.linkedActivityRemoved(flow);

	                this.connectNewActivities(originalSource, activity, flow);
	                this.connectNewActivities(activity, originalTarget);

	                return;
	            }

	            var originalSingle = _.first(originalLinked);

	            if (flow.getLinkedTargetCfg())
	                this.connectNewActivities(activity, originalSingle, flow);
	            else
	                this.connectNewActivities(originalSingle, activity, flow);
	        },

	        disabledMessageTemplate: Handlebars.compile(disabledMessageTemplate),

	        disable: function(message) {
	            if (message) {
	                var disabledSvgMessageView = this.disabledMessageTemplate({message: message});
	                var center = this.getCenter();
	                this.messageNode = helpers.appendTranslatedGroup(this.svg, {x: center.x - 100, y: center.y - 75});
	                this.messageNode.html(disabledSvgMessageView);
	            }
	            this.svgNode.style.pointerEvents = 'none';
	            this.formContainer.attr({ opacity: 0.2 });
	        },

	        enable: function() {
	            this.messageNode && this.messageNode.remove();
	            this.svgNode.style.pointerEvents = 'none';
	        },

	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2), __webpack_require__(19)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers, ElementGroupView) {

	    'use strict';

	    return Marionette.Object.extend({
	        initialize: function (cfg) {
	            this.__readConfig(cfg || {});
	            this.groups = [];
	            this.bindEvents();
	            _.bindAll(this, "__elementStartDrag");

	            this.scroll = { x: 0, y: 0 };
	        },

	        __readConfig: function(cfg) {
	            this.container = cfg.container || (cfg.parent && cfg.parent.toolboxContainer);
	            this.palette = cfg.palette || 'default';
	            cfg.width && (this.width = cfg.width);
	            cfg.height && (this.height = cfg.height);

	        },

	        width: 90,
	        height: 1000,
	        leftOffset: 10,
	        elementHeight: 45,
	        elementLeftOffset: 12,

	        bindEvents: function () {
	            //this.on('elementClick', this.onElementClick.bind(this));
	            this.on('dragStart', this.deselectAndHideAll.bind(this));
	        },


	        activityTypeClick: function(options) {
	            this.parent && this.parent.activityTypeClick && this.parent.activityTypeClick(options);
	        },


	        onElementClick: function (elementView) {
	            _.each(this.elements, function (el) {
	                if (el !== elementView)
	                    el.deselect();
	            });

	        },

	        deselectAll: function () {
	            _.each(this.elements, function (el) {
	                    el.deselect();
	            });
	        },

	        deselectAndHideAll: function () {
	            this.deselectAll();
	        },

	        render: function () {
	            if (!this.container)
	                return;

	            this.container.selectAll("*").remove();

	            this.$el = $(this.container.node());

	            this.$el.on("mousewheel DOMMouseScroll", this.mouseWheel.bind(this));

	            this.container.append('rect').attr({
	                x: 0,
	                y: 0,
	                width: this.width,
	                height: this.height,
	                fill: '#FFF'
	            });

	            this.container.append('line').attr({
	                x1: this.width,
	                y1: 0,
	                x2: this.width,
	                y2: this.height,
	                'stroke-width': 1,
	                stroke: '#BFBEBE'
	            });

	            this.container.append('line').attr({
	                x1: 0,
	                y1: this.height,
	                x2: this.width,
	                y2: this.height,
	                'stroke-width': 1,
	                stroke: '#BFBEBE'
	            });

	            this.appendElements();
	        },

	        mouseWheel: function(event) {
	            var delta = [event.originalEvent.wheelDeltaX, event.originalEvent.wheelDeltaY];
	            helpers.transformPoint(this.scroll, delta, [0.0, 0.15]);
	            if (this.scroll.y > 0) this.scroll.y = 0;
	            this.container.attr(helpers.getTranslationAttribute(this.scroll));

	            event.stopPropagation();
	            event.preventDefault();
	        },

	        appendElements: function () {
	            _.invoke(this.groups, "render");
	        },

	        __elementStartDrag: function(eventArgs) {
	            _.extend(eventArgs, { toolbox: this });
	            this.trigger("element:drag", eventArgs);
	        },

	        pushGroup: function(elementsGroupView) {
	            this.groups.push(elementsGroupView);
	            elementsGroupView.updateContainer(this.container);
	            this.render();

	            this.listenTo(elementsGroupView, "element:drag", this.__elementStartDrag);
	        },

	        setPalette: function(newPalette) {
	            this.palette = newPalette;
	            this.render();
	        }
	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	;


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers)
	{
	    var TemplatedElement = function(options) {
	        this.template = Handlebars.compile(options.template);
	    };

	    TemplatedElement.prototype.render = function() {

	    };

	    return Marionette.Object.extend({

	        initialize: function(cfg) {
	            this.elements = [];
	            this.position = { x: 0, y: 0};
	            this.width = 100;
	            this.height = 100;
	            this.titleHeight = 20;
	            this.title = "abstract group";
	            this.id = "abstractGroup1";

	            this.__readConfig(cfg || {});
	            _.bindAll(this, "__elementStartDrag");
	        },

	        __readConfig: function(cfg) {
	            this.parent = cfg.parent;
	            this.container = cfg.container || (this.parent && this.parent.container);
	        },

	        __generateElements: function() {
	            this.views = [];
	            _.each(this.elements, function(element) {
	                var cfg = _.extend(element, {
	                    container: this.elementsContainer
	                });

	                var viewConstructor = element.view;
	                var newView = new viewConstructor(element);

	                newView.on("element:drag", this.__elementStartDrag);

	                this.views.push(newView);
	            }.bind(this));
	        },

	        __elementStartDrag: function(eventArgs) {
	            _.extend(eventArgs, { group: this });
	            this.trigger("element:drag", eventArgs);
	        },

	        updateContainer: function(container) {
	            this.container = container;
	        },

	        render: function() {
	            var rootAttrs = {
	                'id': this.id
	            };

	            rootAttrs = _.extend(rootAttrs, helpers.getTranslationAttribute(this.position));

	            this.rootContainer = this.container.append("g").attr(rootAttrs);

	            this.borderElement = this.rootContainer
	                .append("rect")
	                .attr({
	                    x: 0,
	                    y: 0,
	                    width: this.width,
	                    height: this.height,
	                    fill: "black",
	                    opacity: "0"
	                });

	            this.titleElement = this.rootContainer.append("text")
	                .classed("no-select", true)
	                .attr({
	                    dx: 0,
	                    dy: 10
	                })
	                .text(this.title);

	            // trash bin for group elements
	            this.elementsContainer = this.rootContainer.append("g").attr(
	                helpers.getTranslationAttribute({ x: 0, y: this.titleHeight }));

	            this.childrenBorderElement = this.elementsContainer
	                .append("rect")
	                .attr({
	                    x: 0,
	                    y: 0,
	                    width: this.width,
	                    height: this.height - this.titleHeight,
	                    fill: "black",
	                    opacity: "0"
	                });

	            this.__generateElements();

	            _.invoke(this.views, "render");

	        }
	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function(helpers) {

	    'use strict';

	    return Marionette.Object.extend({
	        initialize: function(cfg) {
	            this.parent = cfg.parent;
	            this.anchor = cfg.parent.anchor;
	            this.translatedAnchor = cfg.parent.clientToContainerXY(this.anchor);

	            this.container = this.parent.containers["select-g"];

	            this.render();
	        },

	        getPlacedRect: function() {
	            return {
	                x: 0,
	                y: 0,
	                width: this.size ? this.size.width : 0,
	                height: this.size ? this.size.height : 0
	            };
	        },

	        getRegularizedPlacedRect: function() {
	            return helpers.regularizeRect(this.getPlacedRect());
	        },

	        getTranslatedRect: function() {
	            var rect = this.getRegularizedPlacedRect();
	            rect.x += this.translatedAnchor.x;
	            rect.y += this.translatedAnchor.y;
	            return rect;
	        },

	        render: function() {
	            this.contentElement = helpers.appendTranslatedGroup(this.container, this.translatedAnchor);

	            this.visibleElement = this.contentElement.append("rect")
	                .attr(this.getRegularizedPlacedRect())
	                .attr({
	                    stroke: 'black',
	                    fill: 'none',
	                    'stroke-width': 1,
	                    opacity: '0.77',
	                    'stroke-dasharray': '6 6'
	                });
	        },

	        moved: function(newPosition) {
	            this.size = this.size || {};
	            this.size.width = newPosition.x - this.translatedAnchor.x;
	            this.size.height = newPosition.y - this.translatedAnchor.y;

	            this.visibleElement.attr(this.getRegularizedPlacedRect());
	        },

	        destroy: function()
	        {
	            this.contentElement.remove();
	        }
	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function ()
	{
	    'use strict';

	    var constants = {
	        defaultContainer: 'object-g'
	    };

	    var ModelMapper = Marionette.Object.extend({
	        initialize: function() {
	            this.mappers = []
	        },

	        matchModel: function(activityModel) {
	            var activity = null;

	            _.some(this.mappers, function(mapper) {
	                var activityCandidate = mapper.matchModel(activityModel);
	                if (!activityCandidate)
	                    return false;

	                activity = activityCandidate;
	                return true;
	            });

	            return activity;
	        },

	        matchModelContainer: function(activityModel) {
	            var resolvedContainer = constants.defaultContainer;

	            _.some(this.mappers, function(mapper) {
	                if (!mapper.matchModelContainer)
	                    return false;

	                var containerCandiate = mapper.matchModelContainer(activityModel);

	                if (!containerCandiate)
	                    return false;

	                resolvedContainer = containerCandiate;

	                return true;
	            });

	            return resolvedContainer;
	        },

	        matchTypeContainer: function(activityType) {
	            return constants.defaultContainer;
	        },

	        addMapper: function(extraMapping) {
	            this.mappers.push(extraMapping);
	        },

	        defineSingleMapper: function(newSingleMapper) {
	            this.mappers = [newSingleMapper];
	        }
	    });

	    ModelMapper.config = constants;

	    return ModelMapper;

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
	    'use strict';

	    var deepCopy = function(obj) {
	        return JSON.parse(JSON.stringify(obj));
	    };

	    var targetModelCopy = function(viewModel) {
	        return {
	            id: viewModel.getId(),
	            type: viewModel.model.attributes.type,
	            attributes: deepCopy(viewModel.model.attributes)
	        };
	    };

	    var captureLinkedState = function(targets) {
	        var state = { nested: {} };

	        state.main = _.map(targets, function(target) {
	            return {
	                isEmpty: true,
	                id: target.getId()
	            }
	        });

	        _.each(targets, function(target) {
	            var linked = target.getLinkedActivities();
	            for (var i = 0; i < linked.length; i++)
	                state.nested[linked[i].getId()] = { attributes: deepCopy(linked[i].model.attributes) };
	        });

	        return state;
	    };

	    var captureState = function(targets) {
	        var states = [], nested = {};

	        _.each(targets, function(target) {
	            var state = {};
	            state.attributes = deepCopy(target.model.attributes);
	            state.id = target.getId();
	            state.type = target.model.attributes.type;
	            state.isEmpty = false;
	            var linked = target.getLinkedActivities();

	            for (var i = 0; i < linked.length; i++) {
	                nested[linked[i].getId()] = targetModelCopy(linked[i]);
	            }

	            states.push(state)
	        });

	        return {
	            main: states,
	            nested: nested
	        };
	    };

	    var captureStateSingle = function(taget) {
	        return captureState([target]);
	    };

	    var restoreViewModel = function(diagram, state) {
	        var model = diagram.collection.model(state.attributes);
	        model.attributes = _.extend(deepCopy(state.attributes));
	        diagram.collection.add(model);

	        var restoredViewModel = diagram.createViewByModel(model, diagram);
	        diagram.__pushViewModel(restoredViewModel);

	        return restoredViewModel;
	    };

	    var updateViewModel = function(diagram, state, avoidEvents) {
	        var target = diagram.getViewModelById(state.attributes.id);
	        avoidEvents || target.beforeModelUpdated();
	        target.model.attributes = deepCopy(state.attributes);
	        target.ghostPosition && delete target.ghostPosition;
	        avoidEvents || target.modelUpdated();

	        diagram.collection.saveModel(target.model);
	    };

	    var setStateNested = function(diagram, states) {
	        var target;

	        var updateList = _.chain(states.main).where({ isEmpty: false }).union(_.map(states.nested))
	            .map(function(x) { return diagram.getViewModelById(x.id); });

	        updateList.invoke("beforeModelUpdated");

	        _.each(states.main, function(state) {
	            if (state.isEmpty)
	                return;

	            updateViewModel(diagram, state, true);
	        });

	        _.each(states.nested, function(state) {
	            updateViewModel(diagram, state, true);
	        });

	        updateList.invoke("modelUpdated");
	    };


	    var UpdateObjectCommand = function(parent) {
	        var self = this;

	        self.parent = parent;

	        self.captureOriginalState = function(target) {
	            self.originalSnapshot = _.map(self.parent.viewModels, function(viewModel) {
	                return targetModelCopy(viewModel);
	            });

	            self.originalState = captureState(target);
	        };

	        self.captureNewState = function(target) {
	            self.newState = captureState(target);

	            _.each(self.originalState.nested, function(originalNestedSate) {
	                if (!self.newState.nested[originalNestedSate.id]) {
	                    self.newState.nested[originalNestedSate.id] =
	                        targetModelCopy(self.parent.getViewModelById(originalNestedSate.id));
	                }
	            });
	        };

	        self.pick = function(viewModelId) {
	            self.originalState.nested[viewModelId] = deepCopy(_.find(self.originalSnapshot, _.matches({ id: viewModelId })));
	        };

	        self.undo = function() {
	            setStateNested(self.parent, self.originalState);
	        };

	        self.redo = function() {
	            setStateNested(self.parent, self.newState);
	        };
	    };

	    var NewObjectCommand = function(parent) {
	        var self = this;

	        self.parent = parent;

	        self.captureNewState = function(targets) {
	            var target = targets[0];
	            if (!target)
	                return;

	            self.newState = { isEmpty: true,  nested: {} };


	            var discoveredNewObjects = _.filter(self.parent.viewModels, function(m) {
	                var matcher = _.matches({ id: m.getId() });
	                return !_.find(self.originalSnapshot, matcher);
	            });

	            var affected = _.map(discoveredNewObjects, function(newObject) {
	                return _.filter(newObject.getLinkedActivities(), function(newObjectLink) {
	                    return !_.find(discoveredNewObjects, function(newObject2) {
	                        return newObjectLink.getId() === newObject2.getId();
	                    });
	                });
	            });

	            var discoveredAffectedObjects = _.flatten(affected);

	            self.originalState.absentActivities = _.invoke(discoveredNewObjects, "getId");

	            self.newState.selectedActivity = target.getId();

	            _.each(discoveredAffectedObjects, function(o) {
	                var id = o.getId();
	                self.newState.nested[id] = targetModelCopy(o);
	                self.pick(id);
	            });

	            _.each(discoveredNewObjects, function(o) {
	                var id = o.getId();
	                self.newState.nested[id] = _.extend(targetModelCopy(o), { isNew: true });
	            });

	            // picked objects
	            _.each(self.originalState.nested, function(originalNestedSate) {
	                if (!self.newState.nested[originalNestedSate.id]) {
	                    self.newState.nested[originalNestedSate.id] =
	                        targetModelCopy(self.parent.getViewModelById(originalNestedSate.id));
	                }
	            });

	        };

	        self.createSnapshot = function() {
	            self.originalSnapshot = _.map(self.parent.viewModels, function(viewModel) {
	                return targetModelCopy(viewModel);
	            });

	            self.originalState = { isEmpty: true, nested: {} };

	        };

	        self.captureOriginalState = function() {
	            self.createSnapshot();
	            self.originalState.selectedActivity =
	                _.isArray(self.parent.selected)
	                    ? _.invoke(self.parent.selected, "getId")
	                    : (self.parent.selected ? [self.parent.selected.getId()] : []);
	        };

	        self.pick = function(viewModelId) {
	            if (_.isArray(viewModelId))
	                _.each(viewModelId, self.pick);
	            var picked = _.find(self.originalSnapshot, _.matches({ id: viewModelId }));
	            picked && (self.originalState.nested[viewModelId] = deepCopy(picked));
	        };

	        self.undo = function() {
	            _.each(self.originalState.absentActivities, function(id) {
	                var follower = self.parent.getViewModelById(id);
	                if (!follower.isHidden) {
	                    follower.clear();
	                    follower.deselect();
	                    self.parent.deleteActivity(follower);
	                }
	                else {
	                    self.parent.collection.remove(follower.model);
	                }
	            });

	            self.parent.selected = [];

	            _.each(self.originalState.nested, function(state) {
	                var target = self.parent.getViewModelById(state.id);
	                target.model.attributes = deepCopy(state.attributes);
	                if (target.ghostPosition) delete target.ghostPosition;
	                if (!target.isHidden)
	                    target.modelUpdated();
	                target.model.collection.saveModel(target.model);

	                self.parent.addIfVisible(target);
	            });

	            _.each(self.originalState.selectedActivity, function(selectedId) {
	                var target = self.parent.getViewModelById(selectedId);
	                target.select(self.originalState.selectedActivity.length == 1);
	                self.originalState.selectedActivity.length == 1 && (self.parent.selected = target);
	                self.originalState.selectedActivity.length > 1 && self.parent.selected.push(target);
	            });
	        };

	        self.redo = function() {
	            _.each(self.newState.nested, function(state) {
	                if (state.isNew)
	                    restoreViewModel(self.parent, state);
	                else {
	                    var affected = self.parent.getViewModelById(state.id);
	                    affected.model.attributes = deepCopy(state.attributes);
	                    affected.modelUpdated();
	                    affected.model.collection.saveModel(affected.model);
	                }
	            });

	            var selectedActivity = self.parent.getViewModelById(self.newState.selectedActivity);
	            selectedActivity.select();
	        };
	    };

	    var DeleteObjectCommand = function(parent) {
	        var self = this;
	        self.parent = parent;

	        self.captureOriginalState = function(target) {
	            self.originalState = captureState(target);
	        };

	        self.undo = function() {
	            var restored = [];

	            self.parent.deselectAll();
	            _.each(self.originalState.main, function(restoredState) {
	                var restoredViewModel = restoreViewModel(self.parent, restoredState);
	                restoredViewModel.select(false);
	                self.parent.selected = self.parent.selected || [];
	                self.parent.selected.push(restoredViewModel);
	                restored.push(restoredViewModel);
	            });

	            self.newState = captureLinkedState(restored);

	            setStateNested(self.parent, self.originalState);

	            _.each(restored, function(vm) { vm.model.set("isModified", true); });
	        };

	        self.redo = function() {
	            _.each(self.originalState.main, function(state) {
	                var target = parent.getViewModelById(state.id);
	                target.clear();
	                self.parent.deleteActivity(target);
	            });

	            setStateNested(self.parent, self.newState);
	        };

	    };


	    var History = function(parent) {
	        var self = this;
	        self.parent = parent;

	        self.commands = [];
	        self.commandIndex = -1;

	        self.pushCommand = function(command) {
	            command.originalState = { isEmpty: true, nested: {} };
	            command.newState = { isEmpty: true, nested: {} };
	            self.commands.push(command);
	            self.commandIndex = self.commands.length - 1;
	        };

	        self.newNewObjectCommand = function() {
	            var command = new NewObjectCommand(self.parent);
	            self.pushCommand(command);
	            return command;
	        };

	        self.newUpdateObjectCommand = function() {
	            var command = new UpdateObjectCommand(self.parent);
	            self.pushCommand(command);

	            return command;
	        };

	        self.newDeleteObjectCommand = function() {
	            var command = new DeleteObjectCommand(self.parent);
	            self.pushCommand(command);

	            return command;
	        };

	        self.undo = function() {
	            if (self.commandIndex >= 0) {
	                var command = self.commands[self.commandIndex];
	                command.undo();
	                self.commandIndex --;

	            }
	        };

	        self.redo = function() {
	            if (self.commandIndex + 1 < self.commands.length) {
	                self.commandIndex++;
	                var command = self.commands[self.commandIndex];
	                command.redo();
	            }
	        };

	        self.addNested = function(commandState, nestedObject) {
	            if (commandState.nested[nestedObject.model.attributes.id])
	                return;

	            commandState.nested[nestedObject.model.attributes.id] = targetModelCopy(nestedObject);
	        };

	        self.getLastCommand = function() {
	            var lastCommand = null;
	            if (self.commandIndex < 0)
	                return;

	            return self.commands[self.commandIndex];
	        };

	        self.clear = function() {
	            self.commands = [];
	            self.commandIndex = -1;
	        };
	    };

	    History.deepCopy = deepCopy;
	    History.restoreViewModel = restoreViewModel;


	    return History;

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(22)], __WEBPACK_AMD_DEFINE_RESULT__ = function(UndoRedoHelper) {

	    return function(diagram) {
	        var self = this;
	        self.diagram = diagram;

	        self.data = {};

	        self.addToClipboard = function(viewModel) {
	            self.data[viewModel.getId()] =
	                UndoRedoHelper.deepCopy(_.omit(viewModel.model.attributes,
	                    "id", "globalId", "systemName"));


	        };

	        self.suppressConnectors = function(state) {
	            state.connectors = _.filter(state.connectors, function(c) { return self.data[c.targetId] });
	        };

	        self.copy = function() {
	            self.data = {};

	            var selectedSet = self.diagram.getSelectedSet();
	            _.each(selectedSet, self.addToClipboard.bind(self));

	            _.each(self.data, self.suppressConnectors.bind(self));
	        };

	        self.paste = function() {

	            self.diagram.initNewCommand();

	            var pasted = [];

	            _.each(self.data, function(state) {
	                state.position.x += 50;
	                state.position.y += 50;
	                var restored = UndoRedoHelper.restoreViewModel(self.diagram, { attributes: state });
	                diagram.collection.saveModel(restored.model);
	                pasted.push(restored);
	                state.pastedId = restored.getId();
	            });

	            _.each(pasted, function(pastedViewModel) {
	                _.each(pastedViewModel.model.attributes.connectors, function(pastedViewModelConnector) {
	                    pastedViewModelConnector.targetId = self.data[pastedViewModelConnector.targetId].pastedId;
	                });
	            });

	            _.invoke(pasted, "render");
	            self.diagram.deselectAll();
	            _.invoke(pasted, "select", true);
	            self.diagram.selected = _.reject(pasted, function(x) { return x.isOfMetaType("Flow") });
	            if (self.diagram.selected.length == 0)
	                self.diagram.selected = _.first(pasted);


	            self.diagram.finalizeNewOrUpdateCommand(pasted);
	        };
	    };

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(2)], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers) {

	    return Marionette.Object.extend({
	        initialize: function(cfg) {
	            this.parent = cfg.parent;

	            this.parent.on("resize", this.parentResize.bind(this));
	            this.parent.on("layersRecreated", this.appendControls.bind(this));
	        },

	        width: 350,
	        height: 34,
	        diagramLeftMargin: 120,
	        diagramBottomMargin: 54,
	        textPosition: {
	            x: 110,
	            y: 23
	        },
	        textPositionH2: {
	            x: 130,
	            y: 23
	        },
	        defaultText: "DROP HERE TO DELETE",


	        appendControls: function() {
	            this.contentElement = helpers.appendSimpleGroup(this.parent.containers['dropzones-g'])
	                .classed("delete-zone diagram-drop-zone", true);
	            this.contentElement.property("zoneView", this);
	            this.render();
	        },

	        getClientPlacedRect: function() {
	            var rect = this.getPlacedRect();

	            var parentOffset = this.parent.$el.offset();
	            if (!parentOffset)
	                return;

	            rect.x += parentOffset.left;
	            rect.y += parentOffset.top;

	            return rect;
	        },

	        isActivityDropValid: function(activity) {
	            if (activity.isOfMetaType("Flow")) {
	                if (activity.getLinkedActivities().length > 0)
	                    return false;
	            }
	            return true;
	        },

	         draggedActivityEnter: function(activity) {
	            if (!this.isActivityDropValid(activity))
	                return;

	            this.devastationMode(true);
	        },

	        draggedActivityLeave: function(activity) {
	            this.devastationMode(false);
	        },

	        devastationMode: function(isOn) {
	            this.panelElement.attr({
	                'fill': isOn ? "rgb(198, 105, 84)" : "rgb(245, 220, 214)"
	            });

	            var position = isOn ? this.textPositionH2 : this.textPosition;

	            this.textElement.attr(
	                {
	                    fill: isOn ? "white" : "rgb(165, 51, 23)",
	                    dx: position.x,
	                    dy: position.y
	                })
	                .text(isOn ? "Delete now" : this.defaultText)
	        },

	        doActivityDrop: function(activity) {
	            this.devastationMode(false);

	            activity.previousOwner && (activity.owner = activity.previousOwner);

	            this.parent.deleteSelected();

	            return true;
	        },

	        render: function() {
	            var rect = this.getPlacedRect();
	            this.panelElement = this.contentElement.append("rect")
	                .attr( {
	                    'width': rect.width,
	                    'height': rect.height
	                })
	                .attr({
	                    'fill': '#f5dcd6'
	                })
	                .classed("no-select", true);
	            this.textElement = this.contentElement.append("text")
	                .attr({
	                    'dx': this.textPosition.x,
	                    'dy': this.textPosition.y,
	                    'font-size': '14px',
	                    'color': '#a53317',
	                    'fill': '#a53317'
	                })
	                .text(this.defaultText)
	                .style({ "cursor": "default" });
	            this.applyRootTransform(rect);
	        },

	        getPlacedRect: function() {
	            return {
	                x: this.diagramLeftMargin,
	                y: this.parent.graphHeight ? (this.parent.graphHeight - this.diagramBottomMargin) : 0,
	                width: this.width,
	                height: this.height
	            };
	        },

	        applyRootTransform: function(source) {
	            var rect = source || this.getPlacedRect();
	            this.contentElement.attr(helpers.getTranslationAttribute(rect));
	        },

	        parentResize: function() {
	            this.contentElement && this.applyRootTransform();
	        },

	        remove: function() {
	            this.contentElement.remove();
	        }

	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(19),
	    __webpack_require__(26),
	    __webpack_require__(1),
	    __webpack_require__(3),
	    __webpack_require__(5),
	    __webpack_require__(6)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(ToolboxGroup, ToolboxElement, Activity, FlowView, ActivitySequence, behaviors) {

	    var Circle = function() {
	        this.offset = { left: 0, top: 0 };
	        this.view = Circle.ToolboxElement;
	        this.type = "Circle";
	    };

	    Circle.ToolboxElement = ToolboxElement.extend({
	        initialize: function() {
	            ToolboxElement.prototype.initialize.apply(this, arguments);
	            this.tpl = Handlebars.compile("<circle class='js-toolbox toolbox-circle-primitive' cx=15 cy=7 r=10 />");
	        }
	    });

	    Circle.Activity = Activity.extend({
	        defaultModelAttributes: {
	            size: { width: 50, height: 50}
	        },

	        initialize: function(cfg) {
	            behaviors.setupDeclarative(this,
	                'rectangular-resizers',
	                'rectangular-shaped-connector-set');
	            behaviors.subActivitySpawnSequence.setup(this, { sequence: Circle.ColorSequence() });
	            behaviors.titled.setup(this, behaviors.titled.undersideLayoutPreset);
	            _.extend(cfg, {
	                template: '<g transform="{{dimScale}}" class="js-activity-resize-root diagram-activity-circle"><circle class="diagram-activity-circle js-activity-shape" cx="50" cy="50" r="50"></rect></g>'
	            });
	            Activity.prototype.initialize.apply(this, [cfg]);
	        }
	    });

	    Circle.ColorSequence = function() {
	        return ActivitySequence.create({type: 'Circle'}, [
	            {
	                tpl: Handlebars.compile("<circle fill='white' stroke='red' cx=15 cy=15 r=10 />")
	            },
	            {
	                tpl: Handlebars.compile("<circle fill='white' stroke='yellow' cx=15 cy=15 r=10 />")
	            },
	            {
	                tpl: Handlebars.compile("<circle fill='white' stroke='blue' cx=15 cy=15 r=10 />")
	            }
	        ]);
	    };

	    var Rectangle = function() {
	        this.offset = { left: 40, top: 0 };
	        this.view = Rectangle.ToolboxElement;
	        this.type = "Rectangle";
	    };

	    Rectangle.Activity = Activity.extend({
	        initialize: function(cfg) {
	            behaviors.setupDeclarative(this,
	                'titled',
	                'rectangular-resizers',
	                'rectangular-shaped-connector-set',
	                'info-button'
	            );
	            behaviors.subActivitySpawnSequence.setup(this, { sequence: Rectangle.ColorSequence() });
	            behaviors.infoWindow.setup(this, { template: "<div style='padding: 10px'>This is simple popup activity info</div>"});

	            _.extend(cfg, {
	                template: '<g transform="{{dimScale}}"  class="js-activity-resize-root">' +
	                    '<rect class="diagram-activity-rectangle js-activity-shape" vector-effect="non-scaling-stroke" x="0" y="0" width="100" height="100"></rect>' +
	                '</g>'
	            });
	            Activity.prototype.initialize.apply(this, [cfg]);

	        }
	    });

	    Rectangle.ColorSequence = function() {
	        return ActivitySequence.create({type: 'Rectangle'}, [
	            {
	                tpl: Handlebars.compile("<rect fill='white' stroke='olive'x=4 y=4  width=28 height=20 />")
	            },
	            {
	                tpl: Handlebars.compile("<rect fill='white' stroke='navy' x=4 y=4 width=28 height=20 />")
	            },
	            {
	                tpl: Handlebars.compile("<rect fill='white' stroke='pink' x=4 y=4  width=28 height=20 />")
	            }
	        ]);
	    };

	    Rectangle.ToolboxElement = ToolboxElement.extend({

	        initialize: function() {
	            ToolboxElement.prototype.initialize.apply(this, arguments);
	            this.tpl = Handlebars.compile("<rect class='js-toolbox toolbox-rectangle-primitive' x=0 y=0 width=25 height=15 />")
	        }
	    });

	    var Flow = function() {
	        this.offset = { left: 0, top: 30 };
	        this.view = Flow.ToolboxElement;
	        this.type = "Flow";
	    };

	    Flow.ToolboxElement = ToolboxElement.extend({
	        initialize: function() {
	            ToolboxElement.prototype.initialize.apply(this, arguments);
	            this.tpl = Handlebars.compile(
	                '<g transform="translate(13,-6) scale(0.75)"><path d="M0,12L0,47" stroke="#7f7f7f" stroke-width="2"></path>' +
	                '<polygon points="-5,27 0,11 5,27 -5,27" stroke-width="2" fill="#7f7f7f"></polygon></g>');
	        }
	    });

	    var modelReference = {
	        'Circle': Circle.Activity,
	        'Rectangle': Rectangle.Activity,
	        'Flow': FlowView,

	        matchModel: function(model) {
	            return this[model.attributes.type]
	        }
	    };

	    var PrimitiveShapesGroup = ToolboxGroup.extend({
	        initialize: function() {
	            ToolboxGroup.prototype.initialize.apply(this, arguments);
	            this.elements.push(new Circle());
	            this.elements.push(new Rectangle());
	            this.elements.push(new Flow());
	            this.id = "primitivesGroup";
	            this.title = "Primitives"
	            this.position = {x: 0, y:10};
	        }
	    });

	    return Marionette.Object.extend({
	        install: function(diagram) {
	            diagram.toolboxView.pushGroup((new PrimitiveShapesGroup({ container: diagram.toolboxView })));
	            diagram.modelMapper.addMapper(modelReference);
	        }
	    });

	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(2)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function (helpers) {
	    'use strict';

	    return Marionette.Object.extend({
	        arrowTopOffset: 30,

	        initialize: function (cfg) {
	            _.extend(this, cfg);
	            this.selected = false;
	            this.effectiveParentContainer = cfg.container || cfg.parent.container;
	            this.modelOptions = {};
	        },

	        bindEvents: function () {
	            this.container.on({
	                mouseenter: this.onMouseenter.bind(this),
	                mouseleave: this.onMouseleave.bind(this),
	                mousedown: helpers.getDebouncedHandler(this.onElementMousedown, 50, this, true),
	                mouseup: this.onElementMouseup.bind(this),
	                click: this.onElementClick.bind(this)
	            });
	        },

	        unbindEvents: function () {
	            this.container.on({
	                mouseenter: null,
	                mouseleave: null,
	                mousedown: null,
	                click: null
	            });
	        },

	        render: function () {
	            this.container = this.effectiveParentContainer
	                .append('g')
	                .attr(helpers.getTranslationAttribute({ x: this.offset.left, y: this.offset.top }))
	                .classed({
	                    'element-container': true,
	                    'no-select': true
	                });

	            this.contentElement = helpers.appendSimpleGroup(this.container);

	            this.drawShape();
	            this.drawElementRect();

	            this.bindEvents();

	        },

	        drawShape: function () {
	            this.tpl && this.contentElement.html(this.tpl(this));
	        },

	        drawGroupArrow: function () {
	            if (!this.hasChildren)
	                return;

	            var minX = this.offset.left + 36,
	                maxX = minX + 6,
	                minY = this.offset.top + this.arrowTopOffset,
	                maxY = minY + 6,
	                points = [
	                    minX + ',' + maxY,
	                    maxX + ',' + maxY,
	                    maxX + ',' + minY,
	                    minX + ',' + maxY
	                ];

	            this.container.append('polygon')
	                .attr({
	                    points: points.join(' '),
	                    fill: '#BFBEBE'
	                });
	        },

	        drawElementRect: function () {
	            var box = this.container[0][0].getBBox();

	            this.selectRect = this.container.append('rect')
	                .attr({
	                    x: box.x - 5,
	                    y: box.y - 5,
	                    width: box.width + 10,
	                    height: box.height + 10,
	                    stroke: 'none',
	                    fill: '#fff',
	                    opacity: 0
	                });

	            // this is svg 'bring to front'
	            this.contentElement && this.contentElement.bringToFront();
	        },

	        onMouseenter: function () {
	            !this.selected && this.showSelection();
	        },

	        onMouseleave: function () {
	            !this.selected && this.hideSelection();

	            if (this.babyEvent) {
	                this.__doDragStart();
	                this.babyEvent = false;
	            }
	        },

	        __doDragStart: function() {
	            this.trigger("element:drag", this.babyEvent);
	        },

	        showSelection: function () {
	            this.selectRect
	                .attr({fill: '#eaf5fc', opacity: 0.8 });
	        },

	        hideSelection: function () {
	            this.selectRect
	                .attr({fill: '#fff', opacity: 0 });
	        },

	        deselect: function () {
	            this.selected = false;
	            this.hideSelection();
	        },

	        onElementClick: function () {
	            this.trigger("element:click", this);
	        },

	        onElementMousedown: function (d3event) {
	            if (this.dragWontStart)
	            {
	                this.dragWontStart = false;
	                return;
	            }

	            this.babyEvent = {
	                clientX: d3event.clientX,
	                clientY: d3event.clientY,
	                type: this.type,
	                kind: this.kind,
	                source: this,
	                options: JSON.parse(JSON.stringify(this.modelOptions))
	            };
	        },


	        onElementMouseup: function (element) {
	            this.dragWontStart = true;
	            this.babyEvent = false;
	            d3.event.stopPropagation();
	        }
	    });
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ }
/******/ ])
});
;