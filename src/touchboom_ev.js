// Filename: touchboom_ev.js  
// Timestamp: 2017.03.16-15:44:41 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

var touchboom_ev = module.exports = (o => {
  
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
