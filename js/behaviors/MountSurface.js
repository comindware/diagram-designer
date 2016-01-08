define(['d3utils', 'd3'], function(helpers) {

    'use strict';

    return Marionette.Object.extend({

        apply: function(activity) {
            activity.on('dragOver', this.dragOver.bind(activity));
            activity.on('finishDragOver', this.finishDragOver.bind(activity));
            activity.on('dragOverLeave', this.dragOverLeave.bind(activity));

            activity.afterResize = _.wrap(activity.afterResize, this.afterResize.bind(activity));
            activity.getMountArea = this.getMountArea.bind(activity);
            activity.getMountedPosition = this.getMountedPosition.bind(activity);
            activity.mountedActivityReplaced = this.mountedActivityReplaced.bind(activity);
        },

        getMountArea: function() {
            var area = this.getDimensions();
            area.y = area.height - this.mountAreaHeight / 2;
            area.x = this.mountAreaMargin;
            area.width -= (this.mountAreaMargin * 2);
            area.height = this.mountAreaHeight;

            return area;
        },

        getMountedPosition: function(position) {
            var mountArea = this.getMountArea();
            var mountLine = mountArea.y + mountArea.height / 2;
            var waterLineDelta = this.getPosition().y + mountLine - position.y;
            var symmetryDelta = this.getSymmetryAlignedVector(position);

            return {
                x: position.x + symmetryDelta.x,
                y: position.y + waterLineDelta
            }

        },

        dragOver: function(e) {
            var activity = e.draggedViewModel;

            if (!activity.isMountable())
                return;

            var localPosition = d3Graphics.helpers.substractPoint(e.position, this.getPosition());

            var mountArea = this.getMountArea();
            if (!d3Graphics.helpers.doesRectContains(mountArea, localPosition))
                return;

            this.virtualActivityPosition = this.getMountedPosition(activity.getPlacedDraggedPosition());
            activity.setDraggedVirtualPosition(this.virtualActivityPosition);

            this.whenSelected(true, false);

            e.stop = true;
        },

        finishDragOver: function(e) {
            var activity = e.sourceActivity;

            activity.setDraggedEffectivePosition(this.virtualActivityPosition);

            if (activity.isMounted())
                return;

            activity.mount(this);

            this.whenSelected(false, false);

            e.stop = true;
        },

        dragOverLeave: function(e) {
            var activity = e.draggedViewModel;

            if (activity.isMounted())
                activity.dismount(this);


            this.whenSelected(false, false)
        },

        mountedActivityReplaced: function(e) {
            this.whenSelected(false, false)
        },

        containsPoint: function(point) {
            var rect = this.getPlacedRect();
            rect.height += this.mountAreaHeight / 2;
            return d3Graphics.helpers.doesRectContains(rect, point);
        },

        afterResize: function(origin, e) {
            var mounted = _.chain(this.getMountedChildren());
            if (e.deltaDimensions.height != 0 && e.deltaPosition.y != -e.deltaDimensions.height) {
                mounted.invoke("moveActivity", { x: 0, y: e.deltaDimensions.height } );
                mounted.invoke("updateFlow");
            }
            mounted.invoke("bringToFront");
        }

    });


});