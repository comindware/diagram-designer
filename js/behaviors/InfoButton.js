define(['../utils/d3utils'], function(helpers) {

    'use strict';

    return Marionette.Object.extend({

        id: 'info-button',

        defaultPosition: {
            x: -15,
            y: 10
        },

        apply: function(activity, position) {
            _.wrapThrough(activity, "__updateControlNodes", this.__updateControlNodes);
            _.wrapThrough(activity, "__bindEvents", this.__bindEvents);
            _.wrapThrough(activity, "__hideControlElements", this.__hideControlElements);

            _.bindAllTo(activity, this,
                "__syncInfoButtonPosition",
                "__infoBtnOnmouseover",
                "__infoBtnOnclick",
                "__infoBtnOnmouseout",
                "__showInfoBtn",
                "__hideInfoBtn",
                "__appendInfoBtn",
                "__showInfoBtnUser",
                "__hideInfoBtnUser",
                "__onActivityInfoBtnMouseenter",
                "__onActivityInfoBtnMouseleave",
                "__getInfoBtnPosition");

            activity.infoButtonPosition = position;
            if (!position) {
                activity.infoButtonPosition = { x: this.defaultPosition.x, y: this.defaultPosition.y };
            }
        },

        __hideControlElements: function() {
            this.__hideInfoBtn();
        },

        __getInfoBtnPosition: function() {
            var dimensions = this.getDimensions();
            return { x: dimensions.width + this.infoButtonPosition.x, y: this.infoButtonPosition.y }
        },

        __syncInfoButtonPosition: function() {
            this.infoBtn.attr(helpers.getTranslationAttribute());
        },

        __updateControlNodes: function() {
            this.__appendInfoBtn();
        },


        __infoBtnOnmouseover: function () {
            this.infoBtn.hoverCircle
                .style({'opacity': 1});

            this.infoBtn.btnPoints.selectAll('*')
                .attr({'fill': '#FFF'});
        },


        __infoBtnOnclick: function () {
            this.parent.activityInfoClicked(this);
        },

        __infoBtnOnmouseout: function () {
            if (this.infoBtn.isActive)
                return;

            this.infoBtn.hoverCircle
                .style({'opacity': 0});

            this.infoBtn.btnPoints.selectAll('*')
                .attr({'fill': '#3e94cc'});
        },

        __showInfoBtn: function () {
            this.infoBtn.attr(helpers.getTranslationAttribute(this.__getInfoBtnPosition()));
            this.infoBtn.style({'opacity': 1});
        },

        __hideInfoBtn: function () {
            this.infoBtn.style({'display': 'none'});
        },

        __appendInfoBtn: function () {
            if (!this.nodeOverlayG)
                return;

            this.nodeOverlayG.selectAll(".activity-info-btn").remove();

            this.infoBtn = helpers.appendTranslatedGroup(this.nodeOverlayG, this.__getInfoBtnPosition());
            this.infoBtn
                .style({'display': 'none'})
                .classed('activity-info-btn', true)
                .on('mouseover', this.__infoBtnOnmouseover)
                .on('mouseout', this.__infoBtnOnmouseout);

            var pointAttrs = {
                width: 2,
                height: 2,
                fill: '#3e94cc'
            };

            this.infoBtn.hoverCircle = this.infoBtn.append('circle')
                .attr({
                    cx: 1,
                    cy: 4,
                    r: 8,
                    fill: '#3e94cc',
                    opacity: 0
                });

            this.infoBtn.btnPoints = this.infoBtn.append('g').classed('activity-info-btn-points', true);

            for (var i = 0; i < 3; i++) {
                this.infoBtn.btnPoints.append('rect')
                    .attr(pointAttrs)
                    .attr({
                        x: 0,
                        y: 3 * i
                    });
            }

        },

        __showInfoBtnUser: function() {
            clearTimeout(this.__activityInfiBtnTimer);
            this.infoBtn.style({'display': 'block'});
            this.__showInfoBtn();
        },

        __hideInfoBtnUser: function(timeout) {
            var delayedHide = function () {
                this.infoBtn.style({'display': 'none'});
            }.bind(this);

            this.__activityInfiBtnTimer = setTimeout(delayedHide, timeout || 500);
        },

        __onActivityInfoBtnMouseenter: function () {
            this.__showInfoBtnUser();
        },

        __onActivityInfoBtnMouseleave: function () {
            this.__hideInfoBtnUser();
        },

        __bindEvents: function () {
            this.parent.givenActivityInfoAvailable(this, function() {
                this.rootNode.on('mouseenter', this.__onActivityInfoBtnMouseenter);
                this.rootNode.on('mouseleave', this.__onActivityInfoBtnMouseleave);
            }.bind(this));
        }


    });


});