// Filename: touchboom_touchmouse.js
// Timestamp: 2018.01.21-21:07:44 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

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
    /mouseout/.test(e.type) && parentelem &&
      !(e.target && parentelem.isEqualNode(e.target)))

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
        let elem = e.target,
            delegatorstate = ctrldel.getelemstate(o.delegator, nodefocusable(elem));

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
        }
      });

      ctrldel.lsnpubarr(o.delegator, {}, body, [
        'mousedown', 'touchstart'
      ], (cfg, e) => {
        let elem = e.target,
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
        let elem = e.target,
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
