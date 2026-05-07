# Figma Component Generator

Generate React components from Figma designs automatically. Save hours of manual implementation with a single command.

## Features

- ✅ Generate React components from Figma designs
- ✅ Multiple styling approaches (Tailwind, CSS, styled-components)
- ✅ TypeScript support
- ✅ Storybook documentation generation
- ✅ Persistent API token configuration
- ✅ Design token extraction
- ✅ Component variants support

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
# Generate with Tailwind CSS
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Button \
  --styling tailwind

# Generate with styled-components and TypeScript
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Card \
  --styling styled-components \
  --typescript

# Generate with Storybook
generate-component generate \
  --url "https://figma.com/file/xxxxx" \
  --name Modal \
  --storybook
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

- [ ] Support for more component types (inputs, cards, modals)
- [ ] Design token extraction to separate files
- [ ] Component variant detection from Figma
- [ ] Responsive design generation
- [ ] Accessibility attributes
- [ ] Vue and Svelte support
- [ ] Multiple framework export

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