/**
 * Created by nvolf on 21.12.2015.
 */

define([], function() {


    return {
        setupSvgWithContainer: function(context) {
            (function() {
                this.svgId = "svg-" + Math.random();
                this.containerId =  "container-" + Math.random();
                this.svgElement = document.createElement("svg");
                this.svgElement.setAttribute("id", this.svgId);
                document.body.appendChild(this.svgElement);

                this.containerElement = document.createElement("g");
                this.containerElement.setAttribute("id", this.containerId);
                this.svgElement.appendChild(this.containerElement);

                this.svgSelector = "#" + this.svgId;

                this.svgSelect = function() { return $(document.getElementById(this.svgId))}.bind(this);

            }.bind(context))();
        },

        teardownSvgWithContainer: function(context) {
            (function() {
                document.body.removeChild(this.svgElement);
                delete this.svgId;
                delete this.containerId;
                delete this.svgElement;
                delete this.containerElement;
                delete this.svgSelector;
                delete this.svgSelect;

            }.bind(context))();

        },

        setupHtmlContainer: function(context, testSettings) {
            (function() {
                this.container = document.createElement("div");
                this.container.setAttribute("class", testSettings.graphContainerClass);
                document.body.appendChild(this.container);

                this.htmlSelect = $(this.container);

            }.bind(context))();
        },

        teardownHtmlContainer: function(context) {
            (function() {
                document.body.removeChild(this.container);
            }.bind(context))();

        }
    }


});