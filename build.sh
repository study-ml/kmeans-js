#!/bin/bash

rm dist/kmeansjs*
browserify src/js/main.js --s kmeansjs -o dist/kmeansjs.js
browserify src/js/main.js --s kmeansjs | uglifyjs -c > dist/kmeansjs.min.js
uglifycss src/css/main.css > dist/kmeansjs.min.css

