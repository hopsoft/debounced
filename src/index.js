import events from './events'

const initialized = {}

const debounce = (callback, wait = 250) => {
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

const initializeEvent = (name, wait = 250) => {
  if (initialized[name]) return
  initialized[name] = true
  const debouncedDispatch = debounce(dispatch, wait)
  document.addEventListener(name, event => debouncedDispatch(event))
}

for (const [name, meta] of Object.entries(events))
  initializeEvent(name, meta.wait)
