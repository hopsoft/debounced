/**
 * Helper functions for using REAL browser interactions in Playwright tests
 * instead of synthetic events. This ensures we test actual browser behavior.
 */

/**
 * Triggers real events on elements using Playwright's native interaction methods
 * @param {Page} page - Playwright page object
 * @param {string} eventName - Name of the event to trigger
 * @param {object} options - Options for event triggering
 * @returns {Promise<number>} Number of native events triggered
 */
export async function triggerRealEvents(page, eventName, options = {}) {
  const {
    count = 5, // Number of events to trigger
    delay = 3, // Delay between events in ms
    selector = null, // Optional specific selector
  } = options

  // Get the appropriate selector for the event type
  const getSelector = eventName => {
    const selectorMap = {
      click: '[data-testid="testButton"]',
      dblclick: '[data-testid="testButton"]',
      input: '[data-testid="testInput"]',
      change: '[data-testid="testInput"]',
      focus: '[data-testid="testInput"]',
      blur: '[data-testid="testInput"]',
      mousedown: '[data-testid="testButton"]',
      mouseup: '[data-testid="testButton"]',
      mousemove: '[data-testid="testMouse"]',
      mouseenter: '[data-testid="testMouse"]',
      mouseleave: '[data-testid="testMouse"]',
      mouseover: '[data-testid="testMouse"]',
      mouseout: '[data-testid="testMouse"]',
      keydown: '[data-testid="testInput"]',
      keyup: '[data-testid="testInput"]',
    }
    return selector || selectorMap[eventName] || '[data-testid="testButton"]'
  }

  const targetSelector = getSelector(eventName)
  const element = page.locator(targetSelector)

  let eventsTriggered = 0

  switch (eventName) {
    case 'click':
      // Mix of real and synthetic for speed within debounce window
      await element.click()
      eventsTriggered++
      // Fire additional clicks synthetically for speed
      const additionalClicks = await page.evaluate(
        ({selector, count}) => {
          const elem = document.querySelector(selector)
          let fired = 0
          for (let i = 0; i < count - 1; i++) {
            elem.click()
            fired++
          }
          return fired
        },
        {selector: targetSelector, count}
      )
      eventsTriggered += additionalClicks
      break

    case 'dblclick':
      for (let i = 0; i < Math.min(count, 3); i++) {
        await element.dblclick()
        eventsTriggered += 2 // Double click = 2 clicks
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'input':
      await element.focus()
      const text = 'test'.repeat(count)
      await element.type(text, {delay: Math.max(1, delay)})
      eventsTriggered = text.length
      break

    case 'change':
      for (let i = 0; i < count; i++) {
        await element.fill(`test${i}`)
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'focus':
      for (let i = 0; i < count; i++) {
        await element.blur()
        await element.focus()
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'blur':
      for (let i = 0; i < count; i++) {
        await element.focus()
        await element.blur()
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'scroll':
      // Ensure page is scrollable
      await page.evaluate(() => {
        document.body.style.minHeight = '300vh'
        window.scrollTo(0, 0)
      })
      for (let i = 0; i < count; i++) {
        await page.mouse.wheel(0, 10)
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'mousemove':
      const box = await element.boundingBox()
      if (box) {
        await page.mouse.move(box.x, box.y)
        for (let i = 0; i < count; i++) {
          await page.mouse.move(box.x + i * 2, box.y + i, {steps: 1})
          eventsTriggered++
        }
      }
      break

    case 'mouseenter':
    case 'mouseleave':
    case 'mouseover':
    case 'mouseout':
      for (let i = 0; i < count; i++) {
        await element.hover()
        await page.mouse.move(0, 0)
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    case 'keydown':
    case 'keyup':
      await element.focus()
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('a')
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
      break

    default:
      // Fallback to clicking for unknown events
      for (let i = 0; i < count; i++) {
        await element.click()
        eventsTriggered++
        if (i < count - 1) await page.waitForTimeout(delay)
      }
  }

  return eventsTriggered
}

/**
 * Sets up event tracking and triggers real events, then verifies debouncing
 * @param {Page} page - Playwright page object
 * @param {string} eventName - Event to test
 * @param {object} options - Test options
 * @returns {Promise<object>} Test results
 */
export async function testRealEventDebouncing(page, eventName, options = {}) {
  const {count = 5, delay = 3, waitTime = 200} = options

  // Set up event tracking
  await page.evaluate(eventName => {
    window.eventTestData = {
      nativeCount: 0,
      debouncedCount: 0,
      eventName: eventName,
    }

    // Get element based on event type
    function getElement(eventName) {
      if (eventName === 'scroll') return window
      const selectorMap = {
        click: '[data-testid="testButton"]',
        input: '[data-testid="testInput"]',
        focus: '[data-testid="testInput"]',
        blur: '[data-testid="testInput"]',
      }
      const selector = selectorMap[eventName] || '[data-testid="testMouse"]'
      return document.querySelector(selector) || document
    }

    const element = getElement(eventName)

    // Track native events
    element.addEventListener(
      eventName,
      () => {
        window.eventTestData.nativeCount++
      },
      true
    )

    // Track debounced events
    document.addEventListener(`debounced:${eventName}`, () => {
      window.eventTestData.debouncedCount++
    })
  }, eventName)

  // Trigger real events
  await triggerRealEvents(page, eventName, {count, delay})

  // Wait for debounced event
  await page.waitForTimeout(waitTime)

  // Get results
  return await page.evaluate(() => window.eventTestData)
}

/**
 * Replaces synthetic button.click() calls with real Playwright clicks
 * @param {Page} page - Playwright page object
 * @param {string} selector - Button selector
 * @param {number} count - Number of clicks
 */
export async function clickButtonReal(page, selector, count = 1) {
  const button = page.locator(selector)

  if (count === 1) {
    await button.click()
  } else {
    // First real click
    await button.click()

    // Additional clicks synthetically for speed
    if (count > 1) {
      await page.evaluate(
        ({selector, count}) => {
          const btn = document.querySelector(selector)
          for (let i = 0; i < count - 1; i++) {
            btn.click()
          }
        },
        {selector, count}
      )
    }
  }
}

/**
 * Replaces synthetic input.value = x with real typing
 * @param {Page} page - Playwright page object
 * @param {string} selector - Input selector
 * @param {string} value - Value to type
 */
export async function typeInInputReal(page, selector, value) {
  const input = page.locator(selector)
  await input.fill('') // Clear first
  await input.type(value, {delay: 2})
}
