import {test} from '@playwright/test'
import assert from 'assert'

test('Quick Start - basic initialization and listening', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const quickStartWorks = await page.evaluate(async () => {
    // README lines 47-54: Basic initialization and event listening
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize()

    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')
      let eventFired = false

      document.addEventListener('debounced:input', event => {
        eventFired = true
        resolve(event.target.value === 'test value')
      })

      input.value = 'test value'
      input.dispatchEvent(new Event('input', {bubbles: true}))

      setTimeout(() => resolve(eventFired), 300)
    })
  })

  assert.ok(quickStartWorks, 'Quick Start example should work')
})

test('Common Use Cases - search as you type', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Ensure library is initialized
  await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize(['input'])
  })

  // Test search as you type (lines 62-65)
  const searchWorks = await page.evaluate(async () => {
    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')
      let searchValue = null

      const performSearch = value => {
        searchValue = value
      }

      input.addEventListener('debounced:input', event => {
        performSearch(event.target.value)
      })

      input.value = 'search query'
      input.dispatchEvent(new Event('input', {bubbles: true}))

      setTimeout(() => resolve(searchValue === 'search query'), 300)
    })
  })

  assert.ok(searchWorks, 'Search as you type should work')
})

test('Common Use Cases - button click protection', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test button click protection (lines 72-75)
  const clickProtectionWorks = await page.evaluate(async () => {
    window.debounced.register(['click'], {wait: 200})

    return new Promise(resolve => {
      const button = document.querySelector('[data-testid="testButton"]')
      let submitCount = 0

      const submitForm = () => {
        submitCount++
      }

      button.addEventListener('debounced:click', event => {
        submitForm()
      })

      // Rapid clicks
      button.click()
      button.click()
      button.click()

      setTimeout(() => resolve(submitCount === 1), 300)
    })
  })

  assert.ok(clickProtectionWorks, 'Button click protection should prevent double-submits')
})

test('Common Use Cases - keyboard shortcuts', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test keyboard shortcut with modifiers (lines 77-84)
  const keyboardShortcutWorks = await page.evaluate(async () => {
    window.debounced.register(['keydown'], {wait: 100})

    return new Promise(resolve => {
      let saveDocumentCalled = false

      const saveDocument = () => {
        saveDocumentCalled = true
      }

      document.addEventListener('debounced:keydown', event => {
        const original = event.detail.sourceEvent
        if (original.key === 's' && (original.ctrlKey || original.metaKey)) {
          saveDocument()
        }
      })

      const keyEvent = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      })
      document.dispatchEvent(keyEvent)

      setTimeout(() => resolve(saveDocumentCalled), 250)
    })
  })

  assert.ok(keyboardShortcutWorks, 'Keyboard shortcut with modifiers should work')
})

test('Common Use Cases - infinite scroll', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test infinite scroll with proper scrollable content
  const scrollWorks = await page.evaluate(async () => {
    // Make page scrollable
    const content = document.createElement('div')
    content.style.height = '3000px'
    content.style.background = 'linear-gradient(to bottom, #f0f0f0, #333)'
    document.body.appendChild(content)

    // Register scroll event
    window.debounced.register(['scroll'], {wait: 100})

    return new Promise(resolve => {
      let loadMoreCalled = false

      const nearBottom = () => true
      const loadMoreContent = () => {
        loadMoreCalled = true
      }

      window.addEventListener('debounced:scroll', event => {
        if (nearBottom()) loadMoreContent()
      })

      // Trigger scroll
      window.scrollTo(0, 100)

      setTimeout(() => {
        document.body.removeChild(content)
        resolve(loadMoreCalled)
      }, 300)
    })
  })

  assert.ok(scrollWorks, 'Infinite scroll should work')
})

test('Initialization Options', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Wait for library to be ready
  await page.waitForFunction(() => window.debounced)

  // Test initialize all events (lines 164-165)
  const initAllWorks = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize()
    // Check if we have all the default events registered
    return window.debounced.registeredEventNames.length === window.debounced.defaultEventNames.length
  })

  assert.ok(initAllWorks, 'Initialize all should register all default events')

  // Test initialize specific events (lines 167-168)
  const initSpecificWorks = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize(['input', 'scroll', 'resize'])
    return JSON.stringify(window.debounced.registeredEventNames.sort())
  })

  assert.strictEqual(
    initSpecificWorks,
    JSON.stringify(['input', 'resize', 'scroll']),
    'Initialize specific events should work'
  )

  // Test initialize with custom timing (lines 170-171)
  const initCustomWorks = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize(['input'], {wait: 300})
    return window.debounced.registeredEvents.input.wait === 300
  })

  assert.ok(initCustomWorks, 'Initialize with custom timing should work')
})

test('Event Data Access and Properties', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test accessing element properties directly (lines 192-211)
  const propertiesWork = await page.evaluate(async () => {
    window.debounced.register(['input', 'change'], {wait: 100})

    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')
      const checkbox = document.querySelector('[data-testid="testCheckbox1"]')
      const results = {}

      document.addEventListener('debounced:input', event => {
        // Lines 198-200: Access element properties directly
        results.inputValue = event.target.value
        results.inputId = event.target.id

        // Lines 203-208: Access original event properties
        const originalEvent = event.detail.sourceEvent
        results.originalType = originalEvent.constructor.name
        results.hasTimeStamp = typeof originalEvent.timeStamp === 'number'

        // Line 210: Check debounce timing
        results.timing = event.detail.type
      })

      document.addEventListener('debounced:change', event => {
        results.checkboxChecked = event.target.checked
      })

      // Set values and trigger events
      input.id = 'test-input-id'
      input.value = 'test input value'
      input.dispatchEvent(new Event('input', {bubbles: true}))

      checkbox.checked = true
      checkbox.dispatchEvent(new Event('change', {bubbles: true}))

      setTimeout(() => {
        resolve(
          results.inputValue === 'test input value' &&
            results.inputId === 'test-input-id' &&
            results.checkboxChecked === true &&
            results.originalType === 'Event' &&
            results.hasTimeStamp === true &&
            results.timing === 'trailing'
        )
      }, 200)
    })
  })

  assert.ok(propertiesWork, 'Event data access and properties should work as documented')
})

test('Custom Wait Times', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test different wait times for different use cases (lines 237-240)
  const customTimingsWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Set different wait times as shown in README
    window.debounced.register(['input'], {wait: 300}) // Search: wait longer
    window.debounced.register(['scroll'], {wait: 50}) // Scroll: more responsive
    window.debounced.register(['mousemove'], {wait: 16}) // Animation: 60fps

    const events = window.debounced.registeredEvents
    return events.input.wait === 300 && events.scroll.wait === 50 && events.mousemove.wait === 16
  })

  assert.ok(customTimingsWork, 'Custom wait times should work for different use cases')
})

test('Event Management - add, modify, remove', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test adding events after initialization (lines 258-266)
  const addEventsWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.initialize(['input'])

    // Add new events anytime
    window.debounced.register(['focus', 'blur'], {wait: 100})

    // Register individual event
    window.debounced.registerEvent('customEvent', {wait: 250})

    // Mix with existing events
    window.debounced.register(['resize'], {wait: 150})

    const names = window.debounced.registeredEventNames.sort()
    return (
      names.length === 5 &&
      names.includes('input') &&
      names.includes('focus') &&
      names.includes('blur') &&
      names.includes('customEvent') &&
      names.includes('resize')
    )
  })

  assert.ok(addEventsWork, 'Adding events after initialization should work')

  // Test modifying existing registrations (lines 273-285)
  const modifyEventsWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Initial registration
    window.debounced.register(['input'], {wait: 200, trailing: true})
    const initial = window.debounced.registeredEvents.input

    // Change wait time
    window.debounced.register(['input'], {wait: 500})
    const afterWaitChange = window.debounced.registeredEvents.input

    // Change to leading mode
    window.debounced.register(['input'], {wait: 300, leading: true, trailing: false})
    const afterModeChange = window.debounced.registeredEvents.input

    return (
      initial.wait === 200 &&
      initial.trailing === true &&
      afterWaitChange.wait === 500 &&
      afterWaitChange.trailing === true && // defaults restored
      afterWaitChange.leading === false && // defaults restored
      afterModeChange.wait === 300 &&
      afterModeChange.leading === true &&
      afterModeChange.trailing === false
    )
  })

  assert.ok(modifyEventsWork, 'Modifying existing registrations should replace configuration')

  // Test removing events (lines 291-299)
  const removeEventsWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.register(['input', 'scroll', 'click', 'mousemove'], {wait: 100})

    // Unregister specific events
    window.debounced.unregister(['input', 'scroll'])
    const afterUnregister = window.debounced.registeredEventNames.sort()

    // Unregister single event
    window.debounced.unregisterEvent('mousemove')
    const afterUnregisterEvent = window.debounced.registeredEventNames

    // Unregister everything
    window.debounced.unregister(window.debounced.registeredEventNames)
    const afterUnregisterAll = window.debounced.registeredEventNames

    return (
      afterUnregister.length === 2 &&
      afterUnregister.includes('click') &&
      afterUnregister.includes('mousemove') &&
      afterUnregisterEvent.length === 1 &&
      afterUnregisterEvent.includes('click') &&
      afterUnregisterAll.length === 0
    )
  })

  assert.ok(removeEventsWork, 'Removing events should work')

  // Test checking registration status (lines 304-311)
  const statusCheckWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.register(['input', 'scroll', 'click'], {wait: 300})

    const names = window.debounced.registeredEventNames.sort()
    const events = window.debounced.registeredEvents

    return (
      names.length === 3 &&
      names[0] === 'click' &&
      names[1] === 'input' &&
      names[2] === 'scroll' &&
      events.input.wait === 300 &&
      events.input.leading === false &&
      events.input.trailing === true &&
      typeof events.input.handler === 'function'
    )
  })

  assert.ok(statusCheckWork, 'Checking registration status should work')
})

test('Leading vs Trailing Modes', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test trailing only mode - default (lines 323-329)
  const trailingOnlyWorks = await page.evaluate(async () => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.register(['input'], {
      wait: 100,
      leading: false,
      trailing: true,
    })

    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')
      const events = []

      document.addEventListener('debounced:input', event => {
        events.push(event.detail.type)
      })

      // Fire multiple events quickly
      input.dispatchEvent(new Event('input', {bubbles: true}))
      setTimeout(() => input.dispatchEvent(new Event('input', {bubbles: true})), 20)
      setTimeout(() => input.dispatchEvent(new Event('input', {bubbles: true})), 40)

      setTimeout(() => {
        resolve(events.length === 1 && events[0] === 'trailing')
      }, 200)
    })
  })

  assert.ok(trailingOnlyWorks, 'Trailing only mode should fire after user stops')

  // Test leading only mode (lines 331-337)
  const leadingOnlyWorks = await page.evaluate(async () => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.register(['click'], {
      wait: 200,
      leading: true,
      trailing: false,
    })

    return new Promise(resolve => {
      const button = document.querySelector('[data-testid="testButton"]')
      const events = []

      document.addEventListener('debounced:click', event => {
        events.push(event.detail.type)
      })

      // Multiple clicks
      button.click()
      setTimeout(() => button.click(), 50)
      setTimeout(() => button.click(), 100)

      setTimeout(() => {
        resolve(events.length === 1 && events[0] === 'leading')
      }, 400)
    })
  })

  assert.ok(leadingOnlyWorks, 'Leading only mode should fire immediately and ignore subsequent')

  // Test both leading and trailing (lines 339-344)
  const bothModesWork = await page.evaluate(async () => {
    window.debounced.unregister(window.debounced.registeredEventNames)
    window.debounced.register(['click'], {
      wait: 100,
      leading: true,
      trailing: true,
    })

    return new Promise(resolve => {
      const events = []
      const button = document.querySelector('[data-testid="testButton"]')

      document.addEventListener('debounced:click', event => {
        events.push(event.detail.type)
      })

      button.click()

      setTimeout(() => {
        resolve(events.length === 2 && events[0] === 'leading' && events[1] === 'trailing')
      }, 200)
    })
  })

  assert.ok(bothModesWork, 'Both leading and trailing modes should fire')
})

test('Custom Event Prefix', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test custom event prefix (lines 375-384)
  const customPrefixWorks = await page.evaluate(async () => {
    // Clean up any existing registrations
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Must set before initialization
    window.debounced.prefix = 'throttled'
    window.debounced.register(['input', 'click'])

    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')
      const button = document.querySelector('[data-testid="testButton"]')
      let throttledInputFired = false
      let throttledClickFired = false

      // Listen with custom prefix
      document.addEventListener('throttled:input', () => {
        throttledInputFired = true
      })

      document.addEventListener('throttled:click', () => {
        throttledClickFired = true
      })

      input.dispatchEvent(new Event('input', {bubbles: true}))
      button.click()

      setTimeout(() => {
        // Reset prefix for other tests
        window.debounced.prefix = 'debounced'
        resolve(throttledInputFired && throttledClickFired)
      }, 300)
    })
  })

  assert.ok(customPrefixWorks, 'Custom event prefix should work')
})

test('Performance Best Practices', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test registering only what you need (lines 394-402)
  const bestPracticesWork = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Good: Register only what you need
    window.debounced.initialize(['input', 'scroll', 'resize'])
    const specificCount = window.debounced.registeredEventNames.length

    // Good: Appropriate timing for each use case
    window.debounced.register(['input'], {wait: 300}) // User typing
    window.debounced.register(['scroll'], {wait: 50}) // Smooth scrolling
    window.debounced.register(['resize'], {wait: 200}) // Window resizing

    const events = window.debounced.registeredEvents

    return specificCount === 3 && events.input.wait === 300 && events.scroll.wait === 50 && events.resize.wait === 200
  })

  assert.ok(bestPracticesWork, 'Performance best practices should work')
})

test('Re-registration Behavior', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Test re-registration examples from README (lines 583-592)
  const reregistrationWorks = await page.evaluate(() => {
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Start with quick response for typing
    window.debounced.register(['input'], {wait: 100})
    const quick = window.debounced.registeredEvents.input

    // User enables "slow mode"
    window.debounced.register(['input'], {wait: 500})
    const slow = window.debounced.registeredEvents.input

    // Switch to instant feedback
    window.debounced.register(['input'], {wait: 50, leading: true})
    const instant = window.debounced.registeredEvents.input

    return (
      quick.wait === 100 &&
      quick.leading === false &&
      quick.trailing === true &&
      slow.wait === 500 &&
      slow.leading === false && // defaults restored
      slow.trailing === true && // defaults restored
      instant.wait === 50 &&
      instant.leading === true &&
      instant.trailing === true // default restored since not specified
    )
  })

  assert.ok(reregistrationWorks, 'Re-registration should replace entire configuration')
})

test('Event Structure Verification', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  // Verify the event structure matches documentation (lines 507-521)
  const eventStructureCorrect = await page.evaluate(async () => {
    window.debounced.register(['input'], {wait: 100})

    return new Promise(resolve => {
      const input = document.querySelector('[data-testid="testInput"]')

      document.addEventListener('debounced:input', event => {
        const structure = {
          hasTarget: event.target === input,
          type: event.type === 'debounced:input',
          hasDetail: event.detail !== undefined,
          hasSourceEvent: event.detail.sourceEvent !== undefined,
          detailType: event.detail.type === 'trailing',
          bubbles: event.bubbles === true,
          hasCancelable: typeof event.cancelable === 'boolean',
          hasComposed: typeof event.composed === 'boolean',
        }

        resolve(Object.values(structure).every(v => v === true))
      })

      input.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}))
    })
  })

  assert.ok(eventStructureCorrect, 'Event structure should match documentation')
})
