define(['../utils/d3utils'], function(helpers) {

    'use strict';

    var config = {

        defaultWidth: "150px",
        defaultHeight: "100px",
        defaultOffsetLeft: 25,
        defaultOffsetTop: -20
    };

    return Marionette.Object.extend({

        id: 'info-window',


        apply: function (activity, options) {
            _.wrapThrough(activity, "__hideControlElements", this.__hideControlElements);
            _.wrapThrough(activity, "__infoBtnOnclick", this.__infoBtnOnclick);
            _.wrapThrough(activity, "__showDefaultControlElement", this.__showDefaultControlElement);

            _.bindAllTo(activity, this,
                "showInfo",
                "__afterShowInfo",
                "hideInfo");

            activity.infoWindowTemplate = Handlebars.compile(options ? options.template : "<div />");
            activity.infoWindowOptions = options || {};
        },


        __hideControlElements: function() {
            this.hideInfo();
            if (this.__persistInfoButton) {
                this.__deactivateInfoBtn();
            }
        },

        __showDefaultControlElement: function() {
            this.hideInfo();
            if (this.__persistInfoButton) {
                this.__deactivateInfoBtn();
            }
        },

        __infoBtnOnclick: function() {
            if (this.__persistInfoButton) {
                this.hideInfo();
                this.__deactivateInfoBtn();
            }
            else {
                this.__hideControlElements();
                this.parent.leaveSingleControlElements(this);
                this.__activateInfoBtn();
                this.showInfo();

            }

        },

        __afterShowInfo: function() {

        },

        showInfo: function() {
            var rect = this.getPlacedRect();
            helpers.transformPoint(rect, this.__getInfoBtnPosition());
            helpers.transformPoint(rect, this.infoWindowOptions.offset || { x: config.defaultOffsetLeft, y: config.defaultOffsetTop });
            rect = this.transformSvgRect(rect);

            if (!this.overlayInfoWindow) {
                this.overlayInfoWindow = this.parent.htmlContainer
                    .append("div");
            };

            var html = this.infoWindowOptions.html
                ? _.result(this.infoWindowOptions, "html")
                : this.infoWindowTemplate(this.getTemplateHelpers());

            this.overlayInfoWindow
                .style({
                    "position": "absolute",
                    "left": rect.x + "px",
                    "top": rect.y + "px",
                    "width": this.infoWindowOptions.width || config.defaultWidth,
                    "height": this.infoWindowOptions.height || config.defaultHeight
                })
                .classed({
                    'dd-info-window': true
                })
                .html(html);

            this.__afterShowInfo();
        },

        hideInfo: function() {
            if (!this.overlayInfoWindow)
                return;

            this.overlayInfoWindow.remove();
            this.overlayInfoWindow = null;
        }

    });

});
