import { defaultOptions, events } from './events'

let prefix = 'debounced'
const registeredEvents = {}
const timeouts = {}

//
/**
 * Event dispatcher used to trigger all custom debounced events.
 * @param {Event} sourceEvent - The original native event being debounced
 */
const dispatchDebouncedEvent = (sourceEvent, type) => {
  const { bubbles, cancelable, composed } = sourceEvent
  const debouncedEvent = new CustomEvent(`${prefix}:${sourceEvent.type}`, {
    bubbles,
    cancelable,
    composed,
    detail: { sourceEvent, type }
  })

  // @note Both leading and trailing debounced events are executed on the next tick of the event loop
  //       This allows the sourceEvent and its handlers to complete before the debounced event is dispatched
  return setTimeout(() => sourceEvent.target.dispatchEvent(debouncedEvent))
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
    clearTimeout(timeouts[event.target]) // reset timeout

    // dispatch leading debounced event
    if (leading && !timeouts[event.target]) dispatchDebouncedEvent(event, 'leading')

    // NOTE: setTimeout returns a positive integer
    // SEE: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#return_value
    timeouts[event.target] = setTimeout(() => {
      delete timeouts[event.target] // cleanup

      // dispatch trailing debounced event
      if (trailing) dispatchDebouncedEvent(event, 'trailing')
    }, wait)
  }
}

/**
 * Registers an individual event for debouncing.
 * @note Events can be re-registered (replaces existing entry)
 * @param {String} name - Name of the sourceEvent to debounce
 * @param {Object} options - Debounce options
 */
const registerEvent = (name, options = {}) => {
  document.removeEventListener(name, registeredEvents[name]?.handler)
  options = { ...defaultOptions, ...options }
  options.handler = buildDebounceEventHandler(options)
  registeredEvents[name] = options
  document.addEventListener(name, options.handler)
}

/**
 * Initializes debounced events.
 *
 * @example
 *   initialize({
 *     'change': { wait: 200, leading: false, trailing: true },
 *     'click': { wait: 200, leading: false, trailing: true },
 *     // more events...
 *   })
 *
 * @param {Object} evts - Event options to register
 */
const initialize = (evts = events) => {
  prefix = evts.prefix || prefix
  delete evts.prefix
  for (const [name, options] of Object.entries(evts)) registerEvent(name, options)
}

export default {
  initialize,
  registerEvent,
  get registeredEvents() {
    return { ...registeredEvents }
  }
}
