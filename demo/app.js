/**
 * Created by nvolf on 22.12.2015.
 */

define(['designer'], function(designer) {

    var demoApp = {

        setupContainer: function() {
            this.container = document.createElement("div");
            this.container.setAttribute("class", testSettings.graphContainerClass);
            document.body.appendChild(this.container);

            this.htmlSelect = $(this.container);
        },


        showDemo1: function() {
            var diagram = new designer.Diagram();
            diagram.render();

            var primitivesPalette = new designer.palettes.PrimitivesPalette();
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
