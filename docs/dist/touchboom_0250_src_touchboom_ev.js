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
