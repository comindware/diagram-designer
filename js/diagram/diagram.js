define([
    'd3utils',
    '../activity/activity',
    './toolbox',
    './selectFrame',
    './modelMapper',
    '../utils/UndoRedoHelper',
    '../utils/ClipboardHelper',
    './deleteZone',
    'd3'

], function (helpers,
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
        }
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
        },

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

        createActivityInfo: function() {
            var selector = $('.js-activity-info-container');
            this.activityInfo = new ActivityInfoView({ parent: this });
            this.activityInfo.render();
            selector.append(this.activityInfo.$el);
            this.activityInfo.onShow();
        },

        givenActivityInfoAvailable: function(activity, callback) {
            this.subjectActivity = activity;
            if (_.result(this, "doShowActivityInfo", true)) {
                callback(activity);
            }
        },

        showActivityInfo: function(activity) {
            this.givenActivityInfoAvailable(activity, this.activityInfo.setActivity.bind(this.activityInfo));
        },

        showCapabilityDiagram: function(id) {
            this.trigger("load:capability", id);
        },

        hideActivityInfo: function() {
            if (this.activityInfo) {
                this.activityInfo.activity = null;
                this.activityInfo.hide();
            }
        },

        wireInternalEvents: function() {
            this.on('activityExclusivelySelected', this.activityExclusivelySelected.bind(this));
            this.on('additionalActivitySelected', this.additionalActivitySelected.bind(this));
            this.on('additionalActivityDeselected', this.additionalActivityDeselected.bind(this));
            this.on('activityResize', this.activityResize.bind(this));
        },

        additionalActivitySelected: function(options) {
            this.selected = _.isArray(this.selected) ? this.selected : [this.selected];
            this.selected.push(options.sourceActivity);

            this.foreachViewModels(function (viewModel) {
                if (options.sourceActivity != viewModel)
                    viewModel.hideSubActivities();
            });

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

            this.setExistingDefaultPool();
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
            this.hideActivityInfo();
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

        setExistingDefaultPool: function () {
            this.defaultPool = _.find(this.viewModels, function (vm) {
                return  vm.isOfType("Pool");
            });
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

            this.resizedActivity.onfinishResize();

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
            this.hideActivityInfo();
            //this.toolboxView.deselectAndHideAll();
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

            this.deselectAll();
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

            this.isDragConsumated = true;
            this.hideActivityInfo();
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

        createViewByModel: function() {
            ModelMapper.createViewByModel.bind(ModelMapper)
        },

        addTempViewModel: function (model) {
            var self = this;

            var viewConstructor = this.modelMapper.matchModel(model);
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
            var viewModel = this.addNewActivityViaModel(model);

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

        viewModelByModel: function(model) {
            return ModelMapper.createViewByModel(model, this, false, true);
        },

        __pushViewModel: function(viewModel) {
            this.viewModels.push(viewModel);
            this.viewModelsHash[viewModel.getId()] = viewModel;
        },

        addNewActivityViaModel: function(model) {
            var ActivityView = this.modelMapper.matchModel(model);
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
            var self = this;

            self.fireControlZonesEvents(event);

            var clientXY = helpers.getPointFromParameter([event.clientX, event.clientY]);
            var delta = helpers.substractPoint(clientXY, self.startDrag);
            self.startDrag = clientXY;

            helpers.multiplyPoint(delta, 1 / self.scale);

            if (helpers.isZeroPoint(delta))
                return;

            if (!self.isDragConsumated)
                self.selectedDragStart(event);

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

            this.draggedViewModel.removeFutureRect();

            if (this.tempLane) {
                this.tempLane.owner.removeTempLane();
            }
            delete this.tempLane;

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
                    viewModel.trigger('dragOver', eventArgs);
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

        activityInfoClicked: function(source) {
            if (this.activityInfo.activity == source)
                this.hideActivityInfo();
            else
                this.showActivityInfo(source);
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

            try {
                var linked = viewModelToDelete.getLinkedActivities();
                _.each(linked, function (linkedActivity) {
                    linkedActivity.linkedActivityRemoved(viewModelToDelete);
                });
            }
            catch(e) {

            }

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

        browseEmbeddedProcess: function(activity) {
            var eventArgs = {
                targetActivityId: activity.getId(),
                enabled: true
            };
            this.trigger("browse:embedded", eventArgs);
            if (!eventArgs.enabled)
                return;

            this.setDefaultScroll({ uodate: true });

            if (activity == null) {
                this.activeEmbeddedProcessId = null;
                this.activeEmbeddedProcess = null;
                this.updateFromCollection();
                this.trigger("embedded:leave");
                return;
            }

            this.activeEmbeddedProcessId = activity.getId();
            this.activeEmbeddedProcess = activity;
            this.trigger("embedded:enter", { title: activity.getTitle(), id: activity.getId( )});
            this.updateFromCollection();
            this.trigger("embedded:entered", { title: activity.getTitle(), id: activity.getId( )});
        },

        browseEmbeddedProcessId: function(activityId) {
            this.setDefaultScroll({ update: true });

            if (activityId == null) {
                this.activeEmbeddedProcessId = null;
                this.activeEmbeddedProcess = null;
                this.updateFromCollection();
                return;
            }

            this.activeEmbeddedProcessId = activityId;
            this.updateFromCollection();

            this.activeEmbeddedProcess = this.getViewModelById(activityId);

        }

    });
});
