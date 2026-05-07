# Contributing to Figma Component Generator

Thank you for your interest in contributing to the Figma Component Generator! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [ismailquadri@example.com](mailto:ismailquadri@example.com).

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn package manager
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/figma-component-generator.git
   cd figma-component-generator
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Running the Tool Locally

You can test the tool locally without installing it globally:

```bash
node cli.js --help
```

Or link it globally for development:

```bash
npm link
generate-component --help
```

### Running Tests

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

### Linting

Check code style:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

## Making Changes

### Project Structure

```
figma-component-generator/
├── cli.js                 # Main CLI entry point
├── config.js              # Configuration management
├── figma.js               # Figma API client
├── generator.js           # Component generation logic
├── github-generator.js    # GitHub repository generation
├── handoff-generator.js   # Handoff package generation
├── token-exporter.js      # Design token export
├── version-manager.js     # Version tracking
├── tests/                 # Test files
└── package.json           # Project configuration
```

### Adding New Features

1. **Choose an issue**: Look for issues labeled `good first issue` or `help wanted`
2. **Create a branch**: Use descriptive branch names like `feature/add-vue-support`
3. **Make changes**: Follow the coding standards below
4. **Test thoroughly**: Ensure all tests pass and add new tests for your feature
5. **Document changes**: Update README and relevant documentation

### Bug Fixes

1. **Reproduce the bug**: Ensure you can reproduce the issue
2. **Write a test**: Add a failing test that demonstrates the bug
3. **Fix the bug**: Make the minimal change needed to fix the issue
4. **Verify the fix**: Ensure the test now passes and no other tests break

## Testing

### Writing Tests

We use Jest for testing. Tests should be:

- **Descriptive**: Test names should clearly describe what they test
- **Isolated**: Each test should be independent
- **Fast**: Tests should run quickly
- **Comprehensive**: Cover happy paths and edge cases

Example test:

```javascript
describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Test Coverage

We aim for high test coverage. Run `npm run test:coverage` to see your coverage report.

## Submitting Changes

### Commit Messages

Use clear, descriptive commit messages:

- `feat: add Vue.js support`
- `fix: resolve issue with token export`
- `docs: update README with new examples`
- `test: add tests for component generator`

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Pull Request Process

1. **Update documentation**: Ensure README and relevant docs are updated
2. **Run tests**: Make sure all tests pass
3. **Run linter**: Fix any linting issues
4. **Create PR**: Provide a clear description of changes
5. **Link issues**: Reference related issues in the PR description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Code follows project style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Added/updated tests
```

## Coding Standards

### JavaScript Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Use semicolons
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Follow ESLint configuration (run `npm run lint`)

### Code Organization

- Keep functions small and focused
- Use descriptive variable and function names
- Add JSDoc comments for complex functions
- Separate concerns into different modules

### Error Handling

- Always handle errors appropriately
- Provide meaningful error messages
- Use try-catch for async operations
- Log errors for debugging

### Documentation

- Document public APIs with JSDoc
- Update README for user-facing changes
- Add comments for complex logic
- Keep documentation in sync with code

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues for solutions
- Reach out to maintainers for questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in the project's CONTRIBUTORS section.

Thank you for contributing! 🎉