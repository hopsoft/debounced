const events = [
  'change',
  'auxclick',
  'click',
  'contextmenu',
  'dblclick',
  'input',
  'keydown',
  'keyup',
  'mousedown',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'select',
  'wheel'
]
const initialized = {}

const debounce = (callback, delay = 250) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      callback(...args)
    }, delay)
  }
}

const dispatch = event => {
  const { bubbles, cancelable, composed } = event
  const debouncedEvent = new CustomEvent(`debounced:${event.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { originalEvent: event }
  })
  setTimeout(event.target.dispatchEvent(debouncedEvent))
}

const initializeEvent = (name, delay = 250) => {
  if (initialized[name]) return
  initialized[name] = true
  const debouncedDispatch = debounce(dispatch, delay)
  document.addEventListener(name, event => debouncedDispatch(event))
}

events.forEach(name => initializeEvent(name))
