// Filename: touchboom.js
// Timestamp: 2018.01.15-06:15:27 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const touchboom_ctrl = require('./touchboom_ctrl'),
      touchboom_key = require('./touchboom_key'),
      touchboom_touchmouse = require('./touchboom_touchmouse');

module.exports = (o => {
  o.attach = (rafcfg, elem, fnobj) => {
    let slugfn = () => {},
        oneventfn = fnobj.oneventfn || slugfn,
        oninertiafn = fnobj.oninertiafn || slugfn,
        onmovefn = fnobj.onmovefn || slugfn;

    // prevent document|parent scroll when using key controls
    rafcfg.isKeyPreventDefault = typeof rafcfg.isKeyPreventDefault === 'boolean'
      ? rafcfg.isKeyPreventDefault : true;
    rafcfg = touchboom_touchmouse(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_key(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_ctrl(rafcfg, elem, oneventfn, oninertiafn, onmovefn);

    return rafcfg;
  };

  o.detach = (rafcfg, elem) => {
    rafcfg = touchboom_touchmouse.detach(rafcfg, elem);
    rafcfg = touchboom_key.detach(rafcfg, elem);
    rafcfg = touchboom_ctrl.detach(rafcfg);

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
  o.coordsreset = (rafcfg, elem) => {
    rafcfg = touchboom_ctrl.coordsreset(rafcfg);
    rafcfg = touchboom_touchmouse.reset(rafcfg, elem);
    rafcfg = touchboom_key.reset(rafcfg, elem);
    return rafcfg;
  };

  return o;
})({});
