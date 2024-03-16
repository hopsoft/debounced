import events from './events'
import elements from './elements'

let prefix = 'debounced'
const initializedEvents = {}
const timeouts = {}

export const debounce = (callback, options = {}) => {
  const { wait, leading, trailing } = { leading: false, trailing: true, ...options }
  let timeoutId
  let leadingOccurrence = false
  let occurrenceCount = 0
  return event => {
    timeoutId = elements.uniqueId(event.target)
    occurrenceCount += 1
    leadingOccurrence = leading && occurrenceCount == 1

    if (leadingOccurrence) callback(event)

    clearTimeout(timeouts[timeoutId])
    timeouts[timeoutId] = setTimeout(() => {
      timeoutId = null
      occurrenceCount = 0
      if (trailing && !leadingOccurrence) callback(event)
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
  const dispatchDebouncedEvent = () => {
    event.target.dispatchEvent(debouncedEvent)
  }

  setTimeout(dispatchDebouncedEvent)
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
