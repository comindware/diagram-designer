define(['d3utils', 'd3'], function(helpers) {

    'use strict';

    return Marionette.Object.extend({

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


});