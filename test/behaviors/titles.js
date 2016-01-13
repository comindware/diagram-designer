define(["js/behaviors/api", '../renderHelpers'],
function(behaviors, renderHelpers){

    var getTestSubject = function() {
        return new Marionette.Object();
    };

    var getTestSubjectWithDimension = function() {
        var subject = new Marionette.Object();
        subject.getDimensions = jasmine.createSpy("getDimensions").and.returnValue({ width: 999, height: 444 });
        return subject;
    };

    var getTestSubjectWithTitle = function() {
        var subject = new Marionette.Object();
        subject.getDimensions = jasmine.createSpy("getDimensions").and.returnValue({ width: 999, height: 444 });
        subject.getTitle = jasmine.createSpy("getTitle").and.returnValue(undefined);
        return subject;
    };

    describe("titled behavior", function() {

        it("is a valid behavior", function() {
            var subject = getTestSubject();
            behaviors.setupDeclarative(subject, 'titled');

            expect(subject.__appendTitle).not.toBe(undefined);
            expect(subject.__appendTitle).not.toBe(null);
        });

        it("can be applied with custom configuration", function() {
            var subject = getTestSubjectWithDimension();
            behaviors.titled.setup(subject,
                function() {
                    return { x : -110 };
                }
            );

            var layout = subject.__getTitleLayout();

            expect(layout.x).toBe(-110);
        });

        it("returns undefined display title if it is not mandatory and has no model value", function() {
            var subject = getTestSubjectWithTitle();
            behaviors.titled.setup(subject,
                function() {
                    return { isMandatory : false };
                }
            );

            var displayTitle = subject.getDisplayTitle();

            expect(displayTitle).toBe(undefined);
        });
    });

    var getTestSubjectLayout = function() {
        var subject = new Marionette.Object();
        subject.getDimensions = jasmine.createSpy("getDimensions").and.returnValue({ width: 999, height: 444 });
        subject.getTitle = jasmine.createSpy("getTitle").and.returnValue(undefined);
        subject.activityG = d3.select(this.containerElement);
        return subject;
    };

    describe("titled render", function() {
        beforeEach(function() {
            renderHelpers.setupSvgWithContainer(this);
            this.getTestSubjectLayout = getTestSubjectLayout.bind(this);
        });

        afterEach(function() {
            renderHelpers.teardownSvgWithContainer(this);
            delete this.getTestSubjectLayout;
        });

        it("can render given it has a container", function() {
            var subject = this.getTestSubjectLayout();
            behaviors.setupDeclarative(subject, 'titled');

            subject.__appendTitle();

            expect(subject.activityG.select("g.js-title-content").length).toBe(1);

        })


    });


});