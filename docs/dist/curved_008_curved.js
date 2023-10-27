// Filename: curved.js
// Timestamp: 2017.04.26-21:35:40 (last modified)
// Author(s): Dan Pupius (www.pupius.co.uk), Bumblehead (www.bumblehead.com)
//
// thanks to Daniel Pupius
// http://13thparallel.com/archive/bezier-curves/
//
// Bernstein Basis Function
// 1 = t + (1 - t)
//
// Bernstein Basis Function, cubed
// 1^3 = (t + (1 - t))^3
//
// Above Function, represented in terms of 1.
// » 1 = (t + (1 - t)) . (t^2 + 2t(1 - t) + (1 - t)^2)
// » 1 = t^3 + 3t^2(1 - t) + 3t(1 - t)^2 + (1 - t)^3
//
// each function
// B[1](t) = t^3
// B[2](t) = 3t^2(1 - t)
// B[3](t) = 3t(1 - t)^2
// B[4](t) = (1 - t)^3
//
// Where C is the control, and '[ ]' indicates subscript
// point = C[1]B[1](d) + C[2]B[2](d) + C[3]B[3](d) + C[4]B[4](d)
//
// change to the scripting at the link above:
// - given values are 'shifted' into a positive axis so that curves may be
//   generated when negative values are given.

export default (() => {
  const B1 = t => t * t * t,
        B2 = t => 3 * t * t * (1 - t),
        B3 = t => 3 * t * (1 - t) * (1 - t),
        B4 = t => (1 - t) * (1 - t) * (1 - t),
        
        shift = (x1, x2, min = Math.min(x1, x2)) =>
          min && -min;

  // easeStr should be a string 'end' or 'bgn'
  return (bgnCoord, endCoord, easeStr) => {
    let shiftval = shift(bgnCoord, endCoord),
        C1 = endCoord + shiftval,
        C4 = bgnCoord + shiftval,
        C2_3 = easeStr === 'end' ? C1 : C4;

    return per => 
      Math.round(
        C1 * B1(per) +
        C2_3 * B2(per) +
        C2_3 * B3(per) +
          C4 * B4(per)
      ) - shiftval;
  };
})();
