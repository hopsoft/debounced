// All bubbling events
// SEE: https://developer.mozilla.org/en-US/docs/Web/Events

const wait = 200 // the number of milliseconds to wait
const leading = false // fire event on the leading edge of the timeout.
const trailing = true // fire event on the trailing edge of the timeout.

const nativeBubblingEventNames = [
  'DOMContentLoaded',
  'abort',
  'animationcancel',
  'animationend',
  'animationiteration',
  'animationstart',
  'auxclick',
  'change',
  'click',
  'compositionend',
  'compositionstart',
  'compositionupdate',
  'contextmenu',
  'copy',
  'cut',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'error',
  'focusin',
  'focusout',
  'fullscreenchange',
  'fullscreenerror',
  'hashchange',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'pointercancel',
  'pointerdown',
  'pointerlockchange',
  'pointerlockerror',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'popstate',
  'reset',
  'scroll',
  'select',
  'submit',
  'touchcancel',
  'touchend',
  'touchmove',
  'touchstart',
  'transitioncancel',
  'transitionend',
  'transitionrun',
  'transitionstart',
  'visibilitychange',
  'wheel'
]

export const defaultOptions = { wait, leading, trailing }

export const events = nativeBubblingEventNames.reduce((memo, name) => {
  memo[name] = { ...defaultOptions }
  return memo
}, {})
