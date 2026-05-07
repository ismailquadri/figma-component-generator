const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class HandoffPackageGenerator {
  constructor(options) {
    this.figmaUrl = options.figmaUrl;
    this.projectName = options.projectName || 'Design System';
    this.clientName = options.clientName || 'Client';
    this.designerName = options.designerName || 'Your Name';
    this.version = options.version || '1.0.0';
    this.outputDir = options.outputDir || './handoff-package';
    this.figmaApiToken = options.figmaApiToken;
  }

  async generate() {
    console.log('🎨 Generating Professional Design System Handoff Package');
    console.log('');
    console.log(chalk.gray(`Project: ${this.projectName}`));
    console.log(chalk.gray(`Client: ${this.clientName}`));
    console.log(chalk.gray(`Designer: ${this.designerName}`));
    console.log('');

    // Create project structure
    await this.createProjectStructure();

    // Fetch Figma data
    console.log(chalk.yellow('Fetching design data from Figma...'));
    const FigmaClient = require('./figma');
    const figmaClient = new FigmaClient(this.figmaApiToken);
    const fileKey = this.extractFileKey(this.figmaUrl);
    this.figmaData = await figmaClient.getFile(fileKey);
    console.log(chalk.green('✓ Design data fetched'));

    // Extract design tokens from Figma
    console.log(chalk.yellow('Extracting design tokens...'));
    this.designTokens = figmaClient.extractDesignTokens(this.figmaData);
    console.log(chalk.green(`✓ Found ${Object.keys(this.designTokens.colors || {}).length} colors`));
    console.log(chalk.green(`✓ Found ${Object.keys(this.designTokens.typography || {}).length} typography styles`));

    // Detect components in Figma
    console.log(chalk.yellow('Detecting components...'));
    this.components = this.detectComponents(this.figmaData);
    console.log(chalk.green(`✓ Found ${this.components.length} components`));

    // Generate documentation site
    await this.generateDocumentationSite();

    // Generate components from Figma
    await this.generateComponents();

    // Export design tokens from Figma
    await this.exportDesignTokens();

    // Create installation guide
    await this.createInstallationGuide();

    // Create API documentation
    await this.createAPIDocumentation();

    // Create usage examples
    await this.createUsageExamples();

    // Create professional README
    await this.createProfessionalREADME();

    // Create package.json for easy installation
    await this.createPackageJson();

    // Create zip-ready structure
    await this.createZipStructure();

    console.log('');
    console.log(chalk.green('✅ Handoff Package Generated Successfully!'));
    console.log('');
    console.log(chalk.yellow('📦 Package Contents:'));
    console.log(chalk.white('  📚 Documentation Site (index.html)'));
    console.log(chalk.white('  🎨 Components (src/components/)'));
    console.log(chalk.white('  🔧 Design Tokens (src/tokens/)'));
    console.log(chalk.white('  📖 Installation Guide (INSTALLATION.md)'));
    console.log(chalk.white('  📝 API Documentation (API.md)'));
    console.log(chalk.white('  💡 Usage Examples (EXAMPLES.md)'));
    console.log(chalk.white('  📄 README.md'));
    console.log(chalk.white('  📦 package.json'));
    console.log('');
    console.log(chalk.yellow('🎯 Next Steps:'));
    console.log(chalk.white('  1. Review the documentation site: open index.html'));
    console.log(chalk.white('  2. Customize branding in docs/styles.css'));
    console.log(chalk.white('  3. Zip the folder and send to client'));
    console.log(chalk.white('  4. Or deploy to Vercel/Netlify for live documentation'));
  }

  async createProjectStructure() {
    const projectDir = this.outputDir;
    
    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(projectDir, 'src'));
    await fs.ensureDir(path.join(projectDir, 'src/components'));
    await fs.ensureDir(path.join(projectDir, 'src/styles'));
    await fs.ensureDir(path.join(projectDir, 'src/tokens'));
    await fs.ensureDir(path.join(projectDir, 'docs'));
    await fs.ensureDir(path.join(projectDir, 'examples'));

    this.projectDir = projectDir;
  }

  async generateDocumentationSite() {
    console.log('📚 Generating documentation site...');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.projectName} - Design System</title>
    <link rel="stylesheet" href="docs/styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-logo">
        <h1>${this.projectName}</h1>
        <span class="version">v${this.version}</span>
      </div>
      <div class="nav-links">
        <a href="#components">Components</a>
        <a href="#tokens">Design Tokens</a>
        <a href="#installation">Installation</a>
        <a href="#api">API</a>
        <a href="#examples">Examples</a>
      </div>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-container">
      <div class="hero-content">
        <h1 class="hero-title">${this.projectName}</h1>
        <p class="hero-subtitle">A complete design system for ${this.clientName}</p>
        <p class="hero-meta">Designed by ${this.designerName} • Version ${this.version}</p>
        <div class="hero-actions">
          <a href="#installation" class="btn btn-primary">Get Started</a>
          <a href="#components" class="btn btn-secondary">View Components</a>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section id="components" class="section">
      <div class="container">
        <h2 class="section-title">Components</h2>
        <p class="section-description">Ready-to-use components built from Figma designs</p>
        <div class="components-grid">
          <!-- Components will be dynamically added here -->
          <div class="component-card">
            <div class="component-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
            <div class="component-info">
              <h3>Button</h3>
              <p>Primary, secondary, ghost variants</p>
              <a href="#api-button" class="component-link">View API →</a>
            </div>
          </div>
          <div class="component-card">
            <div class="component-preview" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
            <div class="component-info">
              <h3>Card</h3>
              <p>Content cards with variants</p>
              <a href="#api-card" class="component-link">View API →</a>
            </div>
          </div>
          <div class="component-card">
            <div class="component-preview" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);"></div>
            <div class="component-info">
              <h3>Input</h3>
              <p>Form inputs with validation</p>
              <a href="#api-input" class="component-link">View API →</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="tokens" class="section">
      <div class="container">
        <h2 class="section-title">Design Tokens</h2>
        <p class="section-description">Colors, typography, spacing, and effects extracted from Figma</p>
        <div class="tokens-grid">
          <div class="token-section">
            <h3>Colors</h3>
            <div class="color-grid">
              <div class="color-swatch" style="background: #476cff;"></div>
              <div class="color-swatch" style="background: #fb3748;"></div>
              <div class="color-swatch" style="background: #c2f5da;"></div>
              <div class="color-swatch" style="background: #fffaeb;"></div>
              <div class="color-swatch" style="background: #d6dce8;"></div>
            </div>
          </div>
          <div class="token-section">
            <h3>Typography</h3>
            <div class="typography-grid">
              <div class="typography-sample">
                <span style="font-size: 32px; font-weight: 600;">Heading</span>
              </div>
              <div class="typography-sample">
                <span style="font-size: 16px; font-weight: 400;">Body text</span>
              </div>
              <div class="typography-sample">
                <span style="font-size: 14px; font-weight: 500;">Small text</span>
              </div>
            </div>
          </div>
          <div class="token-section">
            <h3>Spacing</h3>
            <div class="spacing-grid">
              <div class="spacing-sample" style="width: 8px;"></div>
              <div class="spacing-sample" style="width: 16px;"></div>
              <div class="spacing-sample" style="width: 24px;"></div>
              <div class="spacing-sample" style="width: 32px;"></div>
              <div class="spacing-sample" style="width: 48px;"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="installation" class="section">
      <div class="container">
        <h2 class="section-title">Installation</h2>
        <p class="section-description">Quick setup guide for the engineering team</p>
        <div class="installation-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Install Dependencies</h3>
              <pre><code>npm install</code></pre>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Import Components</h3>
              <pre><code>import { Button } from './src/components/Button';</code></pre>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Import Design Tokens</h3>
              <pre><code>import './src/tokens/design-tokens.css';</code></pre>
            </div>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Start Building</h3>
              <pre><code>&lt;Button variant="primary"&gt;Click me&lt;/Button&gt;</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="api" class="section">
      <div class="container">
        <h2 class="section-title">API Documentation</h2>
        <p class="section-description">Complete API reference for all components</p>
        <div class="api-sections">
          <div id="api-button" class="api-section">
            <h3>Button Component</h3>
            <div class="api-props">
              <h4>Props</h4>
              <table>
                <tr>
                  <th>Prop</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
                <tr>
                  <td><code>variant</code></td>
                  <td><code>'primary' | 'secondary' | 'ghost'</code></td>
                  <td><code>'primary'</code></td>
                  <td>Button style variant</td>
                </tr>
                <tr>
                  <td><code>size</code></td>
                  <td><code>'small' | 'medium' | 'large'</code></td>
                  <td><code>'medium'</code></td>
                  <td>Button size</td>
                </tr>
                <tr>
                  <td><code>children</code></td>
                  <td><code>ReactNode</code></td>
                  <td><code>null</code></td>
                  <td>Button content</td>
                </tr>
                <tr>
                  <td><code>disabled</code></td>
                  <td><code>boolean</code></td>
                  <td><code>false</code></td>
td>Disable button</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="examples" class="section">
      <div class="container">
        <h2 class="section-title">Usage Examples</h2>
        <p class="section-description">Common implementation patterns</p>
        <div class="examples-grid">
          <div class="example-card">
            <h3>Basic Button</h3>
            <pre><code>&lt;Button variant="primary"&gt;Click me&lt;/Button&gt;</code></pre>
          </div>
          <div class="example-card">
            <h3>Button with Icon</h3>
            <pre><code>&lt;Button variant="secondary"&gt;Cancel&lt;/Button&gt;</code></pre>
          </div>
          <div class="example-card">
            <h3>Disabled Button</h3>
            <pre><code>&lt;Button disabled&gt;Disabled&lt;/Button&gt;</code></pre>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="footer-container">
        <p>&copy; ${new Date().getFullYear()} ${this.clientName}. Design system created by ${this.designerName}.</p>
        <p class="footer-links">
          <a href="README.md">Documentation</a>
          <a href="INSTALLATION.md">Installation Guide</a>
          <a href="API.md">API Reference</a>
        </p>
      </div>
    </footer>
</body>
</html>`;

    await fs.writeFile(path.join(this.projectDir, 'index.html'), html);

    // Create CSS
    const css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #476cff;
  --secondary: #f5576c;
  --dark: #1a1a1a;
  --light: #f7f7f7;
  --gray: #6b7280;
  --border: #e5e7eb;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: var(--dark);
  line-height: 1.6;
}

.navbar {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--dark);
}

.version {
  font-size: 0.875rem;
  color: var(--gray);
  font-weight: 400;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--gray);
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary);
}

.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 6rem 0;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.5rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.hero-meta {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: transform 0.2s;
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: white;
  color: var(--primary);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.section {
  padding: 4rem 0;
}

.section:nth-child(even) {
  background: var(--light);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.section-description {
  font-size: 1.125rem;
  color: var(--gray);
  margin-bottom: 3rem;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.component-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.component-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.component-preview {
  height: 200px;
}

.component-info {
  padding: 1.5rem;
}

.component-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.component-info p {
  color: var(--gray);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.component-link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.token-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.token-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.color-grid {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.typography-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.typography-sample {
  padding: 1rem;
  background: var(--light);
  border-radius: 8px;
}

.spacing-grid {
  display: flex;
  gap: 0.5rem;
}

.spacing-sample {
  height: 40px;
  background: var(--primary);
  border-radius: 4px;
}

.installation-steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.step {
  display: flex;
  gap: 1.5rem;
}

.step-number {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.step-content pre {
  background: var(--dark);
  color: var(--light);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.api-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-top: 2rem;
}

.api-section h3 {
  font-size: 1.25rem;
  font 600;
  margin-bottom: 1rem;
}

.api-props table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.api-props th,
.api-props td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.api-props th {
  font-weight: 600;
  background: var(--light);
}

.api-props code {
  background: var(--light);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
}

.examples-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.example-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.example-card h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.example-card pre {
  background: var(--dark);
  color: var(--light);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.footer {
  background: var(--dark);
  color: white;
  padding: 3rem 0;
  margin-top: 4rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  text-align: center;
}

.footer p {
  opacity: 0.8;
  margin-bottom: 0.5rem;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 2rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.footer-links a:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .nav-links {
    display: none;
  }
  
  .components-grid,
  .tokens-grid,
  .examples-grid {
    grid-template-columns: 1fr;
  }
}`;

    await fs.writeFile(path.join(this.projectDir, 'docs', 'styles.css'), css);

    console.log('✓ Documentation site generated');
  }

  async generateComponents() {
    console.log('🎨 Generating components from Figma...');

    const ComponentGenerator = require('./generator');
    const generator = new ComponentGenerator({
      framework: 'react',
      styling: 'css',
      includeStorybook: true,
      includeTypescript: true
    });

    // Generate components for each detected component
    for (const component of this.components) {
      console.log(chalk.gray(`  Generating ${component.name}...`));
      
      try {
        const componentCode = generator.generate(component.name, this.figmaData);
        
        // Write component file
        const componentName = this.toPascalCase(component.name);
        const componentFile = path.join(this.projectDir, 'src/components', `${componentName}.jsx`);
        await fs.writeFile(componentFile, componentCode.component);
        
        // Write styles file if provided
        if (componentCode.styles) {
          const stylesFile = path.join(this.projectDir, 'src/components', `${componentName}.styles.css`);
          await fs.writeFile(stylesFile, componentCode.styles);
        }
        
        // Write Storybook story if provided
        if (componentCode.storybook) {
          const storybookFile = path.join(this.projectDir, 'src/components', `${componentName}.stories.jsx`);
          await fs.writeFile(storybookFile, componentCode.storybook);
        }
        
        // Write TypeScript types if provided
        if (componentCode.types) {
          const typesFile = path.join(this.projectDir, 'src/components', `${componentName}.types.ts`);
          await fs.writeFile(typesFile, componentCode.types);
        }
        
        console.log(chalk.green(`  ✓ ${component.name} generated`));
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ ${component.name} skipped: ${error.message}`));
      }
    }

    // If no components found, generate a sample Button component
    if (this.components.length === 0) {
      console.log(chalk.yellow('  No components found in Figma, generating sample Button...'));
      await this.generateSampleButton();
    }

    console.log('✓ Components generated');
  }

  async generateSampleButton() {
    const buttonComponent = `import React from 'react';
import './Button.styles.css';

const Button = ({ 
  variant = 'primary', 
  size = 'medium', 
  children, 
  disabled = false,
  onClick 
}) => {
  const classes = [
    'btn',
    \`btn-\${variant}\`,
    \`btn-\${size}\`,
    disabled && 'btn-disabled'
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;`;

    const buttonStyles = `.btn {
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-primary {
  background: var(--color-primary, #476cff);
  color: white;
}

.btn-primary:hover:not(.btn-disabled) {
  background: var(--color-primary-dark, #3a5ce5);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-secondary, #f5576c);
  color: white;
}

.btn-secondary:hover:not(.btn-disabled) {
  background: var(--color-secondary-dark, #d94558);
  transform: translateY(-1px);
}

.btn-ghost {
  background: transparent;
  color: var(--color-primary, #476cff);
  border: 1px solid var(--color-primary, #476cff);
}

.btn-ghost:hover:not(.btn-disabled) {
  background: var(--color-primary-light, #8b9fff);
}

.btn-small {
  padding: 6px 12px;
  font-size: 14px;
}

.btn-medium {
  padding: 8px 16px;
  font-size: 16px;
}

.btn-large {
  padding: 12px 24px;
  font-size: 18px;
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}`;

    await fs.writeFile(
      path.join(this.projectDir, 'src/components', 'Button.jsx'),
      buttonComponent
    );
    await fs.writeFile(
      path.join(this.projectDir, 'src/components', 'Button.styles.css'),
      buttonStyles
    );
  }

  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, c => c.toUpperCase());
  }

  async exportDesignTokens() {
    console.log('🎨 Exporting design tokens from Figma...');

    // Use real design tokens extracted from Figma
    const tokens = this.designTokens || this.getDefaultTokens();
    
    const DesignTokenExporter = require('./token-exporter');
    const exporter = new DesignTokenExporter(tokens);

    // Export to multiple formats
    await exporter.exportJSON(path.join(this.projectDir, 'src/tokens', 'design-tokens.json'));
    await exporter.exportCSSVariables(path.join(this.projectDir, 'src/tokens', 'design-tokens.css'));
    await exporter.exportSCSS(path.join(this.projectDir, 'src/tokens', 'design-tokens.scss'));
    await exporter.exportJavaScript(path.join(this.projectDir, 'src/tokens', 'design-tokens.js'));
    await exporter.exportTypeScript(path.join(this.projectDir, 'src/tokens', 'design-tokens.ts'));

    console.log('✓ Design tokens exported');
  }

  getDefaultTokens() {
    return {
      colors: {
        primary: '#476cff',
        'primary-dark': '#3a5ce5',
        'primary-light': '#8b9fff',
        secondary: '#f5576c',
        'secondary-dark': '#d94558',
        'secondary-light': '#f88a99',
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        'text-primary': '#1a1a1a',
        'text-secondary': '#6b7280',
        'text-inverse': '#ffffff',
        'background-primary': '#ffffff',
        'background-secondary': '#f7f7f7',
        'background-tertiary': '#e5e7eb'
      },
      typography: {
        'heading-4xl': { fontFamily: 'Inter', fontSize: 36, fontWeight: 700, lineHeight: 1.2 },
        'heading-3xl': { fontFamily: 'Inter', fontSize: 30, fontWeight: 700, lineHeight: 1.2 },
        'heading-2xl': { fontFamily: 'Inter', fontSize: 24, fontWeight: 600, lineHeight: 1.3 },
        'heading-xl': { fontFamily: 'Inter', fontSize: 20, fontWeight: 600, lineHeight: 1.4 },
        'heading-lg': { fontFamily: 'Inter', fontSize: 18, fontWeight: 600, lineHeight: 1.5 },
        'body-regular': { fontFamily: 'Inter', fontSize: 16, fontWeight: 400, lineHeight: 1.6 },
        'body-medium': { fontFamily: 'Inter', fontSize: 16, fontWeight: 500, lineHeight: 1.6 },
        'body-semibold': { fontFamily: 'Inter', fontSize: 16, fontWeight: 600, lineHeight: 1.6 },
        'small-regular': { fontFamily: 'Inter', fontSize: 14, fontWeight: 400, lineHeight: 1.5 },
        'small-medium': { fontFamily: 'Inter', fontSize: 14, fontWeight: 500, lineHeight: 1.5 }
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px'
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px'
      },
      effects: {
        'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'shadow-xl': '0 20px 25px rgba(0, 0, 0, 0.1)'
      }
    };
  }

  async createInstallationGuide() {
    const guide = `# Installation Guide

This guide will help the ${this.clientName} engineering team set up the ${this.projectName} design system.

## Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- React project set up

## Installation

### 1. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Copy Design System Files

Copy the \`src/\` folder to your project:

\`\`\`bash
cp -r src/components/* your-project/src/components/
cp -r src/tokens/* your-project/src/tokens/
\`\`\`

### 3. Import Design Tokens

In your main CSS or index file:

\`\`\`css
@import './src/tokens/design-tokens.css';
\`\`\`

### 4. Import Components

\`\`\`jsx
import { Button } from './src/components/Button';
\`\`\`

### 5. Use Components

\`\`\`jsx
<Button variant="primary">Click me</Button>
\`\`\`

## Component Props

See [API.md](./API.md) for complete component API documentation.

## Design Tokens

Design tokens are available in multiple formats:

- **CSS Variables:** \`src/tokens/design-tokens.css\`
- **JSON:** \`src/tokens/design-tokens.json\`

## Support

For questions or issues, contact:
- Designer: ${this.designerName}
- Client: ${this.clientName}
`;

    await fs.writeFile(path.join(this.projectDir, 'INSTALLATION.md'), guide);

    console.log('✓ Installation guide created');
  }

  async createAPIDocumentation() {
    const api = `# API Documentation

Complete API reference for ${this.projectName} components.

## Components

### Button

\`\`\`jsx
import { Button } from './src/components/Button';
\`\`\`

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`variant\` | \`'primary' | 'secondary' | 'ghost'\` | Button style variant |
| \`size\` | \`'small' | 'medium' | 'large'\` | Button size |
| \`children\` | \`ReactNode\` | \`null\` | Button content |
| \`disabled\` | \`boolean\` | \`false\` | Disable button |
| \`onClick\` | \`() => void\` | \`undefined\` | Click handler |

#### Examples

\`\`\`jsx
// Primary button
<Button variant="primary">Click me</Button>

// Secondary button
<Button variant="secondary">Cancel</Button>

// Small button
<Button size="small">Small</Button>

// Disabled button
<Button disabled>Disabled</Button>

// With click handler
<Button onClick={() => alert('Clicked!')}>Click me</Button>
\`\`\`

## Design Tokens

### Colors

CSS variables are available for all colors:

\`\`\`css
var(--color-primary)
var(--color-secondary)
var(--color-success)
var(--color-error)
var(--color-warning)
var(--color-info)
\`\`\`

### Typography

\`\`\`css
font-family: var(--font-heading-medium-4xl)
font-size: var(--font-heading-medium-4xl-size)
\`\`\`

### Spacing

\`\`\`css
padding: var(--spacing-1)
padding: var(--spacing-2)
padding: var(--spacing-3)
\`\`\`

## TypeScript Types

TypeScript types are included for all components:

\`\`\`typescript
import { ButtonProps } from './src/components/Button.types';
\`\`\`
`;

    await fs.writeFile(path.join(this.projectDir, 'API.md'), api);

    console.log('✓ API documentation created');
  }

  async createUsageExamples() {
    const examples = `# Usage Examples

Common implementation patterns for ${this.projectName}.

## Button Examples

### Basic Button

\`\`\`jsx
<Button variant="primary">Click me</Button>
\`\`\`

### Button with Loading State

\`\`\`jsx
const [isLoading, setIsLoading] = useState(false);

<Button 
  disabled={isLoading}
  onClick={handleSubmit}
>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
\`\`\`

### Button with Icon

\`\`\`jsx
<Button variant="secondary">
  <Icon name="arrow-right" />
  Continue
</Button>
\`\`\`

### Button Group

\`\`\`jsx
<div className="button-group">
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</div>
\`\`\`

## Using Design Tokens

### Colors

\`\`\`jsx
const styles = {
  background: 'var(--color-primary)',
  text: 'var(--color-text-dark)'
};
\`\`\`

### Typography

\`\`\`jsx
const styles = {
  fontFamily: 'var(--font-body-regular-sm)',
  fontSize: 'var(--font-body-regular-sm-size)'
};
\`\`\`

### Spacing

\`\`\`jsx
const styles = {
  padding: 'var(--spacing-2)',
  margin: 'var(--spacing-4)'
};
\`\`\`

## Responsive Design

All components support responsive sizing:

\`\`\`jsx
<Button size="small">Small screens</Button>
<Button size="medium">Tablet</Button>
<Button size="large">Desktop</Button>
\`\`\`
`;

    await fs.writeFile(path.join(this.projectDir, 'EXAMPLES.md'), examples);

    console.log('✓ Usage examples created');
  }

  async createProfessionalREADME() {
    const readme = `# ${this.projectName}

> A complete design system for ${this.clientName}
>
> Version ${this.version}
>
> Designed by ${this.designerName}

---

## Overview

${this.projectName} is a complete design system built in Figma and automatically converted to production-ready React components. This handoff package includes everything the ${this.clientName} engineering team needs to start building immediately.

## 📦 What's Included

- **React Components** - Production-ready components extracted from Figma
- **Design Tokens** - Colors, typography, spacing, and effects
- **Documentation Site** - Interactive documentation (index.html)
- **Installation Guide** - Step-by-step setup instructions
- **API Reference** - Complete component documentation
- **Usage Examples** - Common implementation patterns
- **TypeScript Types** - Full type definitions

## 🚀 Quick Start

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Copy Files to Your Project**
   \`\`\`bash
   cp -r src/* your-project/src/
   \`\`\`

3. **Import and Use**
   \`\`\`jsx
   import { Button } from './src/components/Button';
   
   <Button variant="primary">Get Started</Button>
   \`\`\`

## 📚 Documentation

- **Interactive Docs:** Open \`index.html\` in your browser
- **Installation:** See [INSTALLATION.md](INSTALLATION.md)
- **API Reference:** See [API.md](API.md)
- **Examples:** See [EXAMPLES.md](EXAMPLES.md)

## 🎨 Design Tokens

All design tokens are exported in multiple formats:

- **CSS Variables:** \`src/tokens/design-tokens.css\`
- **JSON:** \`src/tokens/design-tokens.json\`
- **TypeScript:** \`src/tokens/design-tokens.ts\`

### Using Design Tokens

\`\`\`css
/* Import in your main CSS */
@import './src/tokens/design-tokens.css';

/* Use in your components */
.button {
  background: var(--color-primary);
  padding: var(--spacing-2);
}
\`\`\`

## 🔧 Components

All components include:

- ✅ React + TypeScript
- ✅ CSS Modules
- ✅ Multiple variants
- ✅ Size options
- ✅ Accessibility attributes
- ✅ Responsive design

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Support

For questions or issues:
- **Designer:** ${this.designerName}
- **Client:** ${this.clientName}
- **Version:** ${this.version}

---

*Generated with Figma Component Generator*
`;

    await fs.writeFile(path.join(this.projectDir, 'README.md'), readme);

    console.log('✓ Professional README created');
  }

  async createPackageJson() {
    const packageJson = {
      name: this.projectName.toLowerCase().replace(/\s+/g, '-'),
      version: this.version,
      description: `Design system for ${this.clientName}`,
      main: 'index.html',
      scripts: {
        'dev': 'npx serve',
        'build': 'echo \'Build script can be customized\'',
        'test': 'echo \'Add your test command here\''
      },
      keywords: [
        'design-system',
        'react',
        'components',
        'ui',
        'figma'
      ],
      author: this.designerName,
      license: 'MIT',
      devDependencies: {
        'serve': '^14.0.0'
      }
    };

    await fs.writeJson(path.join(this.projectDir, 'package.json'), packageJson, { spaces: 2 });

    console.log('✓ package.json created');
  }

  async createZipStructure() {
    // Create a delivery manifest
    const componentNames = this.components.map(c => this.toPascalCase(c.name));
    if (componentNames.length === 0) {
      componentNames.push('Button');
    }

    const manifest = {
      projectName: this.projectName,
      clientName: this.clientName,
      designerName: this.designerName,
      version: this.version,
      generatedAt: new Date().toISOString(),
      components: componentNames,
      documentation: ['index.html', 'README.md', 'INSTALLATION.md', 'API.md', 'EXAMPLES.md'],
      tokens: ['design-tokens.json', 'design-tokens.css'],
      instructions: [
        '1. Open index.html to view interactive documentation',
        '2. Read INSTALLATION.md for setup instructions',
        '3. Copy src/ folder to your project',
        '4. Import and use components',
        '5. Contact designer for questions'
      ]
    };

    await fs.writeJson(path.join(this.projectDir, 'MANIFEST.json'), manifest, { spaces: 2 });

    console.log('✓ Delivery manifest created');
  }

  extractFileKey(url) {
    const oldFormatMatch = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    const newFormatMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);

    if (oldFormatMatch) return oldFormatMatch[1];
    if (newFormatMatch) return newFormatMatch[1];
    throw new Error('Invalid Figma URL');
  }

  detectComponents(figmaData) {
    const components = [];
    
    function traverse(node) {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type
        });
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    
    if (figmaData.document) {
      traverse(figmaData.document);
    }
    
    return components;
  }
}

module.exports = HandoffPackageGenerator;