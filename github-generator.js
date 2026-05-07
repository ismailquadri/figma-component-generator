const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class GitHubRepoGenerator {
  constructor(options) {
    this.figmaUrl = options.figmaUrl;
    this.repoName = options.repoName || 'design-system';
    this.description = options.description || 'Design System generated from Figma';
    this.token = options.githubToken;
    this.private = options.private || false;
    this.outputDir = options.outputDir || './output';
  }

  async generate() {
    console.log('🚀 Generating GitHub Repository from Figma');
    console.log('');

    // 1. Create project structure
    await this.createProjectStructure();

    // 2. Generate components from Figma
    await this.generateComponents();

    // 3. Export design tokens
    await this.exportDesignTokens();

    // 4. Generate documentation
    await this.generateDocumentation();

    // 5. Create README
    await this.createREADME();

    // 6. Initialize git
    await this.initializeGit();

    console.log('');
    console.log('✅ Repository generated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${this.repoName}`);
    console.log(`  git remote add origin <your-github-repo-url>`);
    console.log(`  git push -u origin main`);
  }

  async createProjectStructure() {
    const projectDir = path.join(this.outputDir, this.repoName);
    
    await fs.ensureDir(projectDir);
    await fs.ensureDir(path.join(projectDir, 'src'));
    await fs.ensureDir(path.join(projectDir, 'src/components'));
    await fs.ensureDir(path.join(projectDir, 'src/styles'));
    await fs.ensureDir(path.join(projectDir, 'src/tokens'));
    await fs.ensureDir(path.join(projectDir, 'docs'));
    await fs.ensureDir(path.join(projectDir, '.github', 'workflows'));
    await fs.ensureDir(path.join(projectDir, '.design-system'));

    this.projectDir = projectDir;
  }

  async generateComponents() {
    const FigmaClient = require('./figma');
    const ComponentGenerator = require('./generator');
    const ConfigManager = require('./config');
    const VersionManager = require('./version-manager');

    const configManager = new ConfigManager();
    const configData = configManager.loadConfig();
    const figmaClient = new FigmaClient(configData.figma.api_token);

    // Fetch Figma data
    console.log('📥 Fetching Figma data...');
    const fileKey = this.extractFileKey(this.figmaUrl);
    const figmaData = await figmaClient.getFile(fileKey);

    // Find all components
    console.log('🔍 Finding components...');
    const components = this.findComponents(figmaData.document);
    console.log(`Found ${components.length} components`);

    // Generate each component
    const versionManager = new VersionManager(this.projectDir);
    await versionManager.init();

    const generator = new ComponentGenerator({
      framework: 'react',
      styling: 'css',
      includeStorybook: true,
      includeTypescript: true
    });

    for (const component of components) {
      try {
        console.log(`Generating ${component.name}...`);
        const componentData = figmaClient.extractComponentData(figmaData, component.name);
        const componentCode = generator.generate(component.name, componentData);

      // Write files
      const componentDir = path.join(this.projectDir, 'src/components');
      await fs.writeFile(
        path.join(componentDir, `${component.name}.jsx`),
        componentCode.component
      );
      await fs.writeFile(
        path.join(componentDir, `${component.name}.styles.css`),
        componentCode.styles
      );
      await fs.writeFile(
        path.join(componentDir, `${component.name}.stories.jsx`),
        componentCode.storybook
      );
      await fs.writeFile(
        path.join(componentDir, `${component.name}.types.ts`),
        componentCode.types
      );

      // Save version
      await versionManager.saveComponentVersion(component.name, componentData, componentCode);
      } catch (error) {
        console.log(chalk.yellow(`  ⚠ Skipped ${component.name}: ${error.message}`));
      }
    }

    console.log('✓ Components generated');
  }

  findComponents(node) {
    const components = [];

    function traverse(n) {
      // Only include actual UI components, not documentation/decorative elements
      const isUIComponent = 
        (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') &&
        !n.name.includes('[Documentation]') &&
        !n.name.includes('Image=') &&
        !n.name.includes('🎨') &&
        !n.name.includes('🧩') &&
        !n.name.includes('🏞️') &&
        !n.name.includes('Type=') &&
        !n.name.includes('Color=') &&
        !n.name.toLowerCase().includes('separator') &&
        !n.name.toLowerCase().includes('hero') &&
        !n.name.toLowerCase().includes('footer') &&
        !n.name.toLowerCase().includes('header') &&
        !n.name.toLowerCase().includes('features') &&
        !n.name.toLowerCase().includes('sections') &&
        !n.name.toLowerCase().includes('inline') &&
        !n.name.toLowerCase().includes('spotlight');

      if (isUIComponent) {
        components.push({
          name: n.name,
          type: n.type
        });
      }

      if (n.children) {
        n.children.forEach(traverse);
      }
    }

    traverse(node);
    return components;
  }

  async exportDesignTokens() {
    const FigmaClient = require('./figma');
    const DesignTokenExporter = require('./token-exporter');
    const ConfigManager = require('./config');
    const VersionManager = require('./version-manager');

    const configManager = new ConfigManager();
    const configData = configManager.loadConfig();
    const figmaClient = new FigmaClient(configData.figma.api_token);

    console.log('🎨 Exporting design tokens...');

    const fileKey = this.extractFileKey(this.figmaUrl);
    const figmaData = await figmaClient.getFile(fileKey);
    const tokens = figmaClient.extractDesignTokens(figmaData);

    const exporter = new DesignTokenExporter(tokens);
    const tokensDir = path.join(this.projectDir, 'src/tokens');

    // Export in multiple formats
    await exporter.exportJSON(path.join(tokensDir, 'design-tokens.json'));
    await exporter.exportCSSVariables(path.join(tokensDir, 'design-tokens.css'));
    await exporter.exportSCSS(path.join(tokensDir, 'design-tokens.scss'));
    await exporter.exportJavaScript(path.join(tokensDir, 'design-tokens.js'));
    await exporter.exportTypeScript(path.join(tokensDir, 'design-tokens.ts'));

    console.log('✓ Design tokens exported');
  }

  async generateDocumentation() {
    const VersionManager = require('./version-manager');
    const versionManager = new VersionManager(this.projectDir);

    console.log('📚 Generating documentation...');

    // Generate component documentation
    const components = await versionManager.getAllComponents();

    let docs = '# Component Documentation\n\n';
    docs += `Generated from Figma: ${this.figmaUrl}\n\n`;
    docs += `Total Components: ${components.length}\n\n`;
    docs += '## Components\n\n';

    for (const comp of components) {
      docs += `### ${comp.name}\n\n`;
      docs += `- **Version:** ${comp.version}\n`;
      docs += `- **Status:** ${comp.status}\n`;
      docs += `- **Last Updated:** ${new Date(comp.lastUpdated).toLocaleDateString()}\n\n`;
    }

    await fs.writeFile(path.join(this.projectDir, 'docs', 'COMPONENTS.md'), docs);

    console.log('✓ Documentation generated');
  }

  async createREADME() {
    const readme = `# ${this.repoName}

${this.description}

## 🎨 Generated from Figma

This design system was automatically generated from Figma using the Figma Component Generator.

## 📦 Installation

\`\`\`bash
npm install
\`\`\`

## 🚀 Usage

\`\`\`jsx
import { Button } from './src/components/Button';

<Button variant="primary">Click me</Button>
\`\`\`

## 📚 Components

- See [docs/COMPONENTS.md](./docs/COMPONENTS.md) for detailed component documentation

## 🎨 Design Tokens

Design tokens are available in multiple formats:
- \`src/tokens/design-tokens.json\` - JSON format
- \`src/tokens/design-tokens.css\` - CSS variables
- \`src/tokens/design-tokens.scss\` - SCSS variables
- \`src/tokens/design-tokens.ts\` - TypeScript

## 📖 Version History

Use the Figma Component Generator CLI to track changes:

\`\`\`bash
# View component history
generate-component history --changelog

# Check for Figma updates
generate-component diff --url <figma-url> --name <component>
\`\`\`

## 🔄 Updating from Figma

When designs change in Figma:

1. Check for changes: \`generate-component diff --url <figma-url> --name <component>\`
2. Re-generate: \`generate-component generate --url <figma-url> --name <component>\`
3. Review version history: \`generate-component history --name <component>\`

## 📝 Workflow

1. Design in Figma
2. Generate components: \`generate-component generate\`
3. Review changes: \`generate-component diff\`
4. Update status: \`generate-component status --set approved --name <component>\`
5. Commit changes

## 🛠️ Tech Stack

- React
- CSS Modules
- TypeScript
- Storybook

## 📄 License

MIT

---

Generated with [Figma Component Generator](https://github.com/yourusername/figma-component-generator)
`;

    await fs.writeFile(path.join(this.projectDir, 'README.md'), readme);

    console.log('✓ README created');
  }

  async initializeGit() {
    console.log('🔧 Initializing git...');

    try {
      execSync('git init', { cwd: this.projectDir, stdio: 'inherit' });
      execSync('git add .', { cwd: this.projectDir, stdio: 'inherit' });
      execSync('git commit -m "Initial commit from Figma Component Generator"', { 
        cwd: this.projectDir, 
        stdio: 'inherit' 
      });

      console.log('✓ Git initialized');
    } catch (error) {
      console.log('⚠ Git initialization skipped (git may not be available)');
    }
  }

  extractFileKey(url) {
    const oldFormatMatch = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
    const newFormatMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);

    if (oldFormatMatch) return oldFormatMatch[1];
    if (newFormatMatch) return newFormatMatch[1];
    throw new Error('Invalid Figma URL');
  }
}

module.exports = GitHubRepoGenerator;