// Filename: build.js  
// Timestamp: 2017.08.05-17:34:53 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

require('scroungejs').build({
  iscompressed   : false,
  isconcatenated : true,
  ises2015       : false,
  inputpath      : './src/',
  outputpath     : './docs/dist/',
  treearr : [
    'touchboom.js'
  ]
}, (err) => {
  console.log(err || 'done');
});
