(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom_ev = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom_ev.js  
// Timestamp: 2017.03.16-15:44:41 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

var touchboom_ev = module.exports = (o => {

  o.publish = (cfg, etype, ev) => (typeof cfg.publishfn === 'function' && cfg.publishfn(cfg, etype, ev), cfg);

  o.lsnpub = (cfg, elem, evarr, fn) => o.lsnarr(evarr, elem, e => fn(cfg, e, fn));

  o.lsnarr = (evarr, elem, fn) => evarr.map(e => elem.addEventListener(e, fn));

  o.lsnrmarr = (evarr, elem, fn) => evarr.map(e => elem.removeEventListener(e, fn));

  return o;
})({});
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.curved_007_curved = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: curved.js
// Timestamp: 2016.04.03-20:25:09 (last modified)
// Author(s): Dan Pupius (www.pupius.co.uk), Bumblehead (www.bumblehead.com)
//
// thanks to Daniel Pupius
// http://13thparallel.com/archive/bezier-curves/
//
// Bernstein Basis Function
// 1 = t + (1 - t)
//
// Bernstein Basis Function, cubed
// 1^3 = (t + (1 - t))^3
//
// Above Function, represented in terms of 1.
// » 1 = (t + (1 - t)) . (t^2 + 2t(1 - t) + (1 - t)^2)
// » 1 = t^3 + 3t^2(1 - t) + 3t(1 - t)^2 + (1 - t)^3
//
// each function
// B[1](t) = t^3
// B[2](t) = 3t^2(1 - t)
// B[3](t) = 3t(1 - t)^2
// B[4](t) = (1 - t)^3
//
// Where C is the control, and '[ ]' indicates subscript
// point = C[1]B[1](d) + C[2]B[2](d) + C[3]B[3](d) + C[4]B[4](d)
//
// change to the scripting at the link above:
// - given values are 'shifted' into a positive axis so that curves may be
//   generated when negative values are given.

var curved = module.exports = function () {

  function B1(t) {
    return t * t * t;
  }
  function B2(t) {
    return 3 * t * t * (1 - t);
  }
  function B3(t) {
    return 3 * t * (1 - t) * (1 - t);
  }
  function B4(t) {
    return (1 - t) * (1 - t) * (1 - t);
  }

  function getShift(x1, x2) {
    var min = Math.min(x1, x2);
    return min && -min;
  }

  // easeStr should be a string 'ease-end' or 'ease-bgn'
  return function (bgnCoord, endCoord, easeStr) {
    var shiftval = getShift(bgnCoord, endCoord),
        C1 = endCoord + shiftval,
        C4 = bgnCoord + shiftval,
        C2_3 = easeStr === 'end' ? C1 : C4;

    return function (per) {
      return Math.round(C1 * B1(per) + C2_3 * B2(per) + C2_3 * B3(per) + C4 * B4(per)) - shiftval;
    };
  };
}();
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom_ctrl = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom_ctrl.js  
// Timestamp: 2017.08.05-17:55:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  
//
// http://ariya.github.io/kinetic/
// https://ariya.io/2011/10/flick-list-with-its-momentum-scrolling-and-deceleration
//
// top left mouse event is position 0,0
// 
// +---------------------->|
// | (0, 0)                | (10, 0)
// |                       |
// |                       |
// |                       |
// |                       |
// |                       |
// |                       |
// v (0, 10)               | (10, 10)
// ------------------------+
//

const touchboom_ev = touchboom_023_src_touchboom_ev,
      curved = curved_007_curved;

module.exports = (o => {

  const VELOCITYTHRESHOLD = 10,
        TIMECONST = 325,
        INF = Infinity;

  o = (cfg, parentelem, fn, onmovefn, onoverfn) => {
    cfg.publishfn = fn;
    cfg.onmovefn = onmovefn || function () {};
    cfg.onoverfn = onoverfn || function () {};
    cfg.isinertia = typeof cfg.isinertia === 'boolean' ? cfg.isinertia : true;
    cfg.rafcoordidarr = [];
    cfg = o.coordsreset(cfg);

    return cfg;
  };

  o.events = {
    INTERRUPT: 'interrupt',
    CANCEL: 'cancel',
    KEYSTART: 'keystart',
    KEYEND: 'keyend',
    MOVE: 'move',
    MOVEEND: 'moveend',
    OVER: 'over',
    START: 'start',
    END: 'end',
    TAP: 'tap',
    TAPTAP: 'taptap'
  }, o.onmoveend = (cfg, id, fn) => (cfg.onmoveendfn = cfg.onmoveendfn || {}, cfg.onmoveendfn[id] = fn, cfg);

  o.onmoveendfn = (cfg, type, ev) => {
    if (cfg.onmoveendfn) {
      Object.keys(cfg.onmoveendfn).map(key => {
        cfg.onmoveendfn[key](cfg, type, ev);
      });
    }

    cfg = touchboom_ev.publish(cfg, o.events.MOVEEND);

    return cfg;
  };

  o.onmovefn = (cfg, e) => {
    try {
      cfg.onmovefn(cfg, e);
    } catch (e) {
      o.stop(cfg);
      console.error('[!!!] onmove', e);
    }
  };

  o.coords = (cfgcoords = [{}, {}]) => cfgcoords.map(o.coordget);

  o.coordsreset = cfg => (
  // initialize empty coords, two coords by default --x and y
  cfg.coords = o.coords(cfg.coords), cfg);

  o.isnum = n => typeof n === 'number';

  o.firstnum = numarr => numarr.find(num => typeof num === 'number');

  o.coordget = (c = {}, coorddef = {}) => {
    const now = Date.now();

    c.min = o.firstnum([c.min, coorddef.min, -INF]);
    c.max = o.firstnum([c.max, coorddef.max, INF]);

    // allow changes outside controls to affect ismin and ismax behaviour
    c.getmin = c.getmin || ((cfg, c) => c.min);
    c.getmax = c.getmax || ((cfg, c) => c.max);

    c.trackts = now;

    // glide coordinates are auto-updated with fixed target and amplitude
    // non-glide coordinates continually updated w/ new target and amplitude
    // isglide defined w/ timestamp of glide initialisation
    c.isglide = Boolean(coorddef.isglide) && now;

    // ismove is timestamp of move initialiszation
    c.ismove = Boolean(coorddef.ismove) && now;
    c.startpos = +coorddef.start;
    c.lastpos = +coorddef.start;

    if (o.isnum(c.total)) {
      c.total = c.total;
    } else if (o.isnum(c.bgn)) {
      c.total = c.bgn;
    } else if (o.isnum(coorddef.bgn)) {
      c.total = coorddef.bgn;
    } else {
      c.total = 0;
    }

    c.autoweight = c.autoweight || coorddef.autoweight;
    c.offset = 0;
    c.target = 0;
    c.velocity = 0;
    c.amplitude = 0;
    c.frame = 0;
    c.offset = 0;
    c.type = coorddef.type || c.type;

    return c;
  };

  o.coordgetstarted = (c, start, type) => o.coordget(c, { start, type });

  o.coordset = (c, props) => Object.assign({}, c, props);

  // mutates cfg.coords
  o.coordsupdatepassive = (cfg, now = Date.now()) => (cfg.coords = cfg.coords.map(c => c.isupdatepassive ? o.coordupdatepassive(cfg, c, now) : c), cfg);

  o.coordsgettotal = cfg => o.coordsupdatepassive(cfg).coords.map(c => c.total + c.offset);

  o.coordsismove = cfg => cfg.coords.some(c => c.ismove);

  o.stop = cfg => (cfg.ticker = clearInterval(cfg.ticker), cfg);

  o.start = (cfg, e) => (cfg.rafcoordidarr = cfg.coords.map((c, i) => c.ismove || cfg.rafcoordidarr[i]), cfg.ticker = setInterval(e => o.coordsupdate(cfg), 100), o.coordsmovestart(cfg, e), cfg);

  o.getdeltacurve = ((maxms, curve) => {
    maxms = 1000;
    curve = curved(3, 10, 'bgn');

    return (c, timestart, timenow) => {
      const timediff = (timenow - timestart) / maxms;

      return (c.autoweight ? curved(c.autoweight * .2, c.autoweight, 'bgn') : curve)(timediff > 1 ? 1 : timediff);
    };
  })();

  o.getvelocityupdated = (offset, frame, velocity, elapsedms) => 0.4 * ( //0.8 * (
  1000 * ( // velocity
  offset - frame // delta
  ) / (1 + elapsedms)) + 0.2 * velocity;

  o.getamplitudeupdated = (velocity, amplitude, velocitythreshold) => Math.abs(velocity) > velocitythreshold ? 0.8 * velocity : amplitude;

  o.gettargetupdated = (velocity, offset, amplitude, target) => Math.abs(velocity) > 10 ? Math.round(offset + amplitude) : offset;

  o.coordupdatepassive = (cfg, c, now = Date.now()) => {
    if (c.isupdatepassive) {
      c.lastdelta = c.lastdelta || 0;
      c.lastdelta += o.getdeltacurve(c, c.ismove, now) * c.dir;
      c = o.updatecoord(cfg, c, c.lastdelta);
    }

    return c;
  };

  o.coordupdate = (cfg, c, date = Date.now()) => o.coordset(c, {
    velocity: o.getvelocityupdated(c.offset, c.frame, c.velocity, date - c.trackts),
    frame: c.offset,
    trackts: date
  });

  o.coordsupdate = (cfg, now = Date.now()) => {
    cfg.coords = cfg.coords.map(c => c.isglide ? c : o.coordupdate(cfg, c, now));

    return cfg;
  };

  // offset, cur, max,  min
  // 40,     100,   0,    100   => 0
  // 40,     80,    0,    100   => 20
  // 40,     20,    0,    100   => 40
  // 3,      -100,  -100, 100   => 0
  // -491,   0,     -100, 100   => -100
  o.getoffset = (cfg, offset, cur, min, max) => offset > 0 ? cur + offset <= max ? offset : cur >= max ? 0 : max - cur : cur + offset >= min ? offset : cur <= min ? 0 : min - cur;

  o.movecoord = (cfg, c, dist) => o.coordset(c, {
    offset: o.getoffset(cfg, dist, c.total, c.getmin(cfg, c), c.getmax(cfg, c))
  });

  o.movecoordauto = (cfg, c, now) => {
    const elapsed = now - c.trackts,
          delta = -c.amplitude * Math.exp(-elapsed / TIMECONST);

    if (Math.abs(delta) > 0.5) {
      c = o.movecoord(cfg, c, c.target + delta);
    } else {
      c.ismove = false;
      c.isglide = false;
      c.total += c.offset;
      c.offset = 0;
    }

    return c;
  };

  o.automove = (cfg, e, rafcoordidarr, now = Date.now()) => {
    // continue moving only if an axis moved here is not begun elswhere
    // (indicated by newer/different rafcoordid)
    //
    if (!rafcoordidarr.some((coordid, i) => coordid && coordid === cfg.rafcoordidarr[i])) {
      return 'automove cancelled' && null;
    }

    cfg.coords = cfg.coords.map(c => c.isglide ? c = o.movecoordauto(cfg, c, now) : c);

    if (o.coordsismove(cfg)) {
      requestAnimationFrame(() => {
        o.onmovefn(cfg, e);
        o.automove(cfg, e, rafcoordidarr);
      });
    } else {
      cfg = o.onmoveendfn(cfg, 'moveend', e);
    }
  };

  o.updatecoord = (cfg, c, pos, delta) => {
    delta = c.lastpos - pos;

    if (c.ismove) {
      if (!c.isinertia || Math.abs(delta) > 2) {
        c.lastpos = pos;
        c = o.movecoord(cfg, c, c.offset - delta);
      }
    }

    return c;
  };

  o.coordstopped = (cfg, c) => {
    c.total += c.offset;
    c.offset = 0;
    c.ismove = false;

    return c;
  };
  //o.coordset(c, {
  //  ismove : false,
  //  total : c.total + c.offset,
  //  offset : 0          
  //});

  o.coordmoveend = (cfg, c, now = Date.now()) => {
    if (Math.abs(c.velocity) > VELOCITYTHRESHOLD) {
      c.trackts = now;

      c.amplitude = o.getamplitudeupdated(c.velocity, c.amplitude, VELOCITYTHRESHOLD);

      c.target = o.gettargetupdated(c.velocity, c.offset, c.amplitude, c.target);

      c.isglide = Date.now();
    } else {
      c = o.coordstopped(cfg, c);
    }

    return c;
  };

  o.coordsmovestart = (cfg, e) => requestAnimationFrame(() => {
    if (cfg.ticker) {
      // ticker is active while dragging
      o.coordsmovestart(cfg, e);
      o.onmovefn(cfg, e);
    }
  });

  o.coordsmoveend = (cfg, e) => {
    cfg = o.stop(cfg);

    if (cfg.isinertia && o.coordsismove(cfg)) {
      requestAnimationFrame(() => o.automove(cfg, e, cfg.rafcoordidarr.slice()));
    } else {
      cfg.coords = cfg.coords.map(c => o.coordstopped(cfg, c));
      cfg = o.onmoveendfn(cfg, 'moveend', e);
    }
  };

  return o;
})({});
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.domev_007_domev = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: domev.js
// Timestamp: 2016.11.07-12:14:20 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)

var domev = module.exports = {

  getElemAt: function (e) {
    var fn = function () {};
    if (typeof e === 'object' && e) {
      if ('target' in e) {
        fn = function (ev) {
          return ev.target;
        };
      } else if ('srcElement' in e) {
        fn = function (ev) {
          return ev.srcElement;
        };
      }
    }
    return (domev.getElemAt = fn)(e);
  },

  getparentlinkelemat: function (e) {
    var elem = this.getElemAt(e);

    return elem && function getparentlink(elem) {
      return elem && elem.tagName && (elem.tagName.match(/^a/i) ? elem : getparentlink(elem.parentNode));
    }(elem);
  },

  stopDefaultAt: function (e) {
    var fn = function () {};
    if (typeof e === 'object' && e) {
      if (e.preventDefault) {
        fn = function (ev) {
          return ev.preventDefault();
        };
      } else {
        fn = function (ev) {
          return ev.returnValue = false;
        };
      }
    }
    return (domev.stopDefaultAt = fn)(e);
  },

  isElem: function (e, elem, evelem) {
    evelem = this.getElemAt(e, elem);

    return elem && evelem && elem.isEqualNode(evelem);
  },

  hasElem: function (e, elem, evelem) {
    evelem = this.getElemAt(e, elem);

    return elem && evelem && (elem.isEqualNode(evelem) || elem.contains(evelem));
  }
};
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom_delegate = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom_delegate.js  
// Timestamp: 2017.04.17-18:12:45 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const touchboom_delegate = module.exports = (o => {

  // delegator:
  //
  //   activestate :
  //     [[depth, 'elemid', {state}],
  //      [depth, 'elemid', {state}]]
  //
  //   statearr : [ ...statearr ]
  //  
  o.create = () => ({
    activestate: null,
    statearr: []
  });

  o.setmouseoverstate = (delegator, activestate) => (delegator.mouseoverstate = activestate, delegator);

  o.getmouseoverstate = delegator => delegator.mouseoverstate;

  o.rmmouseoverstate = (delegator, activestate) => (delegator.mouseoverstate = null, delegator);

  o.setactivestate = (delegator, activestate) => (delegator.activestate = activestate, delegator);

  o.getactivestate = delegator => delegator.activestate;

  o.rmactivestate = delegator => (delegator.activestate = null, delegator);

  o.getactivestatemeta = delegator => o.getstatemeta(o.getactivestate(delegator));

  // state:
  //
  //   [[depth, 'elemid', {state}],
  //    [depth, 'elemid', {state}]]
  //  
  o.createstate = (depth, elemid, meta) => [depth, elemid, meta];

  o.isstatesame = (statea, stateb) => o.getstateid(statea) === o.getstateid(stateb);

  o.createelemstate = (elem, meta) => o.createstate(o.getelemdepth(elem), elem.id, meta);

  o.getstatemeta = delegatorstate => delegatorstate && delegatorstate[2];

  o.getstateid = delegatorstate => delegatorstate && delegatorstate[1];

  o.getstateelem = delegatorstate => delegatorstate && document.getElementById(delegatorstate[1]);

  o.haselemid = (elem, elemid, elemidelem) => Boolean(elem && (elemidelem = document.getElementById(elemid)) && (elem.isEqualNode(elemidelem) || elemidelem.contains(elem)));

  o.getelemstate = (delegator, elem) => delegator.statearr.find(([depth, id, meta]) => o.haselemid(elem, id));

  o.getelemdepth = (elem, depth = 0) => elem.parentNode ? o.getelemdepth(elem.parentNode, ++depth) : depth;

  // sorting arranges elements 'deeper' in the document to appear first
  //
  // for elements w/ parent/child relationship --yield child first
  o.delegatordepthsort = ([elemadepth], [elembdepth]) => elemadepth > elembdepth ? 1 : -1;

  o.addstate = (delegator, state) => (delegator.statearr = delegator.statearr.filter(stateelem => !o.isstatesame(stateelem, state)), delegator.statearr.push(state), delegator.statearr = delegator.statearr.sort(o.delegatordepthsort), delegator);

  o.addelemstate = (delegator, elem, state) => {
    if (!elem || !elem.id) {
      console.error('parent element exist w/ valid id');
    } else {
      delegator = o.addstate(delegator, o.createelemstate(elem, state));
    }

    return delegator;
  };

  return o;
})({});
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom_key = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom_key.js  
// Timestamp: 2017.08.05-16:32:00 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const domev = domev_007_domev,
      touchboom_ev = touchboom_023_src_touchboom_ev,
      touchboom_ctrl = touchboom_023_src_touchboom_ctrl,
      touchboom_delegate = touchboom_023_src_touchboom_delegate;

const touchboom_key = module.exports = (o => {

  const DIR_LEFT = 'DIR_LEFT',
        DIR_RIGHT = 'DIR_RIGHT',
        DIR_DOWN = 'DIR_DOWN',
        DIR_UP = 'DIR_UP';

  const {
    INTERRUPT,
    KEYSTART, KEYEND
  } = touchboom_ctrl.events;

  o = (cfg, parentelem, fn) => o.connectdelegate(cfg, parentelem, fn);

  o.events = {
    DIR_LEFT, DIR_RIGHT, DIR_DOWN, DIR_UP
  };

  o.getdirection = (cfg, keyCode) => {
    var dir = null;

    if (typeof keyCode !== 'number') throw new Error('keyCode must be a number');else if (cfg.iskeyupre.test(keyCode)) dir = DIR_UP;else if (cfg.iskeyleftre.test(keyCode)) dir = DIR_LEFT;else if (cfg.iskeydownre.test(keyCode)) dir = DIR_DOWN;else if (cfg.iskeyrightre.test(keyCode)) dir = DIR_RIGHT;

    return dir;
  };

  // LEFT OR RIGHT, X: 0
  // UP or DOWN,    Y: 1
  o.getdirectionxynum = (cfg, dir, xynum = 0) => Number(dir === DIR_DOWN || dir === DIR_UP);

  // LEFT OR DOWN: -1
  // UP or RIGHT:  +1  
  o.getdirectiondirnum = (cfg, dir, dirnum = 0) => Number(dir === DIR_RIGHT || dir === DIR_DOWN) || -Number(dir === DIR_LEFT || dir === DIR_UP);

  o.keydown = (cfg, touchboom_ctrl, e) => {
    console.log('keycode, key', e.keyCode, e.code);
    let dir = o.getdirection(cfg, e.keyCode),
        axisnum = o.getdirectionxynum(cfg, dir),
        dirnum = o.getdirectiondirnum(cfg, dir),
        coord = cfg.coords[axisnum],
        now = Date.now();

    if (coord && !coord.isupdatepassive) {
      if (coord.ismove) {
        coord = touchboom_ctrl.coordset(coord, {
          total: coord.total + coord.offset,
          offset: 0
        });

        cfg.coords[axisnum] = coord;
        cfg = touchboom_ev.publish(cfg, INTERRUPT, e);
      }
      coord.isupdatepassive = true;
      coord = touchboom_ctrl.coordget(coord, {
        ismove: Date.now(),
        start: 0,
        type: 'key'
      });
      coord.lastdelta = 0;
      coord.dir = dirnum;
      cfg.coords[axisnum] = coord;

      cfg = touchboom_ev.publish(cfg, KEYSTART, e);
      touchboom_ctrl.start(cfg, e);
    }
  };

  o.keyup = (cfg, touchboom_ctrl, e) => {
    let dir = o.getdirection(cfg, e.keyCode),
        axisnum = o.getdirectionxynum(cfg, dir),
        dirnum = o.getdirectiondirnum(cfg, dir),
        coord = cfg.coords[axisnum],
        now = Date.now();

    if (coord && coord.isupdatepassive) {
      coord.isupdatepassive = false;
      cfg = touchboom_ctrl.stop(cfg);
      cfg.coords[axisnum] = touchboom_ctrl.coordmoveend(cfg, coord);
      touchboom_ctrl.coordsmoveend(cfg, e, coord);

      cfg = touchboom_ev.publish(cfg, KEYEND, e);
    }
  };

  o.getkeycodearrre = keycodearr => new RegExp(keycodearr.join('|'));

  o.adaptkeycodere = cfg => (cfg.iskeyupre = o.getkeycodearrre(cfg.keycodeuparr || [38, 87]), cfg.iskeyleftre = o.getkeycodearrre(cfg.keycodeleftarr || [37, 65]), cfg.iskeyrightre = o.getkeycodearrre(cfg.keycoderightarr || [39, 68]), cfg.iskeydownre = o.getkeycodearrre(cfg.keycodedownarr || [40, 83]), cfg);

  o.connect = (cfg, touchboom, parentelem, fn) => {
    cfg = o.adaptkeycodere(cfg);

    touchboom_ev.lsnpub(cfg, parentelem, ['keydown'], (cfg, e) => {
      o.keydown(cfg, touchboom, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, ['keyup'], (cfg, e) => {
      o.keyup(cfg, touchboom, e);
    });

    return cfg;
  };

  o.delegator = null;

  o.connectdelegate = (cfg, touchboom, parentelem, fn) => {
    let body = document.body,
        ctrldel = touchboom_delegate;

    if (!parentelem || !parentelem.id) {
      console.error('parent element exist w/ valid id');
      return cfg;
    }

    if (!o.delegator) {
      o.delegator = ctrldel.create();

      touchboom_ev.lsnpub({}, body, ['keydown'], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e));

        if (delegatorstate) {
          o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

          o.keydown(ctrldel.getstatemeta(delegatorstate), touchboom, e);
        }
      });

      touchboom_ev.lsnpub({}, body, ['keyup'], (cfg, e) => {
        let delegatorstate = ctrldel.getactivestate(o.delegator);

        if (delegatorstate) {
          o.keyup(ctrldel.getstatemeta(delegatorstate), touchboom, e);
        }
      });
    }

    cfg = touchboom_ctrl.onmoveend(cfg, 'key', (cfg, type, e) => {
      ctrldel.rmactivestate(o.delegator);
    });

    cfg = o.adaptkeycodere(cfg);

    o.delegator = ctrldel.addelemstate(o.delegator, parentelem, cfg);

    return cfg;
  };

  return o;
})({});
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom_touchmouse = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom_touchmouse.js  
// Timestamp: 2017.07.02-16:10:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const domev = domev_007_domev,
      touchboom_ev = touchboom_023_src_touchboom_ev,
      touchboom_ctrl = touchboom_023_src_touchboom_ctrl,
      touchboom_delegate = touchboom_023_src_touchboom_delegate;

const touchboom_ctrltouchmouse = module.exports = (o => {

  const TYPE = 'touchmouse',
        TAPTIMETHRESHOLD = 200,
        TAPTAPTIMETHRESHOLD = 200,

  //TAPTAPTIMETHRESHOLD = 600,
  TAPMOVETHRESHOLD = 10;

  const {
    INTERRUPT, CANCEL, MOVE, OVER,
    START, END, TAP, TAPTAP
  } = touchboom_ctrl.events;

  o = (cfg, touchboom_ctrl, parentelem, fn) => o.connectdelegate(cfg, touchboom_ctrl, parentelem, fn);

  o.istapev = (cfg, taptimetrheshold, tapmovethreshold) => cfg.coords.some(c => c.ismove && Date.now() - c.ismove < TAPTIMETHRESHOLD && Math.abs(c.offset) < TAPMOVETHRESHOLD);

  // will accept xy array, click object or touch object
  o.getevxy = e => Array.isArray(e) ? e : e && typeof e.clientX === 'number' ? [e.clientX, e.clientY] : [e.changedTouches[0].pageX, e.changedTouches[0].pageY];

  o.getelemxy = elem => {
    let rect = elem.getBoundingClientRect(),
        docelem = document.documentElement,
        win = window;

    return [rect.left + (win.pageXOffset || docelem.scrollLeft), rect.top + (win.pageYOffset || docelem.scrollTop)];
  };

  o.getevxyrelativeelem = (e, elem) => {
    let evxy = o.getevxy(e);

    return o.getelemxy(elem).map((xy, i) => evxy[i] - xy);
  };

  o.endtap = (cfg, e, now = Date.now()) => {
    cfg.istap = o.istapev(cfg, e);
    cfg.istaptap = cfg.tapts && cfg.istap && now - cfg.tapts < TAPTAPTIMETHRESHOLD;
    cfg.tapts = cfg.istap && now;

    return cfg;
  };

  o.ismouseoutparent = (e, parentelem) => /mouseout/.test(e.type) && parentelem && !domev.isElem(e, parentelem);

  o.start = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);

    if (touchboom_ctrl.coordsismove(cfg)) {
      cfg = touchboom_ctrl.stop(cfg);
      cfg.coords = cfg.coords.map(c => touchboom_ctrl.coordset(c, {
        total: c.total + c.offset,
        offset: 0
      }));

      cfg = touchboom_ev.publish(cfg, INTERRUPT, e);
    }

    cfg.istap = false;
    cfg.istaptap = false;
    cfg.coords = cfg.coords.map((c, i) => touchboom_ctrl.coordget(c, {
      ismove: true,
      start: evarr[i],
      type: TYPE
    }));

    cfg = touchboom_ev.publish(cfg, START, e);
    touchboom_ctrl.start(cfg, e);
  };

  o.move = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);

    cfg = touchboom_ev.publish(cfg, MOVE, e);

    cfg.coords = cfg.coords.map((c, i) => c.type == TYPE && c.ismove && !c.isglide ? touchboom_ctrl.updatecoord(cfg, c, evarr[i]) : c);
  };

  o.over = (cfg, touchboom_ctrl, e) => {
    if (cfg.onoverfn) {
      cfg = cfg.onoverfn(cfg, OVER, e);
    }
  };

  // taps must occur near one another, when user is not updating movement.
  //
  //  - previous touch/tap must have been released
  //  - must be not-moving OR if moving must be gliding (user disengaged)
  //
  // prevents multiple, separated -touch/click
  o.istaptapvalid = cfg => cfg.coords.every(c => !c.ismove || c.isglide) && touchboom_ctrl.coordsgettotal(cfg).every(coordtotal => coordtotal < 20);

  o.movecomplete = (cfg, touchboom_ctrl, e) => {
    if (!touchboom_ctrl.coordsismove(cfg)) {
      cfg.publishfn(cfg, END, e);
      return touchboom_ctrl.stop(cfg);
    }

    if (/touchend|mouseup/.test(e.type)) {
      cfg = o.endtap(cfg, e);
      if (cfg.istap) {
        cfg.publishfn(cfg, TAP, e);
      }

      if (cfg.istaptap && o.istaptapvalid(cfg)) {
        cfg.publishfn(cfg, TAPTAP, e);
      }
    }

    if (e.type === 'mouseout' && cfg.coords.some(c => c.isglide)) {
      return null;
    }

    cfg.publishfn(cfg, END, e);

    cfg.coords = cfg.coords.map(c => (c = touchboom_ctrl.coordupdate(cfg, c), c = touchboom_ctrl.coordmoveend(cfg, c), c));

    touchboom_ctrl.coordsmoveend(cfg, e);
  };

  o.movecancel = (cfg, touchboom_ctrl, e) => {
    cfg = touchboom_ev.publish(cfg, CANCEL, e);

    cfg.coords = cfg.coords && cfg.coords.map(c => touchboom_ctrl.coordset(c, {
      offset: 0
    }));

    cfg = touchboom_ctrl.stop(cfg);
  };

  o.connect = (cfg, touchboom_ctrl, parentelem, fn) => {
    touchboom_ev.lsnpub(cfg, parentelem, ['mousedown', 'touchstart'], (cfg, e) => {
      e.preventDefault();

      o.start(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, ['mousemove', 'touchmove'], (cfg, e) => {
      o.move(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, ['mouseup', 'mouseout', 'touchend'], (cfg, e) => {
      if (o.ismouseoutparent(e, parentelem)) {
        return null;
      }

      o.movecomplete(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, ['touchcancel'], (cfg, e) => {
      o.movecancel(cfg, touchboom_ctrl, e);
    });

    return cfg;
  };

  o.delegator = null;

  o.startdelegator = (elem, e) => {
    let ctrldel = touchboom_delegate,
        delegatorstate = ctrldel.getelemstate(o.delegator, elem);

    if (delegatorstate) {
      o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

      o.start(ctrldel.getstatemeta(delegatorstate), touchboom_ctrl, e);
    }
  };

  o.connectdelegate = (cfg, touchboom_ctrl, parentelem, fn) => {
    let body = document.body,
        ctrldel = touchboom_delegate;

    if (!parentelem || !parentelem.id) {
      console.error('parent element exist w/ valid id');
      return cfg;
    }

    if (!o.delegator) {
      o.delegator = ctrldel.create();

      touchboom_ev.lsnpub({}, body, ['mouseover'], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
        }
      });

      touchboom_ev.lsnpub({}, body, ['mousedown', 'touchstart'], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
          o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

          o.start(statemeta, touchboom_ctrl, e);
        }
      });

      touchboom_ev.lsnpub({}, body, ['mousemove', 'touchmove'], (cfg, e) => {
        let delegatorstate = ctrldel.getactivestate(o.delegator),
            mouseoverstate = ctrldel.getmouseoverstate(o.delegator),
            statemeta;

        if (mouseoverstate) {
          statemeta = ctrldel.getstatemeta(mouseoverstate);
          o.over(statemeta, touchboom_ctrl, e);
        }

        if (delegatorstate) {
          statemeta = ctrldel.getstatemeta(delegatorstate);
          o.move(statemeta, touchboom_ctrl, e);
        }
      });

      touchboom_ev.lsnpub({}, body, ['mouseup', 'mouseout', 'touchend'], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          if (o.ismouseoutparent(e, ctrldel.getstateelem(statemeta))) {
            return null;
          }

          if (/mouseout|touchend/.test(e.type)) {
            ctrldel.rmmouseoverstate(o.delegator, delegatorstate);
          }

          o.movecomplete(statemeta, touchboom_ctrl, e);
        }
      });

      touchboom_ev.lsnpub({}, body, ['touchcancel'], (cfg, e) => {
        let delegatorstate = ctrldel.getactivestate(o.delegator);

        if (delegatorstate) {
          ctrldel.rmactivestate(o.delegator);
          ctrldel.rmmouseoverstate(o.delegator, delegatorstate);

          o.movecancel(cfg, touchboom_ctrl, e);
        }
      });
    }

    cfg = touchboom_ctrl.onmoveend(cfg, 'touchmouse', (cfg, type, e) => {
      ctrldel.rmactivestate(o.delegator);
    });

    o.delegator = ctrldel.addelemstate(o.delegator, parentelem, cfg);

    return cfg;
  };

  return o;
})({});
return module.exports;});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.touchboom_023_src_touchboom = f()}})(function(){var define,module,exports;module={exports:(exports={})};
// Filename: touchboom.js  
// Timestamp: 2017.08.05-17:53:52 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const touchboom_ctrl = touchboom_023_src_touchboom_ctrl,
      touchboom_key = touchboom_023_src_touchboom_key,
      touchboom_touchmouse = touchboom_023_src_touchboom_touchmouse;

module.exports = (o => {

  o.attach = (rafcfg, elem, fnobj) => {
    let slugfn = x => {},
        oneventfn = fnobj.oneventfn || slugfn,
        oninertiafn = fnobj.oninertiafn || slugfn,
        onmovefn = fnobj.onmovefn || slugfn;

    rafcfg = touchboom_touchmouse(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_key(rafcfg, touchboom_ctrl, elem);
    rafcfg = touchboom_ctrl(rafcfg, elem, oneventfn, oninertiafn, onmovefn);

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
return module.exports;});