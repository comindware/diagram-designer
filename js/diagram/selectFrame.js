define(['d3utils'], function(helpers) {

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
});