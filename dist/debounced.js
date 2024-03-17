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
var nativeBubblingEventNames = [
  "DOMContentLoaded",
  "abort",
  "animationcancel",
  "animationend",
  "animationiteration",
  "animationstart",
  "auxclick",
  "change",
  "click",
  "compositionend",
  "compositionstart",
  "compositionupdate",
  "contextmenu",
  "copy",
  "cut",
  "dblclick",
  "drag",
  "dragend",
  "dragenter",
  "dragleave",
  "dragover",
  "dragstart",
  "drop",
  "error",
  "focusin",
  "focusout",
  "fullscreenchange",
  "fullscreenerror",
  "hashchange",
  "input",
  "keydown",
  "keyup",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "paste",
  "pointercancel",
  "pointerdown",
  "pointerlockchange",
  "pointerlockerror",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "popstate",
  "reset",
  "scroll",
  "select",
  "submit",
  "touchcancel",
  "touchend",
  "touchmove",
  "touchstart",
  "transitioncancel",
  "transitionend",
  "transitionrun",
  "transitionstart",
  "visibilitychange",
  "wheel"
];
var defaultOptions = { wait, leading, trailing };
var events = nativeBubblingEventNames.reduce((memo, name) => {
  memo[name] = __spreadValues({}, defaultOptions);
  return memo;
}, {});

// src/index.js
var prefix = "debounced";
var registeredEvents = {};
var timeouts = {};
var dispatchDebouncedEvent = (sourceEvent) => {
  const { bubbles, cancelable, composed } = sourceEvent;
  const debouncedEvent = new CustomEvent(`${prefix}:${sourceEvent.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, originalEvent: sourceEvent }
    // NOTE: renamed originalEvent to sourceEvent (originalEvent is deprecated)
  });
  return setTimeout(() => sourceEvent.target.dispatchEvent(debouncedEvent));
};
var buildDebounceEventHandler = (options = {}) => {
  const { wait: wait2, leading: leading2, trailing: trailing2 } = __spreadValues(__spreadValues({}, defaultOptions), options);
  return (event) => {
    clearTimeout(timeouts[event.target]);
    if (leading2 && !timeouts[event.target])
      dispatchDebouncedEvent(event);
    timeouts[event.target] = setTimeout(() => {
      delete timeouts[event.target];
      if (trailing2)
        dispatchDebouncedEvent(event);
    }, wait2);
  };
};
var registerEvent = (name, options = {}) => {
  if (registeredEvents[name])
    return;
  registeredEvents[name] = __spreadValues(__spreadValues({}, defaultOptions), options);
  document.addEventListener(name, (event) => buildDebounceEventHandler(event));
};
var initialize = (evts = events) => {
  prefix = evts.prefix || prefix;
  delete evts.prefix;
  for (const [name, options] of Object.entries(evts))
    registerEvent(name, options);
};
var src_default = {
  initialize,
  registerEvent,
  get registeredEvents() {
    return __spreadValues({}, registeredEvents);
  }
};
export {
  src_default as default
};
