import events from './events'

const initializedEvents = {}

const debounce = (callback, options = {}) => {
  const { wait } = options
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      callback(...args)
    }, wait)
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

const initializeEvent = (name, options = {}) => {
  if (initializedEvents[name]) return
  initializedEvents[name] = options || {}
  const debouncedDispatch = debounce(dispatch, options)
  document.addEventListener(name, event => debouncedDispatch(event))
}

const initialize = (evts = events) => {
  console.log('init debounce', evts)
  for (const [name, options] of Object.entries(evts)) {
    initializeEvent(name, options)
  }
}

export default {
  initialize,
  initializeEvent,
  initializedEvents
}
