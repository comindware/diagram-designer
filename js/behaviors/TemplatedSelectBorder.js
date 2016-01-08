define([], function() {

    'use strict';

    return Marionette.Object.extend({

        apply: function(activity) {
            activity.appendSelectBorder = this.appendSelectBorder.bind(activity);
        },

        appendSelectBorder: function () {
        }
    });


});