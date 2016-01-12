/**
 * Created by Nikolay Volf on 11.01.2016.
 */

define([
    "activity/activity",
    "activity/flow",
    "activity/sequence",
    "behaviors/api",
    "diagram/diagram",
    "diagram/primitivesPalette",
    "diagram/toolboxGroup",
    "diagram/toolboxElement"
],

function(activity, flow, sequence, behaviors, diagram, primitivesPalette, toolboxGroup, toolboxElement) {

    return {

        activities: {
            Activity: activity,
            Flow: flow,
            Sequence: sequence
        },

        Diagram: diagram,

        toolbox: {
            Group: toolboxGroup,
            Element: toolboxElement
        },

        palettes: {
            PrimitivesPalette: primitivesPalette
        },

        behaviors: behaviors
    }

});

