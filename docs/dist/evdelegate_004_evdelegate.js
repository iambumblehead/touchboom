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
