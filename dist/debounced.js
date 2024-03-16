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

// src/index.js
var prefix = "debounced";
var initializedEvents = {};
var timeouts = {};
var dispatch = (event) => {
  const { bubbles, cancelable, composed } = event;
  const debouncedEvent = new CustomEvent(`${prefix}:${event.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { originalEvent: event }
  });
  const dispatchDebouncedEvent = () => event.target.dispatchEvent(debouncedEvent);
  setTimeout(dispatchDebouncedEvent);
};
var debounce = (options = {}) => {
  const { wait: wait2, leading: leading2, trailing: trailing2 } = __spreadValues({ leading: false, trailing: true }, options);
  let timeoutId;
  return (event) => {
    clearTimeout(timeouts[event.target]);
    if (leading2)
      dispatch(event);
    timeouts[timeoutId] = setTimeout(() => {
      delete timeouts[event.target];
      if (trailing2)
        dispatch(event);
    }, wait2);
  };
};
var initializeEvent = (name, options = {}) => {
  if (initializedEvents[name])
    return;
  initializedEvents[name] = options || {};
  document.addEventListener(name, (event) => debounce(event));
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
