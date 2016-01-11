define([], function() {

    'use strict';

    return Marionette.Object.extend({

        apply: function(activity, options) {
            activity.startDrag = _.wrap(activity.startDrag, this.startDrag);
            activity.beforeActivityResize = _.wrap(activity.beforeActivityResize, this.beforeActivityResize);
            activity.__hideControlElements = _.wrap(activity.__hideControlElements, this.__hideControlElements);
            this.sequence = options.sequence;
            this.sequence.container = activity.overlayG;

            this.sequence.on("element:drag", this.spawnDrag.bind(activity));
            this.sequence.on("element:click", this.spawnClick.bind(activity));
        },

        spawnDrag: function(options) {
            this.parent.addActiveType({
                type: options.source.type,
                kind: options.source.kind,
                clientX: options.event.clientX,
                clientY: options.event.clientY,
                sourceActivity: this
            });
        },

        spawnClick: function(options) {
            this.parent.initNewCommand();

            var newActivity =
                this.parent.addNewActivity({
                        type: options.source.type,
                        kind: options.source.kind
                    },
                    {
                        connect: this,
                        inverse: e.shiftKey,
                        direction: { x: 1, y: 0 },
                        align: true,
                        select: true,
                        currentOwner: true
                    });

            this.parent.finalizeNewOrUpdateCommand([newActivity]);
        },

        startDrag: function () {
            this.sequence.hide();
        },

        beforeActivityResize: function() {
            this.sequence.hide();
        },

        __hideControlElements: function() {
            this.sequence.hide();
        }
    });


});