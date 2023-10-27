const getElemAt = (e, fn = ev => null) => {
  if (typeof e === 'object' && e) {
    if ('srcElement' in e) {
      fn = ev => ev.srcElement;        
    } else if ('target' in e) {
      fn = ev => ev.target;
    }
  }

  return fn
};

const stopDefaultAt = (e, fn = ev => null) => {
  if (typeof e === 'object' && e) {
    if (typeof e.preventDefault) {
      fn = ev => (ev.preventDefault());
    } else {
      fn = ev => (ev.returnValue = false);
    }
  }
  
  return fn(e);
};

const getparentlinkelemat = (e, elem = getElemAt(e)) => (
  elem && (function getparentlink (elem) {
    return (elem && elem.tagName) && (
      /^a/i.test(elem.tagName)
        ? elem : getparentlink(elem.parentNode));
  }(elem)));

const isElem = (e, elem, evelem = getElemAt(e, elem)) => (
  elem && evelem && elem.isEqualNode(evelem));

const hasElem = (e, elem, evelem = getElemAt(e, elem)) => (
  elem && evelem && (elem.isEqualNode(evelem) ||
                     elem.contains(evelem)));

export default {
  getElemAt,
  stopDefaultAt,
  getparentlinkelemat,
  isElem,
  hasElem
}
