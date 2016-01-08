define([
    './MountSurface',
    './TemplatedSelectBorder',
    './RectangularShapedConnectorSet',
    './CenterAlignedTitleLayout',
    './RollingSubactivitySet',
    './RectangularResizers'
],

function(
    MountSurfaceBehavior,
    TemplatedSelectBorderBehavior,
    RectangularShapedConnectorSetBehavior,
    CenterAlignedTitleLayoutBehavior,
    RollingSubactivitySetBehavior,
    RectangularResizers)
{
    var behaviors = {
        mountSurface: MountSurfaceBehavior,
        templatedSelectBorder: TemplatedSelectBorderBehavior,
        rectangularShapedConnectorSet: RectangularShapedConnectorSetBehavior,
        centerAlignedTitleLayout: CenterAlignedTitleLayoutBehavior,
        rollingSubactivitySet: RollingSubactivitySetBehavior,
        rectangularResizers: RectangularResizers
    };

    _.each(behaviors, function(behavior, behaviorKey) {
        behavior.setup = function(activity) {
            var restArguments = _.without(arguments, activity);
            var bind = behavior.bind.apply(this, arguments);
            var behaviorInstance = new bind();
            behaviorInstance.apply(activity);
            activity[behaviorKey] = behaviorInstance;
            return behaviorInstance;
        };
    });

    return behaviors;

});