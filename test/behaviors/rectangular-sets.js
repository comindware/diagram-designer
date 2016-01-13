define(["js/behaviors/api"],
function(behaviors){

    var getTestSubject = function() {
        return new Marionette.Object();
    };

    var getTestSubjectWithDimension = function() {
        var subject = new Marionette.Object();
        subject.getDimensions = jasmine.createSpy("getDimensions").and.returnValue({ width: 999, height: 444 });
        return subject;
    };

    describe("rectangular resizers", function() {

        it("is a valid behavior", function() {
            var subject = getTestSubject();
            behaviors.setupDeclarative(subject, 'rectangular-resizers');

            expect(subject.appendResizers).not.toBe(undefined);
            expect(subject.appendResizers).not.toBe(null);
        });
    });

    describe("rectangular connector set", function(){

        it("is a valid behavior", function(){

            var subject = getTestSubject();
            behaviors.setupDeclarative(subject, "rectangular-shaped-connector-set");

            expect(subject.getConnectors).not.toBe(undefined);
            expect(subject.getConnectors).not.toBe(undefined);
        });

        it("returns 4 connectors", function() {
            var subject = getTestSubjectWithDimension();
            behaviors.setupDeclarative(subject, "rectangular-shaped-connector-set");

            var connectors = subject.getConnectors();

            expect(connectors.length).toBe(4);

        })

    })

})