// Filename: touchboom.js
// Timestamp: 2016.08.24-15:36:51 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
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

var touchboom = module.exports = (o => {

  const NAME  = 'boom',
        XYARR = [0,1],
        INF   = Infinity;

  
  o = (cfg, parentelem, fn) => 
    o.connect(cfg, parentelem, fn);

  o.taptimethreshold    = 600;
  o.taptaptimethreshold = 300;  
  o.tapmovethreshold    = 40;
  o.velocitythreshold   = 10;

  o.eventcancel = 'cancel';
  o.eventstart  = 'start';
  o.eventmove   = 'move';
  o.eventend    = 'end';

  o.trackxyts   = NAME+'trackts';    // date at last 'track' event
  o.inputdnxy   = NAME+'inputdnxy';  // date at last 'down' event
  
  o.totalxy     = NAME+'totalxy';
  o.offsetxy    = NAME+'offsetxy';
  o.framexy     = NAME+'framexy';
  o.inputxy     = NAME+'inputxy';  // [x, y], position at last 'move' event
  o.startxy     = NAME+'startxy';  // [x, y], position at last 'down' event  
  o.stepsxy     = NAME+'stepsxy';  // [x, y], differenced position of last 'move' and 'down' event, stepped
  o.refsxy      = NAME+'refsxy';   // [x, y], referenced position of last 'move' and 'down' event
  o.ismovexy    = NAME+'ismovexy'; // is x moving? is y moving?
  o.minxy       = NAME+'minxy';
  o.maxxy       = NAME+'maxxy';

  o.targetxy    = NAME+'targetxy';
  o.velocityxy  = NAME+'velocityxy';
  o.amplitudexy = NAME+'amplitudexy';

  o.istap       = NAME+'istap';    // is tap event?
  o.istaptap    = NAME+'istaptap'; // is double tap event?  

  o.sumxy = (xy1, xy2) => (
    [xy1[0] + xy2[0], xy1[1] + xy2[1]]);

  o.diffxy = (xy1, xy2) => (
    [xy1[0] - xy2[0], xy1[1] - xy2[1]]);

  // will accept xy array, click object or touch object
  o.getevxy = e => (
    Array.isArray(e) ?
      e : e && typeof e.clientX === 'number'
      ? [e.clientX, e.clientY]
      : [e.changedTouches[0].pageX, e.changedTouches[0].pageY]);

  o.ismove = cfg =>
    cfg[o.ismovexy] &&
    (cfg[o.ismovexy][0] ||
     cfg[o.ismovexy][1]);
  
  o.inputreset = cfg => {
    cfg[o.istap] = false;
    cfg[o.istaptap] = false;
    cfg[o.stepsxy] = [0,0];
    clearInterval(cfg.ticker);
  };

  o.inputendtap = (cfg, e) => {
    cfg[o.istaptap] =
      cfg[o.tapts] && (Date.now() - cfg[o.tapts] < o.taptaptimethreshold)
      && o.istapev(cfg, e);
      
    cfg[o.istap] = o.istapev(cfg, e);
    cfg[o.tapts] = cfg[o.istap] && Date.now();
    cfg[o.inputdnxy] = [false, false];

    return cfg;
  };

  o.updatetotal = (cfg) => {
    cfg[o.totalxy] = o.diffxy(cfg[o.totalxy], cfg[o.stepsxy]);

    
    return cfg;
  };
  
  o.inputinterrupt = (cfg, e) => {
    o.updatetotal(cfg);
  };
  
  o.inputmoveend = (cfg, e) => {
    o.updatetotal(cfg);
  };  

  o.inputstart = (cfg, e) => {
    var now = Date.now();
    
    if (cfg[o.ismovexy] &&
        (cfg[o.ismovexy][0] ||
         cfg[o.ismovexy][1])) {
      clearInterval(cfg.ticker);
      o.publish(cfg, 'interrupt', e, cfg.publishfn);
    }      
    
    o.inputreset(cfg);    

    cfg[o.minxy] = cfg.minxy || [-INF, -INF];
    cfg[o.maxxy] = cfg.maxxy || [INF, INF];
    cfg.timeConstant = 325;    
    
    cfg[o.inputdnxy]   = [now, now];
    cfg[o.trackxyts]   = [now, now];
    cfg[o.ismovexy]    = [now, now];
    
    cfg[o.startxy]     = o.getevxy(e);
    cfg[o.refsxy]      = cfg[o.startxy];
    cfg[o.totalxy]     = cfg[o.totalxy] || [0,0];
    cfg[o.offsetxy]    = [0,0];        
    cfg[o.targetxy]    = [0,0];    
    cfg[o.velocityxy]  = [0,0];
    cfg[o.amplitudexy] = [0,0];    
    cfg[o.framexy]     = [0,0];    
    
    cfg.ticker = setInterval(e => o.inputtrack(cfg), 100);
  };
  
  o.getvelocityupdated = (offset, frame, velocity, elapsedms) => (
    0.8 * (
      1000 * (             // velocity
        offset - frame     // delta
      ) / (1 + elapsedms)) + 0.2 * velocity
  );

  o.getvelocityxyupdated = (offsetxy, framexy, velocityxy, elapsedxyms) => 
    [0,1].map(xy => (
      o.getvelocityupdated(offsetxy[xy], framexy[xy], velocityxy[xy], elapsedxyms[xy])));

  o.getamplitudeupdated = (velocity, amplitude, velocitythreshold) =>
     Math.abs(velocity) > velocitythreshold ? 0.8 * velocity : amplitude;

  o.getamplitudexyupdated = (velocityxy, amplitudexy, velocitythreshold) => 
    [0,1].map(xy => (
      o.getamplitudeupdated(velocityxy[xy], amplitudexy[xy], velocitythreshold)));

  o.gettargetupdated = (velocity, offset, amplitude, target) =>
    Math.abs(velocity) > 10 ? Math.round(offset + amplitude) : offset;

  o.gettargetxyupdated = (velocityxy, offsetxy, amplitudexy, targetxy) =>
    [0,1].map(xy => (
      o.gettargetupdated(velocityxy[xy], offsetxy[xy], amplitudexy[xy], targetxy[xy])));

  o.inputtrack = cfg => {
    var now = Date.now(),
        elapsedxy = o.diffxy([now, now], cfg[o.trackxyts]);

    cfg[o.velocityxy] = o.getvelocityxyupdated(
      cfg[o.offsetxy], cfg[o.framexy], cfg[o.velocityxy], elapsedxy);
    cfg[o.framexy] = cfg[o.offsetxy].slice();
    cfg[o.trackxyts] = [now, now];

    return cfg;
  };

  // xy,   total, max,  min
  // 40,   100,   0,    100   => 0
  // 40,   80,    0,    100   => 20
  // 40,   20,    0,    100   => 40
  // 3,    -100,  -100, 100   => 0
  // -491, 0,     -100, 100   => -100
  o.getoffset = (cfg, xy, totalxy, minxy, maxxy) => (
    console.log(xy, totalxy, minxy, maxxy),
    xy > 0 ? ((totalxy + xy <= maxxy)
              ? xy : totalxy >= maxxy ? 0 : maxxy - totalxy)
    : ((totalxy + xy >= minxy)
       ? xy : totalxy <= minxy ? 0 : minxy - totalxy));

  o.getoffsetxy = (cfg, xyarr, totalxy, minxy, maxxy) =>
    XYARR.map(xy => (
      o.getoffset(cfg, xyarr[xy], totalxy[xy], minxy[xy], maxxy[xy])));

  o.movexy = (cfg, xyarr) => {
    cfg[o.offsetxy] = o.getoffsetxy(cfg, xyarr, cfg[o.totalxy], cfg[o.minxy], cfg[o.maxxy]);
    cfg[o.stepsxy] = cfg[o.offsetxy].map(val => -val);
  };
 
  o.isxybeyond = (xyarr, num) => 
    xyarr.some(xy => Math.abs(xy) > num);

  o.autoScroll = (cfg, e, ismovexyts, targetxy) => {
    var elapsedxy,
        deltaxy,
        now = Date.now(),
        ismove = false;

    if (ismovexyts[0] !== cfg[o.ismovexy][0] ||
        ismovexyts[1] !== cfg[o.ismovexy][1]) {
      'autoScroll stopped or interrupted';
    } else {
      if (o.isxybeyond(cfg[o.amplitudexy], 0)) {
        elapsedxy = o.diffxy([now, now], cfg[o.trackxyts]);
        deltaxy = XYARR.map(xy => (
          -cfg[o.amplitudexy][xy] * Math.exp(-elapsedxy[xy] / cfg.timeConstant)));
        if (o.isxybeyond(deltaxy, 0.5)) {
          ismove = true;
        }
      }

      if (ismove) {
        o.movexy(cfg, o.sumxy(targetxy, deltaxy));
        requestAnimationFrame(e => o.autoScroll(cfg, e, ismovexyts, targetxy));      
      } else {
        cfg[o.ismovexy] = [ismove, ismove];
        o.publish(cfg, 'moveend', e, cfg.publishfn);
      }
    }
  };

  o.inputmove = (cfg, e) => {
    var deltaxy;


    if (cfg[o.inputdnxy][0] ||
        cfg[o.inputdnxy][1]) {
      cfg[o.inputxy] = o.getevxy(e);

      if (!cfg[o.ismovexy][0] &&
          !cfg[o.ismovexy][1]) {
        cfg[o.stepsxy] = o.diffxy(cfg[o.inputxy], cfg[o.startxy]);
      }
      
      if (cfg[o.ismovexy][0] ||
          cfg[o.ismovexy][1]) {
        
        deltaxy = o.diffxy(cfg[o.refsxy], cfg[o.inputxy]);
        
        if (o.isxybeyond(deltaxy, 2)) {
          cfg[o.refsxy] = cfg[o.inputxy].slice();
          o.movexy(cfg, o.sumxy(cfg[o.offsetxy], deltaxy));
        }
      }
    }      
  };

  // need to end a single input...
  o.inputend = (cfg, e) => {
    cfg = o.inputtrack(cfg);
    cfg = o.inputendtap(cfg, e);

    clearInterval(cfg.ticker);

    if (o.isxybeyond(cfg[o.velocityxy], o.velocitythreshold)) {
      cfg[o.amplitudexy] = o.getamplitudexyupdated(
        cfg[o.velocityxy], cfg[o.amplitudexy], o.velocitythreshold);
      
      cfg[o.targetxy] = o.gettargetxyupdated(
        cfg[o.velocityxy], cfg[o.offsetxy], cfg[o.amplitudexy], cfg[o.targetxy]);

      requestAnimationFrame(e => o.autoScroll(cfg, e, cfg[o.ismovexy], cfg[o.targetxy]));
    } else {

      cfg[o.ismovexy] = [false, false];
      o.publish(cfg, 'moveend', e, cfg.publishfn);
    }
  };

  o.inputxend = (cfg, e) => {
    
  };

  o.inputcancel = (cfg, e) => {
    o.inputreset(cfg);
  };

  o.istapev = (cfg, e) => {
    var bgndate = cfg[o.inputdnxy][0];
    
    return bgndate
      && (Date.now() - bgndate < o.taptimethreshold)
      && !o.isxybeyond(cfg[o.stepsxy], o.tapmovethreshold);
  };

  o.getstepsxy = (cfg, datets) => 
    cfg[o.stepsxy];
  
  o.publish = (cfg, etype, e, fn) => {
    o['input' + etype](cfg, e);
    
    fn(cfg, etype, e);
  };

  o.lsnarr = (evarr, elem, fn) => 
    evarr.map(e => elem.addEventListener(e, fn));

  o.lsnpub = (cfg, elem, evarr, etype, fn) => 
    o.lsnarr(evarr, elem, e => o.publish(cfg, etype, e, fn));
  
  o.connect = (cfg, parentelem, fn) => {
    o.lsnpub(cfg, parentelem, ['mouseout', 'touchcancel'], o.eventcancel, fn);
    o.lsnpub(cfg, parentelem, ['mousedown', 'touchstart'], o.eventstart, fn);
    o.lsnpub(cfg, parentelem, ['mousemove', 'touchmove'], o.eventmove, fn);
    o.lsnpub(cfg, parentelem, ['mouseup', 'touchend'], o.eventend, fn);

    cfg.publishfn = fn;

    window._cfg = cfg;

    return cfg;
  };

  return o;
  
})({});
