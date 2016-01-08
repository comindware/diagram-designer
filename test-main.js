var allTestFiles = [];
var TEST_REGEXP = /base\/test\/.*\.js/i;

// Get a list of all the test files to include
Object.keys(window.__karma__.files).forEach(function(file) {
  if (TEST_REGEXP.test(file)) {
    // Normalize paths to RequireJS module names.
    // If you require sub-dependencies of test files to be loaded as-is (requiring file extension)
    // then do not normalize the paths
    var normalizedTestModule = file.replace(/^\/base\/|\.js$/g, '');
    allTestFiles.push(normalizedTestModule);
  }
});

var initTest = function() {
  require(["handlebars"], function(handlebars) {
      window.Handlebars = handlebars;
      require(["backbone", "marionette"], function() {
        require(allTestFiles, function() {
          window.__karma__.start();
        });
      });

  });
};

require.config({
  // Karma serves files under /base, which is the basePath from your config file
  baseUrl: '/base',

  paths: {
    'd3': 'bower_components/d3/d3',
    'd3utils': 'js/helpers/d3utils',
    'jquery': 'bower_components/jquery/dist/jquery',
    'handlebars': 'bower_components/handlebars/handlebars',
    'backbone': 'bower_components/backbone/backbone',
    'marionette': 'bower_components/backbone.marionette/lib/backbone.marionette',
    'underscore': 'bower_components/underscore/underscore'
  },

  shim: {
    'backbone': {
      deps: ['jquery', 'underscore'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'marionette': {
      deps: ['backbone'],
      exports: 'Marionette'
    },
    'd3': {
      exports: 'd3'
    }
  },

  // dynamically load all test files
  // we have to kickoff jasmine, as it is asynchronous
  callback: initTest
});
