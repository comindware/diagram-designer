define(['d3utils', 'd3'],

function (helpers, d3) {
    'use strict';

    var SubActivitiesViewModel = Marionette.Object.extend({
        initialize: function (cfg) {
            this.parent = cfg.parent;
            this.items = cfg.items || [];
        },

        render: function () {
            var pos = this.parent.getPosition();

            if (this.rootNode)
                this.rootNode.remove();

            this.rootNode = this.parent.subActivityG.append('g')
                .attr('transform', 'translate(' + pos.x + ',' + pos.y + ')')
                .style({'display': 'none'})
                .classed({
                    'subActivities': true,
                    'when-selected': true
                });
            _.each(this.items, function (item) {
                item.render();
            });
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
        }
    });

    SubActivitiesViewModel.height = 30;
    SubActivitiesViewModel.width = 30;

    SubActivitiesViewModel.mousedown = function () {

        this.dragX = event.clientX;
        this.dragY = event.clientY;
        this.dragInitiated = true;
        this.backElement.on("mousemove", null);
        this.backElement.on("mousemove", function() {

            if (Math.abs(this.dragX - event.clientX) < 3 &&
                Math.abs(this.dragY - event.clientY) < 3)

                return;

            this.parent.parent.parent.addActiveType({
                type: this.type,
                kind: this.kind,
                clientX: event.clientX,
                clientY: event.clientY,
                sourceActivity: this.parent.parent
            });

            d3.event.stopPropagation();

            this.dragInitiated = false;

        }.bind(this));

        this.backElement.on("mouseup", function() {
            if (this.dragInitiated) {
                SubActivitiesViewModel.mouseclick.apply(this, [event]);
            }
            this.backElement.on("mouseup", null);
            this.backElement.on("mousemove", null);
            this.dragInititated = false;
        }.bind(this));

        d3.event.stopPropagation();

    };

    SubActivitiesViewModel.mouseclick = function (e) {
        this.dragInititated = false;

        if (this.type == "Flow")
            return;

        this.parent.parent.parent.initNewCommand();

        var newActivity =
            this.parent.parent.parent.addNewActivity({
                type: this.type,
                kind: this.kind
            },
            {
                connect: this.parent.parent,
                inverse: e.shiftKey,
                direction: { x: 1, y: 0 },
                align: true,
                select: true,
                currentOwner: true
            });

        this.parent.parent.parent.finalizeNewOrUpdateCommand([newActivity]);

        d3.event.stopPropagation();
    };

    SubActivitiesViewModel.onmouseover = function () {
        this.hoverShadow.style('display', 'block');
    };

    SubActivitiesViewModel.onmouseout = function () {
        this.hoverShadow.style('display', 'none');
    };

    SubActivitiesViewModel.BaseSubactivityElement = Marionette.Object.extend({
        type: "None",
        kind: "None",

        backWidth: 30,
        backHeight: 30,

        getHelper: function() {
            return {
                kind: this.kind,
                type: this.type
            };
        },

        getPosition: function() {
            return { x: this.options.x + 3, y: this.options.y };
        },

        getScale: function() {
            return 0.67;
        },

        render: function () {

            this.backElement = helpers.appendTranslatedGroup(this.parent.rootNode, { x: this.options.x, y: this.options.y });
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

            var diff = helpers.substractPoint(this.getPosition(), { x: this.options.x, y: this.options.y });

            this.contentElement = helpers.appendTranslatedGroup(this.backElement, diff);
            this.contentElement.attr({ "transform": this.contentElement.attr("transform") + " scale(" + this.getScale() + ")" });
            this.contentElement.html(this.tpl(this.getHelper()));


            this.backElement
                .property('type', self.type)
                .property('kind', self.kind)
                .on('mousedown', SubActivitiesViewModel.mousedown.bind(this))
                .on('mouseclick', SubActivitiesViewModel.mouseclick.bind(this))

        }
    });

    return SubActivitiesViewModel;
});
