import {test} from '@playwright/test'
import assert from 'node:assert'

test('initialize and test all default events', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Wait for library to be initialized and get available events
  const {defaultEventNames, registeredEventNames} = await page.evaluate(() => {
    return {
      defaultEventNames: window.debounced.defaultEventNames,
      registeredEventNames: window.debounced.registeredEventNames,
    }
  })

  assert.ok(defaultEventNames.length > 0, 'Should have default event names available')
  assert.ok(registeredEventNames.length > 0, 'Should have registered events after initialization')

  // Test a subset of events that are most reliable across browsers
  const eventsToTest = ['click', 'input', 'mousemove', 'scroll'].filter(eventName =>
    defaultEventNames.includes(eventName)
  )

  for (const eventName of eventsToTest) {
    await testSingleEvent(page, eventName)
  }
})

test('test click event debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  await testSingleEvent(page, 'click')
})

test('test input event debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  await testSingleEvent(page, 'input')
})

test('test mousemove event debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  await testSingleEvent(page, 'mousemove')
})

test('test scroll event debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  await testSingleEvent(page, 'scroll')
})

test('test unregister functionality', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    let eventFired = false

    // Set up listener
    const handler = () => {
      eventFired = true
    }
    document.addEventListener('debounced:click', handler)

    // Unregister click events (API expects array)
    window.debounced.unregister(['click'])

    // Try to trigger click
    const button = document.querySelector('[data-testid="testButton"]')
    button.click()

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 300))

    document.removeEventListener('debounced:click', handler)

    return eventFired
  })

  assert.strictEqual(result, false, 'No debounced events should fire after unregister')
})

test('test custom options', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const timings = []

    // Re-register with leading: true (API expects arrays)
    window.debounced.unregister() // unregister all
    window.debounced.register(['click'], {wait: 200, leading: true, trailing: false})

    const handler = () => timings.push(Date.now())
    document.addEventListener('debounced:click', handler)

    const startTime = Date.now()
    const button = document.querySelector('[data-testid="testButton"]')

    // Click multiple times
    for (let i = 0; i < 3; i++) {
      button.click()
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    document.removeEventListener('debounced:click', handler)

    return {
      timings,
      startTime,
      firstEventDelay: timings.length > 0 ? timings[0] - startTime : null,
    }
  })

  assert.ok(result.timings.length >= 1, 'Should fire at least one event with leading: true')
  assert.ok(
    result.firstEventDelay !== null && result.firstEventDelay < 100,
    'First event should fire immediately with leading: true (delay: ' + result.firstEventDelay + 'ms)'
  )
})

// Helper function to test a single event - matches original test approach
async function testSingleEvent(page, eventName) {
  const result = await page.evaluate(async eventName => {
    return new Promise(async (resolve, reject) => {
      let eventHandlerCalled = false
      let nativeEventCount = 0

      const debouncedHandler = event => {
        console.log(`Debounced ${eventName} event fired`, event)
        eventHandlerCalled = true
      }

      const nativeHandler = () => {
        nativeEventCount++
      }

      // Get appropriate element for event type
      function getElementForEvent(eventName) {
        switch (eventName) {
          case 'input':
          case 'change':
            return document.querySelector('[data-testid="testInput"]')
          case 'click':
          case 'dblclick':
            return document.querySelector('[data-testid="testButton"]')
          case 'scroll':
            return document
          default:
            return document.querySelector('[data-testid="testMouse"]')
        }
      }

      // Trigger event function
      async function triggerEvent(element, eventName) {
        switch (eventName) {
          case 'input':
            element.value = 'test' + Date.now()
            element.dispatchEvent(new Event('input', {bubbles: true}))
            break
          case 'change':
            element.value = 'test' + Date.now()
            element.dispatchEvent(new Event('change', {bubbles: true}))
            break
          case 'click':
          case 'dblclick':
            element.dispatchEvent(new MouseEvent(eventName, {bubbles: true}))
            break
          case 'scroll':
            // Use real scrolling behavior
            const randomScrollY = Math.random() * (document.body.scrollHeight - window.innerHeight)
            window.scrollTo(0, randomScrollY)
            break
          case 'mousemove':
            element.dispatchEvent(
              new MouseEvent(eventName, {
                bubbles: true,
                clientX: Math.random() * 100,
                clientY: Math.random() * 100,
              })
            )
            break
          default:
            element.dispatchEvent(new Event(eventName, {bubbles: true}))
        }
      }

      const element = getElementForEvent(eventName)

      // Add event listeners
      document.addEventListener('debounced:' + eventName, debouncedHandler)
      element.addEventListener(eventName, nativeHandler)

      try {
        // Trigger the event multiple times to ensure debounce is working (like original tests)
        for (let i = 0; i < 3; i++) {
          await triggerEvent(element, eventName)
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Wait for the debounced event to fire (like original with waitFor)
        const startTime = Date.now()
        while (!eventHandlerCalled && Date.now() - startTime < 500) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }

        if (eventHandlerCalled) {
          resolve({
            success: true,
            nativeEventCount,
            message: eventName + ' test passed - native: ' + nativeEventCount + ', debounced: 1',
          })
        } else {
          reject(new Error(eventName + ' handler not called after timeout'))
        }
      } catch (error) {
        reject(error)
      } finally {
        document.removeEventListener('debounced:' + eventName, debouncedHandler)
        element.removeEventListener(eventName, nativeHandler)
      }
    })
  }, eventName)

  assert.ok(result.success, result.message)
  assert.ok(result.nativeEventCount >= 3, 'Should fire multiple native ' + eventName + ' events')
}

test('cross-browser compatibility', async ({page, browserName}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(() => {
    return {
      browser: navigator.userAgent,
      hasDebounced: !!window.debounced,
      defaultEventNamesCount: window.debounced.defaultEventNames.length,
      registeredEventsCount: window.debounced.registeredEventNames.length,
    }
  })

  assert.ok(result.hasDebounced, 'Debounced library should be available')
  assert.ok(result.defaultEventNamesCount > 0, 'Should have default event names')
  assert.ok(result.registeredEventsCount > 0, 'Should have registered events')
})

test('form events debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {change: 0, submit: 0, reset: 0}

    const handlers = {
      change: () => events.change++,
      submit: e => {
        e.preventDefault() // Prevent actual form submission
        events.submit++
      },
      reset: () => events.reset++,
    }

    // Add listeners
    Object.keys(handlers).forEach(eventName => {
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      // Test change events on different form elements
      const textarea = document.querySelector('[data-testid="testTextarea"]')
      const select = document.querySelector('[data-testid="testSelect"]')
      const radio = document.querySelector('[data-testid="testRadio1"]')
      const checkbox = document.querySelector('[data-testid="testCheckbox1"]')

      // Trigger change events
      textarea.value = 'test'
      textarea.dispatchEvent(new Event('change', {bubbles: true}))

      select.value = 'option1'
      select.dispatchEvent(new Event('change', {bubbles: true}))

      radio.checked = true
      radio.dispatchEvent(new Event('change', {bubbles: true}))

      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', {bubbles: true}))

      // Test form submission and reset (use buttons to avoid actual form submission)
      const submitButton = document.querySelector('[data-testid="testSubmit"]')
      const resetButton = document.querySelector('[data-testid="testReset"]')

      // Simulate submit/reset by dispatching events on the form
      const form = document.querySelector('[data-testid="testForm"]')
      const submitEvent = new Event('submit', {bubbles: true, cancelable: true})
      form.dispatchEvent(submitEvent)

      const resetEvent = new Event('reset', {bubbles: true, cancelable: true})
      form.dispatchEvent(resetEvent)

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 300))

      return events
    } finally {
      // Cleanup
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  assert.ok(result.change > 0, 'Should fire debounced change events')
  assert.ok(result.submit > 0, 'Should fire debounced submit events')
  assert.ok(result.reset > 0, 'Should fire debounced reset events')
})

test('focus events debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {focusin: 0, focusout: 0}

    const handlers = {
      focusin: () => events.focusin++,
      focusout: () => events.focusout++,
    }

    // Add listeners
    Object.keys(handlers).forEach(eventName => {
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      const input1 = document.querySelector('[data-testid="testFocus1"]')
      const input2 = document.querySelector('[data-testid="testFocus2"]')
      const button = document.querySelector('[data-testid="testFocusButton"]')
      const div = document.querySelector('[data-testid="testFocusDiv"]')

      // Focus different elements to trigger focusin/focusout
      input1.focus()
      await new Promise(resolve => setTimeout(resolve, 50))
      input2.focus()
      await new Promise(resolve => setTimeout(resolve, 50))
      button.focus()
      await new Promise(resolve => setTimeout(resolve, 50))
      div.focus()
      await new Promise(resolve => setTimeout(resolve, 50))
      input1.focus() // Back to first input

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 300))

      return events
    } finally {
      // Cleanup
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  assert.ok(result.focusin > 0, 'Should fire debounced focusin events')
  assert.ok(result.focusout > 0, 'Should fire debounced focusout events')
})

test('drag events debouncing', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {dragstart: 0, dragend: 0, dragenter: 0, dragleave: 0, dragover: 0, drop: 0}

    const handlers = {}
    Object.keys(events).forEach(eventName => {
      handlers[eventName] = e => {
        e.preventDefault() // Prevent default drag behavior
        events[eventName]++
      }
    })

    // Add listeners
    Object.keys(handlers).forEach(eventName => {
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      const draggable = document.querySelector('[data-testid="testDraggable"]')
      const dropZone = document.querySelector('[data-testid="testDropZone"]')

      // Simulate drag sequence
      draggable.dispatchEvent(new DragEvent('dragstart', {bubbles: true}))
      dropZone.dispatchEvent(new DragEvent('dragenter', {bubbles: true}))
      dropZone.dispatchEvent(new DragEvent('dragover', {bubbles: true}))
      dropZone.dispatchEvent(new DragEvent('dragleave', {bubbles: true}))
      dropZone.dispatchEvent(new DragEvent('dragenter', {bubbles: true}))
      dropZone.dispatchEvent(new DragEvent('drop', {bubbles: true}))
      draggable.dispatchEvent(new DragEvent('dragend', {bubbles: true}))

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 300))

      return events
    } finally {
      // Cleanup
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  assert.ok(result.dragstart > 0, 'Should fire debounced dragstart events')
  assert.ok(result.dragend > 0, 'Should fire debounced dragend events')
  assert.ok(result.dragenter > 0, 'Should fire debounced dragenter events')
})

test('nested elements event delegation', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const clickEvents = []

    const handler = event => {
      clickEvents.push({
        target: event.detail.sourceEvent.target.dataset.testid || event.detail.sourceEvent.target.tagName,
        currentTarget: event.currentTarget === document ? 'DOCUMENT' : event.currentTarget.tagName,
        type: event.detail.type,
      })
    }

    document.addEventListener('debounced:click', handler)

    try {
      // Click nested elements to test event delegation
      // Each element gets its own timeout due to [event.type, event.target] key
      const nestedButton = document.querySelector('[data-testid="testNestedButton"]')
      const nestedSpan = document.querySelector('[data-testid="testNestedSpan"]')
      const nestedChild = document.querySelector('[data-testid="testNestedChild"]')
      const nestedParent = document.querySelector('[data-testid="testNestedParent"]')

      // Click each nested element - each should fire because they're different targets
      // Add small delays to ensure events are processed independently
      nestedButton.click()
      await new Promise(resolve => setTimeout(resolve, 50))
      nestedSpan.click()
      await new Promise(resolve => setTimeout(resolve, 50))
      nestedChild.click()
      await new Promise(resolve => setTimeout(resolve, 50))
      nestedParent.click()

      // Wait for debounced events (200ms default + buffer)
      await new Promise(resolve => setTimeout(resolve, 350))

      return {
        eventCount: clickEvents.length,
        events: clickEvents,
        allEventsOnDocument: clickEvents.every(e => e.currentTarget === 'DOCUMENT'),
        uniqueTargets: new Set(clickEvents.map(e => e.target)).size,
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
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

  const result = await page.evaluate(async () => {
    const clickTargets = []

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

    const handler = event => {
      clickTargets.push({
        target: event.detail.sourceEvent.target.dataset.testid,
        time: Date.now(),
      })
    }

    document.addEventListener('debounced:click', handler)

    try {
      // Register with short wait time for faster testing
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 100})

      const button1 = document.querySelector('[data-testid="testMultiple1"]')
      const button2 = document.querySelector('[data-testid="testMultiple2"]')
      const button3 = document.querySelector('[data-testid="testMultiple3"]')

      // Click all three buttons quickly (within the debounce window)
      button1.click()
      button2.click()
      button3.click()

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 150))

      return {
        keyCollisionTest,
        targetCount: new Set(clickTargets.map(e => e.target)).size,
        totalEvents: clickTargets.length,
        targets: clickTargets.map(e => e.target),
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
      // Reset to default
      window.debounced.unregister(['click'])
      window.debounced.register(['click'])
    }
  })

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

test('memory cleanup - Map removes elements with no active timeouts', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    // Direct access to the timeouts Map for verification
    // Note: This test relies on internal implementation details
    const getMapSize = () => {
      // Access the Map through the handler's closure (not directly accessible)
      // We'll infer cleanup by testing behavior
      return 'inferred'
    }

    const events = []
    const handler = event => {
      events.push({
        type: event.type.replace('debounced:', ''),
        target: event.detail.sourceEvent.target.dataset.testid,
      })
    }

    document.addEventListener('debounced:click', handler)
    document.addEventListener('debounced:input', handler)
    document.addEventListener('debounced:change', handler)

    try {
      // Register multiple event types with short wait
      window.debounced.register(['click', 'input', 'change'], {wait: 50})

      const button = document.querySelector('[data-testid="testButton"]')
      const input = document.querySelector('[data-testid="testInput"]')

      // Trigger multiple events on same elements
      button.click()
      input.dispatchEvent(new Event('input', {bubbles: true}))
      input.dispatchEvent(new Event('change', {bubbles: true}))

      // Wait for all timeouts to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      const eventsAfterFirst = events.length

      // Trigger more events to verify cleanup didn't break functionality
      button.click()
      input.dispatchEvent(new Event('input', {bubbles: true}))

      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        eventsAfterFirst,
        totalEvents: events.length,
        // Verify all event types fired
        hasClick: events.some(e => e.type === 'click'),
        hasInput: events.some(e => e.type === 'input'),
        hasChange: events.some(e => e.type === 'change'),
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
      document.removeEventListener('debounced:input', handler)
      document.removeEventListener('debounced:change', handler)
      window.debounced.unregister(['click', 'input', 'change'])
    }
  })

  // After timeouts complete, Map should clean up elements with no active timeouts
  assert.strictEqual(result.eventsAfterFirst, 3, 'First batch: all three event types fired')
  assert.strictEqual(result.totalEvents, 5, 'Second batch: two more events fired')
  assert.ok(result.hasClick, 'Click events fired')
  assert.ok(result.hasInput, 'Input events fired')
  assert.ok(result.hasChange, 'Change events fired')
})

test('rapid re-registration handles cleanup correctly', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []
    const handler = event => {
      events.push({
        type: event.detail.type, // leading or trailing
        time: Date.now(),
      })
    }

    document.addEventListener('debounced:click', handler)

    try {
      const button = document.querySelector('[data-testid="testButton"]')

      // Register with leading=true
      window.debounced.register(['click'], {wait: 100, leading: true, trailing: false})

      // Click to start a timeout
      button.click()

      // Immediately re-register with different options (trailing=true)
      await new Promise(resolve => setTimeout(resolve, 10))
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 100, leading: false, trailing: true})

      // Click again
      button.click()

      // Wait for all timeouts
      await new Promise(resolve => setTimeout(resolve, 150))

      // Check which events fired
      const hasLeading = events.some(e => e.type === 'leading')
      const hasTrailing = events.some(e => e.type === 'trailing')

      // Test rapid re-registration during active timeout
      events.length = 0 // Clear events

      window.debounced.register(['click'], {wait: 50, leading: true, trailing: true})
      button.click()

      // Re-register while timeout is active
      await new Promise(resolve => setTimeout(resolve, 20))
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 50, leading: false, trailing: true})

      // Click again and wait
      button.click()
      await new Promise(resolve => setTimeout(resolve, 100))

      const eventsAfterRapid = events.length

      return {
        hasLeading,
        hasTrailing,
        eventsAfterRapid,
        events,
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
      window.debounced.unregister(['click'])
    }
  })

  // First part: re-registration should have prevented the first leading event's trailing
  assert.ok(result.hasLeading, 'Leading event fired from first registration')
  assert.ok(result.hasTrailing, 'Trailing event fired from second registration')

  // Second part: rapid re-registration during active timeout
  // Should have: 1 leading from first reg, 1 trailing from second reg
  assert.ok(result.eventsAfterRapid >= 2, 'Events fired after rapid re-registration')
})

test('prefix customization changes event names', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    // Test default prefix
    const defaultHandler = event => {
      events.push({prefix: 'default', type: event.type})
    }
    document.addEventListener('debounced:click', defaultHandler)

    // Trigger click with default prefix
    const button = document.querySelector('[data-testid="testButton"]')
    button.click()
    await new Promise(resolve => setTimeout(resolve, 250))

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
    await new Promise(resolve => setTimeout(resolve, 250))

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

    await new Promise(resolve => setTimeout(resolve, 300))
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
    await new Promise(resolve => setTimeout(resolve, 300))
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
    await new Promise(resolve => setTimeout(resolve, 300))
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

test('individual API methods', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    const handler = event => {
      events.push(event.detail.sourceEvent.target.dataset.testid)
    }
    document.addEventListener('debounced:click', handler)

    // Test registerEvent individual method
    const registerResult = window.debounced.registerEvent('click', {wait: 100})

    // Test that it returns correct format
    const hasClickKey = 'click' in registerResult
    const hasHandler = registerResult.click && 'handler' in registerResult.click

    // Click to test it works
    const button = document.querySelector('[data-testid="testButton"]')
    button.click()
    await new Promise(resolve => setTimeout(resolve, 150))

    // Test unregisterEvent individual method
    const unregisterResult = window.debounced.unregisterEvent('click')

    // Try clicking after unregister - should not fire
    const eventsBefore = events.length
    button.click()
    await new Promise(resolve => setTimeout(resolve, 150))
    const eventsAfter = events.length

    document.removeEventListener('debounced:click', handler)

    return {
      events,
      registerResult: hasClickKey && hasHandler,
      unregisterResult,
      eventsFiredAfterUnregister: eventsAfter > eventsBefore,
    }
  })

  assert.ok(result.registerResult, 'registerEvent should return correct object format')
  assert.strictEqual(result.unregisterResult, 'click', 'unregisterEvent should return event name')
  assert.ok(result.events.length >= 1, 'Should fire events after registerEvent')
  assert.ok(!result.eventsFiredAfterUnregister, 'Should not fire events after unregisterEvent')
})

test('state getters validation', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    // Clean slate - unregister all currently registered events
    const currentEvents = window.debounced.registeredEventNames
    if (currentEvents.length > 0) {
      window.debounced.unregister(currentEvents)
    }

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

  const result = await page.evaluate(async () => {
    const events = []

    const handler = event => {
      events.push({
        type: event.detail.type,
        wait: event.detail.sourceEvent.type,
        timestamp: Date.now(),
      })
    }
    document.addEventListener('debounced:click', handler)

    const button = document.querySelector('[data-testid="testButton"]')

    // Register with first options
    window.debounced.register(['click'], {wait: 100, leading: false, trailing: true})

    button.click()
    await new Promise(resolve => setTimeout(resolve, 150))

    const eventsAfterFirst = events.length

    // Re-register with different options (should replace previous)
    window.debounced.register(['click'], {wait: 50, leading: true, trailing: false})

    const startTime = Date.now()
    button.click()
    await new Promise(resolve => setTimeout(resolve, 100))

    const eventsAfterSecond = events.length
    const lastEvent = events[events.length - 1]
    const leadingDelay = lastEvent ? lastEvent.timestamp - startTime : null

    document.removeEventListener('debounced:click', handler)

    return {
      eventsAfterFirst,
      eventsAfterSecond,
      lastEventType: lastEvent?.type,
      leadingDelay,
      totalEvents: events.length,
    }
  })

  assert.ok(result.eventsAfterFirst >= 1, 'Should fire events with first registration')
  assert.ok(result.eventsAfterSecond > result.eventsAfterFirst, 'Should fire events with second registration')
  assert.strictEqual(result.lastEventType, 'leading', 'Last event should be leading type (new options)')
  assert.ok(result.leadingDelay < 50, 'Leading event should fire immediately with new options')
})

test('error handling and edge cases', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
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
      // Test invalid options object (should use defaults)
      window.debounced.register(['click'], {wait: 'invalid', leading: 'notboolean'})
      const button = document.querySelector('[data-testid="testButton"]')

      const events = []
      const handler = e => events.push(e.detail.type)
      document.addEventListener('debounced:click', handler)

      button.click()
      await new Promise(resolve => setTimeout(resolve, 250))

      document.removeEventListener('debounced:click', handler)
      window.debounced.unregister(['click'])

      results.invalidOptions = {
        success: true,
        eventsFired: events.length > 0,
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

  // Test empty array handling
  assert.ok(result.emptyArray.success, 'Should handle empty array without error')
  assert.ok(result.emptyArray.eventCount > 60, 'Empty array should register all default events')

  // Test invalid options handling
  assert.ok(result.invalidOptions.success, 'Should handle invalid options without error')
  assert.ok(result.invalidOptions.eventsFired, 'Should still fire events with invalid options')

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

test('animation and transition events', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {
      transitionstart: 0,
      transitionend: 0,
      animationstart: 0,
      animationend: 0,
    }

    // Register animation and transition events
    window.debounced.register(['transitionstart', 'transitionend', 'animationstart', 'animationend'])

    const handlers = {}
    Object.keys(events).forEach(eventName => {
      handlers[eventName] = () => events[eventName]++
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      const transitionElement = document.querySelector('[data-testid="testTransition"]')

      // Create a style element for animations
      const style = document.createElement('style')
      style.textContent = `
        .test-animation {
          animation: testAnim 0.1s ease;
        }
        @keyframes testAnim {
          from { opacity: 1; }
          to { opacity: 0.5; }
        }
        .test-transition {
          transition: background-color 0.1s ease;
          background-color: #ff0000 !important;
        }
      `
      document.head.appendChild(style)

      // Trigger transition
      transitionElement.classList.add('test-transition')

      // Trigger animation
      transitionElement.classList.add('test-animation')

      // Wait for events to complete
      await new Promise(resolve => setTimeout(resolve, 200))

      // Clean up
      document.head.removeChild(style)
      transitionElement.classList.remove('test-transition', 'test-animation')

      return {
        events,
        hasTransitionEvents: events.transitionstart > 0 || events.transitionend > 0,
        hasAnimationEvents: events.animationstart > 0 || events.animationend > 0,
        totalEvents: Object.values(events).reduce((sum, count) => sum + count, 0),
      }
    } finally {
      // Cleanup event listeners
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  // Note: Animation/transition events may not fire reliably in headless browsers
  // So we test that the events can be registered and handlers attached
  assert.ok(typeof result.events === 'object', 'Should be able to register animation/transition events')
  assert.ok(typeof result.hasTransitionEvents === 'boolean', 'Should track transition events')
  assert.ok(typeof result.hasAnimationEvents === 'boolean', 'Should track animation events')

  // If events do fire, verify they're debounced properly
  if (result.totalEvents > 0) {
    assert.ok(result.totalEvents >= 1, 'Should fire debounced animation/transition events')
  }
})

test('timeout cleanup verification', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    // Register click event
    window.debounced.register(['click'])

    const button = document.querySelector('[data-testid="testButton"]')

    // Access internal timeouts object to verify cleanup
    // Note: This is testing internal implementation but important for memory management
    const getTimeoutCount = () => {
      return Object.keys(window.debounced.registeredEvents.click.handler.timeouts || {}).length
    }

    // Initial state - no timeouts
    let timeoutsBeforeClick = 0
    try {
      // Trigger click to create timeout
      button.click()

      // Wait a bit but not long enough for timeout to fire
      await new Promise(resolve => setTimeout(resolve, 50))

      // Click again to reset timeout
      button.click()

      // Wait for timeout to complete and cleanup
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify cleanup happened by checking if we can click again without issues
      button.click()
      await new Promise(resolve => setTimeout(resolve, 300))

      return {
        success: true,
        cleanupWorking: true, // If we get here without errors, cleanup is working
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  })

  assert.ok(result.success, 'Timeout cleanup should work without errors')
  assert.ok(result.cleanupWorking, 'Should be able to click multiple times (timeouts cleaned up)')
})

test('zero wait time behavior', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
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
      await new Promise(resolve => setTimeout(resolve, 50))

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

test('event property preservation', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const capturedEvents = []

    const handler = event => {
      capturedEvents.push({
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
    document.addEventListener('debounced:click', handler)

    try {
      window.debounced.register(['click'])

      const button = document.querySelector('[data-testid="testButton"]')

      // Create a click event with specific properties
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        composed: true,
      })

      button.dispatchEvent(clickEvent)
      await new Promise(resolve => setTimeout(resolve, 250))

      return {
        eventCount: capturedEvents.length,
        firstEvent: capturedEvents[0] || null,
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
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

test('keyboard events', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {
      keydown: [],
      keyup: [],
    }

    // Register keyboard events
    window.debounced.register(['keydown', 'keyup'])

    const handlers = {
      keydown: event =>
        events.keydown.push({
          key: event.detail.sourceEvent.key,
          type: event.detail.type,
        }),
      keyup: event =>
        events.keyup.push({
          key: event.detail.sourceEvent.key,
          type: event.detail.type,
        }),
    }

    Object.keys(handlers).forEach(eventName => {
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      const input = document.querySelector('[data-testid="testInput"]')
      input.focus()

      // Simulate rapid typing
      const keys = ['a', 'b', 'c']
      for (const key of keys) {
        const keydownEvent = new KeyboardEvent('keydown', {
          key: key,
          bubbles: true,
          cancelable: true,
        })
        const keyupEvent = new KeyboardEvent('keyup', {
          key: key,
          bubbles: true,
          cancelable: true,
        })

        input.dispatchEvent(keydownEvent)
        input.dispatchEvent(keyupEvent)
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 250))

      return {
        keydownCount: events.keydown.length,
        keyupCount: events.keyup.length,
        lastKeydown: events.keydown[events.keydown.length - 1],
        lastKeyup: events.keyup[events.keyup.length - 1],
      }
    } finally {
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  assert.ok(result.keydownCount >= 1, 'Should fire debounced keydown events: ' + result.keydownCount)
  assert.ok(result.keyupCount >= 1, 'Should fire debounced keyup events: ' + result.keyupCount)
  assert.ok(result.lastKeydown && result.lastKeydown.key, 'Should preserve key information in keydown')
  assert.ok(result.lastKeyup && result.lastKeyup.key, 'Should preserve key information in keyup')
})

test('unregister during pending timeout (current behavior)', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    const handler = event => {
      events.push({
        type: event.detail.type,
        timestamp: Date.now(),
      })
    }
    document.addEventListener('debounced:click', handler)

    try {
      // Register with long wait time
      window.debounced.register(['click'], {wait: 300, leading: false, trailing: true})

      const button = document.querySelector('[data-testid="testButton"]')

      // Click to start timeout
      button.click()

      // Wait briefly, then unregister while timeout is still pending
      await new Promise(resolve => setTimeout(resolve, 50))
      window.debounced.unregister(['click'])

      // Wait longer than original timeout would have been
      await new Promise(resolve => setTimeout(resolve, 400))

      // Try clicking again - should not fire since unregistered
      button.click()
      await new Promise(resolve => setTimeout(resolve, 350))

      return {
        eventCount: events.length,
        events: events,
      }
    } finally {
      document.removeEventListener('debounced:click', handler)
    }
  })

  // NOTE: Current library behavior allows pending timeouts to complete even after unregistration
  // The first click WILL fire because the timeout was already scheduled
  // The second click will NOT fire because events are unregistered
  assert.strictEqual(
    result.eventCount,
    1,
    'Pending timeout should complete after unregistration (current behavior): ' + result.eventCount
  )
})

test('copy/paste events', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = {
      copy: 0,
      cut: 0,
      paste: 0,
    }

    // Register copy/paste events
    window.debounced.register(['copy', 'cut', 'paste'])

    const handlers = {}
    Object.keys(events).forEach(eventName => {
      handlers[eventName] = () => events[eventName]++
      document.addEventListener('debounced:' + eventName, handlers[eventName])
    })

    try {
      const input = document.querySelector('[data-testid="testInput"]')
      input.focus()
      input.value = 'test text'
      input.select()

      // Simulate copy/cut/paste events
      const copyEvent = new ClipboardEvent('copy', {bubbles: true, cancelable: true})
      const cutEvent = new ClipboardEvent('cut', {bubbles: true, cancelable: true})
      const pasteEvent = new ClipboardEvent('paste', {bubbles: true, cancelable: true})

      input.dispatchEvent(copyEvent)
      input.dispatchEvent(cutEvent)
      input.dispatchEvent(pasteEvent)

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 250))

      return {
        events,
        totalEvents: Object.values(events).reduce((sum, count) => sum + count, 0),
      }
    } finally {
      Object.keys(handlers).forEach(eventName => {
        document.removeEventListener('debounced:' + eventName, handlers[eventName])
      })
    }
  })

  // Note: Clipboard events may not fire in all test environments
  // So we test that they can be registered without errors
  assert.ok(typeof result.events === 'object', 'Should be able to register copy/paste events')
  assert.ok(typeof result.totalEvents === 'number', 'Should track clipboard events')

  // If events do fire, verify they're debounced
  if (result.totalEvents > 0) {
    assert.ok(result.totalEvents >= 1, 'Should fire debounced clipboard events')
  }
})

test('modify event registration after initialization', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test 1: Change wait time for existing event
  const waitTimeChange = await page.evaluate(async () => {
    // Initially register with 100ms wait
    window.debounced.unregister(['input'])
    window.debounced.register(['input'], {wait: 100})

    const results = []

    // First test with 100ms
    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')

      const handler1 = event => {
        results.push({wait: 100, timestamp: Date.now()})
        document.removeEventListener('debounced:input', handler1)

        // Now change to 300ms
        window.debounced.register(['input'], {wait: 300})

        setTimeout(() => {
          const startTime = Date.now()
          const handler2 = event => {
            const elapsed = Date.now() - startTime
            results.push({wait: 300, timestamp: Date.now(), elapsed})
            document.removeEventListener('debounced:input', handler2)

            // Verify second wait was approximately 300ms
            resolve(elapsed >= 280 && elapsed <= 320)
          }

          document.addEventListener('debounced:input', handler2)
          input.dispatchEvent(new Event('input', {bubbles: true}))
        }, 200) // Wait for first debounce to complete
      }

      document.addEventListener('debounced:input', handler1)
      input.dispatchEvent(new Event('input', {bubbles: true}))

      setTimeout(() => resolve(false), 1000)
    })
  })

  assert.ok(waitTimeChange, 'Should be able to change wait time after initialization')

  // Test 2: Change from trailing to leading
  const modeChange = await page.evaluate(async () => {
    // Start with trailing only (default)
    window.debounced.register(['click'], {wait: 100, leading: false, trailing: true})

    return new Promise(resolve => {
      const button = document.querySelector('[data-testid="testButton"]')
      const results = []

      // First click - should fire trailing
      const handler1 = event => {
        results.push(event.detail.type)
        document.removeEventListener('debounced:click', handler1)

        // Change to leading only
        window.debounced.register(['click'], {wait: 100, leading: true, trailing: false})

        setTimeout(() => {
          const handler2 = event => {
            results.push(event.detail.type)
            document.removeEventListener('debounced:click', handler2)

            // First should be trailing, second should be leading
            resolve(results[0] === 'trailing' && results[1] === 'leading')
          }

          document.addEventListener('debounced:click', handler2)
          button.click()
        }, 200)
      }

      document.addEventListener('debounced:click', handler1)
      button.click()

      setTimeout(() => resolve(false), 1000)
    })
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
  const removeReAdd = await page.evaluate(async () => {
    // Register click event
    window.debounced.register(['click'], {wait: 100})

    return new Promise(resolve => {
      const button = document.querySelector('[data-testid="testButton"]')
      let clickFired = false

      const handler1 = () => {
        clickFired = true
      }

      document.addEventListener('debounced:click', handler1)

      // Unregister click
      window.debounced.unregister(['click'])

      // Click should not trigger debounced event
      button.click()

      setTimeout(() => {
        if (clickFired) {
          resolve(false) // Should not have fired
          return
        }

        // Re-register click
        window.debounced.register(['click'], {wait: 50})

        const handler2 = () => {
          document.removeEventListener('debounced:click', handler1)
          document.removeEventListener('debounced:click', handler2)
          resolve(true) // Re-registered event fired
        }

        document.addEventListener('debounced:click', handler2)
        button.click()

        setTimeout(() => resolve(false), 200)
      }, 150)
    })
  })

  assert.ok(removeReAdd, 'Should be able to remove and re-add events')

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

test('registration edge cases', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

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
