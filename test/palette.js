define(['js/diagram/palette'], function(Palette) {


    describe("Diagram palette", function() {

        it("has a module that loads successfully", function() {

            expect(Palette).not.toBe(undefined);
            expect(Palette).not.toBe(null);
            expect(_.isFunction(Palette)).toBe(true);

        });


    });

});