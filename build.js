// Filename: build.js  
// Timestamp: 2017.08.05-17:03:01 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

require('scroungejs').build({
  iscompressed   : false,
  isconcatenated : true,
  ises2015       : false,
  inputpath      : './src/',
  outputpath     : './dist/',
  treearr : [
    'touchboom.js'
  ]
}, (err) => {
  console.log(err || 'done');
});
