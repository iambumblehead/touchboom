// Filename: touchboom.test.js
// Timestamp: 2017.11.03-12:22:21 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const touchboom = require('./touchboom');

let THREE = null;

function gettouchboom (fn) {
  let threescript = '//cdnjs.cloudflare.com/ajax/libs/three.js/87/three.min.js';

  (function next (arr, x = 0) {
    return x >= arr.length
      // create build and generate demo page
      ? fn(null, { THREE } = window)
      : document.body.appendChild(getscriptelem(arr[x], () => next(arr, ++x)));
  }([
    (/http/.test(window.location.protocol)
      ? window.location.protocol : 'http:') + threescript
  ]));
}

function getrootelem () {
  return document.body;
}

function getcanvaselem (cfg) {
  let canvaselem = document.createElement('canvas'),
      [ w, h ] = cfg.wh;

  canvaselem.style.width = `${w}px`;
  canvaselem.style.height = `${h}px`;
  canvaselem.width = w;
  canvaselem.height = h;

  if (cfg.bg) {
    canvaselem.style.backgroundColor = cfg.bg;
  }

  if (cfg.className) {
    canvaselem.className = cfg.className;
  }

  return canvaselem;
}

function getscriptelem (src, fn) {
  let script = document.createElement('script');
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
  let ctx = canvas.getContext('2d');

  // ctx.clearRect(0,0,canvas.width,canvas.height);
  // ctx.save();

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
    canvas.width / 2 - cfg.stroke / 2,
    canvas.height / 2 - cfg.stroke / 2
  ];
}

function getcentermousexy (cfg, transxy) {
  return transxy
    ? [ cfg.centerxy[0] + transxy[0], cfg.centerxy[1] + transxy[1] ]
    : cfg.centerxy;
}

function paintballconnect (cfg, canvas) {
  return Object.assign(cfg, {
    centerxy : getcenterxy(cfg, canvas)
  });
}

function getsphere (cfg, opacity, radius) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 32, 32),
    new THREE.MeshBasicMaterial({
      opacity,
      transparent : true,
      color : cfg.bgcolor,
      side : THREE.BackSide
    }));
}

function getwrapcircle (opacity, color, radius) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.02, 30, 100),
    new THREE.MeshBasicMaterial({
      color,
      wireframe : true,
      opacity,
      transparent : true
    }));
}

function gettrackball (cfg) {
  let headgroup = new THREE.Group(),
      wrapcircle = getwrapcircle(0.1, cfg.xcolor, 11),
      wrapcircle_y90 = getwrapcircle(0.1, cfg.ycolor, 11),
      wrapcircle_z90 = getwrapcircle(0.1, cfg.zcolor, 11),
      eyecircle1 = getwrapcircle(0.2, cfg.fgcolor, 6),
      eyecircle2 = getwrapcircle(0.2, cfg.fgcolor, 5),
      sphere = getsphere(cfg, 0.7, 20 / 2);
  headgroup.name = 'headgroup';

  wrapcircle_y90.rotation.y = Math.PI / 2;
  wrapcircle_z90.rotation.x = Math.PI / 2;

  eyecircle1.position.set(0, 0, -8.1);
  eyecircle2.position.set(0, 0, -8.9);

  headgroup.add(sphere);
  headgroup.add(wrapcircle_y90);
  headgroup.add(wrapcircle_z90);

  headgroup.add(wrapcircle);
  headgroup.add(eyecircle1);
  headgroup.add(eyecircle2);

  return headgroup;
}

function getglrenderer (canvaselem) {
  return new THREE.WebGLRenderer({
    canvas : canvaselem,
    alpha : true,
    antialias : true
  });
}

function gettrackballscene (cfg, canvaselem) {
  let wharr = [ canvaselem.offsetWidth, canvaselem.offsetHeight ],
      glscene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(60, wharr[0] / wharr[1], 1, 10000),

      glrenderer = getglrenderer(canvaselem),
      headgroup = gettrackball(cfg),
      bodygroup = new THREE.Group(),
      scenegroup = new THREE.Group();

  bodygroup.add(headgroup);
  scenegroup.add(bodygroup);
  scenegroup.rotation.y = -THREE.Math.degToRad(90);

  glscene.add(scenegroup);

  camera.position.set(0, 0, -24);
  camera.lookAt(glscene.position);

  glscene.rotation.y += -Math.PI / 2;

  return {
    wharr,
    headgroup,
    bodygroup,
    glrenderer,
    camera,
    glscene
  };
}

// o.pixel_weightarea = ([w, h]) =>
//   180 / Math.max(w, h);

function degreetoradian (d) {
  return d * (Math.PI / 180);
}

function pixeltodegree (p, pw) {
  return p * pw;
}

function pixelweightarea (wh) {
  return 180 / Math.max(wh[0], wh[1]);
}

function pixelweight (elem) {
  return pixelweightarea(
    elem === window
      ? [ elem.innerWidth, elem.innerHeight ]
      : [ elem.clientWidth, elem.clientHeight ]);
}

function appendchild (parent, child) {
  parent.appendChild(child);

  return child;
}

(function start (cfg) {
  let rootelem = getrootelem(),
      windowwh = getwindowwh(),
      windowhalfwh = getwindowhalfwh(),
      pwwindow = pixelweight(window),
      canvas2Delem = getcanvaselem({
        wh : windowwh,
        bg : cfg.paintballbgcolor
      });

  rootelem.appendChild(canvas2Delem);

  gettouchboom(() => {
    let canvasrightscene = gettrackballscene({
      xcolor : cfg.trackballxcolor,
      ycolor : cfg.trackballycolor,
      zcolor : cfg.trackballzcolor,
      fgcolor : cfg.trackballfgcolor,
      bgcolor : cfg.trackballbgcolor
    }, appendchild(rootelem, getcanvaselem({
      wh : [ windowwh[1], windowwh[1] ],
      className : 'right'
    })));
    // canvasleftscene = gettrackballscene({
    //      xcolor : cfg.trackballxcolor,
    //      ycolor : cfg.trackballycolor,
    //      zcolor : cfg.trackballzcolor,
    //      fgcolor : cfg.trackballfgcolor,
    //      bgcolor : cfg.trackballbgcolor
    //    }, appendchild(rootelem, getcanvaselem({
    //      wh : [ windowwh[1], windowwh[1] ],
    //      className : 'left'
    //    }))),

    cfg = paintballconnect(cfg, canvas2Delem);

    //
    // start coords = [ xcoord, ycoord ]
    // all properties are optional
    //
    cfg.coords = touchboom.coords([ {
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
    } ]);

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
      oneventfn : (cfg, etype) => {
        console.log('touchboom event', etype);
        if (etype === touchboom.events.MOVEEND) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));

          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtapcolor,
            stroke : 25
          }), centerxy, canvas2Delem);
        } else if (touchboom.events.TAP) {
          // let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));
          // paintballrender(Object.assign({}, cfg, {
          //  paintballcolor : cfg.paintballtapcolor,
          //  stroke : 40
          // }), centerxy, canvas2Delem);
        } else if (touchboom.events.TAPTAP) {
          let centerxy = getcentermousexy(cfg, touchboom.coordsgettotal(cfg));

          paintballrender(Object.assign({}, cfg, {
            paintballcolor : cfg.paintballtaptapcolor,
            stroke : 34
          }), centerxy, canvas2Delem);
        }
      },

      oninertiafn : cfg => {
        let totalxy = touchboom.coordsgettotal(cfg),
            [ radx, rady ] = totalxy.map(px => (
              pixeltodegree(px, pwwindow)
            )).map(degreetoradian).reverse();

        // canvasleftscene.headgroup.rotation.x = radxy[1];
        // canvasleftscene.bodygroup.rotation.y = radxy[0];

        canvasrightscene.headgroup.rotation.x = radx;
        canvasrightscene.bodygroup.rotation.y = rady;

        paintballrender(cfg, getcentermousexy(cfg, touchboom.coordsgettotal(cfg)), canvas2Delem);
      }
    });

    (function animate () {
      // canvasleftscene.glrenderer.render(
      //  canvasleftscene.glscene, canvasleftscene.camera);
      canvasrightscene.glrenderer.render(
        canvasrightscene.glscene, canvasrightscene.camera);

      requestAnimationFrame(animate);
    }());
  });
}({
  wh : [ window.innerWidth, window.innerHeight ],
  stroke : 8,
  paintballcolor : '#aff',
  paintballtapcolor : '#fff',
  paintballtaptapcolor : '#faa',
  paintballbgcolor : '#333',

  trackballxcolor : 'rgba(255, 0,   0, 1)',
  trackballycolor : 'rgba(78,  248, 78, 1)',
  trackballzcolor : 'rgba(0,   255, 255, 1)',
  trackballfgcolor : 'rgba(232, 248, 248, 1)',
  trackballbgcolor : 'rgba(43,  51,  63,  1)'
}));
