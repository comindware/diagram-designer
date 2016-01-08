define(['js/diagram/primitivesPalette', 'js/diagram/diagram', './renderHelpers'], function(PrimitivesPalette, Diagram, renderHelpers) {


    describe("primitives palette trivia", function() {

        it("has a module that loads successfully", function() {

            expect(PrimitivesPalette).not.toBe(undefined);
            expect(PrimitivesPalette).not.toBe(null);
            expect(_.isFunction(PrimitivesPalette)).toBe(true);

        });

        it("can be created", function() {

            var palette = new PrimitivesPalette();

            expect(palette).not.toBe(undefined);
            expect(palette).not.toBe(null);
            expect(_.isObject(palette)).toBe(true);

        });

        it("can be installed on diagram", function() {
            var diagram = new Diagram();
            spyOn(diagram.toolboxView, "render");
            var palette = new PrimitivesPalette();
            palette.install(diagram);
        });

        it("adds element groups to the toolbox when installed", function() {
            var diagram = new Diagram();
            var palette = new PrimitivesPalette();
            spyOn(diagram.toolboxView, "pushGroup");
            spyOn(diagram.modelMapper, "addMapper");

            palette.install(diagram);

            expect(diagram.toolboxView.pushGroup).toHaveBeenCalledTimes(1);
        });

        it("installs appropriate model matcher when installed", function() {

            var diagram = new Diagram();
            var palette = new PrimitivesPalette();

            spyOn(diagram.toolboxView, "pushGroup");
            spyOn(diagram.modelMapper, "addMapper");

            palette.install(diagram);

            expect(diagram.modelMapper.addMapper).toHaveBeenCalledTimes(1);

        });

        it("has a model mapper that can produce primitive activities", function() {

            var diagram = new Diagram();
            var palette = new PrimitivesPalette();
            spyOn(diagram.modelMapper, "addMapper");
            spyOn(diagram.toolboxView, "pushGroup");

            palette.install(diagram);

            var installedMapper = diagram.modelMapper.addMapper.calls.argsFor(0)[0];
            var activity = installedMapper.matchModel({ attributes: { type: 'Circle' }});

            expect(_.isFunction(activity)).toBe(true);
        })


    });

    var testSettings = {
        graphContainerClass: "js-graphContainer"
    };

    function getRenderedDiagram() {
        var diagram = new Diagram();
        diagram.render();

        return diagram;
    }

    describe("primitive palette rendering", function() {
        beforeEach(function() {
            renderHelpers.setupHtmlContainer(this, testSettings);
        });

        afterEach(function() {
            renderHelpers.teardownHtmlContainer(this);
        });

        it("can be rendered", function() {
            var diagram = getRenderedDiagram();

            var palette = new PrimitivesPalette();
            palette.install(diagram);

            expect($("g#primitivesGroup").length).toBe(1);

        });

        it("renders circle element in the toolbox as a part of primitives", function() {
            var diagram = getRenderedDiagram();

            var palette = new PrimitivesPalette();
            palette.install(diagram);

            expect($("g#primitivesGroup circle.js-toolbox").length).toBe(1);
        });

        it("renders rectangle element in the toolbox as a part of primitives", function() {

            var diagram = getRenderedDiagram();

            var palette = new PrimitivesPalette();
            palette.install(diagram);

            expect($("g#primitivesGroup rect.js-toolbox").length).toBe(1);

        })
    });

});