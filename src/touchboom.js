// Filename: touchboom.js  
// Timestamp: 2017.08.05-17:53:52 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const touchboom_ctrl = require('./touchboom_ctrl'),
      touchboom_key = require('./touchboom_key'),
      touchboom_touchmouse = require('./touchboom_touchmouse');

module.exports = (o => {

  o.attach = (rafcfg, elem, fnobj) => {
    let slugfn = x => {},
        oneventfn = fnobj.oneventfn || slugfn,
        oninertiafn = fnobj.oninertiafn || slugfn,
        onmovefn = fnobj.onmovefn || slugfn;

    rafcfg = touchboom_touchmouse(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_key(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_ctrl(rafcfg, elem,
                         oneventfn,
                         oninertiafn,
                         onmovefn);

    return rafcfg;
  };

  o.key = touchboom_key;
  o.keyevents = touchboom_key.events;
  o.keygetdirection = touchboom_key.getdirection;
  
  o.touchmouse = touchboom_touchmouse;
  o.istaptapvalid = touchboom_touchmouse.istaptapvalid;
  o.getevxy = touchboom_touchmouse.getevxy;
  o.getevxyrelativeelem = touchboom_touchmouse.getevxyrelativeelem;

  o.events = touchboom_ctrl.events;
  o.coordsgettotal = touchboom_ctrl.coordsgettotal;
  o.coordsmoveend = touchboom_ctrl.coordsmoveend;
  o.coordsismove = touchboom_ctrl.coordsismove;
  o.coords = touchboom_ctrl.coords;
  o.coordsreset = touchboom_ctrl.coordsreset;

  return o;
  
})({});
