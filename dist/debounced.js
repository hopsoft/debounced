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

// src/version.js
var version_default = "1.0.2";

// src/events.js
var nativeDelegatableEvents = [
  "DOMContentLoaded",
  "abort",
  "animationcancel",
  "animationend",
  "animationiteration",
  "animationstart",
  "auxclick",
  "beforeunload",
  "canplay",
  "canplaythrough",
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
  "durationchange",
  "emptied",
  "ended",
  "error",
  "focusin",
  "focusout",
  "fullscreenchange",
  "fullscreenerror",
  "hashchange",
  "input",
  "keydown",
  "keyup",
  "load",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "mousedown",
  "mousemove",
  "mouseout",
  "mouseover",
  "mouseup",
  "orientationchange",
  "paste",
  "pause",
  "play",
  "playing",
  "pointercancel",
  "pointerdown",
  "pointerlockchange",
  "pointerlockerror",
  "pointermove",
  "pointerout",
  "pointerover",
  "pointerup",
  "popstate",
  "progress",
  "ratechange",
  "reset",
  "resize",
  "scroll",
  "seeked",
  "seeking",
  "select",
  "stalled",
  "submit",
  "suspend",
  "timeupdate",
  "touchcancel",
  "touchend",
  "touchmove",
  "touchstart",
  "transitioncancel",
  "transitionend",
  "transitionrun",
  "transitionstart",
  "unload",
  "visibilitychange",
  "volumechange",
  "waiting",
  "wheel"
];
var nativeWindowEvents = [
  "afterprint",
  "appinstalled",
  "beforeinstallprompt",
  "beforeprint",
  "beforeunload",
  "blur",
  "devicemotion",
  "deviceorientation",
  "deviceorientationabsolute",
  "focus",
  "gamepadconnected",
  "gamepaddisconnected",
  "hashchange",
  "languagechange",
  "load",
  "message",
  "messageerror",
  "offline",
  "online",
  "pagehide",
  "pageshow",
  "pageswap",
  "popstate",
  "rejectionhandled",
  "resize",
  "scroll",
  "scrollsnapchange",
  "scrollsnapchanging",
  "storage",
  "unhandledrejection",
  "unload",
  "visibilitychange"
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
var windowRegistrations = {};
var documentRegistrations = {};
var timeouts = /* @__PURE__ */ new Map();
var dispatchDebouncedEvent = (sourceEvent, type) => {
  const { bubbles, cancelable, composed } = sourceEvent;
  const debouncedEvent = new CustomEvent("".concat(prefix, ":").concat(sourceEvent.type), {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, type }
  });
  sourceEvent.target.dispatchEvent(debouncedEvent);
};
var buildDebounceEventHandler = (options = {}) => {
  const { wait, leading, trailing } = __spreadValues(__spreadValues({}, defaultOptions), options);
  return (event) => {
    if (!timeouts.has(event.target)) timeouts.set(event.target, {});
    const elementTimeouts = timeouts.get(event.target);
    if (leading && !elementTimeouts[event.type]) setTimeout(() => dispatchDebouncedEvent(event, "leading"));
    clearTimeout(elementTimeouts[event.type]);
    elementTimeouts[event.type] = setTimeout(() => {
      if (trailing) dispatchDebouncedEvent(event, "trailing");
      delete elementTimeouts[event.type];
      for (const _ in elementTimeouts) return;
      timeouts.delete(event.target);
    }, wait);
  };
};
var unregisterEvent = (name) => {
  var _a;
  const handler = (_a = registeredEvents[name]) == null ? void 0 : _a.handler;
  if (documentRegistrations[name]) {
    document.removeEventListener(name, handler);
    delete documentRegistrations[name];
  }
  if (windowRegistrations[name]) {
    window.removeEventListener(name, handler);
    delete windowRegistrations[name];
  }
  delete registeredEvents[name];
  return name;
};
var registerEvent = (name, options = {}) => {
  unregisterEvent(name);
  options = __spreadValues(__spreadValues({}, defaultOptions), options);
  options.handler = buildDebounceEventHandler(options);
  registeredEvents[name] = options;
  const isDelegatable = nativeDelegatableEvents.includes(name);
  const isWindow = nativeWindowEvents.includes(name);
  if (isDelegatable || isWindow) {
    if (isDelegatable) {
      document.addEventListener(name, options.handler);
      documentRegistrations[name] = options;
    }
    if (isWindow) {
      window.addEventListener(name, options.handler);
      windowRegistrations[name] = options;
    }
  } else {
    document.addEventListener(name, options.handler);
    documentRegistrations[name] = options;
  }
  return { [name]: registeredEvents[name] };
};
var unregister = (eventNames = []) => {
  eventNames.forEach(unregisterEvent);
  return eventNames;
};
var register = (eventNames = [], options = {}) => {
  if (!eventNames || eventNames.length === 0) eventNames = nativeDelegatableEvents;
  eventNames.forEach((name) => registerEvent(name, options));
  return eventNames.reduce((memo, name) => {
    memo[name] = registeredEvents[name];
    return memo;
  }, {});
};
var index_default = {
  initialize: register,
  register,
  unregister,
  registerEvent,
  unregisterEvent,
  get defaultEventNames() {
    return [...nativeDelegatableEvents];
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
  },
  get version() {
    return version_default;
  }
};
export {
  index_default as default
};
