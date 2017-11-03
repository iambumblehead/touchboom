// Filename: build.js
// Timestamp: 2017.11.03-11:51:39 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

require('scroungejs').build({
  iscompressed : false,
  isconcatenated : true,
  inputpath : './src/',
  outputpath : './docs/dist/',
  basepagein : './docs/index.tpl.html',
  basepage : './docs/index.html',
  publicpath : '/touchboom/dist',
  treearr : [
    'touchboom.js',
    'touchboom_demo.js'
  ],
  babelpluginarr : [
    'transform-object-rest-spread'
  ]
}, err => {
  console.log(err || 'done');
});
