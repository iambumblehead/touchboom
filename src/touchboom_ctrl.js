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

const touchboom_ev = require('./touchboom_ev'),
      curved = require('curved');

module.exports = (o => {

  const VELOCITYTHRESHOLD = 10,
        TIMECONST = 325,
        INF       = Infinity;
  
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
    INTERRUPT : 'interrupt',
    CANCEL    : 'cancel',
    KEYSTART  : 'keystart',
    KEYEND    : 'keyend',
    MOVE      : 'move',
    MOVEEND   : 'moveend',
    OVER      : 'over',
    START     : 'start',
    END       : 'end',
    TAP       : 'tap',
    TAPTAP    : 'taptap'
  },

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

  o.coords = (cfgcoords = [{},{}]) => 
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
    
    c.min = o.firstnum([c.min, coorddef.min, -INF]);
    c.max = o.firstnum([c.max, coorddef.max, INF]);

    // allow changes outside controls to affect ismin and ismax behaviour
    c.getmin = c.getmin || ((cfg, c) => c.min);
    c.getmax = c.getmax || ((cfg, c) => c.max);

    c.trackts = now;
    
    // glide coordinates are auto-updated with fixed target and amplitude
    // non-glide coordinates continually updated w/ new target and amplitude
    // isglide defined w/ timestamp of glide initialisation
    c.isglide  = Boolean(coorddef.isglide) && now;
    
    // ismove is timestamp of move initialiszation
    c.ismove   = Boolean(coorddef.ismove) && now;
    c.startpos  = +coorddef.start;
    c.lastpos   = +coorddef.start;

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
    c.offset    = 0;        
    c.target    = 0;
    c.velocity  = 0;
    c.amplitude = 0;
    c.frame     = 0;
    c.offset     = 0;
    c.type      = coorddef.type || c.type;

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
    cfg.ticker = setInterval(e => o.coordsupdate(cfg), 100),
    o.coordsmovestart(cfg, e),
    cfg);
  
  o.getdeltacurve = ((maxms, curve) => {
    maxms = 1000;
    curve = curved(3, 10, 'bgn');
    
    return (c, timestart, timenow) => {
      const timediff = (timenow - timestart) / maxms;

      return (c.autoweight
       ? curved(c.autoweight * .2, c.autoweight, 'bgn')
       : curve)(timediff > 1 ? 1 : timediff);
    };
  })();  
  
  o.getvelocityupdated = (offset, frame, velocity, elapsedms) => (
    0.4 * (//0.8 * (
      1000 * (             // velocity
        offset - frame     // delta
      ) / (1 + elapsedms)) + 0.2 * velocity
  );

  o.getamplitudeupdated = (velocity, amplitude, velocitythreshold) =>
    Math.abs(velocity) > velocitythreshold ? 0.8 * velocity : amplitude;

  o.gettargetupdated = (velocity, offset, amplitude, target) =>
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
      frame    : c.offset,
      trackts  : date
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
  //o.coordset(c, {
  //  ismove : false,
  //  total : c.total + c.offset,
  //  offset : 0          
  //});
    
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
