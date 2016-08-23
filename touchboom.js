// Filename: touchboom.js
// Timestamp: 2014.04.05-17:03:14 (last modified)  
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

  var NAME = 'boom';
  
  o = (cfg, parentelem, fn) => 
    o.connect(cfg, parentelem, fn);

  o.taptimethreshold = 600;
  o.taptaptimethreshold = 300;  
  o.tapmovethreshold = 40;
  o.velocitythreshold = 10;

  o.eventcancel = 'cancel';
  o.eventstart  = 'start';
  o.eventmove   = 'move';
  o.eventend    = 'end';

  o.inputdn     = NAME+'inputdn';  // date at last 'down' event
  o.trackts     = NAME+'trackts';  // date at last 'track' event

  o.offsetxy    = NAME+'offsetxy';
  o.framexy     = NAME+'framexy';
  o.inputxy     = NAME+'inputxy';  // [x, y], position at last 'move' event
  o.startxy     = NAME+'startxy';  // [x, y], position at last 'down' event  
  o.stepsxy     = NAME+'stepsxy';  // [x, y], differenced position of last 'move' and 'down' event, stepped
  o.refsxy      = NAME+'refsxy';   // [x, y], referenced position of last 'move' and 'down' event

  o.targetxy    = NAME+'targetxy';
  o.velocityxy  = NAME+'velocityxy';
  o.amplitudexy = NAME+'amplitudexy';

  o.ismove      = NAME+'ismove';   // is moving?  
  o.istap       = NAME+'istap';    // is tap event?
  o.istaptap    = NAME+'istaptap'; // is double tap event?  

  o.sumxy = (xy1, xy2) => (
    [xy1[0] + xy2[0], xy1[1] + xy2[1]]);

  o.diffxy = (xy1, xy2) => (
    [xy1[0] - xy2[0], xy1[1] - xy2[1]]);

  o.getevxy = e => (
    e && typeof e.clientX === 'number'
      ? [e.clientX, e.clientY]
      : [e.changedTouches[0].pageX, e.changedTouches[0].pageY]);
  

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
    cfg[o.inputdn] = false;

    return cfg;
  };
  
  o.inputinterrupt = (cfg, e) => {};
  o.inputmoveend = (cfg, e) => {};  

  o.inputstart = (cfg, e) => {
    if (cfg[o.ismove]) {
      clearInterval(cfg.ticker);
      //cfg = o.inputendtap(cfg, e);
      o.publish(cfg, 'interrupt', e, cfg.publishfn);
    }      
    
    o.inputreset(cfg);    

    cfg.max = typeof cfg.max === 'number' ? cfg.max : Infinity;
    cfg.min = typeof cfg.min === 'number' ? cfg.min : -Infinity;
    cfg.timeConstant = 325;    
    
    cfg[o.inputdn] = Date.now();
    cfg[o.trackts] = Date.now();
    cfg[o.ismove]  = Date.now();
    
    cfg[o.startxy]     = o.getevxy(e);
    cfg[o.refsxy]      = cfg[o.startxy];
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

  o.getvelocityxyupdated = (offsetxy, framexy, velocityxy, elapsedms) => 
    [0,1].map(xy => (
      o.getvelocityupdated(offsetxy[xy], framexy[xy], velocityxy[xy], elapsedms)));

  o.getamplitudeupdated = (velocity, amplitude, velocitythreshold) =>
    Math.abs(velocity) > velocitythreshold ? 0.8 * velocity : amplitude;

  o.getamplitudexyupdated = (velocityxy, amplitudexy, velocitythreshold) => 
    [0,1].map(xy => (
      o.getamplitudeupdated(velocityxy[xy], amplitudexy[xy], velocitythreshold)));

  o.gettargetupdated = (velocity, offset, amplitude, target) =>
    Math.abs(velocity) > 10 ? Math.round(offset + amplitude) : target;

  o.gettargetxyupdated = (velocityxy, offsetxy, amplitudexy, targetxy) =>
    [0,1].map(xy => (
      o.gettargetupdated(velocityxy[xy], offsetxy[xy], amplitudexy[xy], targetxy[xy])));

  o.inputtrack = cfg => {
    var now = Date.now(),
        elapsed = now - cfg[o.trackts];

    cfg[o.velocityxy] = o.getvelocityxyupdated(
      cfg[o.offsetxy], cfg[o.framexy], cfg[o.velocityxy], elapsed);
    cfg[o.framexy] = cfg[o.offsetxy].slice();
    cfg[o.trackts] = now;
  };

  o.movexy = (cfg, xyarr) => {
    cfg[o.offsetxy] = xyarr.map(xy => (
      xy > cfg.max ? cfg.max : (xy < cfg.min) ? cfg.min : xy));

    cfg[o.stepsxy] = cfg[o.offsetxy].map(val => -val);
  };
 
  o.isxybeyond = (xyarr, num) => 
    xyarr.some(xy => Math.abs(xy) > num);

  o.autoScroll = (cfg, e, ismovets) => {
    var elapsed,
        deltaxy,
        ismove = false;

    if (ismovets !== cfg[o.ismove]) {
      'autoScroll stopped or interrupted';
    } else {
      if (o.isxybeyond(cfg[o.amplitudexy], 0)) {
        elapsed = Date.now() - cfg[o.trackts];
        deltaxy = cfg[o.amplitudexy].map(xy => (
          -xy * Math.exp(-elapsed / cfg.timeConstant)));
        if (o.isxybeyond(deltaxy, 0.5)) {
          ismove = true;
        }
      }

      if (ismove) {
        o.movexy(cfg, o.sumxy(cfg[o.targetxy], deltaxy));
        requestAnimationFrame(e => o.autoScroll(cfg, e, ismovets));      
      } else {
        cfg[o.ismove] = ismove;
        o.publish(cfg, 'moveend', e, cfg.publishfn);
      }
    }
  };

  o.inputmove = (cfg, e) => {
    var deltaxy;

    if (cfg[o.inputdn]) {
      cfg[o.inputxy] = o.getevxy(e);

      if (!cfg[o.ismove]) {
        cfg[o.stepsxy] = o.diffxy(cfg[o.inputxy], cfg[o.startxy]);
      }
    }
    
    if (cfg[o.ismove]) {
      deltaxy = o.diffxy(cfg[o.refsxy], cfg[o.inputxy]);
      
      if (o.isxybeyond(deltaxy, 2)) {
        cfg[o.refsxy] = cfg[o.inputxy].slice();
        o.movexy(cfg, o.sumxy(cfg[o.offsetxy], deltaxy));
      }
    }
  };
  
  o.inputend = (cfg, e) => {
    cfg = o.inputendtap(cfg, e);

    clearInterval(cfg.ticker);
    if (o.isxybeyond(cfg[o.velocityxy], o.velocitythreshold)) {
      cfg[o.amplitudexy] = o.getamplitudexyupdated(
        cfg[o.velocityxy], cfg[o.amplitudexy], o.velocitythreshold);
      
      cfg[o.targetxy] = o.gettargetxyupdated(
        cfg[o.velocityxy], cfg[o.offsetxy], cfg[o.amplitudexy], cfg[o.targetxy]);
            
      cfg[o.trackts] = Date.now();
      requestAnimationFrame(e => o.autoScroll(cfg, e, cfg[o.ismove]));
    } else {
      cfg[o.ismove] = false;
    }
  };  

  o.inputcancel = (cfg, e) => {
    o.inputreset(cfg);
  };

  o.istapev = (cfg, e) => {
    var bgndate = cfg[o.inputdn];
    
    return bgndate
      && (Date.now() - bgndate < o.taptimethreshold)
      && !o.isxybeyond(cfg[o.stepsxy], o.tapmovethreshold);
  };

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
  };

  return o;
  
})({});
