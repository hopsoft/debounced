import version from './version'
import { nativeBubblingEventNames } from './events'

let prefix = 'debounced'

const defaultOptions = {
  wait: 200, // ........ the number of milliseconds to wait
  leading: false, // ... fire event on the leading edge of the timeout
  trailing: true // .... fire event on the trailing edge of the timeout
}

const registeredEvents = {}
const timeouts = {}

//
/**
 * Event dispatcher used to trigger all custom debounced events.
 * @param {Event} sourceEvent - The original native event being debounced
 * @param {String} type - The type of debounced event (leading, trailing)
 */
const dispatchDebouncedEvent = (sourceEvent, type) => {
  const { bubbles, cancelable, composed } = sourceEvent
  const debouncedEvent = new CustomEvent(`${prefix}:${sourceEvent.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, type }
  })
  sourceEvent.target.dispatchEvent(debouncedEvent)
}

/**
 * Builds an event handler for the sourceEvent that dispatches the debounced event(s).
 * @param {Object} options - Debounce options
 * @param {Number} options.wait - Milliseconds to wait before dispatching the trailing debounced event
 * @param {Boolean} options.leading - Whether or not to dispatch a debounced event BEFORE the sourceEvent
 * @param {Boolean} options.trailing - Whether or not to dispatch a debounced event AFTER the sourceEvent
 * @returns {Function} - Event handler that dispatches the debounced event(s)
 */
const buildDebounceEventHandler = (options = {}) => {
  const { wait, leading, trailing } = { ...defaultOptions, ...options }
  return event => {
    const key = [event.type, event.target]

    // NOTE: Both leading and trailing debounced events are executed on the next tick of the event loop
    //       This allows the sourceEvent and its handlers to complete before the debounced event is dispatched

    // dispatch leading debounced event
    if (leading && !timeouts[key]) setTimeout(() => dispatchDebouncedEvent(event, 'leading'))

    clearTimeout(timeouts[key]) // reset timeout

    // NOTE: setTimeout returns a positive integer
    // SEE: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#return_value
    timeouts[key] = setTimeout(() => {
      // dispatch trailing debounced event
      if (trailing) dispatchDebouncedEvent(event, 'trailing')

      delete timeouts[key] // cleanup
    }, wait)
  }
}

/**
 * Unregisters an individual event from debouncing.
 * @param {String} name - Name of the sourceEvent to unregister
 */
const unregisterEvent = name => {
  document.removeEventListener(name, registeredEvents[name]?.handler)
  delete registeredEvents[name]
  return name
}

/**
 * Registers an individual event for debouncing.
 * @note Events can be re-registered (replaces existing entry)
 * @param {String} name - Name of the sourceEvent to debounce
 * @param {Object} options - Debounce options
 */
const registerEvent = (name, options = {}) => {
  unregisterEvent(name)
  options = { ...defaultOptions, ...options }
  options.handler = buildDebounceEventHandler(options)
  registeredEvents[name] = options
  document.addEventListener(name, options.handler)
  return { [name]: registeredEvents[name] }
}

/**
 * Unregisters a list of events.
 * @param {Array<String>} eventNames - List of event names to unregister
 * @returns {Array<String>} - List of event names that were unregistered
 */
const unregister = (eventNames = []) => {
  const names = { ...eventNames }
  eventNames.forEach(name => unregisterEvent(name))
  return names
}

/**
 * Initializes debounced events.
 *
 * @example
 *   register([
 *     'change',
 *     'click'
 *     // more events...
 *   ], {
 *     wait: 200,
 *     leading: false,
 *     trailing: true
 *   })
 *
 * @param {Array<String>} eventNames - List of event names to register
 * @param {Object} options - debounce options
 */
const register = (eventNames = [], options = {}) => {
  if (!eventNames || eventNames.length === 0) eventNames = nativeBubblingEventNames

  eventNames.forEach(name => registerEvent(name, options))
  return eventNames.reduce((memo, name) => {
    memo[name] = registeredEvents[name]
    return memo
  }, {})
}

export default {
  initialize: register,
  register,
  unregister,
  registerEvent,
  unregisterEvent,
  get defaultEventNames() {
    return [...nativeBubblingEventNames]
  },
  get defaultOptions() {
    return { ...defaultOptions }
  },
  get prefix() {
    return prefix
  },
  set prefix(value) {
    prefix = value
  },
  get registeredEvents() {
    return { ...registeredEvents }
  },
  get registeredEventNames() {
    return Object.keys(registeredEvents)
  },
  get version() {
    return version
  }
}
