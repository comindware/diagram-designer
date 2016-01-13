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

    describe("titled behavior", function() {

        it("is a valid behavior", function() {
            var subject = getTestSubject();
            behaviors.setupDeclarative(subject, 'titled');

            expect(subject.__appendTitle).not.toBe(undefined);
            expect(subject.__appendTitle).not.toBe(null);
        });
    });

})