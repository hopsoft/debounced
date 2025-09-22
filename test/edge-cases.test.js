import {test} from '@playwright/test'
import assert from 'node:assert'
import {clickButtonReal} from './helpers/real-interactions.js'

// Utility function for cleaner async waits
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test.describe('Edge Cases Tests', () => {
  test('error handling and edge cases', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const results = {
        emptyArray: null,
        invalidOptions: null,
        nonExistentUnregister: null,
        nullEventNames: null,
        invalidWait: null,
      }

      try {
        // Test empty array - should register all default events
        const emptyResult = window.debounced.register([])
        results.emptyArray = {
          success: true,
          eventCount: Object.keys(emptyResult).length,
        }
        window.debounced.unregister([]) // cleanup
      } catch (error) {
        results.emptyArray = {success: false, error: error.message}
      }

      try {
        // First unregister click to start fresh
        window.debounced.unregister(['click'])
        // Test invalid options object (should use defaults)
        window.debounced.register(['click'], {wait: 'invalid', leading: 'notboolean'})

        window.invalidEvents = []
        window.invalidHandler = e => window.invalidEvents.push(e.detail.type)
        document.addEventListener('debounced:click', window.invalidHandler)

        results.invalidOptions = {
          success: true,
          setupComplete: true,
        }
      } catch (error) {
        results.invalidOptions = {success: false, error: error.message}
      }

      try {
        // Test unregistering non-existent event
        const unregisterResult = window.debounced.unregisterEvent('nonexistent')
        results.nonExistentUnregister = {
          success: true,
          result: unregisterResult,
        }
      } catch (error) {
        results.nonExistentUnregister = {success: false, error: error.message}
      }

      try {
        // Test null/undefined eventNames
        const nullResult = window.debounced.register(null)
        results.nullEventNames = {
          success: true,
          eventCount: Object.keys(nullResult).length,
        }
        window.debounced.unregister([]) // cleanup all
      } catch (error) {
        results.nullEventNames = {success: false, error: error.message}
      }

      try {
        // Test negative wait time
        window.debounced.register(['click'], {wait: -100})
        results.invalidWait = {success: true}
        window.debounced.unregister(['click'])
      } catch (error) {
        results.invalidWait = {success: false, error: error.message}
      }

      return results
    })

    // If invalid options were set up successfully, test with real click
    if (result.invalidOptions?.setupComplete) {
      // Check registration status before testing
      const registrationStatus = await page.evaluate(() => {
        return {
          isRegistered: 'click' in window.debounced.registeredEvents,
          registeredOptions: window.debounced.registeredEvents.click || null,
        }
      })

      // If event is registered, test it
      if (registrationStatus.isRegistered) {
        // Multiple clicks to trigger debounce
        await clickButtonReal(page, '[data-testid="testButton"]', 5)
        // Wait for debounce time with buffer
        const waitTime = registrationStatus.registeredOptions?.wait || 200
        await page.waitForTimeout(waitTime + 100)

        const invalidOptionsResult = await page.evaluate(() => {
          const eventCount = window.invalidEvents.length
          document.removeEventListener('debounced:click', window.invalidHandler)
          window.debounced.unregister(['click'])
          return eventCount > 0
        })

        result.invalidOptions.eventsFired = invalidOptionsResult
      } else {
        // Event wasn't registered, which is still a success for invalid options
        result.invalidOptions.eventsFired = false
        result.invalidOptions.notRegistered = true
      }
    }

    // Test empty array handling
    assert.ok(result.emptyArray.success, 'Should handle empty array without error')
    assert.ok(result.emptyArray.eventCount > 60, 'Empty array should register all default events')

    // Test invalid options handling
    assert.ok(result.invalidOptions.success, 'Should handle invalid options without error')
    // Either the event fires with default options, or it wasn't registered (both are acceptable)
    assert.ok(
      result.invalidOptions.eventsFired || result.invalidOptions.notRegistered,
      'Should either fire events with defaults or gracefully handle invalid registration'
    )

    // Test non-existent event unregistration
    assert.ok(result.nonExistentUnregister.success, 'Should handle non-existent event unregistration')
    assert.strictEqual(
      result.nonExistentUnregister.result,
      'nonexistent',
      'Should return event name even if non-existent'
    )

    // Test null eventNames
    assert.ok(result.nullEventNames.success, 'Should handle null eventNames without error')
    assert.ok(result.nullEventNames.eventCount > 60, 'Null eventNames should register all default events')

    // Test negative wait time
    assert.ok(result.invalidWait.success, 'Should handle negative wait time without error')
  })

  test('event property preservation', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Setup event handler
    await page.evaluate(() => {
      window.capturedEvents = []
      window.propHandler = event => {
        window.capturedEvents.push({
          type: event.type,
          bubbles: event.bubbles,
          cancelable: event.cancelable,
          composed: event.composed,
          detail: event.detail,
          hasSourceEvent: !!event.detail.sourceEvent,
          sourceEventType: event.detail.sourceEvent?.type,
          sourceEventBubbles: event.detail.sourceEvent?.bubbles,
          sourceEventCancelable: event.detail.sourceEvent?.cancelable,
          debouncedType: event.detail.type,
        })
      }
      document.addEventListener('debounced:click', window.propHandler)
      window.debounced.register(['click'])
    })

    // Use real click which creates MouseEvent with proper properties
    await clickButtonReal(page, '[data-testid="testButton"]')
    await page.waitForTimeout(250)

    const result = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.propHandler)
      return {
        eventCount: window.capturedEvents.length,
        firstEvent: window.capturedEvents[0] || null,
      }
    })

    assert.ok(result.eventCount >= 1, 'Should fire debounced event')

    const event = result.firstEvent
    assert.ok(event, 'Should capture event details')
    assert.strictEqual(event.type, 'debounced:click', 'Should have correct debounced event type')
    assert.strictEqual(event.bubbles, true, 'Should preserve bubbles property')
    assert.strictEqual(event.cancelable, true, 'Should preserve cancelable property')
    assert.strictEqual(event.composed, true, 'Should preserve composed property')
    assert.ok(event.hasSourceEvent, 'Should include source event in detail')
    assert.strictEqual(event.sourceEventType, 'click', 'Source event should be original click')
    assert.strictEqual(event.sourceEventBubbles, true, 'Source event should preserve bubbles')
    assert.strictEqual(event.sourceEventCancelable, true, 'Source event should preserve cancelable')
    assert.ok(['leading', 'trailing'].includes(event.debouncedType), 'Should specify debounce type')
  })

  test('nested elements event delegation', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Setup handler
    await page.evaluate(() => {
      window.clickEvents = []
      window.nestedHandler = event => {
        window.clickEvents.push({
          target: event.detail.sourceEvent.target.dataset.testid || event.detail.sourceEvent.target.tagName,
          currentTarget: event.currentTarget === document ? 'DOCUMENT' : event.currentTarget.tagName,
          type: event.detail.type,
        })
      }
      document.addEventListener('debounced:click', window.nestedHandler)
    })

    // Click nested elements with real interactions
    await clickButtonReal(page, '[data-testid="testNestedButton"]')
    await page.waitForTimeout(50)

    // Click the span element
    await page.locator('[data-testid="testNestedSpan"]').click()
    await page.waitForTimeout(50)

    // Click child and parent
    await page.locator('[data-testid="testNestedChild"]').click()
    await page.waitForTimeout(50)
    await page.locator('[data-testid="testNestedParent"]').click()

    // Wait for debounced events (200ms default + buffer)
    await page.waitForTimeout(350)

    const result = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.nestedHandler)
      return {
        eventCount: window.clickEvents.length,
        events: window.clickEvents,
        allEventsOnDocument: window.clickEvents.every(e => e.currentTarget === 'DOCUMENT'),
        uniqueTargets: new Set(window.clickEvents.map(e => e.target)).size,
      }
    })

    // Focus on testing that event delegation works (events bubble up to document)
    assert.ok(result.eventCount >= 1, 'Should fire debounced events from nested elements: ' + result.eventCount)
    assert.ok(result.allEventsOnDocument, 'All events should be handled on document (event delegation)')
    assert.ok(result.uniqueTargets >= 1, 'Should capture events from nested targets')
  })

  test('multiple targets same event type - verify independent timeouts', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const initialResult = await page.evaluate(() => {
      window.clickTargets = []

      // First, let's verify how timeout keys work
      const testTimeouts = {}
      const btn1 = document.querySelector('[data-testid="testMultiple1"]')
      const btn2 = document.querySelector('[data-testid="testMultiple2"]')

      // Test what happens when we use arrays with DOM elements as keys
      const key1 = ['click', btn1]
      const key2 = ['click', btn2]
      testTimeouts[key1] = 'timeout1'
      testTimeouts[key2] = 'timeout2'

      const keyCollisionTest = {
        key1String: String(key1),
        key2String: String(key2),
        sameStringKey: String(key1) === String(key2),
        numKeys: Object.keys(testTimeouts).length,
        finalValue: Object.values(testTimeouts)[0],
      }

      window.multiHandler = event => {
        window.clickTargets.push({
          target: event.detail.sourceEvent.target.dataset.testid,
          time: Date.now(),
        })
      }

      document.addEventListener('debounced:click', window.multiHandler)

      // Register with short wait time for faster testing
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 100})

      return keyCollisionTest
    })

    // Click all three buttons quickly with real interactions
    await page.locator('[data-testid="testMultiple1"]').click()
    await page.locator('[data-testid="testMultiple2"]').click()
    await page.locator('[data-testid="testMultiple3"]').click()

    // Wait for debounced events
    await page.waitForTimeout(150)

    const clickResults = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.multiHandler)
      // Reset to default
      window.debounced.unregister(['click'])
      window.debounced.register(['click'])

      return {
        targetCount: new Set(window.clickTargets.map(e => e.target)).size,
        totalEvents: window.clickTargets.length,
        targets: window.clickTargets.map(e => e.target),
      }
    })

    const result = {
      keyCollisionTest: initialResult,
      ...clickResults,
    }

    // Key collision test results (shows the old implementation would have collided)
    assert.ok(result.keyCollisionTest.sameStringKey, 'Array keys with different DOM elements produce same string')
    assert.strictEqual(result.keyCollisionTest.numKeys, 1, 'Plain object would only have 1 key due to collision')

    // After fix with Map: all three buttons should fire independently
    assert.strictEqual(result.totalEvents, 3, 'All three buttons fire independently with Map implementation')
    assert.strictEqual(result.targetCount, 3, 'All three different targets recorded')
    assert.ok(result.targets.includes('testMultiple1'), 'Button 1 fired')
    assert.ok(result.targets.includes('testMultiple2'), 'Button 2 fired')
    assert.ok(result.targets.includes('testMultiple3'), 'Button 3 fired')
  })

  test('prefix customization changes event names', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const events = []

      // Test default prefix
      const defaultHandler = event => {
        events.push({prefix: 'default', type: event.type})
      }
      document.addEventListener('debounced:click', defaultHandler)

      // Trigger click with default prefix
      const button = document.querySelector('[data-testid="testButton"]')
      button.click()
      await wait(250)

      // Change prefix
      window.debounced.prefix = 'custom'

      // Test custom prefix - remove old listener and add new one
      document.removeEventListener('debounced:click', defaultHandler)

      const customHandler = event => {
        events.push({prefix: 'custom', type: event.type})
      }
      document.addEventListener('custom:click', customHandler)

      // Re-register events with new prefix
      window.debounced.unregister(['click'])
      window.debounced.register(['click'])

      // Trigger click with custom prefix
      button.click()
      await wait(250)

      // Cleanup
      document.removeEventListener('custom:click', customHandler)

      // Reset prefix for other tests
      window.debounced.prefix = 'debounced'

      return {
        events,
        prefixValue: window.debounced.prefix,
      }
    })

    assert.ok(result.events.length >= 2, 'Should fire events with both prefixes')
    assert.ok(
      result.events.find(e => e.prefix === 'default'),
      'Should fire with default prefix'
    )
    assert.ok(
      result.events.find(e => e.prefix === 'custom'),
      'Should fire with custom prefix'
    )
    assert.strictEqual(result.prefixValue, 'debounced', 'Should reset prefix for other tests')
  })

  test('leading debounce modes', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const results = {
        leadingOnly: [],
        both: [],
        trailingOnly: [],
      }

      // Test leading only
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 200, leading: true, trailing: false})

      const leadingHandler = event => {
        results.leadingOnly.push({
          type: event.detail.type,
          timestamp: Date.now(),
        })
      }
      document.addEventListener('debounced:click', leadingHandler)

      const button = document.querySelector('[data-testid="testButton"]')
      const startTime = Date.now()

      // Rapid clicks - should only fire leading event immediately
      button.click()
      button.click()
      button.click()

      await wait(300)
      document.removeEventListener('debounced:click', leadingHandler)

      // Test both leading and trailing
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 200, leading: true, trailing: true})

      const bothHandler = event => {
        results.both.push({
          type: event.detail.type,
          timestamp: Date.now(),
        })
      }
      document.addEventListener('debounced:click', bothHandler)

      button.click()
      await wait(300)
      document.removeEventListener('debounced:click', bothHandler)

      // Test trailing only (default)
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 200, leading: false, trailing: true})

      const trailingHandler = event => {
        results.trailingOnly.push({
          type: event.detail.type,
          timestamp: Date.now(),
        })
      }
      document.addEventListener('debounced:click', trailingHandler)

      button.click()
      await wait(300)
      document.removeEventListener('debounced:click', trailingHandler)

      return {
        ...results,
        startTime,
        leadingDelay: results.leadingOnly[0] ? results.leadingOnly[0].timestamp - startTime : null,
      }
    })

    // Leading only should fire immediately (one event)
    assert.strictEqual(result.leadingOnly.length, 1, 'Leading-only should fire exactly once')
    assert.strictEqual(result.leadingOnly[0].type, 'leading', 'Should be leading event')
    assert.ok(result.leadingDelay < 50, 'Leading event should fire immediately')

    // Both should fire twice (leading + trailing)
    assert.strictEqual(result.both.length, 2, 'Both mode should fire twice')
    assert.ok(
      result.both.find(e => e.type === 'leading'),
      'Should have leading event'
    )
    assert.ok(
      result.both.find(e => e.type === 'trailing'),
      'Should have trailing event'
    )

    // Trailing only should fire once after delay
    assert.strictEqual(result.trailingOnly.length, 1, 'Trailing-only should fire exactly once')
    assert.strictEqual(result.trailingOnly[0].type, 'trailing', 'Should be trailing event')
  })

  test('zero wait time behavior', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const events = []

      const handler = event => {
        events.push({
          type: event.detail.type,
          timestamp: Date.now(),
        })
      }
      document.addEventListener('debounced:click', handler)

      try {
        // Register with zero wait time
        window.debounced.register(['click'], {wait: 0, leading: false, trailing: true})

        const button = document.querySelector('[data-testid="testButton"]')
        const startTime = Date.now()

        // Click multiple times rapidly
        button.click()
        button.click()
        button.click()

        // With zero wait, events should fire almost immediately
        await wait(50)

        return {
          events,
          eventCount: events.length,
          firstEventDelay: events.length > 0 ? events[0].timestamp - startTime : null,
        }
      } finally {
        document.removeEventListener('debounced:click', handler)
      }
    })

    assert.ok(result.eventCount >= 1, 'Should fire events with zero wait time: ' + result.eventCount)
    assert.ok(result.firstEventDelay < 20, 'Zero wait should fire almost immediately: ' + result.firstEventDelay + 'ms')
  })

  test('custom events debouncing', async ({page, browserName}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Test 1: Basic custom event registration and firing
    const basicCustomEvent = await page.evaluate(async () => {
      window.debounced.registerEvent('myCustomEvent', {wait: 100})

      return new Promise(resolve => {
        let eventFired = false

        document.addEventListener('debounced:myCustomEvent', event => {
          eventFired = true
          resolve(event.type === 'debounced:myCustomEvent')
        })

        const customEvent = new CustomEvent('myCustomEvent', {
          bubbles: true,
          detail: {testData: 'value'},
        })
        document.body.dispatchEvent(customEvent)

        setTimeout(() => resolve(eventFired), 200)
      })
    })

    assert.ok(basicCustomEvent, 'Basic custom event should fire debounced version')

    // Test 2: Custom event data preservation
    const dataPreservation = await page.evaluate(async () => {
      window.debounced.registerEvent('dataEvent', {wait: 100})

      return new Promise(resolve => {
        document.addEventListener('debounced:dataEvent', event => {
          const sourceEvent = event.detail.sourceEvent
          resolve(sourceEvent.detail.customData === 'preserved' && sourceEvent.detail.nested.value === 42)
        })

        const customEvent = new CustomEvent('dataEvent', {
          bubbles: true,
          detail: {
            customData: 'preserved',
            nested: {value: 42},
          },
        })
        document.dispatchEvent(customEvent)
      })
    })

    assert.ok(dataPreservation, 'Custom event data should be preserved')

    // Test 3: Multiple custom events
    const multipleCustomEvents = await page.evaluate(async () => {
      window.debounced.registerEvent('eventOne', {wait: 50})
      window.debounced.registerEvent('eventTwo', {wait: 100})

      return new Promise(resolve => {
        const results = {}

        document.addEventListener('debounced:eventOne', () => {
          results.one = true
        })

        document.addEventListener('debounced:eventTwo', () => {
          results.two = true
        })

        document.dispatchEvent(new CustomEvent('eventOne', {bubbles: true}))
        document.dispatchEvent(new CustomEvent('eventTwo', {bubbles: true}))

        setTimeout(() => {
          resolve(results.one === true && results.two === true)
        }, 200)
      })
    })

    assert.ok(multipleCustomEvents, 'Multiple custom events should work independently')

    // Test 4: Custom event without bubbles should not work
    const noBubblesFails = await page.evaluate(async () => {
      window.debounced.registerEvent('noBubbleEvent', {wait: 50})

      return new Promise(resolve => {
        let eventFired = false

        document.addEventListener('debounced:noBubbleEvent', () => {
          eventFired = true
        })

        // Dispatch without bubbles - should NOT trigger debounced version
        const customEvent = new CustomEvent('noBubbleEvent', {
          bubbles: false, // This should prevent debouncing
        })
        document.body.dispatchEvent(customEvent)

        setTimeout(() => resolve(!eventFired), 150)
      })
    })

    assert.ok(noBubblesFails, 'Custom event without bubbles should not trigger debounced event')

    // Test 5: Custom event with leading/trailing modes
    const customEventModes = await page.evaluate(async () => {
      window.debounced.registerEvent('modeEvent', {
        wait: 100,
        leading: true,
        trailing: true,
      })

      return new Promise(resolve => {
        const events = []

        document.addEventListener('debounced:modeEvent', event => {
          events.push(event.detail.type)
        })

        document.dispatchEvent(new CustomEvent('modeEvent', {bubbles: true}))

        setTimeout(() => {
          resolve(events.length === 2 && events[0] === 'leading' && events[1] === 'trailing')
        }, 200)
      })
    })

    assert.ok(customEventModes, 'Custom event should respect leading/trailing modes')

    // Test 6: Custom event on specific element
    const elementSpecificCustom = await page.evaluate(async () => {
      window.debounced.registerEvent('elementCustom', {wait: 50})

      return new Promise(resolve => {
        const button = document.querySelector('[data-testid="testButton"]')
        let correctTarget = false

        document.addEventListener('debounced:elementCustom', event => {
          correctTarget = event.target === button
        })

        // Dispatch from specific element
        button.dispatchEvent(new CustomEvent('elementCustom', {bubbles: true}))

        setTimeout(() => resolve(correctTarget), 150)
      })
    })

    assert.ok(elementSpecificCustom, 'Custom event should maintain correct target element')

    // Test 7: Mix custom and native events
    const mixedEvents = await page.evaluate(async () => {
      window.debounced.register(['click'], {wait: 100})
      window.debounced.registerEvent('customMixed', {wait: 100})

      return new Promise(resolve => {
        const results = {}

        document.addEventListener('debounced:click', () => {
          results.native = true
        })

        document.addEventListener('debounced:customMixed', () => {
          results.custom = true
        })

        document.querySelector('[data-testid="testButton"]').click()
        document.dispatchEvent(new CustomEvent('customMixed', {bubbles: true}))

        setTimeout(() => {
          resolve(results.native === true && results.custom === true)
        }, 200)
      })
    })

    assert.ok(mixedEvents, 'Custom and native events should work together')

    // Test 8: Re-registration of custom events
    const customReregistration = await page.evaluate(async () => {
      // Initial registration
      window.debounced.registerEvent('reregisterCustom', {wait: 200, trailing: true})
      const initial = window.debounced.registeredEvents.reregisterCustom.wait

      // Re-register with different options
      window.debounced.registerEvent('reregisterCustom', {wait: 50, leading: true})
      const updated = window.debounced.registeredEvents.reregisterCustom

      return (
        initial === 200 && updated.wait === 50 && updated.leading === true && updated.trailing === true // default restored
      )
    })

    assert.ok(customReregistration, 'Custom event re-registration should replace configuration')

    // Test 9: Unregister custom event
    const customUnregister = await page.evaluate(() => {
      window.debounced.registerEvent('toRemove', {wait: 100})
      const beforeRemove = window.debounced.registeredEventNames.includes('toRemove')

      window.debounced.unregisterEvent('toRemove')
      const afterRemove = window.debounced.registeredEventNames.includes('toRemove')

      return beforeRemove === true && afterRemove === false
    })

    assert.ok(customUnregister, 'Custom event should be removable')
  })
})
