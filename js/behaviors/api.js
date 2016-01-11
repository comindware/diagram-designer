define([
    './MountSurface',
    './TemplatedSelectBorder',
    './RectangularShapedConnectorSet',
    './CenterAlignedTitleLayout',
    './RollingSubactivitySet',
    './RectangularResizers',
    './SubActivitySpawnSequence',
    './InfoButton',
    './Titled'
],

function(
    MountSurfaceBehavior,
    TemplatedSelectBorderBehavior,
    RectangularShapedConnectorSetBehavior,
    CenterAlignedTitleLayoutBehavior,
    RollingSubactivitySetBehavior,
    RectangularResizers,
    SubActivitySpawnSequence,
    InfoButton,
    Titled)
{
    var behaviors = {
        mountSurface: MountSurfaceBehavior,
        templatedSelectBorder: TemplatedSelectBorderBehavior,
        rectangularShapedConnectorSet: RectangularShapedConnectorSetBehavior,
        centerAlignedTitleLayout: CenterAlignedTitleLayoutBehavior,
        rollingSubactivitySet: RollingSubactivitySetBehavior,
        rectangularResizers: RectangularResizers,
        subActivitySpawnSequence: SubActivitySpawnSequence,
        infoButton: InfoButton,
        titled: Titled,
        setupDeclarative: function(activity) {
            var args = _.rest(arguments, 1);
            behaviors = _.map(this, function(behavior) {
                if (behavior.prototype.id && _.indexOf(args, behavior.prototype.id) >= 0)
                    behavior.setup(activity);
            })
        }
    };

    _.each(behaviors, function(behavior, behaviorKey) {
        _.wrapThrough = function(obj, fnName, spy, context) {
            var preserve = obj[fnName];
            obj[fnName] = function() {
                var result = preserve.apply(obj, arguments);
                spy.apply(context || obj, arguments);
                return result;
            };

        };

        _.bindAllTo = function(newContext, currentContext) {
            var keys = _.rest(arguments, 2);
            _.each(keys, function(key) {
                newContext[key] = currentContext[key].bind(newContext);
            });
        };

        behavior.setup = function(activity) {
            var restArguments = _.without(arguments, activity);
            var bind = behavior.bind.apply(this, arguments);
            var behaviorInstance = new bind(restArguments);
            behaviorInstance.apply.apply(behaviorInstance, arguments);
            activity[behaviorKey] = behaviorInstance;
            return behaviorInstance;
        };
    });

    return behaviors;

});