# Contributing to Debounced

Thank you for your interest in contributing to Debounced! This guide will help you get started.

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Install Playwright browsers: `npx playwright install`
4. Build the library: `npm run build`
5. Run tests: `npm test`

## Development Workflow

### Running Tests

```bash
npm test           # Run all tests headlessly
npm run test:ui    # Open Playwright UI for debugging
```

### Code Formatting

```bash
npm run format  # Format code with Prettier
npm run lint    # Check formatting without modifying files
```

### Building

```bash
npm run build  # Format and build the distribution file
```

## Pull Request Process

1. **Fork the repository** and create a new branch from `main`
2. **Make your changes** and ensure all tests pass
3. **Format your code** with `npm run format`
4. **Update the README** if you've added new features
5. **Create a pull request** with a clear description of changes

### Automated Checks

When you open a pull request, GitHub Actions will automatically:

- ✅ Check code formatting
- ✅ Run tests across Node.js 18 and 20
- ✅ Test on Chromium, Firefox, and WebKit browsers
- ✅ Report bundle size changes
- ✅ Upload test results as artifacts

### What We Look For

- **Tests pass**: All existing tests must continue to pass
- **New features have tests**: Add tests for any new functionality
- **Code style matches**: Use Prettier formatting
- **Documentation updated**: Update README for API changes
- **Version sync**: Keep `package.json` and `src/version.js` in sync

## Testing Guidelines

### Test Coverage

Our test suite includes 204 tests covering:

- All 113 unique native DOM events
- Custom event registration
- Leading/trailing debounce modes
- Event delegation and bubbling
- Cross-browser compatibility
- Edge cases and error handling

### Writing Tests

Tests use Playwright and Node's built-in assert module:

```javascript
test('description', async ({page}) => {
  await page.goto('/test/index.html')

  // Your test logic here

  assert.strictEqual(actual, expected, 'Error message')
})
```

## Release Process

Releases are automated through GitHub Actions when a new release is created on GitHub:

1. Tests run to ensure everything passes
2. Version consistency is verified
3. Library is built and published to npm

## Questions?

Feel free to open an issue if you have questions or need help getting started!
