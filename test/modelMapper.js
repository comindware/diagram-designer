define(['js/diagram/modelMapper'], function(ModelMapper) {

    var testingConstants = {
        fakeActivityName: "FakeSpawn",
        fakeActivityType: "UnknownActivityType(Fake)",
        fakeHtmlContainerClass: 'fake-g'
    };

    var FakeUnknownActivityModel = function() {
        this.attributes = {
            type: testingConstants.fakeActivityName
        }
    };

    var SimpleFakeMapper = function() {

        this.matchModel = function() {
            return function() {
                this.isFake = true;
                this.activityName = testingConstants.fakeActivityName;
            }
        }
    };

    var FakeMapperWithConatiner = function() {
        this.matchModel = function() {
            return function() {
                this.isFake = true;
                this.activityName = testingConstants.fakeActivityName;
            }
        };

        this.matchModelContainer = function() {
            return testingConstants.fakeHtmlContainerClass;
        };
    };

    describe("Model Mapper", function() {

        it("can be created", function() {
            var modelMapper = new ModelMapper();

            expect(modelMapper).not.toBe(null);
        });

        it("returns nothing when encountered unknown activity model", function() {
            var modelMapper = new ModelMapper();

            var activity = modelMapper.matchModel(new FakeUnknownActivityModel());

            expect(activity).toBe(null);
        });

        it("returns default activity container when encountered unknown activity model", function() {
            var modelMapper = new ModelMapper();

            var container = modelMapper.matchModelContainer(new FakeUnknownActivityModel());

            expect(container).toBe(ModelMapper.config.defaultContainer);

        });

        it("can accept single mapper as model resolver", function() {

            var modelMapper = new ModelMapper();
            modelMapper.defineSingleMapper(new SimpleFakeMapper());

            var activityView = modelMapper.matchModel(new FakeUnknownActivityModel());
            var activity = new activityView();

            expect(activity.isFake).toBe(true);
            expect(activity.activityName).toBe(testingConstants.fakeActivityName);

        });

        it("can accept single mapper as model resolver without container and still work", function() {
            var modelMapper = new ModelMapper();
            modelMapper.defineSingleMapper(new SimpleFakeMapper());

            var container = modelMapper.matchModelContainer(new FakeUnknownActivityModel());
            expect(container).toBe(ModelMapper.config.defaultContainer);

        });

        it("can define single mapper with container resolver", function() {
            var modelMapper = new ModelMapper();
            modelMapper.defineSingleMapper(new FakeMapperWithConatiner());

            var container = modelMapper.matchModelContainer(new FakeUnknownActivityModel());

            expect(container).toBe(testingConstants.fakeHtmlContainerClass);
        })

        it("can add additional mappers", function() {
            var modelMapper = new ModelMapper();

            modelMapper.addMapper(new SimpleFakeMapper());

            expect(modelMapper.mappers.length).toBe(1);
        });

    });

});