define([
    './toolboxGroup',
    './toolboxElement',
    '../activity/activity',
    '../activity/flow',
    '../behaviors/api'
],

function(ToolboxGroup, ToolboxElement, Activity, FlowView, behaviors) {

    var Circle = function() {
        this.offset = { left: 0, top: 0 };
        this.view = Circle.ToolboxElement;
        this.type = "Circle";
    };

    Circle.ToolboxElement = ToolboxElement.extend({
        initialize: function() {
            ToolboxElement.prototype.initialize.apply(this, arguments);
            this.tpl = Handlebars.compile("<circle class='js-toolbox toolbox-circle-primitive' cx=15 cy=7 r=10 />");
        }
    });

    Circle.Activity = Activity.extend({
        initialize: function(cfg) {
            _.extend(cfg, {
                template: '<g class="js-activity-resize-root diagram-activity-circle"><circle class="diagram-activity-circle" cx="50" cy="50" r="100"></rect></g>'
            });
            Activity.prototype.initialize.apply(this, [cfg]);
        }
    });

    var Rectangle = function() {
        this.offset = { left: 40, top: 0 };
        this.view = Rectangle.ToolboxElement;
        this.type = "Rectangle";
    };

    Rectangle.Activity = Activity.extend({
        initialize: function(cfg) {
            behaviors.rectangularResizers.setup(this);
            behaviors.rectangularShapedConnectorSet.setup(this);
            _.extend(cfg, {
                template: '<g transform="{{dimScale}}"  class="js-activity-resize-root">' +
                    '<rect class="diagram-activity-rectangle" vector-effect="non-scaling-stroke" x="0" y="0" width="100" height="100"></rect>' +
                '</g>'
            });
            Activity.prototype.initialize.apply(this, [cfg]);
        }
    });

    Rectangle.ToolboxElement = ToolboxElement.extend({

        initialize: function() {
            ToolboxElement.prototype.initialize.apply(this, arguments);
            this.tpl = Handlebars.compile("<rect class='js-toolbox toolbox-rectangle-primitive' x=0 y=0 width=25 height=15 />")
        }
    });

    var Flow = function() {
        this.offset = { left: 0, top: 30 };
        this.view = Flow.ToolboxElement;
        this.type = "Flow";
    };

    Flow.ToolboxElement = ToolboxElement.extend({
        initialize: function() {
            ToolboxElement.prototype.initialize.apply(this, arguments);
            this.tpl = Handlebars.compile(
                '<path d="M0,12L0,47" stroke="#7f7f7f" stroke-width="2"></path>' +
                '<polygon points="-5,27 0,11 5,27 -5,27" stroke-width="2" fill="#7f7f7f"></polygon>');
        }
    });

    var modelReference = {
        'Circle': Circle.Activity,
        'Rectangle': Rectangle.Activity,
        'Flow': FlowView,

        matchModel: function(model) {
            return this[model.attributes.type]
        }
    };

    var PrimitiveShapesGroup = ToolboxGroup.extend({
        initialize: function() {
            ToolboxGroup.prototype.initialize.apply(this, arguments);
            this.elements.push(new Circle());
            this.elements.push(new Rectangle());
            this.elements.push(new Flow());
            this.id = "primitivesGroup";
            this.title = "Primitives"
        }
    });

    return Marionette.Object.extend({
        install: function(diagram) {
            diagram.toolboxView.pushGroup((new PrimitiveShapesGroup({ container: diagram.toolboxView })));
            diagram.modelMapper.addMapper(modelReference);
        }
    });

});