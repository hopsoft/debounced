import {test, expect} from '@playwright/test'

test.describe('Visual Test Page', () => {
  test.setTimeout(60000) // Increase timeout for visual tests

  test('should display visual grid and run tests successfully', async ({page}) => {
    // Navigate to the visual test page
    await page.goto('/test/visual.html')

    // Verify initial state
    await expect(page.getByTestId('runTestsBtn')).toBeVisible()
    await expect(page.getByTestId('resetBtn')).toBeDisabled()
    await expect(page.locator('#testGrid')).toBeHidden()

    // Check real-time counters are present
    await expect(page.locator('#nativeCounter')).toContainText('0')
    await expect(page.locator('#debouncedCounter')).toContainText('0')
    await expect(page.locator('#efficiencyCounter')).toContainText('-')
    await expect(page.locator('#timeElapsed')).toContainText('0s')

    // Click Run Automated Tests
    await page.getByTestId('runTestsBtn').click()

    // Wait for test grid to appear
    await expect(page.locator('#testGrid')).toBeVisible()

    // Verify test grid structure
    await expect(page.locator('#testGridLegend')).toBeVisible()
    await expect(page.locator('#testGridItems')).toBeVisible()

    // Check that grid items are created (should be 97+ events)
    const gridItems = page.locator('#testGridItems > div')
    const itemCount = await gridItems.count()
    expect(itemCount).toBeGreaterThan(90) // Should have 97+ events

    // Wait for first test to start running (blue with pulse)
    await expect(page.locator('.bg-blue-500.animate-pulse').first()).toBeVisible({timeout: 5000})

    // Monitor that tests are progressing - wait for at least one green (passed) item
    await expect(page.locator('.bg-green-500').first()).toBeVisible({timeout: 10000})

    // Check counters are updating
    await expect(async () => {
      const nativeCount = await page.locator('#nativeCounter').textContent()
      expect(parseInt(nativeCount)).toBeGreaterThan(0)
    }).toPass({timeout: 5000})

    await expect(async () => {
      const debouncedCount = await page.locator('#debouncedCounter').textContent()
      expect(parseInt(debouncedCount)).toBeGreaterThan(0)
    }).toPass({timeout: 5000})

    // Check efficiency is calculated
    await expect(async () => {
      const efficiency = await page.locator('#efficiencyCounter').textContent()
      expect(efficiency).not.toBe('-')
      expect(efficiency).toContain('%')
    }).toPass({timeout: 5000})

    // Wait for tests to complete (progress bar at 100%)
    await expect(page.getByTestId('progressText')).toContainText('100%', {timeout: 45000})

    // Verify final state
    const passedCount = await page.locator('#gridPassed').textContent()
    const totalCount = await page.locator('#gridTotal').textContent()

    expect(parseInt(passedCount)).toBeGreaterThan(0)
    expect(parseInt(totalCount)).toBeGreaterThan(90)

    // Check that most tests passed (allow some failures for non-bubbling events)
    const passedItems = await page.locator('.bg-green-500').count()
    const failedItems = await page.locator('.bg-red-500').count()

    expect(passedItems).toBeGreaterThan(failedItems)

    // Verify reset button is enabled after tests complete
    await expect(page.getByTestId('resetBtn')).toBeEnabled()

    // Test reset functionality
    await page.getByTestId('resetBtn').click()

    // Verify grid is hidden after reset
    await expect(page.locator('#testGrid')).toBeHidden()
    await expect(page.getByTestId('progressIndicator')).toBeHidden()
    await expect(page.getByTestId('resetBtn')).toBeDisabled()
  })

  test('should properly test debounce timing', async ({page}) => {
    await page.goto('/test/visual.html')

    // Enable console logging to verify debounce behavior
    const consoleLogs = []
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('fired') && (text.includes('Native') || text.includes('Debounced'))) {
        consoleLogs.push(text)
      }
    })

    // Run tests
    await page.getByTestId('runTestsBtn').click()

    // Wait for tests to complete
    await expect(page.getByTestId('progressText')).toContainText('100%', {timeout: 45000})

    // Check test results displayed on page
    const testResults = await page.getByTestId('testResults').textContent()

    // Verify that high-frequency events show proper debouncing
    expect(testResults).toContain('mousemove')
    expect(testResults).toContain('scroll')

    // Look for specific patterns in results
    const resultLines = testResults.split('\n').filter(line => line.includes('Native events:'))

    // Find results for continuous events
    const continuousEventResults = resultLines.filter(
      line => line.includes('mousemove') || line.includes('scroll') || line.includes('mouseover')
    )

    // Verify continuous events show many native but only 1 debounced
    continuousEventResults.forEach(result => {
      const nativeMatch = result.match(/Native events: (\d+)/)
      const debouncedMatch = result.match(/Debounced events: (\d+)/)

      if (nativeMatch && debouncedMatch) {
        const nativeCount = parseInt(nativeMatch[1])
        const debouncedCount = parseInt(debouncedMatch[1])
        const eventType = result.match(/(\w+):/)?.[1]

        // For continuous events, we should see multiple native events but only 1 debounced
        // We fire 20 events for continuous, but browsers may coalesce them significantly
        // WebKit can coalesce so aggressively that sometimes only 0-1 events get through
        if (eventType === 'scroll' || eventType === 'mousemove' || eventType === 'mouseover') {
          if (nativeCount > 0) {
            // If we got any events at all, we should have exactly 1 debounced
            expect(debouncedCount).toBe(1)
          } else {
            // If no native events fired (very aggressive coalescing), no debounced either
            expect(debouncedCount).toBe(0)
          }
        }
      }
    })
  })
})
