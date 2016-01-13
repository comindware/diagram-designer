/**
 * Created by nvolf on 21.12.2015.
 */

define([], function() {


    return {
        setupSvgWithContainer: function(context) {
            (function() {
                this.svgId = "svg-" + Math.random();
                this.containerId =  "container-" + Math.random();
                this.svgElement = document.createElementNS("http://www.w3.org/2000/svg","svg");
                this.svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                this.svgElement.setAttribute("id", this.svgId);
                window.document.body.appendChild(this.svgElement);

                this.containerElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
                this.containerElement.setAttribute("id", this.containerId);
                this.svgElement.appendChild(this.containerElement);

                this.svgSelector = "#" + this.svgId;

                this.svgSelect = function() { return $(window.document.getElementById(this.svgId))}.bind(this);

            }.bind(context))();
        },

        teardownSvgWithContainer: function(context) {
            (function() {
                window.document.body.removeChild(this.svgElement);
                delete this.svgId;
                delete this.containerId;
                delete this.svgElement;
                delete this.containerElement;
                delete this.svgSelector;
                delete this.svgSelect;

            }.bind(context))();

        },

        setupHtmlContainer: function(context, testSettings) {

            context.setupHtmlContainer = function() {
                this.container = document.createElement("div");
                this.container.setAttribute("class", testSettings.graphContainerClass);
                window.document.body.appendChild(this.container);

                this.htmlSelect = $(this.container);

            };

            context.setupHtmlContainer();

            //(.bind(context))();
        },

        teardownHtmlContainer: function(context) {
            (function() {
                window.document.body.removeChild(this.container);
            }.bind(context))();

        }
    }


});