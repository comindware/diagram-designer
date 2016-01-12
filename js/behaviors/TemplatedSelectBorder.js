define([], function() {

    'use strict';

    return Marionette.Object.extend({

        id: 'templated-select-border',

        apply: function(activity) {
            activity.appendSelectBorder = this.appendSelectBorder.bind(activity);
        },

        appendSelectBorder: function () {
        }
    });


});