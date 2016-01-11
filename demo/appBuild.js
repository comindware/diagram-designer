/**
 * Created by nvolf on 22.12.2015.
 */

define(['../lib/diagram-designer-core'], function(diagramCore) {

    var demoApp = {

        showDemo1: function() {
            var diagram = new diagramCore.Diagram();
            diagram.render();

            var primitivesPalette = new diagramCore.palettes.PrimitivesPalette();
            primitivesPalette.install(diagram);

            $(window).on("resize", diagram.resize.bind(diagram));
        },

        start: function() {
            $(function() {
                demoApp.showDemo1();
            });

        }
    };

    return demoApp;


});
