define(['../utils/d3utils'], function(helpers) {

    'use strict';

    return Marionette.Object.extend({

        id: 'titled',

        displayTemplate: Handlebars.compile(""),

        editTemplate: Handlebars.compile(""),

        apply: function(activity, layout) {
            activity.__titleLayout = layout;
            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
            _.wrapThrough(activity, "__appendServiceNodes", this.__appendServiceNodes);

            _.bindAllTo(activity, this,
                "__getTitleLayout",
                "__createMultiline",
                "__appendTitle",
                "__activityDblClick",
                "__stopEditTitle"
                );

            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
        },

        __appendServiceNodes: function() {
            this.__appendTitle();
        },

        __getTitleLayout: function () {
            var size = this.getDimensions();

            return {
                exists: true,
                x: 15,
                y: 20,
                width: size.width - 35,
                height: size.height - 30,
                textWidth: size.width - 35,
                isMandatory: true,
                isVerticalCenterAligned: true,
                isCenterAligned: true,
                overlayEditorX: 5,
                overlayEditorY: 10,
                overlayEditorWidth: size.width - 15,
                overlayEditorHeight: size.height - 30,
            }
        },

        __bindEvents: function() {
            this.activityG.on("dblclick", this.__activityDblClick);
        },

        __createMultiline: function (text, width) {
            var textClasses = { 'activity-shape' : true, 'no-select': true, 'activity-title': true };
            var words = text.split(' ');
            var tspan_element = this.titleNode
                .append("tspan")
                .classed(textClasses)
                .text(words[0]);

            for (var i = 1; i < words.length; i++) {
                var current = tspan_element.text();
                var len = current.length;
                tspan_element.text(current + " "  + words[i]);

                if (tspan_element.node().getComputedTextLength() > width) {
                    tspan_element.text(current.slice(0, len));

                    tspan_element = this.titleNode.append("tspan")
                        .text(words[i])
                        .classed(textClasses)
                        .attr(
                        {
                            x: 10,
                            dy: 18
                        });
                }
            }


        },

        __appendTitle: function () {
            var titleLayout = this.__getTitleLayout();

            var textWidth = titleLayout.textWidth;
            var containerWidth = titleLayout.width;
            var title = this.getTitle() || "No title";

            this.titleG = this.activityG.select(".js-title-content");

            if (this.titleG.empty())
                this.titleG  = this.activityG.append("g").classed({ "js-title-content": true, 'null-spaced': true });

            this.titleNode = this.titleG.append("text")
                .attr("x", titleLayout.x)
                .attr("y", titleLayout.y)
                .attr("width", textWidth)
                .attr("height", titleLayout.height)
                .classed({ "activity-shape" : true });

            this.__createMultiline(title, containerWidth);
        },

        __stopEditTitle: function() {
            var titleLayout = this.__getTitleLayout();
            var containerWidth = titleLayout.width;

            var newTitle = this.overlayEditorBox.node().value;
            this.model.attributes.title = newTitle;

            this.overlayEditor.remove();
            this.titleG.style({ 'display' : 'block'});
            this.titleNode.selectAll("*").remove();
            this.__createMultiline(newTitle, containerWidth);
        },

        __activityDblClick: function () {
            var self = this;

            var titleLayout = this.__getTitleLayout();

            var rect = this.getPlacedRect();
            rect.x += (titleLayout.overlayEditorX || titleLayout.x);
            rect.y += (titleLayout.overlayEditorY || titleLayout.y);
            rect.width = (titleLayout.overlayEditorWidth || titleLayout.width);
            rect.height = (titleLayout.overlayEditorHeight || titleLayout.height);
            rect = this.transformSvgRect(rect);

            this.__hideControlElements();

            this.titleG.style({ 'display' : 'none'});


            this.overlayEditor = this.parent.htmlContainer
                .append("div")
                .style({
                    "position": "absolute",
                    "left": rect.x + "px",
                    "top": rect.y + "px",
                    "width": rect.width + "px",
                    "height": rect.height + "px"
                })
                .classed({
                    'non-selectable': true,
                    'dd-overlay-editor': true
                });

            this.overlayEditorBox =  this.overlayEditor
                .append("textarea")
                .style({
                    "width": rect.width + "px",
                    "height": rect.height + "px"
                })
                .classed({
                    'dd-overlay-editor-area': true
                })
                .on("blur", this.__stopEditTitle);

            this.overlayEditorBox.node().value =  this.getTitle() || "No title";

            this.overlayEditorBox.node().focus();



        },
    });


});