define([], function() {


    return Marionette.Object.extend({
       initialize: function(options) {
           this.modelMapper = options.modelMapper;
       }

    });


});