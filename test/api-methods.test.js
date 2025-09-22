import {test} from '@playwright/test'
import assert from 'node:assert'
import {clickButtonReal, typeInInputReal, testRealEventDebouncing} from './helpers/real-interactions.js'

// Utility function for cleaner async waits
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test.describe('API Methods Tests', () => {
  test('test unregister functionality', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Set up tracking
    await page.evaluate(() => {
      window.eventFired = false
      window.handler = () => {
        window.eventFired = true
      }
      document.addEventListener('debounced:click', window.handler)
    })

    // Unregister click events
    await page.evaluate(() => {
      window.debounced.unregister(['click'])
    })

    // Try to trigger click with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')

    // Wait for any potential debounced event
    await page.waitForTimeout(300)

    const result = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.handler)
      return window.eventFired
    })

    assert.strictEqual(result, false, 'No debounced events should fire after unregister')
  })

  test('individual API methods', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Set up tracking
    await page.evaluate(() => {
      window.events = []
      window.handler = event => {
        window.events.push(event.detail.sourceEvent.target.dataset.testid)
      }
      document.addEventListener('debounced:click', window.handler)
    })

    // Test registerEvent individual method
    const registerResult = await page.evaluate(() => {
      const result = window.debounced.registerEvent('click', {wait: 100})
      return {
        hasClickKey: 'click' in result,
        hasHandler: result.click?.handler !== undefined,
      }
    })

    // Click to test it works with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    const eventsBefore = await page.evaluate(() => window.events.length)

    // Test unregisterEvent individual method
    const unregisterResult = await page.evaluate(() => {
      return window.debounced.unregisterEvent('click')
    })

    // Try clicking after unregister with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    const result = await page.evaluate(() => {
      const eventsAfter = window.events.length
      document.removeEventListener('debounced:click', window.handler)
      return {
        events: window.events,
        eventsFiredAfterUnregister: eventsAfter > window.eventsBefore,
        eventsLength: window.events.length,
        eventsBefore: window.eventsBefore,
      }
    })

    assert.ok(
      registerResult.hasClickKey && registerResult.hasHandler,
      'registerEvent should return correct object format'
    )
    assert.strictEqual(unregisterResult, 'click', 'unregisterEvent should return event name')
    assert.ok(result.eventsLength >= 1, 'Should fire events after registerEvent')
    assert.ok(eventsBefore === result.eventsLength, 'Should not fire events after unregisterEvent')
  })

  test('state getters validation', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      // Clean slate - unregister all currently registered events
      const currentEvents = window.debounced.registeredEventNames
      if (currentEvents.length > 0) window.debounced.unregister(currentEvents)

      // Test defaultEventNames getter
      const defaultEventNames = window.debounced.defaultEventNames
      const isArray = Array.isArray(defaultEventNames)
      const hasClickEvent = defaultEventNames.includes('click')
      const hasInputEvent = defaultEventNames.includes('input')

      // Test defaultOptions getter
      const defaultOptions = window.debounced.defaultOptions
      const hasWait = 'wait' in defaultOptions && typeof defaultOptions.wait === 'number'
      const hasLeading = 'leading' in defaultOptions && typeof defaultOptions.leading === 'boolean'
      const hasTrailing = 'trailing' in defaultOptions && typeof defaultOptions.trailing === 'boolean'

      // Test version getter
      const version = window.debounced.version
      const isVersionString = typeof version === 'string'
      const hasVersionPattern = /^\d+\.\d+\.\d+/.test(version)

      // Test prefix getter
      const prefix = window.debounced.prefix
      const isPrefixString = typeof prefix === 'string'

      // Test registeredEvents getter before and after registration
      const registeredEventsBefore = window.debounced.registeredEvents
      const registeredEventNamesBefore = window.debounced.registeredEventNames

      // Register an event
      window.debounced.register(['click'])

      const registeredEventsAfter = window.debounced.registeredEvents
      const registeredEventNamesAfter = window.debounced.registeredEventNames

      return {
        defaultEventNames: {
          isArray,
          hasClickEvent,
          hasInputEvent,
          length: defaultEventNames.length,
        },
        defaultOptions: {
          hasWait,
          hasLeading,
          hasTrailing,
          wait: defaultOptions.wait,
          leading: defaultOptions.leading,
          trailing: defaultOptions.trailing,
        },
        version: {
          isVersionString,
          hasVersionPattern,
          value: version,
        },
        prefix: {
          isPrefixString,
          value: prefix,
        },
        registeredEvents: {
          beforeIsObject: typeof registeredEventsBefore === 'object',
          afterIsObject: typeof registeredEventsAfter === 'object',
          hasClickAfter: 'click' in registeredEventsAfter,
        },
        registeredEventNames: {
          beforeIsArray: Array.isArray(registeredEventNamesBefore),
          afterIsArray: Array.isArray(registeredEventNamesAfter),
          hasClickAfter: registeredEventNamesAfter.includes('click'),
          beforeLength: registeredEventNamesBefore.length,
          afterLength: registeredEventNamesAfter.length,
        },
      }
    })

    // Test defaultEventNames
    assert.ok(result.defaultEventNames.isArray, 'defaultEventNames should be an array')
    assert.ok(result.defaultEventNames.hasClickEvent, 'defaultEventNames should include click')
    assert.ok(result.defaultEventNames.hasInputEvent, 'defaultEventNames should include input')
    assert.ok(result.defaultEventNames.length > 60, 'Should have many default events')

    // Test defaultOptions
    assert.ok(result.defaultOptions.hasWait, 'defaultOptions should have wait property')
    assert.ok(result.defaultOptions.hasLeading, 'defaultOptions should have leading property')
    assert.ok(result.defaultOptions.hasTrailing, 'defaultOptions should have trailing property')
    assert.strictEqual(result.defaultOptions.wait, 200, 'Default wait should be 200ms')
    assert.strictEqual(result.defaultOptions.leading, false, 'Default leading should be false')
    assert.strictEqual(result.defaultOptions.trailing, true, 'Default trailing should be true')

    // Test version
    assert.ok(result.version.isVersionString, 'version should be a string')
    assert.ok(result.version.hasVersionPattern, 'version should match semver pattern')

    // Test prefix
    assert.ok(result.prefix.isPrefixString, 'prefix should be a string')
    assert.strictEqual(result.prefix.value, 'debounced', 'Default prefix should be debounced')

    // Test registeredEvents and registeredEventNames
    assert.ok(result.registeredEvents.beforeIsObject, 'registeredEvents should be object')
    assert.ok(result.registeredEvents.afterIsObject, 'registeredEvents should be object after registration')
    assert.ok(result.registeredEvents.hasClickAfter, 'registeredEvents should have click after registration')

    assert.ok(result.registeredEventNames.beforeIsArray, 'registeredEventNames should be array')
    assert.ok(result.registeredEventNames.afterIsArray, 'registeredEventNames should be array after registration')
    assert.ok(result.registeredEventNames.hasClickAfter, 'registeredEventNames should include click after registration')
    assert.ok(
      result.registeredEventNames.afterLength > result.registeredEventNames.beforeLength,
      'Should have more events after registration'
    )
  })

  test('re-registration behavior', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Set up tracking
    await page.evaluate(() => {
      window.events = []
      window.handler = event => {
        window.events.push({
          type: event.detail.type,
          wait: event.detail.sourceEvent.type,
          timestamp: Date.now(),
        })
      }
      document.addEventListener('debounced:click', window.handler)
    })

    // Register with first options
    await page.evaluate(() => {
      window.debounced.register(['click'], {wait: 100, leading: false, trailing: true})
    })

    // Click with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    const eventsAfterFirst = await page.evaluate(() => window.events.length)

    // Re-register with different options
    await page.evaluate(() => {
      window.debounced.register(['click'], {wait: 50, leading: true, trailing: false})
      window.startTime = Date.now()
    })

    // Click with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(100)

    const result = await page.evaluate(() => {
      const eventsAfterSecond = window.events.length
      const lastEvent = window.events[window.events.length - 1]
      const leadingDelay = lastEvent ? lastEvent.timestamp - window.startTime : null

      document.removeEventListener('debounced:click', window.handler)

      return {
        eventsAfterFirst: window.eventsAfterFirst,
        eventsAfterSecond,
        lastEventType: lastEvent?.type,
        leadingDelay,
        totalEvents: window.events.length,
      }
    })

    // Store eventsAfterFirst for comparison
    result.eventsAfterFirst = eventsAfterFirst

    assert.ok(result.eventsAfterFirst >= 1, 'Should fire events with first registration')
    assert.ok(result.eventsAfterSecond > result.eventsAfterFirst, 'Should fire events with second registration')
    assert.strictEqual(result.lastEventType, 'leading', 'Last event should be leading type (new options)')
    assert.ok(result.leadingDelay < 50, 'Leading event should fire immediately with new options')
  })

  test('registration edge cases', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Wait for library to be available
    await page.waitForFunction(() => window.debounced)

    // Test empty arrays
    const emptyArray = await page.evaluate(() => {
      const beforeCount = window.debounced.registeredEventNames.length
      window.debounced.register([])
      const afterCount = window.debounced.registeredEventNames.length
      return beforeCount === afterCount
    })

    assert.ok(emptyArray, 'Empty array should not register any events')

    // Test duplicate events in array
    const duplicates = await page.evaluate(() => {
      window.debounced.unregister(window.debounced.registeredEventNames)
      window.debounced.register(['click', 'click', 'click'], {wait: 100})

      // Should only register once
      return window.debounced.registeredEventNames.length === 1 && window.debounced.registeredEventNames[0] === 'click'
    })

    assert.ok(duplicates, 'Duplicate events in array should only register once')

    // Test partial options override
    const partialOptions = await page.evaluate(() => {
      // Register with full options
      window.debounced.register(['blur'], {wait: 200, leading: true, trailing: false})

      // Re-register with only wait (should apply defaults for others)
      window.debounced.register(['blur'], {wait: 300})

      const options = window.debounced.registeredEvents.blur
      return (
        options.wait === 300 &&
        options.leading === false && // Back to default
        options.trailing === true // Back to default
      )
    })

    assert.ok(partialOptions, 'Partial options should apply defaults for unspecified options')
  })

  test('modify event registration after initialization', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Test 1: Change wait time for existing event
    // Setup and trigger first input
    await page.evaluate(() => {
      window.debounced.unregister(['input'])
      window.debounced.register(['input'], {wait: 100})
      window.waitTimeResults = []
      window.waitHandler1 = event => {
        window.waitTimeResults.push({wait: 100, timestamp: Date.now()})
      }
      document.addEventListener('debounced:input', window.waitHandler1)
    })

    // Type with real interaction
    await typeInInputReal(page, '[data-testid="testInput"]', 'test1')
    await page.waitForTimeout(150)

    // Now change to 300ms and test again
    await page.evaluate(() => {
      document.removeEventListener('debounced:input', window.waitHandler1)
      window.debounced.register(['input'], {wait: 300})
      window.waitHandler2 = event => {
        window.waitTimeResults.push({wait: 300, timestamp: Date.now()})
      }
      document.addEventListener('debounced:input', window.waitHandler2)
    })

    const beforeSecondType = Date.now()
    // Type again with real interaction
    await typeInInputReal(page, '[data-testid="testInput"]', 'test2')
    await page.waitForTimeout(350)

    const waitTimeChange = await page.evaluate(startTime => {
      document.removeEventListener('debounced:input', window.waitHandler2)
      const lastResult = window.waitTimeResults[window.waitTimeResults.length - 1]
      if (!lastResult) return false
      const elapsed = lastResult.timestamp - startTime
      // The debounced event should fire approximately 300ms after typing started
      return elapsed >= 250 && elapsed <= 350
    }, beforeSecondType)

    assert.ok(waitTimeChange, 'Should be able to change wait time after initialization')

    // Test 2: Change from trailing to leading
    // Setup trailing mode
    await page.evaluate(() => {
      window.debounced.register(['click'], {wait: 100, leading: false, trailing: true})
      window.modeResults = []
      window.modeHandler1 = event => {
        window.modeResults.push(event.detail.type)
      }
      document.addEventListener('debounced:click', window.modeHandler1)
    })

    // Click with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    // Change to leading mode
    await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.modeHandler1)
      window.debounced.register(['click'], {wait: 100, leading: true, trailing: false})
      window.modeHandler2 = event => {
        window.modeResults.push(event.detail.type)
      }
      document.addEventListener('debounced:click', window.modeHandler2)
    })

    // Click again with real interaction
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    const modeChange = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.modeHandler2)
      // First should be trailing, second should be leading
      return window.modeResults[0] === 'trailing' && window.modeResults[1] === 'leading'
    })

    assert.ok(modeChange, 'Should be able to change between leading/trailing modes')

    // Test 3: Add new events after initialization
    const addNewEvents = await page.evaluate(async () => {
      // Initialize with just input
      window.debounced.unregister(window.debounced.registeredEventNames)
      window.debounced.register(['input'], {wait: 100})

      const beforeCount = window.debounced.registeredEventNames.length

      // Add more events
      window.debounced.register(['scroll', 'resize'], {wait: 50})

      const afterCount = window.debounced.registeredEventNames.length
      const hasInput = window.debounced.registeredEventNames.includes('input')
      const hasScroll = window.debounced.registeredEventNames.includes('scroll')
      const hasResize = window.debounced.registeredEventNames.includes('resize')

      return beforeCount === 1 && afterCount === 3 && hasInput && hasScroll && hasResize
    })

    assert.ok(addNewEvents, 'Should be able to add new events after initialization')

    // Test 4: Remove and re-add events
    // Register and setup tracking
    await page.evaluate(() => {
      window.debounced.register(['click'], {wait: 100})
      window.clickFired = false
      window.removeHandler1 = () => {
        window.clickFired = true
      }
      document.addEventListener('debounced:click', window.removeHandler1)
    })

    // Unregister click
    await page.evaluate(() => {
      window.debounced.unregister(['click'])
    })

    // Click should not trigger debounced event
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(150)

    const clickFiredAfterUnregister = await page.evaluate(() => window.clickFired)

    if (!clickFiredAfterUnregister) {
      // Re-register click
      await page.evaluate(() => {
        window.debounced.register(['click'], {wait: 50})
        window.reRegistered = false
        window.removeHandler2 = () => {
          window.reRegistered = true
        }
        document.addEventListener('debounced:click', window.removeHandler2)
      })

      // Click again with real interaction
      await clickButtonReal(page, '[data-testid="testButton"]')
      await page.waitForTimeout(100)

      const removeReAdd = await page.evaluate(() => {
        document.removeEventListener('debounced:click', window.removeHandler1)
        document.removeEventListener('debounced:click', window.removeHandler2)
        return window.reRegistered
      })

      assert.ok(removeReAdd, 'Should be able to remove and re-add events')
    } else {
      assert.fail('Click event should not have fired after unregister')
    }

    // Test 5: Mixed modifications - some events change, some stay
    const mixedModifications = await page.evaluate(async () => {
      // Register multiple events with same options
      window.debounced.register(['input', 'click', 'scroll'], {wait: 100, trailing: true})

      const originalInput = window.debounced.registeredEvents.input
      const originalClick = window.debounced.registeredEvents.click

      // Modify only input
      window.debounced.register(['input'], {wait: 200, leading: true})

      const modifiedInput = window.debounced.registeredEvents.input
      const unchangedClick = window.debounced.registeredEvents.click
      const unchangedScroll = window.debounced.registeredEvents.scroll

      return (
        modifiedInput.wait === 200 &&
        modifiedInput.leading === true &&
        unchangedClick.wait === 100 &&
        unchangedClick.leading === false &&
        unchangedScroll.wait === 100
      )
    })

    assert.ok(mixedModifications, 'Should be able to modify individual events without affecting others')

    // Test 6: Verify re-registration replaces handler
    const handlerReplaced = await page.evaluate(async () => {
      // Register with 500ms wait
      window.debounced.register(['focus'], {wait: 500})
      const handler1 = window.debounced.registeredEvents.focus.handler

      // Re-register with 100ms wait
      window.debounced.register(['focus'], {wait: 100})
      const handler2 = window.debounced.registeredEvents.focus.handler

      // Handlers should be different functions
      return handler1 !== handler2 && handler2 !== undefined
    })

    assert.ok(handlerReplaced, 'Re-registration should replace the event handler')
  })
})
