define([
    'd3utils',
    '../activity/subActivity'
], function(helpers, SubactivityView) {

    'use strict';

    return Marionette.Object.extend({

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


});