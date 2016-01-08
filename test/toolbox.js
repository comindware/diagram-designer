define(['js/diagram/toolbox', 'js/diagram/toolboxGroup', './renderHelpers'], function(ToolboxView, ToolboxGroup, renderHelpers) {

   describe("Toolbox", function() {

       it("has a valid module", function() {

           expect(ToolboxView).not.toBe(null);
           expect(ToolboxView).not.toBe(undefined);

           expect(_.isFunction(ToolboxView)).toBe(true);

       });

       it("can be created", function() {
           var toolbox = new ToolboxView();

           expect(toolbox).not.toBe(null);
           expect(toolbox).not.toBe(undefined);
           expect(_.isObject(toolbox)).toBe(true);
       });

   });

    describe("Toolbox rendering", function() {

        beforeEach(function() {
            this.svgId = "svg-" + Math.random();
            this.containerId =  "container-" + Math.random();
            this.svgElement = document.createElement("svg");
            this.svgElement.setAttribute("id", this.svgId);
            document.body.appendChild(this.svgElement);

            this.containerElement = document.createElement("g");
            this.containerElement.setAttribute("id", this.containerId);
            this.svgElement.appendChild(this.containerElement);
        });

        afterEach(function() {
            document.body.removeChild(this.svgElement);
            delete this.svgId;
            delete this.containerId;
            delete this.svgElement;
            delete this.containerElement;
        });

        it("can be rendered", function() {
            var toolbox = new ToolboxView({ container: d3.select(this.containerElement)});
            toolbox.render();
        });

        it("it renders a container with the rect", function(){
            var toolbox = new ToolboxView({ container: d3.select(this.containerElement)});
            toolbox.render();

            expect($("svg > g > rect").length).toBe(1);
        });

        it("renders all his groups when rendered", function() {
            var toolbox = new ToolboxView({ container: d3.select(this.containerElement)});
            var renderSpy = jasmine.createSpy("render spy");
            toolbox.groups = [{
                    render: renderSpy
                },
                {
                    render: renderSpy
                }];

            toolbox.render();

            expect(renderSpy).toHaveBeenCalledTimes(2);
        });

        it("pushing a group cases it to re-render", function() {
            var toolbox = new ToolboxView({ container: d3.select(this.containerElement)});
            spyOn(toolbox, "render");

            var group = new ToolboxGroup();

            toolbox.pushGroup(group);

            expect(toolbox.render).toHaveBeenCalledTimes(1);

        })

    });

    function getElementConstructorSpy () {

        var elementConstructorSpy = jasmine.createSpy("group element constructor spy");
        elementConstructorSpy.and.returnValue({ on: jasmine.createSpy("event handler")});

        return elementConstructorSpy;
    }

    describe("Toobox groups", function() {

        it("has a valid module", function() {

            expect(ToolboxGroup).not.toBe(null);
            expect(ToolboxGroup).not.toBe(undefined);

            expect(_.isFunction(ToolboxGroup)).toBe(true);

        });

        it("can be created", function() {
            var group = new ToolboxGroup();

            expect(group).not.toBe(null);
            expect(group).not.toBe(undefined);
            expect(_.isObject(group)).toBe(true);
        });

        it("can create element views if any specified", function() {
            var group = new ToolboxGroup();
            var elementConstructorSpy = getElementConstructorSpy();

            group.elements.push({
                view: elementConstructorSpy
            });

            group.__generateElements();

            expect(elementConstructorSpy).toHaveBeenCalledTimes(1);
        });

        it("passes the configured options to the created element view", function() {
            var group = new ToolboxGroup();
            var elementConstructorSpy = getElementConstructorSpy();

            group.elements.push({
                view: elementConstructorSpy,
                option1: "option1FakeValue"
            });

            group.__generateElements();

            // call #0, argument #0
            expect(elementConstructorSpy.calls.argsFor(0)[0].option1).toBe("option1FakeValue");

        });
    });

    describe("Toolbox groups rendering", function() {

        beforeEach(function() {
            renderHelpers.setupSvgWithContainer(this);
        });

        afterEach(function() {
            renderHelpers.teardownSvgWithContainer(this);
        });


        it("can be rendered provided with a container", function() {
            var group = new ToolboxGroup({ container: d3.select(this.containerElement )});
            group.render();
            expect($("g#abstractGroup1").length).toBe(1);
        });

    });

});