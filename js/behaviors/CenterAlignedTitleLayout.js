define([], function() {

    'use strict';

    return Marionette.Object.extend({

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


});