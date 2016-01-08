# diagram-designer

Core library for editing activities and their connections with each other to form general diagram

#dependencies
jquery, underscore, handlebars, backbone, marionette, d3 (listed in bower.json)

all of these should be defined on the global scope

backbone and marionette will be removed once with fallback to self-hosted models

#requirements
node.js

#tests
library uses karma runner with jasmine described tests

to run tests

```
npm install
bower install
karma start
```

you probably want bower and karma to be installed globally before this
```
npm install -g karma
npm install -g bower
```

#demo

simple github demo (version can be other than current master):

https://rawgit.com/comindware/diagram-designer/trash/githubDemo/demo/github.html
