
function addcommonjsmodule () {
  window.module = window.module || {exports : {}};
}

function gettouchboom (fn) {
  addcommonjsmodule();

  document.body.appendChild(gettouchboomscriptelem(function () {
    fn(null, window.touchboom);
  }));
}

function getrootelem () {
  return document.body;
}

function getcanvaselem (cfg) {
  var canvaselem = document.createElement('canvas');
  
  canvaselem.style.width = cfg.wh[0] + 'px';
  canvaselem.style.height = cfg.wh[1] + 'px';
  canvaselem.width = cfg.wh[0];
  canvaselem.height = cfg.wh[1];
  canvaselem.style.backgroundColor = cfg.bg;

  return canvaselem;
}

function gettouchboomscriptelem (fn) {
  var script = document.createElement('script');
  script.src = '../touchboom.js';
  script.async = false;
  script.onload = function () {
    fn(null);
  };
  return script;
}

function getwindowhalfwh () {
  return [
    Math.floor(window.innerWidth),
    Math.floor(window.innerHeight)
  ];
}

function paintballrender (cfg, xyr, canvas) {
  var ctx = canvas.getContext('2d');
  
  //ctx.clearRect(0,0,canvas.width,canvas.height);
  //ctx.save();

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
    canvas.width/2 - cfg.stroke/2,
    canvas.height/2 - cfg.stroke/2
  ];
}

// new location?
function getcentermousexy (cfg, transxy) {
  return transxy
    ? [cfg.centerxy[0] + transxy[0],
       cfg.centerxy[1] + transxy[1]]
    : cfg.centerxy;
}

function paintballconnect (cfg, canvas) {
  return Object.assign(cfg, {
    centerxy : getcenterxy(cfg, canvas)
  });
}

(function start(cfg) {
  var rootelem = getrootelem(),
      canvas2Delem = getcanvaselem({
        wh : getwindowhalfwh(),
        bg : cfg.paintballbgcolor
      });

  rootelem.appendChild(canvas2Delem);
  
  gettouchboom(function (err, touchboom) {

    cfg = paintballconnect(cfg, canvas2Delem);

    touchboom(cfg, rootelem, function (cfg, etype, e) {
      if (etype === 'interrupt' ||
          etype === 'moveend') {
        cfg.centerxy = getcentermousexy(cfg, cfg.boomstepsxy);
        
        paintballrender(Object.assign({}, cfg, {
          paintballcolor : cfg.paintballtapcolor,
          stroke : 25
        }), cfg.centerxy, canvas2Delem);
      } else if (etype === 'end') {
        if (cfg.boomistaptap) {
          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtapcolor,
            stroke : 40
          }), cfg.centerxy, canvas2Delem);        
        } else if (cfg.boomistap) {
          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtaptapcolor,
            stroke : 34
          }), touchboom.sumxy(cfg.centerxy, cfg.boomstepsxy), canvas2Delem);
        }

      }
    });

    (function animate () {
      if (cfg.boomismove) {
        paintballrender(cfg, getcentermousexy(cfg, cfg.boomstepsxy), canvas2Delem);
      }
      
      requestAnimationFrame(animate);
    }());
    
  });
}({
  wh : [window.innerWidth, window.innerHeight],
  stroke : 8,
  paintballcolor    : '#aff',
  paintballtapcolor : '#fff',
  paintballtaptapcolor : '#faa',  
  paintballbgcolor  : '#333'
}));
