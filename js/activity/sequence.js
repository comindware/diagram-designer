define(['../utils/d3utils'],

function (helpers) {
    'use strict';

    var ActivitySequence = Marionette.Object.extend({
        initialize: function (cfg) {
            this.container = cfg.container;
            this.items = cfg.items || [];
            this.layoutFunc = cfg.layoutFunc || this.layoutFuncDefault;

            if (cfg.position)
                this.position = cfg.position;
        },

        render: function () {
            if (this.rootNode)
                this.rootNode.remove();

            if (!this.drawingContainer)
                this.drawingContainer = _.result(this, "container");

            var position = _.result(this, "position");

            this.rootNode = helpers.appendTranslatedGroup(this.drawingContainer, position)
                .classed({
                    'subActivities': true,
                    'when-selected': true
                });
            _.each(this.items, function (item) {
                item.container = this.rootNode;
                item.render();
            }.bind(this));
        },

        addItem: function (item) {
            item.parent = this;
            this.items.push(item);
        },

        removeAll: function () {
            this.items = [];
        },

        remove: function() {
            this.rootNode.remove();
        },

        hide: function() {
            this.rootNode && this.rootNode.style({'display': 'none'});
        },

        layoutFuncDefault: function(index) {
            return { x: 0, y: index * 30 }
        }
    });

    ActivitySequence.create = function(options, items) {
        var effectiveItems = _.map(items, function(item) {
            var extender = ActivitySequence.BaseSequenceMember.extend(item);
            return new extender(item);
        });

        var sequence = new ActivitySequence(_.extend(options, { items: effectiveItems }));

        _.each(sequence.items, function(item, index) {
            var newPosition = sequence.layoutFuncDefault(index);
            _.extend(item, newPosition);

            sequence.listenTo(item, "element:drag", function(options) {
                _.extend(options, { sequence: sequence });
                sequence.trigger("element:drag", options);
            });
            sequence.listenTo(item, "element:click", function(options) {
                _.extend(options, { sequence: sequence });
                sequence.trigger("element:click", options);
            });

            if (!item.type)
                item.type = options.type;
        });

        return sequence;
    };

    ActivitySequence.height = 30;
    ActivitySequence.width = 30;

    ActivitySequence.mousedown = function () {

        this.dragX = event.clientX;
        this.dragY = event.clientY;
        this.dragInitiated = true;
        this.backElement.on("mousemove", null);
        this.backElement.on("mousemove", function() {

            if (Math.abs(this.dragX - event.clientX) < 3 &&
                Math.abs(this.dragY - event.clientY) < 3)

                return;

            this.trigger("element:drag",
                {
                    clientX: event.clientX,
                    clientY: event.clientY,
                    originalEvent: event,
                    source: this
                }
            );


            d3.event.stopPropagation();

            this.dragInitiated = false;

        }.bind(this));

        this.backElement.on("mouseup", function() {
            if (this.dragInitiated) {
                ActivitySequence.mouseclick.apply(this, [event]);
            }
            this.backElement.on("mouseup", null);
            this.backElement.on("mousemove", null);
            this.dragInititated = false;
        }.bind(this));

        d3.event.stopPropagation();

    };

    ActivitySequence.mouseclick = function (e) {
        this.dragInititated = false;

        if (this.type == "Flow")
            return;

        this.trigger("element:click",
            {
                clientX: event.clientX,
                clientY: event.clientY,
                originalEvent: e,
                source: this
            }
        );
        d3.event.stopPropagation();
    };

    ActivitySequence.onmouseover = function () {
        this.hoverShadow.style('display', 'block');
    };

    ActivitySequence.onmouseout = function () {
        this.hoverShadow.style('display', 'none');
    };

    ActivitySequence.BaseSequenceMember = Marionette.Object.extend({
        backWidth: 30,
        backHeight: 30,

        initialize: function(options) {
            _.extend(this, options);
            if (!this.x)
                this.x = 0;
            if (!this.y)
                this.y = 0;

            this.options = options;
        },

        getHelper: function() {
            return JSON.stringify(this.options || {});
        },

        getPosition: function() {
            return { x: this.x, y: this.y };
        },

        getScale: function() {
            return 0.67;
        },

        render: function () {

            var position = this.getPosition();

            this.backElement = helpers
                .appendTranslatedGroup(this.container, position);
            this.backElement.classed({ "sequence-back-container" : true });

            this.backElement.append("rect").attr({
                width: this.backWidth,
                height: this.backHeight,
                x: 0,
                y: 0,
                opacity: 0.0,
                fill: 'black',
                stroke: 'none'
            })
                .classed( { "rect-hover": true });

            this.contentElement = helpers.appendTranslatedGroup(this.backElement, { x: 0, y: 0 });
            this.contentElement.attr({ "transform": this.contentElement.attr("transform") });
            this.contentElement.html(this.tpl(this.getHelper()));


            this.backElement
                .on('mousedown', ActivitySequence.mousedown.bind(this))
                .on('mouseclick', ActivitySequence.mouseclick.bind(this))

        }
    });

    return ActivitySequence;
});
