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

// src/index.js
var prefix = "debounced";
var defaultOptions = {
  wait: 200,
  // ........ the number of milliseconds to wait
  leading: false,
  // ... fire event on the leading edge of the timeout
  trailing: true
  // .... fire event on the trailing edge of the timeout
};
var registeredEvents = {};
var timeouts = {};
var dispatchDebouncedEvent = (sourceEvent, type) => {
  const { bubbles, cancelable, composed } = sourceEvent;
  const debouncedEvent = new CustomEvent(`${prefix}:${sourceEvent.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, type }
  });
  return setTimeout(() => sourceEvent.target.dispatchEvent(debouncedEvent));
};
var buildDebounceEventHandler = (options = {}) => {
  const { wait, leading, trailing } = __spreadValues(__spreadValues({}, defaultOptions), options);
  return (event) => {
    clearTimeout(timeouts[event.target]);
    if (leading && !timeouts[event.target])
      dispatchDebouncedEvent(event, "leading");
    timeouts[event.target] = setTimeout(() => {
      delete timeouts[event.target];
      if (trailing)
        dispatchDebouncedEvent(event, "trailing");
    }, wait);
  };
};
var unregisterEvent = (name) => {
  var _a;
  document.removeEventListener(name, (_a = registeredEvents[name]) == null ? void 0 : _a.handler);
  delete registeredEvents[name];
  return name;
};
var registerEvent = (name, options = {}) => {
  unregisterEvent(name);
  options = __spreadValues(__spreadValues({}, defaultOptions), options);
  options.handler = buildDebounceEventHandler(options);
  registeredEvents[name] = options;
  document.addEventListener(name, options.handler);
  return { [name]: registeredEvents[name] };
};
var unregister = (eventNames = []) => {
  const names = __spreadValues({}, eventNames);
  eventNames.forEach((name) => unregisterEvent(name));
  return names;
};
var register = (eventNames = [], options = {}) => {
  if (!eventNames || eventNames.length === 0)
    eventNames = nativeBubblingEventNames;
  eventNames.forEach((name) => registerEvent(name, options));
  return eventNames.reduce((memo, name) => {
    memo[name] = registeredEvents[name];
    return memo;
  }, {});
};
var src_default = {
  initialize: register,
  register,
  unregister,
  registerEvent,
  unregisterEvent,
  get defaultEventNames() {
    return [...nativeBubblingEventNames];
  },
  get defaultOptions() {
    return __spreadValues({}, defaultOptions);
  },
  get prefix() {
    return prefix;
  },
  set prefix(value) {
    prefix = value;
  },
  get registeredEvents() {
    return __spreadValues({}, registeredEvents);
  },
  get registeredEventNames() {
    return Object.keys(registeredEvents);
  }
};
export {
  src_default as default
};
