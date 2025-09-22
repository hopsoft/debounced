import {test} from '@playwright/test'
import assert from 'node:assert'

// Utility function for cleaner async waits
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test.describe('Event Delegation', () => {
  test('nested elements event delegation', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const events = []

      // Create nested structure
      const container = document.createElement('div')
      container.id = 'parent'
      const child = document.createElement('button')
      child.id = 'child'
      const grandchild = document.createElement('span')
      grandchild.id = 'grandchild'
      grandchild.textContent = 'Click me'

      child.appendChild(grandchild)
      container.appendChild(child)
      document.body.appendChild(container)

      // Listen for debounced clicks
      document.addEventListener('debounced:click', event => {
        events.push({
          targetId: event.target.id,
          currentTargetId: event.currentTarget.id || 'document',
          eventPhase: event.eventPhase,
        })
      })

      // Click the deepest element
      grandchild.click()

      // Wait for debounce
      await wait(250)

      // Cleanup
      document.body.removeChild(container)

      return events
    })

    assert.ok(result.length > 0, 'Debounced event should fire')
    assert.strictEqual(result[0].targetId, 'grandchild', 'Event target should be the clicked element')
    assert.ok(result[0].currentTargetId, 'Event should have currentTarget')
  })

  test('multiple targets same event type - verify independent timeouts', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
      const events = []
      const startTime = Date.now()

      // Create two buttons
      const button1 = document.createElement('button')
      button1.id = 'button1'
      button1.textContent = 'Button 1'
      const button2 = document.createElement('button')
      button2.id = 'button2'
      button2.textContent = 'Button 2'

      document.body.appendChild(button1)
      document.body.appendChild(button2)

      // Listen for debounced clicks
      document.addEventListener('debounced:click', event => {
        events.push({
          targetId: event.target.id,
          timestamp: Date.now() - startTime,
        })
      })

      // Scenario: Click button1 multiple times, then button2
      // Use intervals less than 50ms debounce to keep resetting the timeout
      button1.click()
      await wait(10)
      button1.click() // This should reset button1's timeout
      await wait(10)
      button1.click() // One more to ensure we're within debounce window

      // Quickly start button2 while button1's timeout is still pending
      await wait(10)

      // Now click button2 - should have its own independent timeout
      button2.click()
      await wait(10)
      button2.click() // Reset button2's timeout
      await wait(10)
      button2.click() // One more to ensure we're within debounce window

      // Wait for both debounced events to fire
      // Both timeouts should complete after their last click + 50ms
      await wait(100)

      // Cleanup
      document.body.removeChild(button1)
      document.body.removeChild(button2)

      return {
        events,
        button1Events: events.filter(e => e.targetId === 'button1').length,
        button2Events: events.filter(e => e.targetId === 'button2').length,
      }
    })

    assert.strictEqual(result.button1Events, 1, 'Button 1 should fire exactly 1 debounced event')
    assert.strictEqual(result.button2Events, 1, 'Button 2 should fire exactly 1 debounced event')
    assert.strictEqual(result.events.length, 2, 'Total of 2 debounced events should fire')

    // Verify the events fired at different times (independent timeouts)
    if (result.events.length === 2) {
      const timeDiff = Math.abs(result.events[0].timestamp - result.events[1].timestamp)
      assert.ok(timeDiff < 200, 'Events should fire close in time but independently')
    }
  })

  test('custom events debouncing', async ({page, browserName}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Test 1: Basic custom event registration
    const customEventWorks = await page.evaluate(async () => {
      // Clear any existing registrations
      window.debounced.unregisterEvent('myCustomEvent')

      // Register custom event
      window.debounced.registerEvent('myCustomEvent', {wait: 100})

      return new Promise(resolve => {
        let eventFired = false

        // Listen for debounced custom event
        document.addEventListener('debounced:myCustomEvent', event => {
          eventFired = true
        })

        // Dispatch custom event multiple times
        for (let i = 0; i < 3; i++) {
          const customEvent = new CustomEvent('myCustomEvent', {
            bubbles: true,
            detail: {value: i},
          })
          document.dispatchEvent(customEvent)
        }

        // Wait for debounce
        setTimeout(() => {
          window.debounced.unregisterEvent('myCustomEvent')
          resolve(eventFired)
        }, 200)
      })
    })

    assert.ok(customEventWorks, 'Custom event should be debounced')

    // Test 2: Custom event data preservation
    const dataPreservation = await page.evaluate(async () => {
      window.debounced.registerEvent('dataEvent', {wait: 50})

      return new Promise(resolve => {
        let dataCorrect = false

        document.addEventListener('debounced:dataEvent', event => {
          dataCorrect = event.detail.sourceEvent.detail.testData === 'preserved'
        })

        const customEvent = new CustomEvent('dataEvent', {
          bubbles: true,
          detail: {testData: 'preserved'},
        })
        document.dispatchEvent(customEvent)

        setTimeout(() => resolve(dataCorrect), 150)
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

    // Test 5: Custom event on specific element
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
  })
})
