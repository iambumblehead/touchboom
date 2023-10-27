// Filename: touchboom_ev.js
// Timestamp: 2017.11.03-11:32:20 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

export default (o => {
  o.publish = (cfg, etype, ev) => (
    typeof cfg.publishfn === 'function'
      && cfg.publishfn(cfg, etype, ev),
    cfg);

  o.lsnpub = (cfg, elem, evarr, fn) =>
    o.lsnarr(evarr, elem, e => fn(cfg, e, fn));

  o.lsnarr = (evarr, elem, fn) =>
    evarr.map(e => elem.addEventListener(e, fn));

  o.lsnrmarr = (evarr, elem, fn) =>
    evarr.map(e => elem.removeEventListener(e, fn));

  return o;
})({});

// Filename: curved.js
// Timestamp: 2017.04.26-21:35:40 (last modified)
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

export default (() => {
  const B1 = t => t * t * t,
        B2 = t => 3 * t * t * (1 - t),
        B3 = t => 3 * t * (1 - t) * (1 - t),
        B4 = t => (1 - t) * (1 - t) * (1 - t),
        
        shift = (x1, x2, min = Math.min(x1, x2)) =>
          min && -min;

  // easeStr should be a string 'end' or 'bgn'
  return (bgnCoord, endCoord, easeStr) => {
    let shiftval = shift(bgnCoord, endCoord),
        C1 = endCoord + shiftval,
        C4 = bgnCoord + shiftval,
        C2_3 = easeStr === 'end' ? C1 : C4;

    return per => 
      Math.round(
        C1 * B1(per) +
        C2_3 * B2(per) +
        C2_3 * B3(per) +
          C4 * B4(per)
      ) - shiftval;
  };
})();

// Filename: touchboom_ctrl.js
// Timestamp: 2018.01.21-20:41:01 (last modified)
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

import touchboom_ev from './touchboom_0250_src_touchboom_ev.js'
import curved from './curved_008_curved.js'

export default (o => {
  const VELOCITYTHRESHOLD = 10
  const TIMECONST = 325
  const INF = Infinity;

  o = (cfg, parentelem, fn, onmovefn, onoverfn) => {
    cfg.publishfn = fn;
    cfg.onmovefn = onmovefn || function () {};
    cfg.onoverfn = onoverfn || function () {};
    cfg.isinertia = typeof cfg.isinertia === 'boolean' ? cfg.isinertia : true;
    cfg.rafcoordidarr = [];
    cfg = o.coordsreset(cfg);

    return cfg;
  };

  o.detach = cfg => {
    cfg.publishfn = null;
    cfg.onmovefn = null;
    cfg.onoverfn = null;
    cfg.rafcoordidarr = [];

    return cfg;
  };

  o.events = {
    INTERRUPT : 'interrupt',
    CANCEL : 'cancel',
    KEYSTART : 'keystart',
    KEYEND : 'keyend',
    MOVE : 'move',
    MOVEEND : 'moveend',
    OVER : 'over',
    START : 'start',
    END : 'end',
    TAP : 'tap',
    OUT : 'out', // mouse leaves area
    TAPTAP : 'taptap'
  };

  o.onmoveend = (cfg, id, fn) => (
    cfg.onmoveendfn = cfg.onmoveendfn || {},
    cfg.onmoveendfn[id] = fn,
    cfg);

  o.onmoveendfn = (cfg, type, ev) => {
    if (cfg.onmoveendfn) {
      Object.keys(cfg.onmoveendfn).map(key => {
        cfg.onmoveendfn[key](cfg, type, ev);
      });
    }

    cfg = touchboom_ev.publish(cfg, o.events.MOVEEND, cfg.laste);

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

  o.coords = (cfgcoords = [ {}, {} ]) =>
    cfgcoords.map(o.coordget);

  o.coordsreset = cfg => (
    // initialize empty coords, two coords by default --x and y
    cfg.coords = o.coords(cfg.coords),
    cfg);

  o.isnum = n =>
    typeof n === 'number';

  o.firstnum = numarr =>
    numarr.find(num => typeof num === 'number');

  o.coordget = (c = {}, coorddef = {}) => {
    const now = Date.now();

    c.min = o.firstnum([ c.min, coorddef.min, -INF ]);
    c.max = o.firstnum([ c.max, coorddef.max, INF ]);

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
      // do nothing
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

  o.coordgetstarted = (c, start, type) =>
    o.coordget(c, { start, type });

  o.coordset = (c, props) =>
    Object.assign({}, c, props);

  // mutates cfg.coords
  o.coordsupdatepassive = (cfg, now = Date.now()) => (
    cfg.coords = cfg.coords.map(c => (
      c.isupdatepassive ? o.coordupdatepassive(cfg, c, now) : c)),
    cfg
  );

  o.coordsgettotal = cfg => (
    o.coordsupdatepassive(cfg).coords.map(c => c.total + c.offset));

  o.coordsismove = cfg =>
    cfg.coords.some(c => c.ismove);

  o.stop = cfg => (
    cfg.ticker = clearInterval(cfg.ticker),
    cfg);

  o.start = (cfg, e) => (
    cfg.rafcoordidarr = cfg.coords.map((c, i) => (
      c.ismove || cfg.rafcoordidarr[i])),
    cfg.ticker = setInterval(() => o.coordsupdate(cfg), 100),
    o.coordsmovestart(cfg, e),
    cfg);

  o.getdeltacurve = ((maxms, curve) => {
    maxms = 1000;
    curve = curved(3, 10, 'bgn');

    return (c, timestart, timenow) => {
      const timediff = (timenow - timestart) / maxms;

      return (c.autoweight
        ? curved(c.autoweight * 0.2, c.autoweight, 'bgn')
        : curve)(timediff > 1 ? 1 : timediff);
    };
  })();

  o.getvelocityupdated = (offset, frame, velocity, elapsedms) => (
    0.4 * ( // 0.8 * (
      1000 * ( // velocity
        offset - frame // delta
      ) / (1 + elapsedms)) + 0.2 * velocity
  );

  o.getamplitudeupdated = (velocity, amplitude, velocitythreshold) =>
    Math.abs(velocity) > velocitythreshold ? 0.8 * velocity : amplitude;

  o.gettargetupdated = (velocity, offset, amplitude) =>
    Math.abs(velocity) > 10 ? Math.round(offset + amplitude) : offset;

  o.coordupdatepassive = (cfg, c, now = Date.now()) => {
    if (c.isupdatepassive) {
      c.lastdelta = c.lastdelta || 0;
      c.lastdelta += o.getdeltacurve(c, c.ismove, now) * c.dir;
      c = o.updatecoord(cfg, c, c.lastdelta);
    }

    return c;
  };

  o.coordupdate = (cfg, c, date = Date.now()) =>
    o.coordset(c, {
      velocity : o.getvelocityupdated(c.offset, c.frame, c.velocity, date - c.trackts),
      frame : c.offset,
      trackts : date
    });

  o.coordsupdate = (cfg, now = Date.now()) => {
    cfg.coords = cfg.coords.map(c => (
      c.isglide ? c : o.coordupdate(cfg, c, now)
    ));

    return cfg;
  };

  // offset, cur, max,  min
  // 40,     100,   0,    100   => 0
  // 40,     80,    0,    100   => 20
  // 40,     20,    0,    100   => 40
  // 3,      -100,  -100, 100   => 0
  // -491,   0,     -100, 100   => -100
  o.getoffset = (cfg, offset, cur, min, max) => (
    offset > 0
      ? ((cur + offset <= max)
        ? offset : cur >= max ? 0 : max - cur)
      : ((cur + offset >= min)
        ? offset : cur <= min ? 0 : min - cur));

  o.movecoord = (cfg, c, dist) =>
    o.coordset(c, {
      offset : o.getoffset(cfg, dist, c.total, c.getmin(cfg, c), c.getmax(cfg, c))
    });

  o.movecoordauto = (cfg, c, now) => {
    const elapsed = now - c.trackts;
    const delta = -c.amplitude * Math.exp(-elapsed / TIMECONST);

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
    if (!rafcoordidarr.some((coordid, i) => (
      coordid && coordid === cfg.rafcoordidarr[i]
    ))) {
      return 'automove cancelled' && null;
    }

    cfg.coords = cfg.coords.map(c => (
      c.isglide ? c = o.movecoordauto(cfg, c, now) : c));

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

  o.coordmoveend = (cfg, c, now = Date.now()) => {
    if (Math.abs(c.velocity) > VELOCITYTHRESHOLD) {
      c.trackts = now;

      c.amplitude = o.getamplitudeupdated(
        c.velocity, c.amplitude, VELOCITYTHRESHOLD);

      c.target = o.gettargetupdated(
        c.velocity, c.offset, c.amplitude, c.target);

      c.isglide = Date.now();
    } else {
      c = o.coordstopped(cfg, c);
    }

    return c;
  };

  o.coordsmovestart = (cfg, e) =>
    requestAnimationFrame(() => {
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

const getElemAt = (e, fn = ev => null) => {
  if (typeof e === 'object' && e) {
    if ('srcElement' in e) {
      fn = ev => ev.srcElement;        
    } else if ('target' in e) {
      fn = ev => ev.target;
    }
  }

  return fn
};

const stopDefaultAt = (e, fn = ev => null) => {
  if (typeof e === 'object' && e) {
    if (typeof e.preventDefault) {
      fn = ev => (ev.preventDefault());
    } else {
      fn = ev => (ev.returnValue = false);
    }
  }
  
  return fn(e);
};

const getparentlinkelemat = (e, elem = getElemAt(e)) => (
  elem && (function getparentlink (elem) {
    return (elem && elem.tagName) && (
      /^a/i.test(elem.tagName)
        ? elem : getparentlink(elem.parentNode));
  }(elem)));

const isElem = (e, elem, evelem = getElemAt(e, elem)) => (
  elem && evelem && elem.isEqualNode(evelem));

const hasElem = (e, elem, evelem = getElemAt(e, elem)) => (
  elem && evelem && (elem.isEqualNode(evelem) ||
                     elem.contains(evelem)));

export default {
  getElemAt,
  stopDefaultAt,
  getparentlinkelemat,
  isElem,
  hasElem
}

// Filename: evdelegator.js
// Timestamp: 2017.11.03-13:35:11 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

export default (o => {
  // delegator:
  //
  //   activestate :
  //     [[depth, 'elemid', {state}],
  //      [depth, 'elemid', {state}]]
  //
  //   statearr : [ ...statearr ]
  //
  o.create = () => ({
    listenersarr : [],
    activestate : null,
    statearr : []
  });

  o.setmouseoverstate = (delegator, activestate) => (
    delegator.mouseoverstate = activestate,
    delegator);

  o.getmouseoverstate = delegator =>
    delegator.mouseoverstate;

  o.rmmouseoverstate = delegator => (
    delegator.mouseoverstate = null,
    delegator);

  o.setactivestate = (delegator, activestate) => (
    delegator.activestate = activestate,
    delegator);

  o.getactivestate = delegator =>
    delegator.activestate;

  o.rmactivestate = delegator => (
    delegator.activestate = null,
    delegator);

  o.getactivestatemeta = delegator =>
    o.getstatemeta(o.getactivestate(delegator));

  // state:
  //
  //   [[depth, 'elemid', {state}],
  //    [depth, 'elemid', {state}]]
  //
  o.createstate = (depth, elemid, meta) => (
    [ depth, elemid, meta ]);

  o.isstatesame = (statea, stateb) =>
    o.getstateid(statea) === o.getstateid(stateb);

  o.createelemstate = (elem, meta) => (
    o.createstate(o.getelemdepth(elem), elem.id, meta));

  o.getstatemeta = delegatorstate =>
    delegatorstate && delegatorstate[2];

  o.getstateid = delegatorstate =>
    delegatorstate && delegatorstate[1];

  o.getstateelem = delegatorstate =>
    delegatorstate && document.getElementById(delegatorstate[1]);

  o.haselemid = (elem, elemid, elemidelem) =>
    Boolean(elem && (elemidelem = document.getElementById(elemid)) &&
            (elem.isEqualNode(elemidelem) || elemidelem.contains(elem)));

  o.getelemstate = (delegator, elem) =>
    delegator.statearr.find(([ , id ]) => (
      o.haselemid(elem, id)));

  o.getelemdepth = (elem, depth = 0) => (
    elem.parentNode
      ? o.getelemdepth(elem.parentNode, ++depth)
      : depth);

  // sorting arranges elements 'deeper' in the document to appear first
  //
  // for elements w/ parent/child relationship --yield child first
  o.delegatordepthsort = ([ elemadepth ], [ elembdepth ]) =>
    elemadepth > elembdepth ? 1 : -1;

  o.addstate = (delegator, state) => (
    delegator.statearr = delegator.statearr
      .filter(stateelem => !o.isstatesame(stateelem, state)),
    delegator.statearr.push(state),
    delegator.statearr = delegator.statearr.sort(o.delegatordepthsort),
    delegator);

  o.addelemstate = (delegator, elem, state) => {
    if (!elem || !elem.id) {
      console.error('parent element exist w/ valid id');
    } else {
      delegator = o.addstate(delegator, o.createelemstate(elem, state));
    }

    return delegator;
  };

  o.rmelemstate = (delegator, elem) => {
    delegator.statearr = delegator.statearr
      .filter(stateelem => o.getstateid(stateelem) !== elem.id);

    // completely removes *all* listeners associtated w/ delegator
    delegator.listenersarr.map(([ listeners, lsnfn ]) => {
      o.lsnrmarr(elem, listeners, lsnfn);
    });

    return delegator;
  };

  //
  // convenience data
  //
  o.lsnarr = (elem, evarr, fn) =>
    evarr.map(e => elem.addEventListener(e, fn));

  o.lsnrmarr = (elem, evarr, fn) =>
    evarr.map(e => elem.removeEventListener(e, fn));

  o.lsnpubarr = (delegator, cfg, elem, evarr, fn) => {
    const lsnfn = e => fn(cfg, e, fn);

    delegator.listenersarr.push([ evarr, lsnfn ]);

    o.lsnarr(elem, evarr, lsnfn);

    return delegator;
  };

  return o;
})({});

// Filename: nodefocusable.js  
// Timestamp: 2017.09.20-06:59:18 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const focusableNameRe = /^(button|input|select|textarea)$/

const is = elem => Boolean(elem instanceof Element && (
  focusableNameRe.test(elem.nodeName) ||
    elem.hasAttribute('href') || (
      elem.hasAttribute('tabindex') &&
        !/-1/.test(elem.getAttribute('tabindex')))));

const getfocusableparent = elem => elem && (
  is(elem) ? elem : getfocusableparent(elem.parentNode))

export default Object.assign(getfocusableparent, { is })

// Filename: touchboom_key.js
// Timestamp: 2018.01.15-15:05:24 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import domev from './domev_008_domev.js'
import evdelegate from './evdelegate_004_evdelegate.js'
import nodefocusable from './nodefocusable_002_nodefocusable.js'

import touchboom_ev from './touchboom_0250_src_touchboom_ev.js'
import touchboom_ctrl from './touchboom_0250_src_touchboom_ctrl.js'

export default (o => {
  const DIR_LEFT = 'DIR_LEFT';
  const DIR_RIGHT = 'DIR_RIGHT';
  const DIR_DOWN = 'DIR_DOWN';
  const DIR_UP = 'DIR_UP';
  const {
    INTERRUPT,
    KEYSTART, KEYEND
  } = touchboom_ctrl.events;

  o = (cfg, parentelem, fn) =>
    o.connectdelegate(cfg, parentelem, fn);

  o.events = {
    DIR_LEFT, DIR_RIGHT, DIR_DOWN, DIR_UP
  };

  o.getdirection = (cfg, keyCode) => {
    let dir = null;

    if (typeof keyCode !== 'number')
      throw new Error('keyCode must be a number');
    else if (cfg.iskeyupre.test(keyCode))
      dir = DIR_UP;
    else if (cfg.iskeyleftre.test(keyCode))
      dir = DIR_LEFT;
    else if (cfg.iskeydownre.test(keyCode))
      dir = DIR_DOWN;
    else if (cfg.iskeyrightre.test(keyCode))
      dir = DIR_RIGHT;

    return dir;
  };

  // LEFT OR RIGHT, X: 0
  // UP or DOWN,    Y: 1
  o.getdirectionxynum = (cfg, dir) =>
    Number(dir === DIR_DOWN || dir === DIR_UP);

  // LEFT OR DOWN: -1
  // UP or RIGHT:  +1
  o.getdirectiondirnum = (cfg, dir) =>
    Number(dir === DIR_RIGHT || dir === DIR_DOWN) ||
    -Number(dir === DIR_LEFT || dir === DIR_UP);

  o.keydown = (cfg, touchboom_ctrl, e) => {
    let dir = o.getdirection(cfg, e.keyCode),
        axisnum = o.getdirectionxynum(cfg, dir),
        dirnum = o.getdirectiondirnum(cfg, dir),
        coord = cfg.coords[axisnum];

    e.lastkeye = e;
    if (coord && !coord.isupdatepassive) {
      if (coord.ismove) {
        coord = touchboom_ctrl.coordset(coord, {
          total : coord.total + coord.offset,
          offset : 0
        });

        cfg.coords[axisnum] = coord;
        cfg = touchboom_ev.publish(cfg, INTERRUPT, e);
      }
      coord.isupdatepassive = true;
      coord = touchboom_ctrl.coordget(coord, {
        ismove : Date.now(),
        start : 0,
        type : 'key'
      });
      coord.lastdelta = 0;
      coord.dir = dirnum;
      cfg.coords[axisnum] = coord;

      cfg = touchboom_ev.publish(cfg, KEYSTART, e);
      touchboom_ctrl.start(cfg, e);
    }

    // prevent key from scrolling parent|document
    if (cfg.isKeyPreventDefault)
      domev.stopDefaultAt(e);
  };

  o.keyup = (cfg, touchboom_ctrl, e) => {
    let dir = o.getdirection(cfg, e.keyCode),
        axisnum = o.getdirectionxynum(cfg, dir),
        coord = cfg.coords[axisnum];

    if (coord && coord.isupdatepassive) {
      coord.isupdatepassive = false;
      cfg = touchboom_ctrl.stop(cfg);
      cfg.coords[axisnum] = touchboom_ctrl.coordmoveend(cfg, coord);
      touchboom_ctrl.coordsmoveend(cfg, e, coord);

      cfg = touchboom_ev.publish(cfg, KEYEND, e || cfg.lastkeye);
    }
  };

  o.getkeycodearrre = keycodearr =>
    new RegExp(keycodearr.join('|'));

  o.adaptkeycodere = cfg => (
    cfg.iskeyupre = o.getkeycodearrre(
      cfg.keycodeuparr || [ 38, 87 ]),
    cfg.iskeyleftre = o.getkeycodearrre(
      cfg.keycodeleftarr || [ 37, 65 ]),
    cfg.iskeyrightre = o.getkeycodearrre(
      cfg.keycoderightarr || [ 39, 68 ]),
    cfg.iskeydownre = o.getkeycodearrre(
      cfg.keycodedownarr || [ 40, 83 ]),
    cfg);

  o.connect = (cfg, touchboom, parentelem) => {
    cfg = o.adaptkeycodere(cfg);

    touchboom_ev.lsnpub(cfg, parentelem, [ 'keydown' ], (cfg, e) => {
      o.keydown(cfg, touchboom, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, [ 'keyup' ], (cfg, e) => {
      o.keyup(cfg, touchboom, e);
    });

    return cfg;
  };

  o.delegator = null;

  o.detach = (cfg, parentelem) => {
    o.delegator = evdelegate.rmelemstate(o.delegator, parentelem);

    return cfg;
  };

  o.reset = (cfg, elem) => {
    o.delegator = evdelegate.addelemstate(o.delegator, elem, cfg);

    return cfg;
  };

  o.connectdelegate = (cfg, touchboom, parentelem) => {
    let { body } = document,
        ctrldel = evdelegate;

    if (!parentelem || !parentelem.id) {
      console.error('parent element exist w/ valid id');
      return cfg;
    }

    if (!o.delegator) {
      o.delegator = ctrldel.create();

      ctrldel.lsnpubarr(o.delegator, {}, body, [ 'keydown' ], (cfg, e) => {
        let elem = domev.getElemAt(e),
            delegatorstate = ctrldel.getelemstate(o.delegator, nodefocusable(elem));

        if (delegatorstate) {
          o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

          o.keydown(ctrldel.getstatemeta(delegatorstate), touchboom, e);
        }
      });

      ctrldel.lsnpubarr(o.delegator, {}, body, [ 'keyup' ], (cfg, e) => {
        let delegatorstate = ctrldel.getactivestate(o.delegator);

        if (delegatorstate) {
          o.keyup(ctrldel.getstatemeta(delegatorstate), touchboom, e);
        }
      });
    }

    cfg = touchboom_ctrl.onmoveend(cfg, 'key', (/* cfg, type, e */) => {
      ctrldel.rmactivestate(o.delegator);
    });

    cfg = o.adaptkeycodere(cfg);

    o.delegator = ctrldel.addelemstate(o.delegator, parentelem, cfg);

    return cfg;
  };

  return o;
})({});

// Filename: touchboom_touchmouse.js
// Timestamp: 2018.01.21-21:07:44 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import domev from './domev_008_domev.js'
import evdelegate from './evdelegate_004_evdelegate.js'
import nodefocusable from './nodefocusable_002_nodefocusable.js'

import touchboom_ev from './touchboom_0250_src_touchboom_ev.js'
import touchboom_ctrl from './touchboom_0250_src_touchboom_ctrl.js'

export default (o => {
  const TYPE = 'touchmouse';
  const TAPTIMETHRESHOLD = 200;
  const TAPTAPTIMETHRESHOLD = 200;
  const TAPMOVETHRESHOLD = 10;
  const {
    INTERRUPT, CANCEL, MOVE, OVER,
    START, END, TAP, TAPTAP, OUT
  } = touchboom_ctrl.events;

  o = (cfg, touchboom_ctrl, parentelem, fn) =>
    o.connectdelegate(cfg, touchboom_ctrl, parentelem, fn);

  o.istapev = cfg =>
    cfg.coords.some(c => (
      c.ismove
        && (Date.now() - c.ismove < TAPTIMETHRESHOLD)
        && (Math.abs(c.offset) < TAPMOVETHRESHOLD)));

  o.getchangedtouchxy = changedTouches => {
    let changedTouch = changedTouches && changedTouches[0];

    return changedTouch
      ? [ changedTouch.pageX, changedTouch.pageY ]
      : [ 0, 0 ];
  };

  // will accept xy array, click object or touch object
  o.getevxy = e => {
    let evxy = [ 0, 0 ];

    if (Array.isArray(e)) {
      evxy = e;
    } else if (typeof e.clientX === 'number') {
      evxy = [ e.clientX, e.clientY ];
    } else if (typeof e.changedTouches === 'object') {
      evxy = o.getchangedtouchxy(e.changedTouches);
    }

    return evxy;
  };

  o.getelemxy = elem => {
    let rect = elem.getBoundingClientRect(),
        docelem = document.documentElement,
        win = window;

    return [
      rect.left + (win.pageXOffset || docelem.scrollLeft),
      rect.top + (win.pageYOffset || docelem.scrollTop)
    ];
  };

  o.getevxyrelativeelem = (e, elem) => {
    let evxy = o.getevxy(e);

    return o.getelemxy(elem).map((xy, i) => evxy[i] - xy);
  };

  o.endtap = (cfg, e, now = Date.now()) => {
    cfg.istap = o.istapev(cfg, e);
    cfg.istaptap = cfg.tapts
      && cfg.istap
      && now - cfg.tapts < TAPTAPTIMETHRESHOLD;
    cfg.tapts = cfg.istap && now;

    return cfg;
  };

  o.ismouseoutparent = (e, parentelem) => (
    /mouseout/.test(e.type) && parentelem && !domev.isElem(e, parentelem));

  o.start = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);

    cfg.laste = e;
    if (touchboom_ctrl.coordsismove(cfg)) {
      cfg = touchboom_ctrl.stop(cfg);
      cfg.coords = cfg.coords.map(c => (
        touchboom_ctrl.coordset(c, {
          total : c.total + c.offset,
          offset : 0
        })));

      cfg = touchboom_ev.publish(cfg, INTERRUPT, e);
    }

    cfg.istap = false;
    cfg.istaptap = false;
    cfg.coords = cfg.coords.map((c, i) => touchboom_ctrl.coordget(c, {
      ismove : true,
      start : evarr[i],
      type : TYPE
    }));

    cfg = touchboom_ev.publish(cfg, START, e);
    touchboom_ctrl.start(cfg, e);
  };

  o.move = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);

    cfg.laste = e;
    cfg = touchboom_ev.publish(cfg, MOVE, e);

    cfg.coords = cfg.coords.map((c, i) => (
      c.type === TYPE && (c.ismove && !c.isglide)
        ? touchboom_ctrl.updatecoord(cfg, c, evarr[i]) : c));
  };

  o.over = (cfg, touchboom_ctrl, e) => {
    if (cfg.onoverfn) {
      cfg = cfg.onoverfn(cfg, OVER, e);
    }
  };

  o.publishfn = (cfg, ev, e) =>
    cfg.publishfn && cfg.publishfn(cfg, ev, e);

  // taps must occur near one another, when user is not updating movement.
  //
  //  - previous touch/tap must have been released
  //  - must be not-moving OR if moving must be gliding (user disengaged)
  //
  // prevents multiple, separated -touch/click
  o.istaptapvalid = cfg =>
    cfg.coords.every(c => !c.ismove || c.isglide) &&
    (touchboom_ctrl
      .coordsgettotal(cfg)
      .every(coordtotal => coordtotal < 20));

  o.movecomplete = (cfg, touchboom_ctrl, e, evtype = END) => {
    if (!touchboom_ctrl.coordsismove(cfg)) {
      o.publishfn(cfg, evtype, e);
      return touchboom_ctrl.stop(cfg);
    }

    if (/touchend|mouseup/.test(e.type)) {
      cfg = o.endtap(cfg, e);
      if (cfg.istap) {
        o.publishfn(cfg, TAP, e);
      }

      if (cfg.istaptap && o.istaptapvalid(cfg)) {
        o.publishfn(cfg, TAPTAP, e);
      }
    }

    if (e.type === 'mouseout' &&
        cfg.coords.some(c => c.isglide)) {
      return null;
    }

    o.publishfn(cfg, evtype, e);

    cfg.coords = cfg.coords.map(c => (
      c = touchboom_ctrl.coordupdate(cfg, c),
      c = touchboom_ctrl.coordmoveend(cfg, c),
      c));

    touchboom_ctrl.coordsmoveend(cfg, e);
  };

  o.moveout = (cfg, touchboom_ctrl, e) =>
    o.movecomplete(cfg, touchboom_ctrl, e, OUT);

  o.movecancel = (cfg, touchboom_ctrl, e) => {
    cfg = touchboom_ev.publish(cfg, CANCEL, e);

    cfg.coords = cfg.coords && cfg.coords.map(c => (
      touchboom_ctrl.coordset(c, {
        offset : 0
      })));

    cfg = touchboom_ctrl.stop(cfg);
  };

  o.connect = (cfg, touchboom_ctrl, parentelem) => {
    touchboom_ev.lsnpub(cfg, parentelem, [ 'mousedown', 'touchstart' ], (cfg, e) => {
      e.preventDefault();

      o.start(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, [ 'mousemove', 'touchmove' ], (cfg, e) => {
      o.move(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, [ 'mouseup', 'mouseout', 'touchend' ], (cfg, e) => {
      if (o.ismouseoutparent(e, parentelem)) {
        return null;
      }

      o.movecomplete(cfg, touchboom_ctrl, e);
    });

    touchboom_ev.lsnpub(cfg, parentelem, [ 'touchcancel' ], (cfg, e) => {
      o.movecancel(cfg, touchboom_ctrl, e);
    });

    return cfg;
  };

  o.delegator = null;

  o.startdelegator = (elem, e) => {
    let ctrldel = evdelegate,
        delegatorstate = ctrldel.getelemstate(o.delegator, elem);

    if (delegatorstate) {
      o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

      o.start(ctrldel.getstatemeta(delegatorstate), touchboom_ctrl, e);
    }
  };

  o.detach = (cfg, parentelem) => {
    // console.log('detach touchmouse', o.delegator);
    o.delegator = evdelegate.rmelemstate(o.delegator, parentelem);

    return cfg;
  };

  o.reset = (cfg, elem) => {
    o.delegator = evdelegate.addelemstate(o.delegator, elem, cfg);

    return cfg;
  };

  o.connectdelegate = (cfg, touchboom_ctrl, parentelem) => {
    let { body } = document,
        ctrldel = evdelegate;

    if (!parentelem || !parentelem.id) {
      console.error('parent element exist w/ valid id');
      return cfg;
    }

    if (!o.delegator) {
      o.delegator = ctrldel.create();

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'mouseover'
      ], (cfg, e) => {
        let elem = domev.getElemAt(e),
            delegatorstate = ctrldel.getelemstate(o.delegator, nodefocusable(elem));

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
        }
      });

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'mousedown', 'touchstart'
      ], (cfg, e) => {
        let elem = domev.getElemAt(e),
            delegatorstate = ctrldel.getelemstate(o.delegator, nodefocusable(elem)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
          o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

          o.start(statemeta, touchboom_ctrl, e);
        }
      });

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'mousemove', 'touchmove'
      ], (cfg, e) => {
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

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'mouseup', 'mouseout', 'touchend'
      ], (cfg, e) => {
        let elem = domev.getElemAt(e),
            delegatorstate = ctrldel.getelemstate(o.delegator, nodefocusable(elem)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          if (o.ismouseoutparent(e, ctrldel.getstateelem(delegatorstate))) {
            return null;
          }

          if (/mouseout|touchend/.test(e.type)) {
            ctrldel.rmmouseoverstate(o.delegator, delegatorstate);
          }

          if (/mouseout/.test(e.type)) {
            o.movecomplete(statemeta, touchboom_ctrl, e, OUT);
          } else {
            o.movecomplete(statemeta, touchboom_ctrl, e);
          }
        }
      });

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'touchcancel'
      ], (cfg, e) => {
        let delegatorstate = ctrldel.getactivestate(o.delegator);

        if (delegatorstate) {
          ctrldel.rmactivestate(o.delegator);
          ctrldel.rmmouseoverstate(o.delegator, delegatorstate);

          o.movecancel(cfg, touchboom_ctrl, e);
        }
      });
    }

    document.addEventListener('mouseout', e => {
      e = e || window.event;
      let from = e.relatedTarget || e.toElement;

      if (!from || /html/i.test(from.nodeName)) {
        let delegatorstate = ctrldel.getactivestate(o.delegator),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          evdelegate.rmactivestate(o.delegator);
          evdelegate.rmmouseoverstate(o.delegator, delegatorstate);

          o.moveout(statemeta, touchboom_ctrl, e);
        }
      }
    });


    cfg = touchboom_ctrl.onmoveend(cfg, 'touchmouse', (/* cfg, type, e */) => {
      ctrldel.rmactivestate(o.delegator);
    });

    o.delegator = ctrldel.addelemstate(o.delegator, parentelem, cfg);

    return cfg;
  };

  return o;
})({});

// Filename: touchboom.js
// Timestamp: 2018.01.15-06:15:27 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import touchboom_ctrl from './touchboom_0250_src_touchboom_ctrl.js'
import touchboom_key from './touchboom_0250_src_touchboom_key.js'
import touchboom_touchmouse from './touchboom_0250_src_touchboom_touchmouse.js'

export default (o => {
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

// Filename: touchboom.test.js
// Timestamp: 2017.11.03-13:33:54 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import touchboom from './touchboom_0250_src_touchboom.js'

let THREE = null;

function gettouchboom (fn) {
  let threescript = '//cdnjs.cloudflare.com/ajax/libs/three.js/87/three.min.js';

  (function next (arr, x = 0) {
    return x >= arr.length
      // create build and generate demo page
      ? fn(null, { THREE } = window)
      : document.body.appendChild(getscriptelem(arr[x], () => next(arr, ++x)));
  }([
    (/http/.test(window.location.protocol)
      ? window.location.protocol : 'http:') + threescript
  ]));
}

function getrootelem () {
  return document.body;
}

function getcanvaselem (cfg) {
  let canvaselem = document.createElement('canvas'),
      [ w, h ] = cfg.wh;

  canvaselem.style.width = `${w}px`;
  canvaselem.style.height = `${h}px`;
  canvaselem.width = w;
  canvaselem.height = h;

  if (cfg.bg) {
    canvaselem.style.backgroundColor = cfg.bg;
  }

  if (cfg.className) {
    canvaselem.className = cfg.className;
  }

  return canvaselem;
}

function getscriptelem (src, fn) {
  let script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = function () {
    fn(null);
  };
  return script;
}

function getwindowwh () {
  return [
    Math.floor(window.innerWidth),
    Math.floor(window.innerHeight)
  ];
}

function getwindowhalfwh () {
  return getwindowwh().map(wh => wh / 2);
}

function paintballrender (cfg, xyr, canvas) {
  let ctx = canvas.getContext('2d');

  // ctx.clearRect(0,0,canvas.width,canvas.height);
  // ctx.save();

  ctx.beginPath();
  ctx.arc(xyr[0], xyr[1], cfg.stroke, 0, 2 * Math.PI, false);
  ctx.fillStyle = cfg.paintballcolor;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = cfg.paintballcolor;
  ctx.stroke();

  ctx.restore();
  ctx.save();
}

function getcenterxy (cfg, canvas) {
  return [
    canvas.width / 2 - cfg.stroke / 2,
    canvas.height / 2 - cfg.stroke / 2
  ];
}

function getcentermousexy (cfg, transxy) {
  return transxy
    ? [ cfg.centerxy[0] + transxy[0], cfg.centerxy[1] + transxy[1] ]
    : cfg.centerxy;
}

function paintballconnect (cfg, canvas) {
  return Object.assign(cfg, {
    centerxy : getcenterxy(cfg, canvas)
  });
}

function getsphere (cfg, opacity, radius) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshBasicMaterial({
      opacity,
      transparent : true,
      color : cfg.bgcolor,
      side : THREE.BackSide
    }));
}

function getwrapcircle (opacity, color, radius) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.02, 30, 100),
    new THREE.MeshBasicMaterial({
      color,
      wireframe : true,
      opacity,
      transparent : true
    }));
}

function gettrackball (cfg) {
  let headgroup = new THREE.Group(),
      wrapcircle = getwrapcircle(0.1, cfg.xcolor, 11),
      wrapcircle_y90 = getwrapcircle(0.1, cfg.ycolor, 11),
      wrapcircle_z90 = getwrapcircle(0.1, cfg.zcolor, 11),
      eyecircle1 = getwrapcircle(0.2, cfg.fgcolor, 6),
      eyecircle2 = getwrapcircle(0.2, cfg.fgcolor, 5),
      sphere = getsphere(cfg, 0.7, 20 / 2);
  headgroup.name = 'headgroup';

  wrapcircle_y90.rotation.y = Math.PI / 2;
  wrapcircle_z90.rotation.x = Math.PI / 2;

  eyecircle1.position.set(0, 0, -8.1);
  eyecircle2.position.set(0, 0, -8.9);

  headgroup.add(sphere);
  headgroup.add(wrapcircle_y90);
  headgroup.add(wrapcircle_z90);

  headgroup.add(wrapcircle);
  headgroup.add(eyecircle1);
  headgroup.add(eyecircle2);

  return headgroup;
}

function getglrenderer (canvaselem) {
  return new THREE.WebGLRenderer({
    canvas : canvaselem,
    alpha : true,
    antialias : true
  });
}

function gettrackballscene (cfg, canvaselem) {
  let wharr = [ canvaselem.offsetWidth, canvaselem.offsetHeight ],
      glscene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(60, wharr[0] / wharr[1], 1, 10000),

      glrenderer = getglrenderer(canvaselem),
      headgroup = gettrackball(cfg),
      bodygroup = new THREE.Group(),
      scenegroup = new THREE.Group();

  bodygroup.add(headgroup);
  scenegroup.add(bodygroup);
  scenegroup.rotation.y = -THREE.Math.degToRad(90);

  glscene.add(scenegroup);

  camera.position.set(0, 0, -24);
  camera.lookAt(glscene.position);

  glscene.rotation.y += -Math.PI / 2;

  return {
    wharr,
    headgroup,
    bodygroup,
    glrenderer,
    camera,
    glscene
  };
}

// o.pixel_weightarea = ([w, h]) =>
//   180 / Math.max(w, h);

function degreetoradian (d) {
  return d * (Math.PI / 180);
}

function pixeltodegree (p, pw) {
  return p * pw;
}

function pixelweightarea (wh) {
  return 180 / Math.max(wh[0], wh[1]);
}

function pixelweight (elem) {
  return pixelweightarea(
    elem === window
      ? [ elem.innerWidth, elem.innerHeight ]
      : [ elem.clientWidth, elem.clientHeight ]);
}

function appendchild (parent, child) {
  parent.appendChild(child);

  return child;
}

(function (cfg) {
  let rootelem = getrootelem(),
      windowwh = getwindowwh(),
      windowhalfwh = getwindowhalfwh(),
      pwwindow = pixelweight(window),
      canvas2Delem = getcanvaselem({
        wh : windowwh,
        bg : cfg.paintballbgcolor
      });

  rootelem.appendChild(canvas2Delem);

  gettouchboom(() => {
    let canvasrightscene = gettrackballscene({
      xcolor : cfg.trackballxcolor,
      ycolor : cfg.trackballycolor,
      zcolor : cfg.trackballzcolor,
      fgcolor : cfg.trackballfgcolor,
      bgcolor : cfg.trackballbgcolor
    }, appendchild(rootelem, getcanvaselem({
      wh : [ windowwh[1], windowwh[1] ],
      className : 'right'
    })));
    // canvasleftscene = gettrackballscene({
    //      xcolor : cfg.trackballxcolor,
    //      ycolor : cfg.trackballycolor,
    //      zcolor : cfg.trackballzcolor,
    //      fgcolor : cfg.trackballfgcolor,
    //      bgcolor : cfg.trackballbgcolor
    //    }, appendchild(rootelem, getcanvaselem({
    //      wh : [ windowwh[1], windowwh[1] ],
    //      className : 'left'
    //    }))),

    cfg = paintballconnect(cfg, canvas2Delem);

    //
    // start coords = [ xcoord, ycoord ]
    // all properties are optional
    //
    cfg.coords = touchboom.coords([ {
      bgn : 0,

      // 'optional' properties
      min : -windowhalfwh[0],
      max : windowhalfwh[0]
    }, {
      autoweight : 10,
      bgn : 0,

      // 'optional' properties
      min : -windowhalfwh[1],
      max : windowhalfwh[1]
    } ]);

    //
    // target element must have id, used to manage delegation
    // one set of listeners are attached body and delegated
    // to touchboom functions assocated w/ element
    //
    rootelem.id = 'id-is-required';

    //
    // all event functions are optional,
    //
    //  * oneventfn, called when an event occurs
    //    'bgn', 'start', 'end', 'move', 'moveend', 'tap', 'cancel', 'over'
    //
    //  * oninertiafn, called on each 'frame' of movement before and after
    //    touch/mouse release
    //
    //  * onmovefn, called when mouse is over element
    //
    touchboom.attach(cfg, rootelem, {
      oneventfn : (cfg, etype) => {
        console.log('touchboom event', etype);
        if (etype === touchboom.events.MOVEEND) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));

          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtapcolor,
            stroke : 25
          }), centerxy, canvas2Delem);
        } else if (touchboom.events.TAP) {
          // let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));
          // paintballrender(Object.assign({}, cfg, {
          //  paintballcolor : cfg.paintballtapcolor,
          //  stroke : 40
          // }), centerxy, canvas2Delem);
        } else if (touchboom.events.TAPTAP) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));

          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtaptapcolor,
            stroke : 34
          }), centerxy, canvas2Delem);
        }
      },

      oninertiafn : cfg => {
        let totalxy = touchboom.coordsgettotal(cfg),
            [ radx, rady ] = totalxy.map(px => (
              pixeltodegree(px, pwwindow)
            )).map(degreetoradian).reverse();

        // canvasleftscene.headgroup.rotation.x = radxy[1];
        // canvasleftscene.bodygroup.rotation.y = radxy[0];

        canvasrightscene.headgroup.rotation.x = radx;
        canvasrightscene.bodygroup.rotation.y = rady;

        paintballrender(cfg, getcentermousexy(cfg, touchboom.coordsgettotal(cfg)), canvas2Delem);
      }
    });

    // touchboom.detach(cfg, rootelem);

    (function animate () {
      // canvasleftscene.glrenderer.render(
      //  canvasleftscene.glscene, canvasleftscene.camera);
      canvasrightscene.glrenderer.render(
        canvasrightscene.glscene, canvasrightscene.camera);

      requestAnimationFrame(animate);
    }());
  });
}({
  wh : [ window.innerWidth, window.innerHeight ],
  stroke : 8,
  paintballcolor : '#aff',
  paintballtapcolor : '#fff',
  paintballtaptapcolor : '#faa',
  paintballbgcolor : '#333',

  trackballxcolor : 'rgba(255, 0,   0, 1)',
  trackballycolor : 'rgba(78,  248, 78, 1)',
  trackballzcolor : 'rgba(0,   255, 255, 1)',
  trackballfgcolor : 'rgba(232, 248, 248, 1)',
  trackballbgcolor : 'rgba(43,  51,  63,  1)'
}));
