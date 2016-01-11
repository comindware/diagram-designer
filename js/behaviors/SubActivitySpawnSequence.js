define(['../utils/d3utils'], function(helpers) {

    'use strict';

    return Marionette.Object.extend({

        id: 'subactivity-spawn-sequence',

        apply: function(activity, options) {

            activity.afterResize = _.wrap(activity.afterResize, this.afterResize);
            activity.startDrag = _.wrap(activity.startDrag, this.startDrag);
            activity.beforeActivityResize = _.wrap(activity.beforeActivityResize, this.beforeActivityResize);
            activity.__hideControlElements = _.wrap(activity.__hideControlElements, this.__hideControlElements);
            activity.__showDefaultControlElement = _.wrap(activity.__showDefaultControlElement, this.__showDefaultControlElement);
            activity.setDrawingPosition = _.wrap(activity.setDrawingPosition, this.setDrawingPosition);

            activity.subActivities = options.sequence;
            activity.subActivities.container = activity.overlayG;


            if (!options.position)
                activity.subActivities.position = this.getSequencePosition.bind(this, activity);

            if (!options.container)
                activity.subActivities.container = this.getSequenceContainer.bind(this, activity);

            activity.subActivities.on("element:drag", this.spawnDrag.bind(activity));
            activity.subActivities.on("element:click", this.spawnClick.bind(activity));
        },

        setDrawingPosition: function(setDrawingPositionOriginal, position) {
            if (this.subActivityG)
                helpers.applyTranslation(this.subActivityG, position || this.getPosition());
            setDrawingPositionOriginal.apply(this, _.without(arguments, setDrawingPositionOriginal));
        },


        getSequencePosition: function(activity) {
            return  { x: activity.getDimensions().width, y : 0 };
        },

        getSequenceContainer: function(activity) {
            if (!this.subActivityG)
                this.subActivityG = activity.subActivityG = helpers.appendTranslatedGroup(activity.__resolveParentContainer('subactivity-g'), activity.getPosition());

            return this.subActivityG;
        },

        afterResize: function(afterResizeOriginal) {
            this.subActivities.render();
            afterResizeOriginal.apply(this, _.without(arguments, afterResizeOriginal));
        },

        spawnDrag: function(options) {
            this.parent.addActiveType({
                type: options.source.type,
                kind: options.source.kind,
                clientX: options.originalEvent.clientX,
                clientY: options.originalEvent.clientY,
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
                        inverse: options.originalEvent.shiftKey,
                        direction: { x: 1, y: 0 },
                        align: true,
                        select: true,
                        currentOwner: true
                    });

            this.parent.finalizeNewOrUpdateCommand([newActivity]);
        },

        startDrag: function (startDragOriginal) {
            this.subActivities.hide();
            startDragOriginal.apply(this, _.without(arguments, startDragOriginal));

        },

        beforeActivityResize: function(beforeActivityResizeOriginal) {
            this.subActivities.hide();
            beforeActivityResizeOriginal.apply(this, _.without(arguments, beforeActivityResizeOriginal));
        },

        __hideControlElements: function(__hideControlElementsOriginal) {
            this.subActivities.hide();
            __hideControlElementsOriginal.apply(this, _.without(arguments, __hideControlElementsOriginal));
        },

        __showDefaultControlElement: function(__showDefaultControlElementOriginal) {
            this.subActivities.render();
            __showDefaultControlElementOriginal.apply(this, _.without(arguments, __showDefaultControlElementOriginal));
        }
    });


});