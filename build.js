var webpack = require("webpack");
var _ = require("underscore");

var compiler = webpack(
    {
        context: __dirname + "/js",
        entry: "./api",
        output: {
            path: __dirname + "/lib",
            filename: "diagram-designer-core.js",
            library: "diagram-designer-core",
            libraryTarget: "umd"
        },
        resolve: {
            root: [
                __dirname + '/js',
            ]
        }
    }
);

compiler.run(function(err, stats) {
    if (err)
        console.log(err);
    else {
        _.each(stats.compilation.errors, function() {
            console.log("error: " + stats);
        });
    }
});
