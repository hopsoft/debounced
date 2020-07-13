import events from './events'

const initialized = {}

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
  if (initialized[name]) return
  initialized[name] = true
  const debouncedDispatch = debounce(dispatch, options)
  document.addEventListener(name, event => debouncedDispatch(event))
}

for (const [name, options] of Object.entries(events))
  initializeEvent(name, options)
