require('scroungejs').build({
  iscompressed   : false,
  isconcatenated : true,
  ises2015       : false,
  inputpath      : './src/',
  outputpath     : './test/src',
  treearr : [
    'touchboom.js'
  ]
}, (err) => {
  console.log(err || 'done');
});
