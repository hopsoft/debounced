import {test, expect} from '@playwright/test'
import assert from 'node:assert'

test.describe('Issue #8 - Nested Scrollable Elements', () => {
  test('debounced scroll events should work on individually scrollable elements', async ({page}) => {
    // Navigate to test page that has debounced loaded
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Create nested scrollable elements
    await page.evaluate(() => {
      // Clear the test page
      document.body.innerHTML = ''

      // Add styles
      const style = document.createElement('style')
      style.textContent = `
        body { display: flex; height: 100vh; margin: 0; }
        #sidebar {
          width: 300px;
          overflow-y: scroll;
          background: #f0f0f0;
          padding: 20px;
        }
        #main-pane {
          flex: 1;
          overflow-y: scroll;
          padding: 20px;
        }
        .tall-content { height: 2000px; }
      `
      document.head.appendChild(style)

      // Create the HTML structure
      document.body.innerHTML = `
        <nav id="sidebar">
          <h2>Sidebar</h2>
          <div class="tall-content">Tall sidebar content</div>
        </nav>
        <div id="main-pane">
          <h2>Main Pane</h2>
          <div class="tall-content">Tall main content</div>
        </div>
      `
    })

    await page.waitForLoadState('networkidle')

    // Initialize debouncing and set up event listeners
    const results = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

      // Initialize debouncing for scroll events
      window.debounced.register(['scroll'], {wait: 50})

      const events = {
        sidebarNative: 0,
        sidebarDebounced: 0,
        mainNative: 0,
        mainDebounced: 0,
        documentDebounced: 0,
        windowDebounced: 0,
        debouncedTargets: [],
      }

      const sidebar = document.getElementById('sidebar')
      const mainPane = document.getElementById('main-pane')

      // Listen for native scroll events
      sidebar.addEventListener('scroll', () => {
        events.sidebarNative++
      })

      mainPane.addEventListener('scroll', () => {
        events.mainNative++
      })

      // Listen for debounced scroll events on the elements themselves
      sidebar.addEventListener('debounced:scroll', e => {
        events.sidebarDebounced++
      })

      mainPane.addEventListener('debounced:scroll', e => {
        events.mainDebounced++
      })

      // Listen on document (should bubble up)
      document.addEventListener('debounced:scroll', e => {
        events.documentDebounced++
        events.debouncedTargets.push(e.target.id)
      })

      // Listen on window
      window.addEventListener('debounced:scroll', e => {
        events.windowDebounced++
      })

      // Test 1: Scroll the sidebar multiple times rapidly
      for (let i = 0; i < 5; i++) {
        sidebar.scrollTop = i * 10
        await wait(5) // Small delay within debounce window
      }

      // Wait for debounce to complete
      await wait(100)

      // Test 2: Scroll the main pane multiple times rapidly
      for (let i = 0; i < 5; i++) {
        mainPane.scrollTop = i * 10
        await wait(5)
      }

      // Wait for debounce to complete
      await wait(100)

      return events
    })

    // Verify native scroll events fired (browser may coalesce these)
    assert.ok(
      results.sidebarNative >= 2,
      `Sidebar native scroll should fire multiple times (got ${results.sidebarNative})`
    )
    assert.ok(results.mainNative >= 2, `Main pane native scroll should fire multiple times (got ${results.mainNative})`)

    // THE KEY TESTS FOR ISSUE #8:
    // Verify that debounced events are received by listeners on the scrollable elements themselves
    assert.strictEqual(
      results.sidebarDebounced,
      1,
      `Sidebar should receive exactly 1 debounced scroll event (got ${results.sidebarDebounced})`
    )
    assert.strictEqual(
      results.mainDebounced,
      1,
      `Main pane should receive exactly 1 debounced scroll event (got ${results.mainDebounced})`
    )

    // Note: Scroll events captured at document level during capture phase may not bubble back
    // The important thing is that the elements themselves receive the debounced events
  })

  test('scroll events on body vs nested elements should be independent', async ({page}) => {
    await page.goto('/test/index.html')
    await page.waitForLoadState('networkidle')

    // Create test structure
    await page.evaluate(() => {
      document.body.innerHTML = ''

      const style = document.createElement('style')
      style.textContent = `
        body { height: 200vh; } /* Make body scrollable */
        #scrollable-div {
          width: 400px;
          height: 300px;
          overflow-y: scroll;
          border: 1px solid black;
          margin: 50px;
        }
        .tall-content { height: 1000px; }
      `
      document.head.appendChild(style)

      document.body.innerHTML = `
        <div id="scrollable-div">
          <div class="tall-content">Content in scrollable div</div>
        </div>
        <p>Body content to make page scrollable</p>
      `
    })

    const results = await page.evaluate(async () => {
      const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

      window.debounced.register(['scroll'], {wait: 50})

      const events = {
        bodyDebounced: 0,
        divDebounced: 0,
        targets: [],
      }

      const scrollableDiv = document.getElementById('scrollable-div')

      // Listen for debounced events on the scrollable div itself
      scrollableDiv.addEventListener('debounced:scroll', e => {
        events.divDebounced++
      })

      // Also listen on document to see if it bubbles
      document.addEventListener('debounced:scroll', e => {
        events.targets.push(e.target.id || e.target.tagName)

        if (e.target === document || e.target === document.documentElement || e.target === document.body) {
          events.bodyDebounced++
        }
      })

      // Scroll the div
      scrollableDiv.scrollTop = 100
      await wait(100)

      // Scroll the body/window
      window.scrollTo(0, 100)
      await wait(100)

      return events
    })

    // Each scrollable element should generate its own debounced event
    assert.strictEqual(
      results.divDebounced,
      1,
      `Scrollable div should generate 1 debounced event (got ${results.divDebounced})`
    )
    assert.strictEqual(
      results.bodyDebounced,
      1,
      `Body/window scroll should generate 1 debounced event (got ${results.bodyDebounced})`
    )
  })
})
