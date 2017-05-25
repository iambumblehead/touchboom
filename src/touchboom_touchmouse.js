// Filename: touchboom_touchmouse.js  
// Timestamp: 2017.05.23-01:38:30 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const domev = require('domev'),
      touchboom_ev = require('./touchboom_ev'),
      touchboom_ctrl = require('./touchboom_ctrl'),
      touchboom_delegate = require('./touchboom_delegate');

const touchboom_ctrltouchmouse = module.exports = (o => {

  const TYPE = 'touchmouse',
        TAPTIMETHRESHOLD    = 200,
        TAPTAPTIMETHRESHOLD = 200,
        TAPMOVETHRESHOLD    = 10;

  o = (cfg, touchboom_ctrl, parentelem, fn) => 
    o.connectdelegate(cfg, touchboom_ctrl, parentelem, fn);

  o.istapev = (cfg, taptimetrheshold, tapmovethreshold) => 
    cfg.coords.some(c => (
      c.ismove
        && (Date.now() - c.ismove < TAPTIMETHRESHOLD)
        && (Math.abs(c.offset) < TAPMOVETHRESHOLD)));

  // will accept xy array, click object or touch object
  o.getevxy = e => (
    Array.isArray(e) ?
      e : e && typeof e.clientX === 'number'
      ? [e.clientX, e.clientY]
      : [e.changedTouches[0].pageX, e.changedTouches[0].pageY]);

  o.getelemxy = elem => {
    let rect = elem.getBoundingClientRect(),
        docelem = document.documentElement,
        win = window;

    return [
      rect.left + (win.pageXOffset || docelem.scrollLeft),
      rect.top  + (win.pageYOffset || docelem.scrollTop)
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

  o.ismouseoutparent = (e, parentelem) =>
    /mouseout/.test(e.type) && parentelem && !domev.isElem(e, parentelem);

  o.start = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);
    
    if (touchboom_ctrl.coordsismove(cfg)) {
      cfg = touchboom_ctrl.stop(cfg);
      cfg.coords = cfg.coords.map(c => (
        touchboom_ctrl.coordset(c, {
          total : c.total + c.offset,
          offset : 0
        })));
      
      cfg = touchboom_ev.publish(cfg, 'interrupt', e);
    }

    cfg.istap = false;
    cfg.istaptap = false;
    cfg.coords = cfg.coords.map((c, i) => touchboom_ctrl.coordget(c, {
      ismove : true,
      start : evarr[i],
      type : TYPE
    }));

    cfg = touchboom_ev.publish(cfg, 'start', e);
    touchboom_ctrl.start(cfg, e);
  };

  o.move = (cfg, touchboom_ctrl, e) => {
    let evarr = o.getevxy(e);    

    cfg = touchboom_ev.publish(cfg, 'move', e);

    cfg.coords = cfg.coords.map((c, i) => (
      c.type == TYPE && (c.ismove && !c.isglide)
        ? touchboom_ctrl.updatecoord(cfg, c, evarr[i]) : c));
  };

  o.over = (cfg, touchboom_ctrl, e) => {
    if (cfg.onoverfn) {
      cfg = cfg.onoverfn(cfg, 'over', e);
    }
  };  

  o.movecomplete = (cfg, touchboom_ctrl, e) => {
    if (!touchboom_ctrl.coordsismove(cfg)) {
      cfg.publishfn(cfg, 'end', e);
      return touchboom_ctrl.stop(cfg);
    }

    if (/touchend|mouseup/.test(e.type)) {
      cfg = o.endtap(cfg, e);
      if (cfg.istap) {
        cfg.publishfn(cfg, 'tap', e);
      }
    }

    if (e.type === 'mouseout' &&
        cfg.coords.some(c => c.isglide)) {
      return null;
    }

    cfg.publishfn(cfg, 'end', e);

    cfg.coords = cfg.coords.map(c => (
      c = touchboom_ctrl.coordupdate(cfg, c),
      c = touchboom_ctrl.coordmoveend(cfg, c),
      c));

    touchboom_ctrl.coordsmoveend(cfg, e);
  };

  o.movecancel = (cfg, touchboom_ctrl, e) => {
    cfg = touchboom_ev.publish(cfg, 'cancel', e);

    cfg.coords = cfg.coords.map(c => (
      touchboom_ctrl.coordset(c, {
        offset : 0
      })));

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

      touchboom_ev.lsnpub({}, body, [
        'mouseover'
      ], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
        }
      });

      touchboom_ev.lsnpub({}, body, [
        'mousedown', 'touchstart'
      ], (cfg, e) => {
        let delegatorstate = ctrldel.getelemstate(o.delegator, domev.getElemAt(e)),
            statemeta = delegatorstate && ctrldel.getstatemeta(delegatorstate);

        if (delegatorstate) {
          e.preventDefault();
          
          o.delegator = ctrldel.setmouseoverstate(o.delegator, delegatorstate);
          o.delegator = ctrldel.setactivestate(o.delegator, delegatorstate);

          o.start(statemeta, touchboom_ctrl, e);
        }
      });
      
      touchboom_ev.lsnpub({}, body, [
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

      touchboom_ev.lsnpub({}, body, [
        'mouseup', 'mouseout', 'touchend'
      ], (cfg, e) => {
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

      touchboom_ev.lsnpub({}, body, [
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

    cfg = touchboom_ctrl.onmoveend(cfg, 'touchmouse', (cfg, type, e) => {
      ctrldel.rmactivestate(o.delegator);
    });

    o.delegator = ctrldel.addelemstate(o.delegator, parentelem, cfg);

    return cfg;
  };

  return o;

})({});
