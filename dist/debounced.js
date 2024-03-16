var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// src/events.js
var wait = 200;
var leading = false;
var trailing = true;
var events_default = {
  DOMContentLoaded: { wait, leading, trailing },
  abort: { wait, leading, trailing },
  animationcancel: { wait, leading, trailing },
  animationend: { wait, leading, trailing },
  animationiteration: { wait, leading, trailing },
  animationstart: { wait, leading, trailing },
  auxclick: { wait, leading, trailing },
  change: { wait, leading, trailing },
  click: { wait, leading, trailing },
  compositionend: { wait, leading, trailing },
  compositionstart: { wait, leading, trailing },
  compositionupdate: { wait, leading, trailing },
  contextmenu: { wait, leading, trailing },
  copy: { wait, leading, trailing },
  cut: { wait, leading, trailing },
  dblclick: { wait, leading, trailing },
  drag: { wait, leading, trailing },
  dragend: { wait, leading, trailing },
  dragenter: { wait, leading, trailing },
  dragleave: { wait, leading, trailing },
  dragover: { wait, leading, trailing },
  dragstart: { wait, leading, trailing },
  drop: { wait, leading, trailing },
  error: { wait, leading, trailing },
  focusin: { wait, leading, trailing },
  focusout: { wait, leading, trailing },
  fullscreenchange: { wait, leading, trailing },
  fullscreenerror: { wait, leading, trailing },
  hashchange: { wait, leading, trailing },
  input: { wait, leading, trailing },
  keydown: { wait, leading, trailing },
  keyup: { wait, leading, trailing },
  mousedown: { wait, leading, trailing },
  mousemove: { wait, leading, trailing },
  mouseout: { wait, leading, trailing },
  mouseover: { wait, leading, trailing },
  mouseup: { wait, leading, trailing },
  paste: { wait, leading, trailing },
  pointercancel: { wait, leading, trailing },
  pointerdown: { wait, leading, trailing },
  pointerlockchange: { wait, leading, trailing },
  pointerlockerror: { wait, leading, trailing },
  pointermove: { wait, leading, trailing },
  pointerout: { wait, leading, trailing },
  pointerover: { wait, leading, trailing },
  pointerup: { wait, leading, trailing },
  popstate: { wait, leading, trailing },
  reset: { wait, leading, trailing },
  scroll: { wait, leading, trailing },
  select: { wait, leading, trailing },
  submit: { wait, leading, trailing },
  touchcancel: { wait, leading, trailing },
  touchend: { wait, leading, trailing },
  touchmove: { wait, leading, trailing },
  touchstart: { wait, leading, trailing },
  transitioncancel: { wait, leading, trailing },
  transitionend: { wait, leading, trailing },
  transitionrun: { wait, leading, trailing },
  transitionstart: { wait, leading, trailing },
  visibilitychange: { wait, leading, trailing },
  wheel: { wait, leading, trailing }
};

// src/elements.js
function uniqueId(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE)
    return element == null ? void 0 : element.nodeName;
  if (element.id && document.querySelectorAll(`#${element.id}`).length === 1)
    return element.id;
  const treeWalker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, null, false);
  let currentNode = null;
  let index = 0;
  while (currentNode !== element) {
    currentNode = treeWalker.nextNode();
    index++;
  }
  return `${element.nodeName.toLowerCase()}-${index}`;
}
var elements_default = { uniqueId };

// src/index.js
var prefix = "debounced";
var initializedEvents = {};
var timeouts = {};
var debounce = (callback, options = {}) => {
  const { wait: wait2, leading: leading2, trailing: trailing2 } = __spreadValues({ leading: false, trailing: true }, options);
  let timeoutId;
  let leadingOccurrence = false;
  let occurrenceCount = 0;
  return (event) => {
    timeoutId = elements_default.uniqueId(event.target);
    occurrenceCount += 1;
    leadingOccurrence = leading2 && occurrenceCount == 1;
    if (leadingOccurrence)
      callback(event);
    clearTimeout(timeouts[timeoutId]);
    timeouts[timeoutId] = setTimeout(() => {
      timeoutId = null;
      occurrenceCount = 0;
      if (trailing2 && !leadingOccurrence)
        callback(event);
    }, wait2);
  };
};
var dispatch = (event) => {
  const { bubbles, cancelable, composed } = event;
  const debouncedEvent = new CustomEvent(`${prefix}:${event.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { originalEvent: event }
  });
  const dispatchDebouncedEvent = () => {
    event.target.dispatchEvent(debouncedEvent);
  };
  setTimeout(dispatchDebouncedEvent);
};
var initializeEvent = (name, options = {}) => {
  if (initializedEvents[name])
    return;
  initializedEvents[name] = options || {};
  const debouncedDispatch = debounce(dispatch, options);
  document.addEventListener(name, (event) => debouncedDispatch(event));
};
var initialize = (evts = events_default) => {
  prefix = evts.prefix || prefix;
  delete evts.prefix;
  for (const [name, options] of Object.entries(evts)) {
    initializeEvent(name, options);
  }
};
var src_default = {
  debounce,
  events: events_default,
  initialize,
  initializeEvent,
  initializedEvents
};
export {
  debounce,
  src_default as default,
  initializeEvent
};
