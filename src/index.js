import events from './events'

let prefix = 'debounced'
const initializedEvents = {}
/**
 * Mapping of target id to their associated timeout ids
 * @type {Object.<string, number>}
 */
const timeoutIds = {}
let idGenerator = 0

export const debounce = (fn, options = {}) => {
  const { wait, leading, trailing } = { leading: false, trailing: true, ...options }
  let timeoutId
  let leadingOccurrence = false
  let occurrenceCount = 0
  return (...args) => {
    occurrenceCount += 1
    leadingOccurrence = leading && occurrenceCount == 1

    if (leadingOccurrence) fn(...args)

    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      timeoutId = null
      occurrenceCount = 0
      if (trailing && !leadingOccurrence) fn(...args)
    }, wait)
  }
}

/**
 * Get the id of the element or generate one if it doesn't exist
 * @param element {HTMLElement}
 * @param attributeKey {string}
 * @returns {string}
 */
const getOrGenerateId = (element, attributeKey) => {
  let id = element.getAttribute(attributeKey)
  if (!id) {
    id = idGenerator++
    element.setAttribute(attributeKey, id.toString())
  }
  return id
}

export const debounceEvent = (fn, options = {}) => {
  const { wait, leading, trailing } = { leading: false, trailing: true, ...options }
  let leadingOccurrence = false
  let occurrenceCount = 0
  return event => {
    occurrenceCount += 1
    leadingOccurrence = leading && occurrenceCount == 1
    if (leadingOccurrence) fn(event)
    const target = event.target
    const key = `${prefix}-id`
    const targetId = target ? getOrGenerateId(target, key) : 'no-target'
    const timeoutId = timeoutIds[targetId]
    clearTimeout(timeoutId)
    timeoutIds[targetId] = setTimeout(() => {
      delete timeoutIds[targetId]
      if (trailing && !leadingOccurrence) fn(event)
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
    event.target.dispatchEvent(debouncedEvent);
  };

  setTimeout(dispatchDebouncedEvent)
}

export const initializeEvent = (name, options = {}) => {
  if (initializedEvents[name]) return
  initializedEvents[name] = options || {}
  const debouncedDispatch = debounceEvent(dispatch, options)
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
