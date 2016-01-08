define(['d3utils', './toolboxGroup'],

    function (helpers, ElementGroupView) {

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
})
;
