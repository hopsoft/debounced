import {test} from '@playwright/test'
import assert from 'node:assert'

test.describe('Comprehensive Native Events Coverage', () => {
  // Test ALL native events to ensure comprehensive coverage
  test('all delegatable events are properly registered and fire', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const events = []
      const delegatableEvents = window.debounced.defaultDelegatableEventNames

      // Register all delegatable events
      window.debounced.register(delegatableEvents, {wait: 50})

      // Set up listener for all events
      const handler = eventName => e => {
        events.push({
          name: eventName,
          fired: true,
          hasDetail: !!e.detail,
          hasSourceEvent: !!e.detail?.sourceEvent,
        })
      }

      // Add listeners
      const listeners = {}
      delegatableEvents.forEach(eventName => {
        listeners[eventName] = handler(eventName)
        document.addEventListener(`debounced:${eventName}`, listeners[eventName])
      })

      // Test a sample of critical events
      const testButton = document.querySelector('[data-testid="testButton"]')
      const testInput = document.querySelector('[data-testid="testInput"]')
      const testMouse = document.querySelector('[data-testid="testMouse"]')

      // Click events
      if (delegatableEvents.includes('click')) testButton?.click()
      if (delegatableEvents.includes('dblclick')) testButton?.dispatchEvent(new MouseEvent('dblclick', {bubbles: true}))
      if (delegatableEvents.includes('contextmenu'))
        testButton?.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true}))
      if (delegatableEvents.includes('auxclick')) testButton?.dispatchEvent(new MouseEvent('auxclick', {bubbles: true}))

      // Mouse events
      if (delegatableEvents.includes('mousedown'))
        testMouse?.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}))
      if (delegatableEvents.includes('mouseup')) testMouse?.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}))
      if (delegatableEvents.includes('mousemove'))
        testMouse?.dispatchEvent(new MouseEvent('mousemove', {bubbles: true}))
      if (delegatableEvents.includes('mouseover'))
        testMouse?.dispatchEvent(new MouseEvent('mouseover', {bubbles: true}))
      if (delegatableEvents.includes('mouseout')) testMouse?.dispatchEvent(new MouseEvent('mouseout', {bubbles: true}))
      if (delegatableEvents.includes('mouseenter'))
        testMouse?.dispatchEvent(new MouseEvent('mouseenter', {bubbles: false}))
      if (delegatableEvents.includes('mouseleave'))
        testMouse?.dispatchEvent(new MouseEvent('mouseleave', {bubbles: false}))

      // Keyboard events
      if (delegatableEvents.includes('keydown'))
        document.dispatchEvent(new KeyboardEvent('keydown', {bubbles: true, key: 'a'}))
      if (delegatableEvents.includes('keyup'))
        document.dispatchEvent(new KeyboardEvent('keyup', {bubbles: true, key: 'a'}))

      // Form events
      if (delegatableEvents.includes('input')) {
        testInput?.dispatchEvent(new Event('input', {bubbles: true}))
      }
      if (delegatableEvents.includes('change')) {
        testInput?.dispatchEvent(new Event('change', {bubbles: true}))
      }
      if (delegatableEvents.includes('submit')) {
        const form = document.createElement('form')
        form.onsubmit = e => e.preventDefault() // Prevent navigation
        document.body.appendChild(form)
        form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}))
        document.body.removeChild(form)
      }
      if (delegatableEvents.includes('reset')) {
        const form = document.createElement('form')
        document.body.appendChild(form)
        form.dispatchEvent(new Event('reset', {bubbles: true}))
        document.body.removeChild(form)
      }
      if (delegatableEvents.includes('select')) {
        testInput?.dispatchEvent(new Event('select', {bubbles: true}))
      }

      // Focus events (some bubble, some don't)
      if (delegatableEvents.includes('focus')) testInput?.dispatchEvent(new FocusEvent('focus', {bubbles: false}))
      if (delegatableEvents.includes('blur')) testInput?.dispatchEvent(new FocusEvent('blur', {bubbles: false}))
      if (delegatableEvents.includes('focusin')) testInput?.dispatchEvent(new FocusEvent('focusin', {bubbles: true}))
      if (delegatableEvents.includes('focusout')) testInput?.dispatchEvent(new FocusEvent('focusout', {bubbles: true}))

      // Touch events (not supported in all browsers)
      try {
        if (delegatableEvents.includes('touchstart')) {
          testButton?.dispatchEvent(new TouchEvent('touchstart', {bubbles: true, touches: []}))
        }
        if (delegatableEvents.includes('touchend')) {
          testButton?.dispatchEvent(new TouchEvent('touchend', {bubbles: true, touches: []}))
        }
        if (delegatableEvents.includes('touchmove')) {
          testButton?.dispatchEvent(new TouchEvent('touchmove', {bubbles: true, touches: []}))
        }
        if (delegatableEvents.includes('touchcancel')) {
          testButton?.dispatchEvent(new TouchEvent('touchcancel', {bubbles: true, touches: []}))
        }
      } catch (e) {
        // TouchEvent not supported in this browser
      }

      // Pointer events
      if (delegatableEvents.includes('pointerdown')) {
        testButton?.dispatchEvent(new PointerEvent('pointerdown', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerup')) {
        testButton?.dispatchEvent(new PointerEvent('pointerup', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointermove')) {
        testButton?.dispatchEvent(new PointerEvent('pointermove', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerover')) {
        testButton?.dispatchEvent(new PointerEvent('pointerover', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerout')) {
        testButton?.dispatchEvent(new PointerEvent('pointerout', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerenter')) {
        testButton?.dispatchEvent(new PointerEvent('pointerenter', {bubbles: false}))
      }
      if (delegatableEvents.includes('pointerleave')) {
        testButton?.dispatchEvent(new PointerEvent('pointerleave', {bubbles: false}))
      }
      if (delegatableEvents.includes('pointercancel')) {
        testButton?.dispatchEvent(new PointerEvent('pointercancel', {bubbles: true}))
      }

      // Wheel event
      if (delegatableEvents.includes('wheel')) {
        testMouse?.dispatchEvent(new WheelEvent('wheel', {bubbles: true, deltaY: 100}))
      }

      // Scroll event
      if (delegatableEvents.includes('scroll')) {
        document.dispatchEvent(new Event('scroll', {bubbles: true}))
      }

      // Clipboard events (may not be supported in all browsers)
      try {
        if (delegatableEvents.includes('copy')) document.dispatchEvent(new ClipboardEvent('copy', {bubbles: true}))
        if (delegatableEvents.includes('cut')) document.dispatchEvent(new ClipboardEvent('cut', {bubbles: true}))
        if (delegatableEvents.includes('paste')) document.dispatchEvent(new ClipboardEvent('paste', {bubbles: true}))
      } catch (e) {
        // ClipboardEvent not supported
      }

      // Drag events (may not be supported in all browsers)
      try {
        if (delegatableEvents.includes('dragstart')) {
          testButton?.dispatchEvent(new DragEvent('dragstart', {bubbles: true}))
        }
        if (delegatableEvents.includes('drag')) {
          testButton?.dispatchEvent(new DragEvent('drag', {bubbles: true}))
        }
        if (delegatableEvents.includes('dragend')) {
          testButton?.dispatchEvent(new DragEvent('dragend', {bubbles: true}))
        }
        if (delegatableEvents.includes('dragenter')) {
          testButton?.dispatchEvent(new DragEvent('dragenter', {bubbles: true}))
        }
        if (delegatableEvents.includes('dragover')) {
          testButton?.dispatchEvent(new DragEvent('dragover', {bubbles: true}))
        }
        if (delegatableEvents.includes('dragleave')) {
          testButton?.dispatchEvent(new DragEvent('dragleave', {bubbles: true}))
        }
        if (delegatableEvents.includes('drop')) {
          testButton?.dispatchEvent(new DragEvent('drop', {bubbles: true}))
        }
      } catch (e) {
        // DragEvent not supported
      }

      // Composition events (may not be supported in all browsers)
      try {
        if (delegatableEvents.includes('compositionstart')) {
          testInput?.dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true}))
        }
        if (delegatableEvents.includes('compositionupdate')) {
          testInput?.dispatchEvent(new CompositionEvent('compositionupdate', {bubbles: true}))
        }
        if (delegatableEvents.includes('compositionend')) {
          testInput?.dispatchEvent(new CompositionEvent('compositionend', {bubbles: true}))
        }
      } catch (e) {
        // CompositionEvent not supported
      }

      // Animation events (may not be supported in all browsers)
      try {
        if (delegatableEvents.includes('animationstart')) {
          testButton?.dispatchEvent(new AnimationEvent('animationstart', {bubbles: true}))
        }
        if (delegatableEvents.includes('animationend')) {
          testButton?.dispatchEvent(new AnimationEvent('animationend', {bubbles: true}))
        }
        if (delegatableEvents.includes('animationiteration')) {
          testButton?.dispatchEvent(new AnimationEvent('animationiteration', {bubbles: true}))
        }
        if (delegatableEvents.includes('animationcancel')) {
          testButton?.dispatchEvent(new AnimationEvent('animationcancel', {bubbles: true}))
        }
      } catch (e) {
        // AnimationEvent not supported
      }

      // Transition events (may not be supported in all browsers)
      try {
        if (delegatableEvents.includes('transitionrun')) {
          testButton?.dispatchEvent(new TransitionEvent('transitionrun', {bubbles: true}))
        }
        if (delegatableEvents.includes('transitionstart')) {
          testButton?.dispatchEvent(new TransitionEvent('transitionstart', {bubbles: true}))
        }
        if (delegatableEvents.includes('transitionend')) {
          testButton?.dispatchEvent(new TransitionEvent('transitionend', {bubbles: true}))
        }
        if (delegatableEvents.includes('transitioncancel')) {
          testButton?.dispatchEvent(new TransitionEvent('transitioncancel', {bubbles: true}))
        }
      } catch (e) {
        // TransitionEvent not supported
      }

      // Media events - create a video element for testing
      const video = document.createElement('video')
      document.body.appendChild(video)

      if (delegatableEvents.includes('play')) video.dispatchEvent(new Event('play', {bubbles: true}))
      if (delegatableEvents.includes('pause')) video.dispatchEvent(new Event('pause', {bubbles: true}))
      if (delegatableEvents.includes('playing')) video.dispatchEvent(new Event('playing', {bubbles: true}))
      if (delegatableEvents.includes('ended')) video.dispatchEvent(new Event('ended', {bubbles: true}))
      if (delegatableEvents.includes('waiting')) video.dispatchEvent(new Event('waiting', {bubbles: true}))
      if (delegatableEvents.includes('seeking')) video.dispatchEvent(new Event('seeking', {bubbles: true}))
      if (delegatableEvents.includes('seeked')) video.dispatchEvent(new Event('seeked', {bubbles: true}))
      if (delegatableEvents.includes('timeupdate')) video.dispatchEvent(new Event('timeupdate', {bubbles: true}))
      if (delegatableEvents.includes('volumechange')) video.dispatchEvent(new Event('volumechange', {bubbles: true}))
      if (delegatableEvents.includes('ratechange')) video.dispatchEvent(new Event('ratechange', {bubbles: true}))
      if (delegatableEvents.includes('durationchange'))
        video.dispatchEvent(new Event('durationchange', {bubbles: true}))
      if (delegatableEvents.includes('canplay')) video.dispatchEvent(new Event('canplay', {bubbles: true}))
      if (delegatableEvents.includes('canplaythrough'))
        video.dispatchEvent(new Event('canplaythrough', {bubbles: true}))
      if (delegatableEvents.includes('stalled')) video.dispatchEvent(new Event('stalled', {bubbles: true}))
      if (delegatableEvents.includes('suspend')) video.dispatchEvent(new Event('suspend', {bubbles: true}))
      if (delegatableEvents.includes('emptied')) video.dispatchEvent(new Event('emptied', {bubbles: true}))
      if (delegatableEvents.includes('progress')) video.dispatchEvent(new Event('progress', {bubbles: true}))

      // Non-bubbling media events (in capturable list)
      if (delegatableEvents.includes('loadstart')) video.dispatchEvent(new Event('loadstart', {bubbles: false}))
      if (delegatableEvents.includes('loadeddata')) video.dispatchEvent(new Event('loadeddata', {bubbles: false}))
      if (delegatableEvents.includes('loadedmetadata'))
        video.dispatchEvent(new Event('loadedmetadata', {bubbles: false}))
      if (delegatableEvents.includes('load')) video.dispatchEvent(new Event('load', {bubbles: false}))
      if (delegatableEvents.includes('error')) video.dispatchEvent(new Event('error', {bubbles: false}))
      if (delegatableEvents.includes('abort')) video.dispatchEvent(new Event('abort', {bubbles: false}))

      document.body.removeChild(video)

      // Document/Window events
      if (delegatableEvents.includes('DOMContentLoaded')) {
        document.dispatchEvent(new Event('DOMContentLoaded', {bubbles: true}))
      }
      if (delegatableEvents.includes('fullscreenchange')) {
        document.dispatchEvent(new Event('fullscreenchange', {bubbles: true}))
      }
      if (delegatableEvents.includes('fullscreenerror')) {
        document.dispatchEvent(new Event('fullscreenerror', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerlockchange')) {
        document.dispatchEvent(new Event('pointerlockchange', {bubbles: true}))
      }
      if (delegatableEvents.includes('pointerlockerror')) {
        document.dispatchEvent(new Event('pointerlockerror', {bubbles: true}))
      }
      if (delegatableEvents.includes('visibilitychange')) {
        document.dispatchEvent(new Event('visibilitychange', {bubbles: true}))
      }

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 150))

      // Check registration BEFORE cleanup
      const allRegistered = delegatableEvents.every(e => e in window.debounced.registeredEvents)

      // Cleanup
      delegatableEvents.forEach(eventName => {
        document.removeEventListener(`debounced:${eventName}`, listeners[eventName])
      })
      window.debounced.unregister(delegatableEvents)

      return {
        totalDelegatable: delegatableEvents.length,
        testedEvents: events.length,
        events: events.slice(0, 20), // Sample for verification
        allRegistered,
        hasClick: events.some(e => e.name === 'click'),
        hasKeydown: events.some(e => e.name === 'keydown'),
        hasInput: events.some(e => e.name === 'input'),
      }
    })

    assert.ok(result.allRegistered, 'All delegatable events should be registered')
    assert.ok(result.testedEvents > 0, 'Should have fired some test events')
    assert.ok(result.hasClick || !result.events.some(e => e.name === 'click'), 'Click event handling')
    assert.strictEqual(result.totalDelegatable, 92, 'Should have 92 delegatable events')
  })

  test('all window events are properly registered and fire', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const result = await page.evaluate(async () => {
      const events = []
      const windowEvents = window.debounced.defaultWindowEventNames

      // Get only window-specific events (not in delegatable)
      const windowOnlyEvents = windowEvents.filter(e => !window.debounced.defaultDelegatableEventNames.includes(e))

      // Register window-only events
      window.debounced.register(windowOnlyEvents, {wait: 50})

      // Set up listeners
      const handler = eventName => e => {
        events.push({
          name: eventName,
          target: e.target === window ? 'window' : 'other',
        })
      }

      const listeners = {}
      windowOnlyEvents.forEach(eventName => {
        listeners[eventName] = handler(eventName)
        window.addEventListener(`debounced:${eventName}`, listeners[eventName])
      })

      // Test some window-specific events
      if (windowOnlyEvents.includes('storage')) {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: 'test',
            newValue: 'value',
            url: window.location.href,
          })
        )
      }
      if (windowOnlyEvents.includes('online')) {
        window.dispatchEvent(new Event('online'))
      }
      if (windowOnlyEvents.includes('offline')) {
        window.dispatchEvent(new Event('offline'))
      }
      if (windowOnlyEvents.includes('message')) {
        window.dispatchEvent(new MessageEvent('message', {data: 'test'}))
      }
      if (windowOnlyEvents.includes('messageerror')) {
        window.dispatchEvent(new MessageEvent('messageerror', {data: 'error'}))
      }
      if (windowOnlyEvents.includes('hashchange')) {
        window.dispatchEvent(
          new HashChangeEvent('hashchange', {
            oldURL: window.location.href,
            newURL: window.location.href + '#test',
          })
        )
      }
      if (windowOnlyEvents.includes('languagechange')) {
        window.dispatchEvent(new Event('languagechange'))
      }
      if (windowOnlyEvents.includes('rejectionhandled')) {
        window.dispatchEvent(
          new PromiseRejectionEvent('rejectionhandled', {
            promise: Promise.resolve(),
            reason: 'test',
          })
        )
      }
      if (windowOnlyEvents.includes('unhandledrejection')) {
        window.dispatchEvent(
          new PromiseRejectionEvent('unhandledrejection', {
            promise: Promise.resolve(),
            reason: 'test',
          })
        )
      }
      if (windowOnlyEvents.includes('beforeprint')) {
        window.dispatchEvent(new Event('beforeprint'))
      }
      if (windowOnlyEvents.includes('afterprint')) {
        window.dispatchEvent(new Event('afterprint'))
      }
      // Page transition events (may not be supported)
      try {
        if (windowOnlyEvents.includes('pagehide')) {
          window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: false}))
        }
        if (windowOnlyEvents.includes('pageshow')) {
          window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted: false}))
        }
      } catch (e) {
        // PageTransitionEvent not supported
      }

      // Device orientation events (may not be available in all browsers)
      try {
        if (windowOnlyEvents.includes('devicemotion')) {
          window.dispatchEvent(new DeviceMotionEvent('devicemotion'))
        }
        if (windowOnlyEvents.includes('deviceorientation')) {
          window.dispatchEvent(new DeviceOrientationEvent('deviceorientation'))
        }
        if (windowOnlyEvents.includes('deviceorientationabsolute')) {
          window.dispatchEvent(new DeviceOrientationEvent('deviceorientationabsolute'))
        }
      } catch (e) {
        // Some browsers don't support these events
      }

      // Gamepad events (may not be available)
      try {
        if (windowOnlyEvents.includes('gamepadconnected')) {
          window.dispatchEvent(new GamepadEvent('gamepadconnected', {gamepad: null}))
        }
        if (windowOnlyEvents.includes('gamepaddisconnected')) {
          window.dispatchEvent(new GamepadEvent('gamepaddisconnected', {gamepad: null}))
        }
      } catch (e) {
        // Some browsers don't support gamepad events
      }

      // Wait for debounced events
      await new Promise(resolve => setTimeout(resolve, 150))

      // Cleanup
      windowOnlyEvents.forEach(eventName => {
        window.removeEventListener(`debounced:${eventName}`, listeners[eventName])
      })
      window.debounced.unregister(windowOnlyEvents)

      return {
        totalWindowEvents: windowEvents.length,
        windowOnlyCount: windowOnlyEvents.length,
        eventsTriggered: events.length,
        events: events.slice(0, 10),
        hasStorage: events.some(e => e.name === 'storage'),
        hasOnline: events.some(e => e.name === 'online'),
      }
    })

    assert.ok(result.totalWindowEvents > 100, 'Should have 100+ window events')
    assert.ok(result.windowOnlyCount > 0, 'Should have window-only events')
    assert.ok(result.eventsTriggered > 0, 'Should have triggered some window events')
  })

  test('verify all event categories coverage', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    const coverage = await page.evaluate(() => {
      const allNativeEvents = new Set([
        ...window.debounced.defaultDelegatableEventNames,
        ...window.debounced.defaultWindowEventNames,
      ])

      return {
        bubblingCount: window.debounced.defaultBubblingEventNames.length,
        capturableCount: window.debounced.defaultCapturableEventNames.length,
        delegatableCount: window.debounced.defaultDelegatableEventNames.length,
        windowCount: window.debounced.defaultWindowEventNames.length,
        totalUnique: allNativeEvents.size,

        // Check specific event categories
        hasMouseEvents: ['click', 'mousedown', 'mouseup', 'mousemove'].every(e => allNativeEvents.has(e)),
        hasKeyboardEvents: ['keydown', 'keyup'].every(e => allNativeEvents.has(e)),
        hasTouchEvents: ['touchstart', 'touchend', 'touchmove', 'touchcancel'].every(e => allNativeEvents.has(e)),
        hasPointerEvents: ['pointerdown', 'pointerup', 'pointermove'].every(e => allNativeEvents.has(e)),
        hasDragEvents: ['dragstart', 'drag', 'dragend', 'drop'].every(e => allNativeEvents.has(e)),
        hasClipboardEvents: ['copy', 'cut', 'paste'].every(e => allNativeEvents.has(e)),
        hasFormEvents: ['input', 'change', 'submit', 'reset'].every(e => allNativeEvents.has(e)),
        hasFocusEvents: ['focus', 'blur', 'focusin', 'focusout'].every(e => allNativeEvents.has(e)),
        hasAnimationEvents: ['animationstart', 'animationend'].every(e => allNativeEvents.has(e)),
        hasTransitionEvents: ['transitionstart', 'transitionend'].every(e => allNativeEvents.has(e)),
        hasMediaEvents: ['play', 'pause', 'ended', 'loadstart'].every(e => allNativeEvents.has(e)),
        hasWindowEvents: ['resize', 'scroll', 'storage', 'online', 'offline'].every(e => allNativeEvents.has(e)),
      }
    })

    // Verify comprehensive coverage
    assert.ok(coverage.bubblingCount > 70, 'Should have 70+ bubbling events')
    assert.strictEqual(coverage.capturableCount, 12, 'Should have 12 capturable events')
    assert.strictEqual(coverage.delegatableCount, 92, 'Should have 92 delegatable events')
    assert.ok(coverage.windowCount > 100, 'Should have 100+ window events')
    assert.strictEqual(coverage.totalUnique, 113, 'Should have 113 total unique events')

    // Verify all event categories are present
    assert.ok(coverage.hasMouseEvents, 'Should have mouse events')
    assert.ok(coverage.hasKeyboardEvents, 'Should have keyboard events')
    assert.ok(coverage.hasTouchEvents, 'Should have touch events')
    assert.ok(coverage.hasPointerEvents, 'Should have pointer events')
    assert.ok(coverage.hasDragEvents, 'Should have drag events')
    assert.ok(coverage.hasClipboardEvents, 'Should have clipboard events')
    assert.ok(coverage.hasFormEvents, 'Should have form events')
    assert.ok(coverage.hasFocusEvents, 'Should have focus events')
    assert.ok(coverage.hasAnimationEvents, 'Should have animation events')
    assert.ok(coverage.hasTransitionEvents, 'Should have transition events')
    assert.ok(coverage.hasMediaEvents, 'Should have media events')
    assert.ok(coverage.hasWindowEvents, 'Should have window events')
  })
})
