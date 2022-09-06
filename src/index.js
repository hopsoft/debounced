import events from './events'

let prefix = 'debounced'
const initializedEvents = {}

export const debounce = (fn, options = {}) => {
  const { wait } = options
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      fn(...args)
    }, wait)
  }
}

const dispatch = event => {
  const { bubbles, cancelable, composed } = event
  const debouncedEvent = new CustomEvent(`${prefix}:${event.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { originalEvent: event }
  })
  setTimeout(() => { event.target.dispatchEvent(debouncedEvent) })
}

export const initializeEvent = (name, options = {}) => {
  if (initializedEvents[name]) return
  initializedEvents[name] = options || {}
  const debouncedDispatch = debounce(dispatch, options)
  document.addEventListener(name, event => debouncedDispatch(event))
}

const initialize = (evts = events) => {
  prefix = evts.prefix || prefix
  delete evts.prefix
  for (const [name, options] of Object.entries(evts)) {
    initializeEvent(name, options)
  }
}

export default {
  debounce,
  events,
  initialize,
  initializeEvent,
  initializedEvents
}
