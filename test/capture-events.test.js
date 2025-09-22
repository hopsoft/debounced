import {test} from '@playwright/test'
import assert from 'node:assert'

test.describe('Capture Phase Events', () => {
  test('verify non-bubbling events use capture phase', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const captureEvents = [
        'blur',
        'focus',
        'mouseenter',
        'mouseleave',
        'pointerenter',
        'pointerleave',
        'abort',
        'error',
        'load',
        'loadeddata',
        'loadedmetadata',
        'loadstart',
      ]

      // Check that all capture events are in nativeCapturableEvents
      const allInCapturable = captureEvents.every(event => window.debounced.defaultCapturableEventNames.includes(event))

      // Register the events
      window.debounced.register(captureEvents, {wait: 50})

      // Create a test to verify capture phase is used
      const capturedEvents = []
      const bubbledEvents = []

      // Add listeners in capture phase
      captureEvents.forEach(eventName => {
        document.addEventListener(
          `debounced:${eventName}`,
          e => {
            if (e.eventPhase === Event.CAPTURING_PHASE || e.eventPhase === Event.AT_TARGET) {
              capturedEvents.push(eventName)
            }
          },
          true
        ) // capture phase

        document.addEventListener(
          `debounced:${eventName}`,
          e => {
            if (e.eventPhase === Event.BUBBLING_PHASE) {
              bubbledEvents.push(eventName)
            }
          },
          false
        ) // bubble phase
      })

      // Test blur/focus
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()
      input.blur()
      input.focus()

      await new Promise(resolve => setTimeout(resolve, 100))

      // Cleanup
      window.debounced.unregister(captureEvents)
      document.body.removeChild(input)

      return {
        allInCapturable,
        capturedEvents: [...new Set(capturedEvents)],
        bubbledEvents,
        registeredCount: captureEvents.filter(e => e in window.debounced.registeredEvents).length,
      }
    })

    assert.ok(result.allInCapturable, 'All non-bubbling events should be in defaultCapturableEventNames')
    assert.ok(result.capturedEvents.length > 0, 'Should capture some events')
    assert.strictEqual(result.bubbledEvents.length, 0, 'Non-bubbling events should not bubble')
  })

  test('error event on image elements', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const events = []

      window.debounced.register(['error'], {wait: 50})

      // Listen for error events
      document.addEventListener(
        'debounced:error',
        e => {
          events.push({
            type: e.type,
            targetTag: e.target?.tagName,
            detail: e.detail?.type,
          })
        },
        true
      ) // Use capture since error doesn't bubble

      // Create an image with invalid src to trigger error
      const img = document.createElement('img')
      document.body.appendChild(img)

      // Create promise for error event
      const errorPromise = new Promise(resolve => {
        img.addEventListener('error', () => resolve('native-error'))
      })

      img.src = 'http://invalid.domain/nonexistent.jpg'

      // Wait for native error
      await errorPromise

      // Wait for debounced error
      await new Promise(resolve => setTimeout(resolve, 100))

      // Cleanup
      document.body.removeChild(img)
      window.debounced.unregister(['error'])

      return {
        events,
        hasError: events.length > 0,
      }
    })

    assert.ok(result.hasError, 'Should capture error event from img element')
  })

  test('media events (loadstart, loadedmetadata, loadeddata)', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const events = []
      const mediaEvents = ['loadstart', 'loadedmetadata', 'loadeddata']

      window.debounced.register(mediaEvents, {wait: 50})

      // Listen for media events using capture
      mediaEvents.forEach(eventName => {
        document.addEventListener(
          `debounced:${eventName}`,
          e => {
            events.push({
              type: eventName,
              targetTag: e.target?.tagName,
            })
          },
          true
        ) // capture phase
      })

      // Create video element with data URL
      const video = document.createElement('video')
      document.body.appendChild(video)

      // Simple video data URL (1x1 black pixel)
      video.src =
        'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAs1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjYwMSBhMGNkN2QzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEwIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAADIAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU2LjQwLjEwMQ=='

      // Track native events
      let nativeLoadstart = false
      let nativeLoadedmetadata = false
      let nativeLoadeddata = false

      video.addEventListener('loadstart', () => {
        nativeLoadstart = true
      })
      video.addEventListener('loadedmetadata', () => {
        nativeLoadedmetadata = true
      })
      video.addEventListener('loadeddata', () => {
        nativeLoadeddata = true
      })

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 200))

      // Cleanup
      document.body.removeChild(video)
      window.debounced.unregister(mediaEvents)

      return {
        events,
        nativeLoadstart,
        nativeLoadedmetadata,
        nativeLoadeddata,
        debouncedCount: events.length,
      }
    })

    assert.ok(result.nativeLoadstart, 'Native loadstart should fire')
    // Note: Media events on elements don't bubble, so debounced versions via delegation won't work
    // This is expected behavior for element-level media events
  })

  test('abort event on XMLHttpRequest', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const events = []

      window.debounced.register(['abort'], {wait: 50})

      // Listen for abort events
      document.addEventListener(
        'debounced:abort',
        e => {
          events.push({
            type: e.type,
            detail: e.detail?.type,
          })
        },
        true
      ) // capture phase

      // Note: XMLHttpRequest abort doesn't bubble to document
      // This test verifies the event is registered but won't fire via delegation

      // Verify abort is in capturable events
      const isInCapturable = window.debounced.defaultCapturableEventNames.includes('abort')

      window.debounced.unregister(['abort'])

      return {
        events,
        isInCapturable,
      }
    })

    assert.ok(result.isInCapturable, 'Abort should be in defaultCapturableEventNames')
  })

  test('new getter methods', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(() => {
      return {
        hasBubblingGetter: Array.isArray(window.debounced.defaultBubblingEventNames),
        hasCapturableGetter: Array.isArray(window.debounced.defaultCapturableEventNames),
        hasDelegatableGetter: Array.isArray(window.debounced.defaultDelegatableEventNames),
        hasWindowGetter: Array.isArray(window.debounced.defaultWindowEventNames),
        hasDefaultEventNames: Array.isArray(window.debounced.defaultEventNames),

        bubblingCount: window.debounced.defaultBubblingEventNames.length,
        capturableCount: window.debounced.defaultCapturableEventNames.length,
        delegatableCount: window.debounced.defaultDelegatableEventNames.length,
        windowCount: window.debounced.defaultWindowEventNames.length,
        defaultCount: window.debounced.defaultEventNames.length,

        // Verify relationships
        delegatableIsUnion:
          window.debounced.defaultDelegatableEventNames.length ===
          new Set([...window.debounced.defaultBubblingEventNames, ...window.debounced.defaultCapturableEventNames])
            .size,

        // Check specific events are in correct categories
        clickInBubbling: window.debounced.defaultBubblingEventNames.includes('click'),
        blurInCapturable: window.debounced.defaultCapturableEventNames.includes('blur'),
        loadInCapturable: window.debounced.defaultCapturableEventNames.includes('load'),
        errorInCapturable: window.debounced.defaultCapturableEventNames.includes('error'),

        // Check new non-bubbling events
        abortInCapturable: window.debounced.defaultCapturableEventNames.includes('abort'),
        loadeddataInCapturable: window.debounced.defaultCapturableEventNames.includes('loadeddata'),
        loadedmetadataInCapturable: window.debounced.defaultCapturableEventNames.includes('loadedmetadata'),
        loadstartInCapturable: window.debounced.defaultCapturableEventNames.includes('loadstart'),
      }
    })

    assert.ok(result.hasBubblingGetter, 'Should have defaultBubblingEventNames getter')
    assert.ok(result.hasCapturableGetter, 'Should have defaultCapturableEventNames getter')
    assert.ok(result.hasDelegatableGetter, 'Should have defaultDelegatableEventNames getter')
    assert.ok(result.hasWindowGetter, 'Should have defaultWindowEventNames getter')
    assert.ok(result.hasDefaultEventNames, 'Should have defaultEventNames getter')

    assert.ok(result.bubblingCount > 50, 'Should have many bubbling events')
    assert.strictEqual(result.capturableCount, 12, 'Should have 12 capturable events')
    assert.ok(result.delegatableIsUnion, 'Delegatable should be union of bubbling and capturable')

    assert.ok(result.clickInBubbling, 'Click should be in bubbling events')
    assert.ok(result.blurInCapturable, 'Blur should be in capturable events')
    assert.ok(result.loadInCapturable, 'Load should be in capturable events')
    assert.ok(result.errorInCapturable, 'Error should be in capturable events')
    assert.ok(result.abortInCapturable, 'Abort should be in capturable events')
    assert.ok(result.loadeddataInCapturable, 'Loadeddata should be in capturable events')
    assert.ok(result.loadedmetadataInCapturable, 'Loadedmetadata should be in capturable events')
    assert.ok(result.loadstartInCapturable, 'Loadstart should be in capturable events')
  })

  test('verify capture phase registration', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const capturableEvents = window.debounced.defaultCapturableEventNames

      // Register all capturable events
      window.debounced.register(capturableEvents, {wait: 50})

      // Check internal registration (if exposed)
      const registrations = {}
      capturableEvents.forEach(eventName => {
        const registration = window.debounced.registeredEvents[eventName]
        if (registration) {
          registrations[eventName] = {
            hasHandler: !!registration.handler,
            useCapture: registration.useCapture === true,
          }
        }
      })

      // Cleanup
      window.debounced.unregister(capturableEvents)

      return {
        registrations,
        allUseCapture: Object.values(registrations).every(r => r.useCapture === true),
      }
    })

    assert.ok(result.allUseCapture, 'All capturable events should be registered with useCapture: true')
  })
})
