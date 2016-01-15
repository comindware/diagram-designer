/**
 * Created by nvolf on 22.12.2015.
 */

define(['designer'], function(designer) {

    var demoApp = {
        showDemo1: function() {
            this.diagram = new designer.Diagram();
            this.diagram.render();

            var primitivesPalette = new designer.palettes.PrimitivesPalette();
            primitivesPalette.install(this.diagram);
            this.diagram.toolboxView.groups[0].position.y = 10;
            this.diagram.toolboxView.render();

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
