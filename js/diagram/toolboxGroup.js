define(['d3utils', 'd3'],

function (helpers)
{
    var TemplatedElement = function(options) {
        this.template = Handlebars.compile(options.template);
    };

    TemplatedElement.prototype.render = function() {

    };

    return Marionette.Object.extend({

        initialize: function(cfg) {
            this.elements = [];
            this.position = { x: 0, y: 0};
            this.width = 100;
            this.height = 100;
            this.titleHeight = 15;
            this.title = "abstract group";
            this.id = "abstractGroup1";

            this.__readConfig(cfg || {});
            _.bindAll(this, "__elementStartDrag");
        },

        __readConfig: function(cfg) {
            this.parent = cfg.parent;
            this.container = cfg.container || (this.parent && this.parent.container);
        },

        __generateElements: function() {
            this.views = [];
            _.each(this.elements, function(element) {
                var cfg = _.extend(element, {
                    container: this.container
                });

                var viewConstructor = element.view;
                var newView = new viewConstructor(element);

                newView.on("element:drag", this.__elementStartDrag);

                this.views.push(newView);
            }.bind(this));
        },

        __elementStartDrag: function(eventArgs) {
            _.extend(eventArgs, { group: this });
            this.trigger("element:drag", eventArgs);
        },

        updateContainer: function(container) {
            this.container = container;
        },

        render: function() {
            var rootAttrs = {
                'id': this.id
            };

            rootAttrs = _.extend(rootAttrs, helpers.getTranslationAttribute(this.position));

            this.rootContainer = this.container.append("g").attr(rootAttrs);

            this.borderElement = this.rootContainer
                .append("rect")
                .attr({
                    x: 0,
                    y: 0,
                    width: this.width,
                    height: this.height,
                    fill: "black",
                    opacity: "0"
                });

            this.titleElement = this.rootContainer.append("text")
                .classed("no-select", true)
                .attr({
                    dx: 0,
                    dy: 10
                })
                .text(this.title);

            // trash bin for group elements
            this.container = this.rootContainer.append("g").attr(
                helpers.getTranslationAttribute({ x: 0, y: this.titleHeight }));

            this.childrenBorderElement = this.container
                .append("rect")
                .attr({
                    x: 0,
                    y: 0,
                    width: this.width,
                    height: this.height - this.titleHeight,
                    fill: "black",
                    opacity: "0"
                });

            this.__generateElements();

            _.invoke(this.views, "render");

        }
    });
});
