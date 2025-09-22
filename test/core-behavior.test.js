import {test} from '@playwright/test'
import assert from 'node:assert'
import {clickButtonReal} from './helpers/real-interactions.js'

// Utility function for cleaner async waits
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

// Helper function using REAL Playwright interactions instead of synthetic events
async function testEventWithRealInteractions(page, eventName) {
  // Set up event listeners
  await page.evaluate(eventName => {
    window.testEventData = {
      nativeCount: 0,
      debouncedCount: 0,
      eventName: eventName,
    }

    // Get appropriate element for event type
    const elementMap = {
      input: '[data-testid="testInput"]',
      change: '[data-testid="testInput"]',
      click: '[data-testid="testButton"]',
      dblclick: '[data-testid="testButton"]',
      focus: '[data-testid="testInput"]',
      blur: '[data-testid="testInput"]',
    }

    function getElementForEvent(eventName) {
      if (eventName === 'scroll') return window
      const selector = elementMap[eventName] || '[data-testid="testMouse"]'
      return document.querySelector(selector) || document
    }

    const element = getElementForEvent(eventName)

    // Native event listener
    element.addEventListener(
      eventName,
      event => {
        window.testEventData.nativeCount++
        // Track targets for debugging
        if (!window.testEventData.nativeTargets) {
          window.testEventData.nativeTargets = []
        }
        const targetInfo =
          event.target === window
            ? 'window'
            : event.target === document
              ? 'document'
              : event.target === document.documentElement
                ? 'html'
                : event.target === document.body
                  ? 'body'
                  : event.target.id || event.target.tagName || 'unknown'
        window.testEventData.nativeTargets.push(targetInfo)
      },
      true
    )

    // Debounced event listener
    document.addEventListener(`debounced:${eventName}`, event => {
      window.testEventData.debouncedCount++
      // Track targets for debugging
      if (!window.testEventData.debouncedTargets) {
        window.testEventData.debouncedTargets = []
      }
      const targetInfo =
        event.target === window
          ? 'window'
          : event.target === document
            ? 'document'
            : event.target === document.documentElement
              ? 'html'
              : event.target === document.body
                ? 'body'
                : event.target.id || event.target.tagName || 'unknown'
      window.testEventData.debouncedTargets.push(targetInfo)
    })
  }, eventName)

  // Trigger events using REAL Playwright interactions
  const button = page.locator('[data-testid="testButton"]')
  const input = page.locator('[data-testid="testInput"]')
  const mouseArea = page.locator('[data-testid="testMouse"]')

  // Fire multiple events rapidly within debounce window using REAL interactions
  // IMPORTANT: Keep delays short to ensure events fire within 50ms debounce window
  switch (eventName) {
    case 'click':
      // Use a mix of real clicks and synthetic for speed
      // First real click to ensure proper focus/interaction
      await button.click()
      // Then fire more clicks synthetically within the page
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="testButton"]')
        for (let i = 0; i < 4; i++) {
          btn.click()
        }
      })
      break
    case 'dblclick':
      for (let i = 0; i < 3; i++) {
        await button.dblclick()
        await page.waitForTimeout(3)
      }
      break
    case 'input':
      // Type multiple characters rapidly
      await input.focus()
      await input.type('testtext', {delay: 3})
      break
    case 'change':
      for (let i = 0; i < 5; i++) {
        await input.fill(`test${i}`)
        await page.waitForTimeout(3)
      }
      break
    case 'focus':
      for (let i = 0; i < 5; i++) {
        await input.blur() // Blur first
        await input.focus()
        await page.waitForTimeout(3)
      }
      break
    case 'blur':
      for (let i = 0; i < 5; i++) {
        await input.focus()
        await input.blur()
        await page.waitForTimeout(3)
      }
      break
    case 'mousemove':
      // Continuous mouse movement in small steps
      const box = await mouseArea.boundingBox()
      if (box) {
        await page.mouse.move(box.x, box.y)
        // Move in a smooth line with many small steps
        for (let i = 0; i < 20; i++) {
          await page.mouse.move(box.x + i * 2, box.y + i, {steps: 1})
          // No delay - continuous movement
        }
      }
      break
    case 'mouseout':
    case 'mouseover':
      for (let i = 0; i < 8; i++) {
        await mouseArea.hover()
        await page.mouse.move(0, 0)
        await page.waitForTimeout(5)
      }
      break
    case 'scroll':
      // Make page scrollable first
      await page.evaluate(() => {
        document.body.style.height = '200vh'
        window.scrollTo(0, 0)
      })
      // Use real scrolling which fires events properly
      for (let i = 0; i < 8; i++) {
        await page.evaluate(() => window.scrollBy(0, 10))
        await page.waitForTimeout(2) // Small delay to stay within debounce window
      }
      break
    default:
      // For unsupported events, click the button as fallback
      for (let i = 0; i < 8; i++) {
        await button.click()
        await page.waitForTimeout(5)
      }
  }

  // Wait for debounced event (50ms debounce + buffer)
  await page.waitForTimeout(200)

  // Get results
  const result = await page.evaluate(() => window.testEventData)

  // Special handling for continuous events that might fire differently
  const continuousEvents = ['mousemove', 'scroll', 'mouseover', 'mouseout']
  const isContinuous = continuousEvents.includes(eventName)

  // For continuous events like scroll and mousemove, browser behavior varies
  // What matters is that events are debounced, not the exact count
  if (isContinuous) {
    assert.ok(
      result.debouncedCount >= 1 && result.debouncedCount <= 2,
      `Debounced ${eventName} should fire 1-2 times (got ${result.debouncedCount})`
    )
  } else {
    assert.ok(
      result.debouncedCount === 1,
      `Debounced ${eventName} should fire exactly once (got ${result.debouncedCount})`
    )
  }

  // For continuous events, we just need at least 2 native events to prove multiple events fired
  // For discrete events, we expect more consistent firing
  const minNativeEvents = isContinuous ? 2 : 5
  assert.ok(
    result.nativeCount >= minNativeEvents,
    `Multiple native ${eventName} events should fire (got ${result.nativeCount}, expected at least ${minNativeEvents})`
  )

  return result
}

// Helper function for testing single events (keeping old one for compatibility)
async function testSingleEvent(page, eventName) {
  // Use the new real interactions version
  return testEventWithRealInteractions(page, eventName)
}

// Original helper for tests that haven't been updated yet
async function testSingleEventLegacy(page, eventName) {
  const result = await page.evaluate(async eventName => {
    return new Promise(async (resolve, reject) => {
      let eventHandlerCalled = false
      let nativeEventCount = 0
      const debouncedHandler = event => {
        eventHandlerCalled = true
      }
      const nativeHandler = () => {
        nativeEventCount++
      }
      // Get appropriate element for event type
      const elementMap = {
        input: '[data-testid="testInput"]',
        change: '[data-testid="testInput"]',
        click: '[data-testid="testButton"]',
        dblclick: '[data-testid="testButton"]',
      }

      function getElementForEvent(eventName) {
        if (eventName === 'scroll') return document
        const selector = elementMap[eventName] || '[data-testid="testMouse"]'
        return document.querySelector(selector)
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
            element.dispatchEvent(new MouseEvent('mousemove', {bubbles: true, clientX: 100, clientY: 100}))
            break
          default:
            element.dispatchEvent(new Event(eventName, {bubbles: true}))
        }
      }

      const element = getElementForEvent(eventName)
      if (!element) return reject(new Error(`No test element found for ${eventName}`))

      // Set up listeners
      document.addEventListener(`debounced:${eventName}`, debouncedHandler)
      element.addEventListener(eventName, nativeHandler, true)

      // Trigger multiple events rapidly within the debounce window
      // Fire 8 events with 5ms intervals = 40ms total (within 50ms window)
      for (let i = 0; i < 8; i++) {
        await triggerEvent(element, eventName)
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      // Wait for debounced event
      // 50ms debounce * 4 = 200ms minimum wait
      await new Promise(resolve => setTimeout(resolve, 200))

      // Cleanup
      document.removeEventListener(`debounced:${eventName}`, debouncedHandler)
      element.removeEventListener(eventName, nativeHandler, true)

      resolve({
        eventHandlerCalled,
        nativeEventCount,
        eventName,
      })
    })
  }, eventName)

  assert.ok(result.eventHandlerCalled, `Debounced ${result.eventName} event should fire`)
  assert.ok(
    result.nativeEventCount >= 3,
    `Multiple native ${result.eventName} events should fire (got ${result.nativeEventCount})`
  )
}

test.describe('Core Debouncing Behavior', () => {
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

  test('cross-browser compatibility', async ({page, browserName}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Set up event listener
    await page.evaluate(() => {
      window.browserTestEvents = []
      document.addEventListener('debounced:click', event => {
        window.browserTestEvents.push(Date.now())
      })
    })

    // Use hybrid approach - one real click followed by synthetic clicks
    // This ensures all clicks happen within the debounce window
    await clickButtonReal(page, '[data-testid="testButton"]', 8)

    // Wait for debounced event to fire (50ms debounce * 4 = 200ms)
    await page.waitForTimeout(200)

    // Get results
    const result = await page.evaluate(browserName => {
      return {browserName, eventsLength: window.browserTestEvents.length}
    }, browserName)

    // Basic sanity check - debouncing should work in all browsers
    assert.ok(result, `Debouncing should work in ${browserName}`)
    assert.strictEqual(result.eventsLength, 1, `Should have exactly 1 debounced event in ${browserName}`)
  })
})
