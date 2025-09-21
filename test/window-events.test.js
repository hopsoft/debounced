import {test} from '@playwright/test'
import assert from 'node:assert'

test('window-only events (storage, online, offline)', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    // Register window-only events
    window.debounced.register(['storage', 'online', 'offline'], {wait: 100})

    // Set up listeners on window (where these events should fire)
    const handlers = {
      storage: event => events.push({type: 'storage', target: event.target === window ? 'window' : 'other'}),
      online: event => events.push({type: 'online', target: event.target === window ? 'window' : 'other'}),
      offline: event => events.push({type: 'offline', target: event.target === window ? 'window' : 'other'}),
    }

    // These events should fire on window
    window.addEventListener('debounced:storage', handlers.storage)
    window.addEventListener('debounced:online', handlers.online)
    window.addEventListener('debounced:offline', handlers.offline)

    // Also check they DON'T fire on document
    let documentFired = false
    document.addEventListener('debounced:storage', () => (documentFired = true))
    document.addEventListener('debounced:online', () => (documentFired = true))
    document.addEventListener('debounced:offline', () => (documentFired = true))

    try {
      // Trigger storage event (window-only)
      const storageEvent = new StorageEvent('storage', {
        key: 'test',
        oldValue: null,
        newValue: 'value',
        url: window.location.href,
        storageArea: localStorage,
      })
      window.dispatchEvent(storageEvent)

      // Trigger online/offline events
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 150))

      return {
        events,
        documentFired,
        storageRegistered: 'storage' in window.debounced.registeredEvents,
        onlineRegistered: 'online' in window.debounced.registeredEvents,
        offlineRegistered: 'offline' in window.debounced.registeredEvents,
      }
    } finally {
      // Cleanup
      window.removeEventListener('debounced:storage', handlers.storage)
      window.removeEventListener('debounced:online', handlers.online)
      window.removeEventListener('debounced:offline', handlers.offline)
      window.debounced.unregister(['storage', 'online', 'offline'])
    }
  })

  assert.ok(result.storageRegistered, 'Storage event should be registered')
  assert.ok(result.onlineRegistered, 'Online event should be registered')
  assert.ok(result.offlineRegistered, 'Offline event should be registered')
  assert.ok(result.events.length >= 3, 'Should fire window-only events')
  assert.ok(
    result.events.every(e => e.target === 'window'),
    'All events should target window'
  )
  assert.ok(!result.documentFired, 'Window-only events should NOT fire on document')
})

test('dual registration events (resize in both lists)', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    // Check that resize is in both lists
    const resizeInBoth =
      window.debounced.defaultEventNames.includes('resize') && window.nativeWindowEvents?.includes('resize')

    // Register resize - it's in both lists so should register on both targets
    window.debounced.register(['resize'], {wait: 100})

    // Listen for debounced events
    const handler = event => {
      events.push({
        listenedOn: event.currentTarget === window ? 'window' : 'document',
        firedOn: event.target === window ? 'window' : 'element',
      })
    }

    window.addEventListener('debounced:resize', handler)
    document.addEventListener('debounced:resize', handler)

    try {
      // Trigger resize on window
      window.dispatchEvent(new Event('resize'))

      await new Promise(resolve => setTimeout(resolve, 150))

      // Check both registrations exist
      const hasWindowReg = 'resize' in (window.debounced.windowRegistrations || {})
      const hasDocReg = 'resize' in (window.debounced.documentRegistrations || {})

      return {
        events,
        resizeInBoth,
        hasWindowReg,
        hasDocReg,
        eventCount: events.length,
      }
    } finally {
      window.removeEventListener('debounced:resize', handler)
      document.removeEventListener('debounced:resize', handler)
      window.debounced.unregister(['resize'])
    }
  })

  assert.ok(result.resizeInBoth, 'Resize should be in both event lists')
  // We don't expose the registration objects, so we can't check them directly
  // But we can verify events fired
  assert.ok(result.eventCount >= 1, 'Should fire resize event through dual registration')
  assert.ok(
    result.events.some(e => e.listenedOn === 'window'),
    'Should catch event on window listener'
  )
})

test('event cleanup for dual registration', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    // Register a dual event (exists in both lists)
    window.debounced.register(['resize'], {wait: 50})

    const handler = () => events.push(Date.now())
    window.addEventListener('debounced:resize', handler)

    // Trigger resize
    window.dispatchEvent(new Event('resize'))
    await new Promise(resolve => setTimeout(resolve, 100))

    const eventsAfterFirst = events.length

    // Unregister should clean up BOTH window and document listeners
    window.debounced.unregister(['resize'])

    // Try to trigger again - should NOT fire
    window.dispatchEvent(new Event('resize'))
    document.dispatchEvent(new Event('resize'))
    await new Promise(resolve => setTimeout(resolve, 100))

    const eventsAfterUnregister = events.length

    // Re-register to ensure clean state
    window.debounced.register(['resize'], {wait: 50})
    window.dispatchEvent(new Event('resize'))
    await new Promise(resolve => setTimeout(resolve, 100))

    const eventsAfterReregister = events.length

    window.removeEventListener('debounced:resize', handler)
    window.debounced.unregister(['resize'])

    return {
      eventsAfterFirst,
      eventsAfterUnregister,
      eventsAfterReregister,
      cleanupWorked: eventsAfterFirst === eventsAfterUnregister,
      reregisterWorked: eventsAfterReregister > eventsAfterUnregister,
    }
  })

  assert.ok(result.eventsAfterFirst > 0, 'Should fire events after registration')
  assert.ok(result.cleanupWorked, 'Unregister should remove both window and document listeners')
  assert.ok(result.reregisterWorked, 'Re-registration should work after cleanup')
})

test('mixed event types registration', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const firedEvents = []

    // Clean slate first
    window.debounced.unregister(window.debounced.registeredEventNames)

    // Register a mix of event types
    window.debounced.register(
      [
        'click', // Document-only (delegatable)
        'storage', // Window-only
        'resize', // Dual (both lists)
        'customEvent', // Custom (defaults to document)
      ],
      {wait: 50}
    )

    // Set up universal handler
    const handler = event => {
      firedEvents.push({
        type: event.type.replace('debounced:', ''),
        targetType: event.target === window ? 'window' : event.target === document ? 'document' : 'element',
      })
    }

    // Listen on both window and document for all events
    ;['click', 'storage', 'resize', 'customEvent'].forEach(eventName => {
      window.addEventListener(`debounced:${eventName}`, handler, true)
      document.addEventListener(`debounced:${eventName}`, handler, true)
    })

    try {
      // Trigger each type of event
      document.body.click() // Delegated event
      window.dispatchEvent(new Event('storage')) // Window-only
      window.dispatchEvent(new Event('resize')) // Dual
      document.dispatchEvent(new CustomEvent('customEvent', {bubbles: true})) // Custom

      await new Promise(resolve => setTimeout(resolve, 150))

      return {
        firedEvents,
        clickFired: firedEvents.some(e => e.type === 'click'),
        storageFired: firedEvents.some(e => e.type === 'storage'),
        resizeFired: firedEvents.some(e => e.type === 'resize'),
        customFired: firedEvents.some(e => e.type === 'customEvent'),
        allRegistered: Object.keys(window.debounced.registeredEvents).length === 4,
      }
    } finally {
      // Cleanup
      ;['click', 'storage', 'resize', 'customEvent'].forEach(eventName => {
        window.removeEventListener(`debounced:${eventName}`, handler, true)
        document.removeEventListener(`debounced:${eventName}`, handler, true)
      })
      window.debounced.unregister(['click', 'storage', 'resize', 'customEvent'])
    }
  })

  assert.ok(result.allRegistered, 'All event types should be registered')
  assert.ok(result.clickFired, 'Document-delegated events should fire')
  assert.ok(result.storageFired, 'Window-only events should fire')
  assert.ok(result.resizeFired, 'Dual registration events should fire')
  assert.ok(result.customFired, 'Custom events should default to document delegation')
})

test('window event options (wait, leading, trailing)', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const events = []

    // Test that window-only events respect debounce options
    window.debounced.register(['storage'], {
      wait: 100,
      leading: true,
      trailing: true,
    })

    window.addEventListener('debounced:storage', event => {
      events.push({
        type: event.detail.type,
        timestamp: Date.now(),
      })
    })

    const startTime = Date.now()

    try {
      // Fire multiple storage events rapidly
      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(new Event('storage'))
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      // Wait for trailing event
      await new Promise(resolve => setTimeout(resolve, 150))

      const hasLeading = events.some(e => e.type === 'leading')
      const hasTrailing = events.some(e => e.type === 'trailing')
      const leadingTiming = hasLeading ? events[0].timestamp - startTime : null

      return {
        events,
        hasLeading,
        hasTrailing,
        leadingTiming,
        eventCount: events.length,
      }
    } finally {
      window.debounced.unregister(['storage'])
    }
  })

  assert.strictEqual(result.eventCount, 2, 'Should fire both leading and trailing')
  assert.ok(result.hasLeading, 'Should fire leading event')
  assert.ok(result.hasTrailing, 'Should fire trailing event')
  assert.ok(result.leadingTiming < 50, 'Leading should fire immediately')
})

test('window events target verification', async ({page}) => {
  await page.goto('/test/index.html')
  await page.waitForLoadState('networkidle')

  const result = await page.evaluate(async () => {
    const targetInfo = []

    // Register different event types
    window.debounced.register(['storage', 'resize', 'click'])

    const captureTarget = event => {
      targetInfo.push({
        eventType: event.type.replace('debounced:', ''),
        target:
          event.target === window
            ? 'window'
            : event.target === document
              ? 'document'
              : event.target?.tagName || 'unknown',
        sourceTarget:
          event.detail?.sourceEvent?.target === window
            ? 'window'
            : event.detail?.sourceEvent?.target === document
              ? 'document'
              : event.detail?.sourceEvent?.target?.tagName || 'unknown',
      })
    }

    // Use capture phase to catch all events
    window.addEventListener('debounced:storage', captureTarget, true)
    window.addEventListener('debounced:resize', captureTarget, true)
    document.addEventListener('debounced:click', captureTarget, true)

    try {
      // Trigger events
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new Event('resize'))
      document.body.click()

      await new Promise(resolve => setTimeout(resolve, 250))

      return {
        targetInfo,
        storageTarget: targetInfo.find(t => t.eventType === 'storage'),
        resizeTarget: targetInfo.find(t => t.eventType === 'resize'),
        clickTarget: targetInfo.find(t => t.eventType === 'click'),
      }
    } finally {
      window.debounced.unregister(['storage', 'resize', 'click'])
    }
  })

  // Verify correct event targets
  assert.ok(result.storageTarget?.target === 'window', 'Storage events should target window')
  assert.ok(result.resizeTarget?.target === 'window', 'Resize events should target window')
  assert.ok(result.clickTarget?.target === 'BODY', 'Click events should target the element')
})
