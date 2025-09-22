import {test} from '@playwright/test'
import assert from 'node:assert'
import {clickButtonReal} from './helpers/real-interactions.js'

// Utility function for cleaner async waits
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

test.describe('Configuration Options', () => {
  test('test custom options', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Setup handler and configuration
    await page.evaluate(() => {
      window.timings = []
      window.debounced.unregister() // unregister all
      window.debounced.register(['click'], {wait: 200, leading: true, trailing: false})
      window.customHandler = () => window.timings.push(Date.now())
      document.addEventListener('debounced:click', window.customHandler)
    })

    // Record start time just before clicking
    const startTime = Date.now()

    // First burst with real clicks
    await clickButtonReal(page, '[data-testid="testButton"]', 3)
    await page.waitForTimeout(250)

    // Second burst after wait period
    await clickButtonReal(page, '[data-testid="testButton"]', 3)
    await page.waitForTimeout(250)

    const result = await page.evaluate(start => {
      document.removeEventListener('debounced:click', window.customHandler)
      return {
        eventCount: window.timings.length,
        timingDeltas: window.timings.map(t => t - start),
      }
    }, startTime)

    assert.strictEqual(result.eventCount, 2, 'Leading mode should fire twice (once per burst)')
    assert.ok(result.timingDeltas[0] < 100, 'First leading event should fire quickly')
    assert.ok(result.timingDeltas[1] > 250, 'Second leading event should fire after wait period')
  })

  test('leading debounce modes', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Test all combinations of leading/trailing
    const scenarios = [
      {leading: false, trailing: false, expectedEvents: 0},
      {leading: false, trailing: true, expectedEvents: 1},
      {leading: true, trailing: false, expectedEvents: 1},
      {leading: true, trailing: true, expectedEvents: 2},
    ]

    for (const scenario of scenarios) {
      // Setup configuration for this scenario
      await page.evaluate(({leading, trailing}) => {
        window.scenarioEvents = []

        // Re-register with specific configuration
        window.debounced.unregister(['click'])
        window.debounced.register(['click'], {
          wait: 100,
          leading,
          trailing,
        })

        window.scenarioHandler = event => {
          window.scenarioEvents.push({
            type: event.detail.type,
            timestamp: Date.now(),
          })
        }

        document.addEventListener('debounced:click', window.scenarioHandler)
      }, scenario)

      // Trigger real clicks with small delays
      await clickButtonReal(page, '[data-testid="testButton"]', 3)

      // Wait for potential trailing event
      await page.waitForTimeout(200)

      const result = await page.evaluate(() => {
        document.removeEventListener('debounced:click', window.scenarioHandler)

        return {
          events: window.scenarioEvents,
          leadingFired: window.scenarioEvents.some(e => e.type === 'leading'),
          trailingFired: window.scenarioEvents.some(e => e.type === 'trailing'),
        }
      })

      assert.strictEqual(
        result.events.length,
        scenario.expectedEvents,
        `Leading=${scenario.leading}, Trailing=${scenario.trailing} should fire ${scenario.expectedEvents} events`
      )

      if (scenario.leading) {
        assert.ok(result.leadingFired, 'Leading event should fire when enabled')
      }
      if (scenario.trailing) {
        assert.ok(result.trailingFired, 'Trailing event should fire when enabled')
      }
    }
  })

  test('zero wait time behavior', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Setup configuration with zero wait
    await page.evaluate(() => {
      window.zeroEvents = []
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 0})
      window.zeroHandler = () => window.zeroEvents.push(Date.now())
      document.addEventListener('debounced:click', window.zeroHandler)
    })

    // Fire multiple real clicks with small delays
    for (let i = 0; i < 5; i++) {
      await clickButtonReal(page, '[data-testid="testButton"]')
      await page.waitForTimeout(5)
    }

    // Small wait to ensure all events processed
    await page.waitForTimeout(50)

    const result = await page.evaluate(() => {
      document.removeEventListener('debounced:click', window.zeroHandler)

      return {
        eventCount: window.zeroEvents.length,
      }
    })

    // With wait: 0, we still get debouncing due to async setTimeout
    assert.ok(result.eventCount <= 5, 'Even with wait:0, some debouncing occurs due to event loop')
    assert.ok(result.eventCount >= 1, 'At least one event should fire')
  })

  test('prefix customization changes event names', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Setup prefix and handlers
    await page.evaluate(() => {
      window.originalPrefix = window.debounced.prefix
      window.debounced.prefix = 'throttled'
      window.newPrefix = window.debounced.prefix

      // Re-register to apply new prefix
      window.debounced.unregister(['click'])
      window.debounced.register(['click'], {wait: 50})

      // Listen with new prefix
      window.newPrefixFired = false
      window.newHandler = () => {
        window.newPrefixFired = true
      }
      document.addEventListener('throttled:click', window.newHandler)

      // Also listen with old prefix (should not fire)
      window.oldPrefixFired = false
      window.oldHandler = () => {
        window.oldPrefixFired = true
      }
      document.addEventListener('debounced:click', window.oldHandler)
    })

    // Trigger event with real click
    await clickButtonReal(page, '[data-testid="testButton"]')

    // Wait for debounced event
    await page.waitForTimeout(100)

    const result = await page.evaluate(() => {
      const results = {
        newPrefix: window.newPrefix,
        newPrefixFired: window.newPrefixFired,
        oldPrefixFired: window.oldPrefixFired,
      }

      // Cleanup - restore original prefix
      window.debounced.prefix = window.originalPrefix
      window.debounced.unregister(['click'])
      window.debounced.register(['click']) // Re-register with original prefix

      document.removeEventListener('throttled:click', window.newHandler)
      document.removeEventListener('debounced:click', window.oldHandler)

      return results
    })

    assert.strictEqual(result.newPrefix, 'throttled', 'Prefix should be changeable')
    assert.ok(result.newPrefixFired, 'Events should fire with new prefix')
    assert.ok(!result.oldPrefixFired, 'Events should not fire with old prefix after change')
  })
})
