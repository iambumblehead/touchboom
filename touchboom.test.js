// Filename: touchboom.test.js  
// Timestamp: 2016.08.24-13:00:57 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

function addcommonjsmodule () {
  window.module = window.module || {exports : {}};
  window.require = name => window[name];
}

function gettouchboom (fn) {
  addcommonjsmodule();

  (function next (arr, x=0, elem) {
    x >= arr.length
      ? fn(null, window.touchboom_010_src_touchboom)
      : document.body.appendChild(getscriptelem(arr[x], () => next(arr, ++x)));
  }([
    './test/src/touchboom.js'
  ]));
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

function getscriptelem (src, fn) {
  console.log('get it');
  var script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = function () {
    console.log('load');
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

    //
    // start coords = [ xcoord, ycoord ]
    // all properties are optional
    // 
    cfg.coords = touchboom.coords([{
      bgn : 0
    }, {
      autoweight : 10,
      bgn : 0,
      min : -400,
      max : 400
    }]);

    //
    // target element must have id, used to manage delegation
    // one set of listeners are attached body and delegated
    // to touchboom functions assocated w/ element
    //
    rootelem.id = 'id-is-required';

    //
    // all event functions are optional,
    //
    //  * oneventfn, called when an event occurs
    //    'bgn', 'start', 'end', 'move', 'moveend', 'tap', 'cancel', 'over'
    //
    //  * oninertiafn, called on each 'frame' of movement before and after
    //    touch/mouse release
    //
    //  * onmovefn, called when mouse is over element
    //
    touchboom.attach(cfg, rootelem, {
      oneventfn : function (cfg, etype, e) {
        if (etype === 'moveend') {
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
      },

      oninertiafn : function (cfg, etype, e) {
        paintballrender(cfg, getcentermousexy(cfg, touchboom.coordsgettotal(cfg)), canvas2Delem);
      }
    });

    (function animate () {
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
