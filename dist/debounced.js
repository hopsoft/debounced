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
var nativeBubblingEvents = [
  "DOMContentLoaded",
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
var nativeCapturableEvents = [
  "abort",
  "blur",
  "error",
  "focus",
  "load",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "mouseenter",
  "mouseleave",
  "pointerenter",
  "pointerleave",
  "scroll"
];
var nativeDelegatableEvents = Array.from(/* @__PURE__ */ new Set([...nativeBubblingEvents, ...nativeCapturableEvents])).sort();
var nativeWindowEvents = Array.from(
  /* @__PURE__ */ new Set([
    "afterprint",
    "appinstalled",
    "beforeinstallprompt",
    "beforeprint",
    "beforeunload",
    "blur",
    "devicemotion",
    "deviceorientation",
    "deviceorientationabsolute",
    "error",
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
    "pagereveal",
    "pageshow",
    "pageswap",
    "popstate",
    "rejectionhandled",
    "resize",
    "storage",
    "unhandledrejection",
    ...nativeBubblingEvents
  ])
).sort();
var nativeEvents = Array.from(/* @__PURE__ */ new Set([...nativeDelegatableEvents, ...nativeWindowEvents])).sort();

// src/index.js
var prefix = "debounced";
var defaultOptions = {
  wait: 200,
  // ........ the number of milliseconds to wait
  leading: false,
  // ... fire event on the leading edge of the timeout
  trailing: true
  // ... fire event on the trailing edge of the timeout
};
var registeredEvents = {};
var windowRegistrations = {};
var documentRegistrations = {};
var timeouts = /* @__PURE__ */ new Map();
var dispatchDebouncedEvent = (sourceEvent, type) => {
  var _a;
  const { bubbles, cancelable, composed } = sourceEvent;
  const debouncedEvent = new CustomEvent("".concat(prefix, ":").concat(sourceEvent.type), {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, type }
  });
  (_a = sourceEvent.target) == null ? void 0 : _a.dispatchEvent(debouncedEvent);
};
var buildDebounceEventHandler = (options = {}) => {
  const { wait, leading, trailing } = __spreadValues(__spreadValues({}, defaultOptions), options);
  return (event) => {
    if (!timeouts.has(event.target)) timeouts.set(event.target, {});
    const targetTimeouts = timeouts.get(event.target);
    if (leading && !targetTimeouts[event.type]) setTimeout(() => dispatchDebouncedEvent(event, "leading"));
    clearTimeout(targetTimeouts[event.type]);
    targetTimeouts[event.type] = setTimeout(() => {
      if (trailing) dispatchDebouncedEvent(event, "trailing");
      delete targetTimeouts[event.type];
      if (Object.keys(targetTimeouts).length === 0) timeouts.delete(event.target);
    }, wait);
  };
};
var unregisterEvent = (name) => {
  const registration = registeredEvents[name];
  if (!registration) return name;
  const { handler, useCapture } = registration;
  if (documentRegistrations[name]) {
    document.removeEventListener(name, handler, useCapture || false);
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
  options.useCapture || (options.useCapture = nativeCapturableEvents.includes(name));
  options.handler = buildDebounceEventHandler(options);
  registeredEvents[name] = options;
  const isNativeDelegatableEvent = nativeDelegatableEvents.includes(name);
  const isNativeWindowEvent = nativeWindowEvents.includes(name);
  const isCustomEvent = !isNativeDelegatableEvent && !isNativeWindowEvent;
  if (isNativeDelegatableEvent || isCustomEvent) {
    document.addEventListener(name, options.handler, options.useCapture || false);
    documentRegistrations[name] = options;
  }
  if (isNativeWindowEvent || isCustomEvent) {
    window.addEventListener(name, options.handler);
    windowRegistrations[name] = options;
  }
  return { [name]: registeredEvents[name] };
};
var unregister = (eventNames = []) => {
  eventNames.forEach(unregisterEvent);
  return eventNames;
};
var register = (eventNames = [], options = {}) => {
  if (!eventNames || eventNames.length === 0) eventNames = nativeEvents;
  eventNames.forEach((name) => registerEvent(name, options));
  return Object.fromEntries(eventNames.map((name) => [name, registeredEvents[name]]));
};
var index_default = {
  initialize: register,
  register,
  unregister,
  registerEvent,
  unregisterEvent,
  get defaultBubblingEventNames() {
    return [...nativeBubblingEvents];
  },
  get defaultCapturableEventNames() {
    return [...nativeCapturableEvents];
  },
  get defaultDelegatableEventNames() {
    return [...nativeDelegatableEvents];
  },
  get defaultWindowEventNames() {
    return [...nativeWindowEvents];
  },
  get defaultEventNames() {
    return [...nativeEvents];
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
