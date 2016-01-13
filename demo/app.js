/**
 * Created by nvolf on 22.12.2015.
 */

define(['../js/diagram/diagram', '../js/diagram/primitivesPalette'], function(Diagram, PrimitivesPalette) {

    var demoApp = {

        setupContainer: function() {
            this.container = document.createElement("div");
            this.container.setAttribute("class", testSettings.graphContainerClass);
            document.body.appendChild(this.container);

            this.htmlSelect = $(this.container);
        },


        showDemo1: function() {
            this.diagram = new Diagram();
            this.diagram.render();

            var primitivesPalette = new PrimitivesPalette();
            primitivesPalette.install(this.diagram);

            $(window).on("resize", this.diagram.resize.bind(this.diagram));
        },

        start: function() {
            $(function() {
                demoApp.showDemo1();
                this.setupKeyListener();

            }.bind(this));

        },

        setupKeyListener: function() {
            var self = this;

            $(window.document).keydown(function(event) {
                // del
                if (event.keyCode == 46 ) {
                    this.diagram.deleteSelected();
                }
                if (event.ctrlKey) {
                    // ctrl-c
                    if (event.keyCode == 67) {
                        this.diagram.clipboard.copy();
                    }

                    // ctrl-v
                    if (event.keyCode == 86) {
                        this.diagram.clipboard.paste();
                    }
                    // ctrl-z
                    if (event.keyCode == 90) {
                        this.diagram.history.undo();
                    }
                    // ctrl-y
                    if (event.keyCode == 89) {
                        this.diagram.history.redo();
                    }
                }
            }.bind(this));

        }
    };

    return demoApp;


});
