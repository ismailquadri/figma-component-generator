# Figma Component Generator

Generate React components from Figma designs automatically. Save hours of manual implementation with a single command.

## Features

- ✅ Generate React, Vue, and Svelte components from Figma designs
- ✅ Multiple component types: Buttons, Inputs, Cards, Modals, Navigation
- ✅ Multiple styling approaches: Tailwind, CSS, styled-components, CSS Modules, Stylus, Less
- ✅ TypeScript support
- ✅ Professional Storybook integration with auto-setup
- ✅ Storybook preset system (React Vite, Next.js, CRA, Vue, Svelte, etc.)
- ✅ Professional addon configuration (a11y, themes, viewport, docs)
- ✅ Theme/provider decorator templates
- ✅ Auto-generated documentation with MDX support
- ✅ Figma-to-Storybook bridge with design token extraction
- ✅ CI/CD integration (GitHub Actions for Storybook deployment)
- ✅ Visual regression testing setup (Chromatic, Percy)
- ✅ Monorepo support (Nx, Turborepo, Lerna, Yarn Workspaces)
- ✅ Persistent API token configuration
- ✅ Design token extraction
- ✅ Component variants support
- ✅ Accessibility attributes (ARIA, keyboard navigation)
- ✅ Intelligent component type detection from Figma names
- ✅ Intelligent variant detection from Figma component sets

## Installation

### Install via npm (Recommended)

```bash
npm install -g figma-component-generator
```

### Install from source

```bash
git clone https://github.com/ismailquadri/figma-component-generator.git
cd figma-component-generator
npm install
npm link
```

## Setup

First-time setup to configure your Figma API token:

```bash
generate-component setup
```

You'll be prompted for:
- Figma API token (get it from [Figma Settings](https://www.figma.com/developers/api#authentication))
- Default output directory
- Default framework
- Default styling approach

## Usage

### Generate a Component

```bash
generate-component generate --url "https://figma.com/file/xxxxx/Design-System" --name Button
```

Or use interactive mode:

```bash
generate-component generate
```

### Options

- `-u, --url <url>` - Figma file URL
- `-n, --name <name>` - Component name
- `-o, --output <dir>` - Output directory (default: ./src/components)
- `-f, --framework <framework>` - Framework: react, vue, svelte
- `-s, --styling <styling>` - Styling: tailwind, css, styled-components, emotion
- `--storybook` - Generate Storybook story
- `--typescript` - Generate TypeScript types

### Examples

```bash
# Generate React component with Tailwind CSS
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --framework react \
  --styling tailwind

# Generate Vue component with CSS
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Card \
  --framework vue \
  --styling css

# Generate Svelte component with styled-components
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Modal \
  --framework svelte \
  --styling styled-components \
  --typescript

# Generate with Storybook
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --storybook

# Generate with CSS Modules
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --styling css-modules

# Generate with Stylus
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --styling stylus

# Generate with Less
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --styling less
```

## Supported Component Types

The generator automatically detects component types based on naming patterns:

### Button
- Detects: `Button`, `Btn`, `PrimaryButton`, etc.
- Features: Variants (primary, secondary, ghost), sizes, disabled state, keyboard navigation

### Input
- Detects: `Input`, `TextField`, `TextInput`, `EmailInput`, etc.
- Features: Type variants (text, email, password), error states, accessibility attributes, focus states

### Card
- Detects: `Card`, `ProductCard`, `InfoCard`, etc.
- Features: Title/subtitle sections, action buttons, hover effects, variant styles (default, outlined, elevated)

### Modal
- Detects: `Modal`, `Dialog`, `Popup`, etc.
- Features: Size variants (small, medium, large), overlay click handling, escape key support, accessibility (ARIA)

### Navigation
- Detects: `Navigation`, `Navbar`, `Menu`, `Header`, etc.
- Features: Logo, links array, mobile responsive toggle, external link support

The generator intelligently extracts design properties (colors, typography, spacing, borders) from your Figma designs and applies them to the generated components.

## Professional Storybook Integration

### Initialize Storybook with Auto-Detection

Automatically set up Storybook with project type detection:

```bash
generate-component init-storybook
```

This automatically detects your project type (Next.js, CRA, Vite, etc.) and configures Storybook accordingly.

### Storybook Presets

Choose from professional presets for different project types:

```bash
# React with Vite (default)
generate-component init-storybook --preset react-vite

# Next.js
generate-component init-storybook --preset nextjs

# Create React App
generate-component init-storybook --preset cra

# Vue with Vite
generate-component init-storybook --preset vue-vite --framework vue

# Svelte with Vite
generate-component init-storybook --preset svelte-vite --framework svelte

# Full professional setup
generate-component init-storybook --preset full

# Minimal setup
generate-component init-storybook --preset minimal
```

List all available presets:

```bash
generate-component init-storybook --list-presets
```

### Professional Features

Include additional professional features:

```bash
# Complete professional setup with all features
generate-component init-storybook --preset full --ci --testing --visual --monorepo

# CI/CD integration (GitHub Actions)
generate-component init-storybook --ci

# Testing configuration
generate-component init-storybook --testing

# Visual regression testing
generate-component init-storybook --visual

# Monorepo support (auto-detects Nx, Turborepo, Lerna, etc.)
generate-component init-storybook --monorepo
```

### Visual Regression Testing

Set up visual regression testing with Chromatic and Percy:

```bash
# Chromatic setup
generate-component init-visual-testing

# Chromatic + Percy setup
generate-component init-visual-testing --percy

# Custom concurrent builds
generate-component init-visual-testing --concurrent 8
```

### Monorepo Support

Set up Storybook for monorepo projects:

```bash
# Auto-detect monorepo type
generate-component init-monorepo

# Specify monorepo type
generate-component init-monorepo --type nx
generate-component init-monorepo --type turborepo
generate-component init-monorepo --type lerna
generate-component init-monorepo --type yarn-workspaces
```

### Enhanced Story Generation

When generating components with `--storybook`, the tool now:

- **Auto-detects component type** and generates appropriate stories
- **Extracts Figma metadata** for design tokens and documentation
- **Includes accessibility parameters** for a11y testing
- **Generates comprehensive examples** for all variants
- **Adds proper TypeScript types** for Storybook
- **Creates responsive viewport configurations**
- **Integrates Figma design links** in story parameters

```bash
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --storybook
```

### Storybook Features

The professional Storybook setup includes:

- **Accessibility Testing**: Integrated axe-core for WCAG compliance
- **Theme Support**: Dark/light mode with theme switching
- **Viewport Presets**: Mobile, tablet, desktop breakpoints
- **Auto-Documentation**: MDX support with design tokens
- **Figma Integration**: Direct links to Figma designs
- **Professional Addons**: a11y, themes, viewport, docs, interactions
- **CI/CD Ready**: GitHub Actions for automated deployment
- **Visual Testing**: Chromatic/Percy integration
- **Monorepo Support**: Nx, Turborepo, Lerna, Yarn Workspaces

### Storybook Folder Structure

The setup creates a professional folder structure:

```
src/
├── stories/
│   ├── introduction/      # Introduction and getting started
│   ├── components/        # Component stories
│   ├── docs/             # MDX documentation
│   └── examples/         # Usage examples
├── components/           # Generated components
├── decorators/          # Reusable decorators
│   ├── withTheme.js
│   ├── withRouter.js
│   └── withI18n.js
└── styles/              # Global styles
```

## Configuration

### Update API Token

```bash
generate-component update-token
```

### Show Current Configuration

```bash
generate-component config-show
```

### Initialize Storybook

Automatically set up Storybook in your project with the correct configuration:

```bash
generate-component init-storybook
generate-component init-storybook --directory ./my-project --framework react
```

This will:
- Install Storybook dependencies
- Create `.storybook` configuration files
- Add Storybook scripts to package.json
- Set up the stories directory structure

### Config File Location

`~/.config/figma-component-generator/config.json`

## Output Structure

The tool generates:

```
src/components/
├── Button.jsx              # Component code
├── Button.styles.js        # Styles (if using CSS)
├── Button.stories.jsx      # Storybook story (if --storybook)
└── Button.types.ts         # TypeScript types (if --typescript)
```

## Supported Styling Approaches

### Tailwind CSS
```jsx
<Button variant="primary" size="medium">
  Click me
</Button>
```

### CSS Modules
```jsx
<Button variant="primary" size="medium">
  Click me
</Button>
```

### Styled Components
```jsx
<Button variant="primary" size="medium">
  Click me
</Button>
```

## Component Props

Generated components support:

- `variant` - primary, secondary, ghost
- `size` - small, medium, large
- `children` - Button content
- `className` - Additional CSS classes
- `onClick` - Click handler
- `disabled` - Disabled state

## Getting Your Figma API Token

1. Go to [Figma Settings](https://www.figma.com/settings)
2. Scroll to "Personal Access Tokens"
3. Click "Create new token"
4. Copy the token (starts with `figd_`)
5. Run `generate-component setup` and paste the token

## Roadmap

- [ ] Support for more component types (inputs, cards, modals, navigation)
- [ ] Responsive design generation from Figma frames
- [ ] Figma plugin for direct export
- [ ] Enhanced Storybook integration
- [ ] More styling frameworks (CSS Modules, Stylus, Less)
- [ ] Asset export (images, icons, fonts)

## Troubleshooting

### "Invalid API token"
Run `generate-component update-token` and enter your token again.

### "Component not found in Figma file"
Make sure the component name matches exactly what's in Figma.

### "File not found"
Check that the Figma URL is correct and you have access to the file.

## Contributing

Contributions welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on how to contribute to this project.

Please note that this project has a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

## License

MIT © [Ismail Quadri](https://github.com/ismailquadri)

## Acknowledgments

- Built with [Figma API](https://www.figma.com/developers/api)
- Inspired by the need to bridge the gap between design and development
- Thanks to all contributors who help improve this tool

## Support

- 🐛 [Report bugs](https://github.com/ismailquadri/figma-component-generator/issues)
- 💡 [Request features](https://github.com/ismailquadri/figma-component-generator/issues)
- 📖 [Documentation](https://github.com/ismailquadri/figma-component-generator/wiki)
- 💬 [Discussions](https://github.com/ismailquadri/figma-component-generator/discussions)