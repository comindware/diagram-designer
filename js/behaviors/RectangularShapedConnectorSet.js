
define([], function() {

    'use strict';

    return Marionette.Object.extend({

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


});