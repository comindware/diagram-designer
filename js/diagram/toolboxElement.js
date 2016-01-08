define([
    'd3utils',
    'd3'
], function (helpers) {
    'use strict';

    return Marionette.Object.extend({
        arrowTopOffset: 30,

        initialize: function (cfg) {
            _.extend(this, cfg);
            this.selected = false;
            this.effectiveParentContainer = cfg.container || cfg.parent.container;


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
                source: this
            };
        },


        onElementMouseup: function (element) {
            this.dragWontStart = true;
            this.babyEvent = false;
            d3.event.stopPropagation();
        }
    });
});