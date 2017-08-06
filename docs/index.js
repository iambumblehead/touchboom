// Filename: touchboom.test.js  
// Timestamp: 2017.08.05-18:07:04 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

function addcommonjsmodule () {
  window.module = window.module || {exports : {}};
  window.require = name => window[name];
}

function gettouchboom (fn) {
  addcommonjsmodule();

  (function next (arr, x=0, elem) {
    x >= arr.length
      // create build and generate demo page
      ? fn(null, window[Object.keys(window).find(key => (
          /^touchboom.*touchboom$/.test(key)))])
      : document.body.appendChild(getscriptelem(arr[x], () => next(arr, ++x)));
  }(['./dist/touchboom.js']));
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
  var script = document.createElement('script');
  script.src = src;
  script.async = false;
  script.onload = function () {
    fn(null);
  };
  return script;
}

function getwindowwh () {
  return [
    Math.floor(window.innerWidth),
    Math.floor(window.innerHeight)
  ];
}

function getwindowhalfwh () {
  return getwindowwh().map(wh => wh / 2);
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
      windowwh = getwindowwh(),
      windowhalfwh = getwindowhalfwh(),
      canvas2Delem = getcanvaselem({
        wh : windowwh,
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
      bgn : 0,

      // 'optional' properties
      min : -windowhalfwh[0],
      max : windowhalfwh[0]
    }, {
      autoweight : 10,
      bgn : 0,

      // 'optional' properties
      min : -windowhalfwh[1],
      max : windowhalfwh[1]
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
        console.log('touchboom event', etype);
        if (etype === touchboom.events.MOVEEND) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));
          
          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtapcolor,
            stroke : 25
          }), centerxy, canvas2Delem);
        } else if (touchboom.events.TAP) {
          //let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));
          //paintballrender(Object.assign({}, cfg, {
          //  paintballcolor : cfg.paintballtapcolor,
          //  stroke : 40
          //}), centerxy, canvas2Delem);
        } else if (touchboom.events.TAPTAP) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));
          
          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtaptapcolor,
            stroke : 34
          }), centerxy, canvas2Delem);
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