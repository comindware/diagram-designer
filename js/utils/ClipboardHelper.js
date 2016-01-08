define(['./UndoRedoHelper'], function(UndoRedoHelper) {

    return function(diagram) {
        var self = this;
        self.diagram = diagram;

        self.data = {};

        self.addToClipboard = function(viewModel) {
            self.data[viewModel.getId()] =
                UndoRedoHelper.deepCopy(_.omit(viewModel.model.attributes,
                    "id", "globalId", "systemName"));


        };

        self.suppressConnectors = function(state) {
            state.connectors = _.filter(state.connectors, function(c) { return self.data[c.targetId] });
        };

        self.copy = function() {
            self.data = {};

            var selectedSet = self.diagram.getSelectedSet();
            _.each(selectedSet, self.addToClipboard.bind(self));

            _.each(self.data, self.suppressConnectors.bind(self));
        };

        self.paste = function() {

            self.diagram.initNewCommand();

            var pasted = [];

            _.each(self.data, function(state) {
                state.position.x += 50;
                state.position.y += 50;
                var restored = UndoRedoHelper.restoreViewModel(self.diagram, { attributes: state });
                diagram.collection.saveModel(restored.model);
                pasted.push(restored);
                state.pastedId = restored.getId();
            });

            _.each(pasted, function(pastedViewModel) {
                _.each(pastedViewModel.model.attributes.connectors, function(pastedViewModelConnector) {
                    pastedViewModelConnector.targetId = self.data[pastedViewModelConnector.targetId].pastedId;
                });
            });

            self.diagram.deselectAll();
            _.invoke(pasted, "select", true);
            self.diagram.selected = _.reject(pasted, function(x) { return x.isOfMetaType("Flow") });
            if (self.diagram.selected.length == 0)
                self.diagram.selected = _.first(pasted);

            self.diagram.finalizeNewOrUpdateCommand(pasted);
        };
    };

});