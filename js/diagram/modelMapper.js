define([],
function ()
{
    'use strict';

    var constants = {
        defaultContainer: 'object-g'
    };

    var ModelMapper = Marionette.Object.extend({
        initialize: function() {
            this.mappers = []
        },

        matchModel: function(activityModel) {
            var activity = null;

            _.some(this.mappers, function(mapper) {
                var activityCandidate = mapper.matchModel(activityModel);
                if (!activityCandidate)
                    return false;

                activity = activityCandidate;
                return true;
            });

            return activity;
        },

        matchModelContainer: function(activityModel) {
            var resolvedContainer = constants.defaultContainer;

            _.some(this.mappers, function(mapper) {
                if (!mapper.matchModelContainer)
                    return false;

                var containerCandiate = mapper.matchModelContainer(activityModel);

                if (!containerCandiate)
                    return false;

                resolvedContainer = containerCandiate;

                return true;
            });

            return resolvedContainer;
        },

        matchTypeContainer: function(activityType) {
            return constants.defaultContainer;
        },

        addMapper: function(extraMapping) {
            this.mappers.push(extraMapping);
        },

        defineSingleMapper: function(newSingleMapper) {
            this.mappers = [newSingleMapper];
        }
    });

    ModelMapper.config = constants;

    return ModelMapper;

});
