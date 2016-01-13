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
            _.wrapThrough(activity, "__doAfterResize", this.__doAfterResize);

            _.bindAllTo(activity, this,
                "__getTitleLayout",
                "__createMultiline",
                "__appendTitle",
                "__activityDblClick",
                "__stopEditTitle",
                "__doAfterResize",
                "__resizeTitleNode",
                "__alignSpan",
                "__alignText",
                "getDisplayTitle"
                );

            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
        },

        getDisplayTitle: function() {
            return this.getTitle() || "No title";
        },

        __appendServiceNodes: function() {
            this.__appendTitle();
        },

        __getTitleLayout: function () {
            var size = this.getDimensions();

            return {
                exists: true,
                x: 10,
                y: 10,
                width: size.width - 20,
                height: size.height - 20,
                textWidth: size.width - 20,
                isMandatory: true,
                isVerticalCenterAligned: true,
                isHorizontalCenterAligned: true,
                overlayEditorX: 5,
                overlayEditorY: 10,
                overlayEditorWidth: size.width - 15,
                overlayEditorHeight: size.height - 30,
                lineHeight: 18
            }
        },

        __bindEvents: function() {
            this.activityG.on("dblclick", this.__activityDblClick);
        },

        __alignSpan: function(layout, tspan_element) {
            if (layout.isHorizontalCenterAligned) {
                var alignedLength = tspan_element.node().getComputedTextLength();
                tspan_element.attr({ x : layout.x + (layout.width - alignedLength) / 2})
            }
        },

        __createMultiline: function (text, layout) {
            layout = layout || this.__getTitleLayout();
            text = text || this.getDisplayTitle();

            var textClasses = { 'activity-shape' : true, 'no-select': true, 'activity-title': true };
            var words = text.split(' ');
            var tspan_element = this.titleNode
                .append("tspan")
                .classed(textClasses)
                .text(words[0]);

            this.totalLines = 1;

            for (var i = 1; i < words.length; i++) {
                var current = tspan_element.text();
                var len = current.length;
                tspan_element.text(current + " "  + words[i]);

                var currentTextLength = tspan_element.node().getComputedTextLength();

                if (currentTextLength > layout.width) {
                    tspan_element.text(current.slice(0, len));

                    this.__alignSpan(layout, tspan_element);

                    tspan_element = this.titleNode.append("tspan")
                        .text(words[i])
                        .classed(textClasses)
                        .attr(
                        {
                            x: layout.x,
                            dy: layout.lineHeight
                        });

                    this.totalLines ++;
                }
            }

            this.__alignSpan(layout, tspan_element);

        },

        __appendTitle: function () {
            var titleLayout = this.__getTitleLayout();

            var textWidth = titleLayout.textWidth;
            var title = this.getDisplayTitle();

            this.titleG = this.activityG.select(".js-title-content");

            if (this.titleG.empty())
                this.titleG  = this.activityG.append("g").classed({ "js-title-content": true, 'null-spaced': true });

            this.titleNode = this.titleG.append("text")
                .attr("x", titleLayout.x)
                .attr("y", titleLayout.y + titleLayout.lineHeight)
                .attr("width", textWidth)
                .attr("height", titleLayout.height)
                .classed({ "activity-shape" : true });

            this.__createMultiline(title, titleLayout);

            this.__alignText();
        },

        __alignText: function(titleLayout) {
            titleLayout = titleLayout || this.__getTitleLayout();
            if (titleLayout.isVerticalCenterAligned) {

                var verticalSpan = this.totalLines * titleLayout.lineHeight;
                if (verticalSpan < titleLayout.height)
                {
                    helpers.applyTranslation(this.titleNode, {
                        x : 0,
                        y: (titleLayout.height - verticalSpan - titleLayout.lineHeight) / 2
                    });
                }

            }
        },

        __stopEditTitle: function() {
            var newTitle = this.overlayEditorBox.node().value;
            this.model.attributes.title = newTitle;

            this.overlayEditor.remove();
            this.titleG.style({ 'display' : 'block'});
            this.titleNode.selectAll("*").remove();
            this.__createMultiline(newTitle);
            this.__alignText();

        },

        __resizeTitleNode: function() {
            this.titleNode.selectAll("*").remove();
            this.__createMultiline();
            this.__alignText();
        },

        __doAfterResize: function() {
            this.__resizeTitleNode();
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
                    "height": rect.height + "px",
                    "pointer-events": "auto"
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