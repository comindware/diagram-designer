/**
 * Created by nvolf on 10.12.2015.
 */
define(['js/diagram/diagram', 'js/activity/activity', './renderHelpers'], function(Diagram, Activity, renderHelpers) {

    var testSettings = {
        fakeId1: "id.fake.1",
        fakeId2: "id.fake.2",
        randomActivityType: "rectangle", // guarantee to be random
        primitiveActivityTemplate: '<g class="js-activity-resize-root"><rect x=0 y=0 width=100 height=100></rect></g>',
        primitiveActivityTemplateWithId: '<g class="js-activity-resize-root" id="{{id}}"><rect x=0 y=0 width=100 height=100></rect></g>',
        graphContainerClass: "js-graphContainer"
    };

    var FakeModelMapper = function() {

        this.matchModel = function() {
            return function() {
                this.getId = function() { return testSettings.fakeId1 };
            };
        }

    };

    var getFakeDiagramWithMapper = function() {
        var diagram = new Diagram();
        diagram.modelMapper = new FakeModelMapper();
        return diagram;
    };

    var newTemplatedActivity = function() {
        return new Activity({ template: testSettings.primitiveActivityTemplate });
    };

    var FakeActivity = function() {
        this.isFake = true;
        this.getId = function() { return testSettings.fakeId2 };

    };


    describe("Diagram basics", function() {

        it("is in the module that properly configured", function() {
            expect(Diagram).not.toBe(undefined);
            expect(_.isFunction(Diagram)).toBe(true);
        });

        it("can be created", function() {
            var diagram = new Diagram();
            expect(diagram).not.toBe(null);
        });

        it("can host activity", function() {
            var diagram = getFakeDiagramWithMapper();
            diagram.addNewActivity({
                type: testSettings.randomActivityType
            });
            expect(diagram.viewModels.length).toBe(1);
            expect(diagram.viewModels[0].getId()).toBe(testSettings.fakeId1);
            expect(diagram.viewModelsHash[testSettings.fakeId1]).not.toBe(undefined);
        });

        it("can return hosted activity by id", function() {
            var diagram = getFakeDiagramWithMapper();
            diagram.addNewActivity({
                type: testSettings.randomActivityType
            });

            var targetActivity = diagram.getViewModelById(testSettings.fakeId1);

            expect(targetActivity.getId()).toBe(testSettings.fakeId1);
        });

        it("invokes render method on non-hidden activity when the last is added", function() {
            var diagram = new Diagram();
            var activity = { render: jasmine.createSpy("activity render spy"), getId: function() { return testSettings.fakeId1; } };

            diagram.add(activity);

            expect(activity.render).toHaveBeenCalled();

        });

        it("can add activity via model given the model mapper is ok", function() {
            var diagram = new Diagram();

            spyOn(diagram.modelMapper, "matchModel").and.returnValue(FakeActivity);

            var activity = diagram.addNewActivityViaModel({ type: "dummy"});

            expect(diagram.viewModels.length).toBe(1);
        });



    });

    describe("Diagram render", function() {

        var rootSvgSelector = "." + testSettings.graphContainerClass + " svg";
        var fakeIdSelector = "g#" + testSettings.fakeId1;

        beforeEach(function() {
            renderHelpers.setupHtmlContainer(this, testSettings);
        });

        afterEach(function() {
            renderHelpers.teardownHtmlContainer(this);
        });

        it("can be rendered", function() {
            var diagram = new Diagram();
            diagram.render();
        });

        it("appends root svg element when rendered", function() {
            var diagram = new Diagram();
            diagram.render();

            expect($(rootSvgSelector).length).toBe(1);
        });

        it("unhides and renders activity being added", function() {
            var diagram = new Diagram();
            diagram.render();

            var activity = new Activity({ template: testSettings.primitiveActivityTemplate });
            spyOn(activity, "render");
            diagram.add(activity);

            expect(activity.render).toHaveBeenCalled();
            expect(activity.isHidden).not.toBe(true);
        });

        it("contains enough layers for activities", function() {
            var diagram = new Diagram();
            diagram.render();

            var activity = new Activity({ template: testSettings.primitiveActivityTemplateWithId });
            diagram.add(activity);

            var node = document.getElementById(activity.getId());
            expect(node).not.toBe(null);
            expect(node).not.toBe(undefined);
        });

        it("assignes container for toolbox when rendered", function() {

            var diagram = new Diagram();
            diagram.render();

            expect(diagram.toolboxView.container).not.toBe(null);
            expect(diagram.toolboxView.container).not.toBe(undefined);

        })

    });
});