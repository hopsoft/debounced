import events from './events'

let prefix = 'debounced'
const initializedEvents = {}
const timeouts = {}

// event dispatcher used by all debounced events
const dispatch = event => {
  const { bubbles, cancelable, composed } = event
  const debouncedEvent = new CustomEvent(`${prefix}:${event.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { originalEvent: event }
  })
  const dispatchDebouncedEvent = () => event.target.dispatchEvent(debouncedEvent)
  setTimeout(dispatchDebouncedEvent)
}

// creates an event handler that debounces standard DOM events
export const debounce = (options = {}) => {
  const { wait, leading, trailing } = { leading: false, trailing: true, ...options }
  let timeoutId

  return event => {
    clearTimeout(timeouts[event.target])

    if (leading) dispatch(event) // fire leading

    timeouts[timeoutId] = setTimeout(() => {
      delete timeouts[event.target]
      if (trailing) dispatch(event) // fire trailing
    }, wait)
  }
}

export const initializeEvent = (name, options = {}) => {
  if (initializedEvents[name]) return
  initializedEvents[name] = options || {}
  document.addEventListener(name, event => debounce(event))
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
