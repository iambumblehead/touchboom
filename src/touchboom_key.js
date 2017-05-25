// Filename: touchboom_key.js  
// Timestamp: 2017.03.24-22:41:00 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const domev = require('domev'),

      touchboom_ev = require('./touchboom_ev'),
      touchboom_ctrl = require('./touchboom_ctrl'),
      touchboom_delegate = require('./touchboom_delegate');

const touchboom_key = module.exports = (o => {

  const DIR_LEFT  = 'DIR_LEFT',
        DIR_RIGHT = 'DIR_RIGHT',
        DIR_DOWN  = 'DIR_DOWN',
        DIR_UP    = 'DIR_UP';  

  o = (cfg, parentelem, fn) =>
    o.connectdelegate(cfg, parentelem, fn);

  o.getdirection = (cfg, keyCode) => {
    var dir = null;
    
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
  o.getdirectionxynum = (cfg, dir, xynum = 0) => 
    Number(dir === DIR_DOWN || dir === DIR_UP);

  // LEFT OR DOWN: -1
  // UP or RIGHT:  +1  
  o.getdirectiondirnum = (cfg, dir, dirnum = 0) =>
    Number(dir === DIR_RIGHT || dir === DIR_DOWN) ||
    -Number(dir === DIR_LEFT || dir === DIR_UP);

  o.keydown = (cfg, touchboom_ctrl, e) => {
    let dir = o.getdirection(cfg, e.keyCode),
        axisnum = o.getdirectionxynum(cfg, dir),
        dirnum = o.getdirectiondirnum(cfg, dir),
        coord = cfg.coords[axisnum],
        now = Date.now();

    if (coord && !coord.isupdatepassive)  {
      if (coord.ismove) {
        coord = touchboom_ctrl.coordset(coord, {
          total : coord.total + coord.offset,
          offset : 0
        });

        cfg.coords[axisnum] = coord;
        cfg = touchboom_ev.publish(cfg, 'interrupt', e);
      }
      coord.isupdatepassive = true;
      coord = touchboom_ctrl.coordget(coord, {
        ismove : Date.now(),
        start : 0,
        type :'key'
      });
      coord.lastdelta = 0;
      coord.dir = dirnum;
      cfg.coords[axisnum] = coord;

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
    }
  };

  o.getkeycodearrre = keycodearr =>
    new RegExp(keycodearr.join('|'));

  o.adaptkeycodere = cfg => (
    cfg.iskeyupre = o.getkeycodearrre(
      cfg.keycodeuparr || [38, 87]),
    cfg.iskeyleftre = o.getkeycodearrre(
      cfg.keycodeleftarr || [37, 65]),
    cfg.iskeyrightre = o.getkeycodearrre(
      cfg.keycoderightarr || [39, 68]),
    cfg.iskeydownre = o.getkeycodearrre(
      cfg.keycodedownarr || [40, 83]),
    cfg);

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
