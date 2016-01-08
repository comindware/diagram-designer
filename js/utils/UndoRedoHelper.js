define([], function () {
    'use strict';

    var deepCopy = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    var targetModelCopy = function(viewModel) {
        return {
            id: viewModel.getId(),
            type: viewModel.model.attributes.type,
            attributes: deepCopy(viewModel.model.attributes)
        };
    };

    var captureLinkedState = function(targets) {
        var state = { nested: {} };

        state.main = _.map(targets, function(target) {
            return {
                isEmpty: true,
                id: target.getId()
            }
        });

        _.each(targets, function(target) {
            var linked = target.getLinkedActivities();
            for (var i = 0; i < linked.length; i++)
                state.nested[linked[i].getId()] = { attributes: deepCopy(linked[i].model.attributes) };
        });

        return state;
    };

    var captureState = function(targets) {
        var states = [], nested = {};

        _.each(targets, function(target) {
            var state = {};
            state.attributes = deepCopy(target.model.attributes);
            state.id = target.getId();
            state.type = target.model.attributes.type;
            state.isEmpty = false;
            var linked = target.getLinkedActivities();

            for (var i = 0; i < linked.length; i++) {
                nested[linked[i].getId()] = targetModelCopy(linked[i]);
            }

            states.push(state)
        });

        return {
            main: states,
            nested: nested
        };
    };

    var captureStateSingle = function(taget) {
        return captureState([target]);
    };

    var restoreViewModel = function(diagram, state) {
        var model = diagram.collection.model(state.attributes);
        model.attributes = _.extend(deepCopy(state.attributes));
        diagram.collection.add(model);

        var restoredViewModel = diagram.createViewByModel(model, diagram);
        diagram.viewModels.push(restoredViewModel);
        diagram.viewModelsHash[restoredViewModel.getId()] = restoredViewModel;

        return restoredViewModel;
    };

    var updateViewModel = function(diagram, state, avoidEvents) {
        var target = diagram.getViewModelById(state.attributes.id);
        avoidEvents || target.beforeModelUpdated();
        target.model.attributes = deepCopy(state.attributes);
        target.ghostPosition && delete target.ghostPosition;
        avoidEvents || target.modelUpdated();

        diagram.collection.saveModel(target.model);
    };

    var setStateNested = function(diagram, states) {
        var target;

        var updateList = _.chain(states.main).where({ isEmpty: false }).union(_.map(states.nested))
            .map(function(x) { return diagram.getViewModelById(x.id); });

        updateList.invoke("beforeModelUpdated");

        _.each(states.main, function(state) {
            if (state.isEmpty)
                return;

            updateViewModel(diagram, state, true);
        });

        _.each(states.nested, function(state) {
            updateViewModel(diagram, state, true);
        });

        updateList.invoke("modelUpdated");
    };


    var UpdateObjectCommand = function(parent) {
        var self = this;

        self.parent = parent;

        self.captureOriginalState = function(target) {
            self.originalSnapshot = _.map(self.parent.viewModels, function(viewModel) {
                return targetModelCopy(viewModel);
            });

            self.originalState = captureState(target);
        };

        self.captureNewState = function(target) {
            self.newState = captureState(target);

            _.each(self.originalState.nested, function(originalNestedSate) {
                if (!self.newState.nested[originalNestedSate.id]) {
                    self.newState.nested[originalNestedSate.id] =
                        targetModelCopy(self.parent.getViewModelById(originalNestedSate.id));
                }
            });
        };

        self.pick = function(viewModelId) {
            self.originalState.nested[viewModelId] = deepCopy(_.find(self.originalSnapshot, _.matches({ id: viewModelId })));
        };

        self.undo = function() {
            setStateNested(self.parent, self.originalState);
        };

        self.redo = function() {
            setStateNested(self.parent, self.newState);
        };
    };

    var NewObjectCommand = function(parent) {
        var self = this;

        self.parent = parent;

        self.captureNewState = function(targets) {
            var target = targets[0];
            if (!target)
                return;

            self.newState = { isEmpty: true,  nested: {} };


            var discoveredNewObjects = _.filter(self.parent.viewModels, function(m) {
                var matcher = _.matches({ id: m.getId() });
                return !_.find(self.originalSnapshot, matcher);
            });

            var affected = _.map(discoveredNewObjects, function(newObject) {
                return _.filter(newObject.getLinkedActivities(), function(newObjectLink) {
                    return !_.find(discoveredNewObjects, function(newObject2) {
                        return newObjectLink.getId() === newObject2.getId();
                    });
                });
            });

            var discoveredAffectedObjects = _.flatten(affected);

            self.originalState.absentActivities = _.invoke(discoveredNewObjects, "getId");

            self.newState.selectedActivity = target.getId();

            _.each(discoveredAffectedObjects, function(o) {
                var id = o.getId();
                self.newState.nested[id] = targetModelCopy(o);
                self.pick(id);
            });

            _.each(discoveredNewObjects, function(o) {
                var id = o.getId();
                self.newState.nested[id] = _.extend(targetModelCopy(o), { isNew: true });
            });

            // picked objects
            _.each(self.originalState.nested, function(originalNestedSate) {
                if (!self.newState.nested[originalNestedSate.id]) {
                    self.newState.nested[originalNestedSate.id] =
                        targetModelCopy(self.parent.getViewModelById(originalNestedSate.id));
                }
            });

        };

        self.createSnapshot = function() {
            self.originalSnapshot = _.map(self.parent.viewModels, function(viewModel) {
                return targetModelCopy(viewModel);
            });

            self.originalState = { isEmpty: true, nested: {} };

        };

        self.captureOriginalState = function() {
            self.createSnapshot();
            self.originalState.selectedActivity =
                _.isArray(self.parent.selected)
                    ? _.invoke(self.parent.selected, "getId")
                    : (self.parent.selected ? [self.parent.selected.getId()] : []);
        };

        self.pick = function(viewModelId) {
            if (_.isArray(viewModelId))
                _.each(viewModelId, self.pick);
            var picked = _.find(self.originalSnapshot, _.matches({ id: viewModelId }));
            picked && (self.originalState.nested[viewModelId] = deepCopy(picked));
        };

        self.undo = function() {
            _.each(self.originalState.absentActivities, function(id) {
                var follower = self.parent.getViewModelById(id);
                if (!follower.isHidden) {
                    follower.clear();
                    follower.deselect();
                    self.parent.deleteActivity(follower);
                }
                else {
                    self.parent.collection.remove(follower.model);
                }
            });

            self.parent.selected = [];

            _.each(self.originalState.nested, function(state) {
                var target = self.parent.getViewModelById(state.id);
                target.model.attributes = deepCopy(state.attributes);
                if (target.ghostPosition) delete target.ghostPosition;
                if (!target.isHidden)
                    target.modelUpdated();
                target.model.collection.saveModel(target.model);

                self.parent.addIfVisible(target);
            });

            _.each(self.originalState.selectedActivity, function(selectedId) {
                var target = self.parent.getViewModelById(selectedId);
                target.select(self.originalState.selectedActivity.length == 1);
                self.originalState.selectedActivity.length == 1 && (self.parent.selected = target);
                self.originalState.selectedActivity.length > 1 && self.parent.selected.push(target);
            });
        };

        self.redo = function() {
            _.each(self.newState.nested, function(state) {
                if (state.isNew)
                    restoreViewModel(self.parent, state);
                else {
                    var affected = self.parent.getViewModelById(state.id);
                    affected.model.attributes = deepCopy(state.attributes);
                    affected.modelUpdated();
                    affected.model.collection.saveModel(affected.model);
                }
            });

            var selectedActivity = self.parent.getViewModelById(self.newState.selectedActivity);
            selectedActivity.select();
        };
    };

    var DeleteObjectCommand = function(parent) {
        var self = this;
        self.parent = parent;

        self.captureOriginalState = function(target) {
            self.originalState = captureState(target);
        };

        self.undo = function() {
            var restored = [];

            self.parent.deselectAll();
            _.each(self.originalState.main, function(restoredState) {
                var restoredViewModel = restoreViewModel(self.parent, restoredState);
                restoredViewModel.select(false);
                self.parent.selected = self.parent.selected || [];
                self.parent.selected.push(restoredViewModel);
                restored.push(restoredViewModel);
            });

            self.newState = captureLinkedState(restored);

            setStateNested(self.parent, self.originalState);

            _.each(restored, function(vm) { vm.model.set("isModified", true); });
        };

        self.redo = function() {
            _.each(self.originalState.main, function(state) {
                var target = parent.getViewModelById(state.id);
                target.clear();
                self.parent.deleteActivity(target);
            });

            setStateNested(self.parent, self.newState);
        };

    };


    var History = function(parent) {
        var self = this;
        self.parent = parent;

        self.commands = [];
        self.commandIndex = -1;

        self.pushCommand = function(command) {
            command.originalState = { isEmpty: true, nested: {} };
            command.newState = { isEmpty: true, nested: {} };
            self.commands.push(command);
            self.commandIndex = self.commands.length - 1;
        };

        self.newNewObjectCommand = function() {
            var command = new NewObjectCommand(self.parent);
            self.pushCommand(command);
            return command;
        };

        self.newUpdateObjectCommand = function() {
            var command = new UpdateObjectCommand(self.parent);
            self.pushCommand(command);

            return command;
        };

        self.newDeleteObjectCommand = function() {
            var command = new DeleteObjectCommand(self.parent);
            self.pushCommand(command);

            return command;
        };

        self.undo = function() {
            if (self.commandIndex >= 0) {
                var command = self.commands[self.commandIndex];
                command.undo();
                self.commandIndex --;

            }
        };

        self.redo = function() {
            if (self.commandIndex + 1 < self.commands.length) {
                self.commandIndex++;
                var command = self.commands[self.commandIndex];
                command.redo();
            }
        };

        self.addNested = function(commandState, nestedObject) {
            if (commandState.nested[nestedObject.model.attributes.id])
                return;

            commandState.nested[nestedObject.model.attributes.id] = targetModelCopy(nestedObject);
        };

        self.getLastCommand = function() {
            var lastCommand = null;
            if (self.commandIndex < 0)
                return;

            return self.commands[self.commandIndex];
        };

        self.clear = function() {
            self.commands = [];
            self.commandIndex = -1;
        };
    };

    History.deepCopy = deepCopy;
    History.restoreViewModel = restoreViewModel;


    return History;

});
