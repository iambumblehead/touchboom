touchboom
=========
[MIT-license](#license)

[![touchboom](https://github.com/iambumblehead/touchboom/raw/main/docs/img/touchboom.png)][10]

Reports inertial movement and key/touch/mouse events from the document. A reworking of the [motion scripts found here][7], courtesy of Ariya Hidayat.

Try it out by [visiting this page][10]. Try clicking, dragging and releasing.

All handlers connect to the same data, so that mouse-originated glide motions continue alongside key-originated glide motions. One set of listeners are attached to the body from which all events are delegated so that behaviour may be bound many times.

Touchboom uses the legacy property [event.keyCode][9] with keyboard up, down, left, right, wasd events.

Run npm test and load the [test page][8] to see a demo.

```javascript
//
// state is defined and mutated on cfg
//
let cfg = {};

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
//    touchboom.events
//
//  * oninertiafn, called each 'frame' of movement
//    before and after touch/mouse release
//
//  * onmovefn, called when mouse is over element
//
touchboom.attach(cfg, rootelem, {
  oneventfn : function (cfg, etype, e) {
    if (etype === 'moveend') {
      // coords stopped moving
      console.log(touchboom.coordsgettotal(cfg));
    } else if (etype === 'end') {
      // mouse or finger are disengaged
      console.log(touchboom.coordsgettotal(cfg));
    }
  },
  oninertiafn : function (cfg, etype, e) {
      // coordinates are updated
      console.log(touchboom.coordsgettotal(cfg));
  }
});
```

[0]: http://www.bumblehead.com                            "bumblehead"
[7]: https://github.com/ariya/kinetic/                       "kinetic"
[8]: https://github.com/iambumblehead/touchboom/blob/main/docs/index.js "test page"
[9]: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode#Browser_compatibility
[10]: https://iambumblehead.github.io/touchboom/


![scrounge](https://github.com/iambumblehead/scroungejs/raw/main/img/hand.png)


(The MIT License)

Copyright (c) 2016 [Bumblehead][0] <chris@bumblehead.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
