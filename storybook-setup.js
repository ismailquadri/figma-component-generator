const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const StorybookPresets = require('./storybook-presets');

class StorybookSetup {
  constructor(projectPath, framework, options = {}) {
    this.projectPath = projectPath;
    this.framework = framework || 'react';
    this.preset = options.preset || 'react-vite';
    this.options = options;
    this.storybookDir = path.join(projectPath, '.storybook');
    this.presets = new StorybookPresets();
  }

  async setup() {
    console.log(chalk.blue('Setting up Professional Storybook...'));

    try {
      // Check if project exists
      if (!fs.existsSync(this.projectPath)) {
        throw new Error(`Project path does not exist: ${this.projectPath}`);
      }

      // Check package.json
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found in project directory');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Detect project type if preset is 'auto'
      if (this.preset === 'auto') {
        this.preset = this.detectProjectType(packageJson);
        console.log(chalk.yellow(`Auto-detected preset: ${this.preset}`));
      }

      // Get preset configuration
      const presetConfig = this.presets.getPreset(this.preset);
      console.log(chalk.yellow(`Using preset: ${presetConfig.name}`));
      console.log(chalk.gray(`  ${presetConfig.description}`));
      console.log('');

      // Install Storybook dependencies
      console.log(chalk.yellow('Installing Storybook dependencies...'));
      await this.installDependencies(packageJson, presetConfig.dependencies);

      // Create .storybook directory and files
      console.log(chalk.yellow('Creating Storybook configuration...'));
      this.createStorybookConfig(presetConfig);

      // Update package.json scripts
      this.updatePackageJsonScripts(packageJson);

      // Create professional folder structure
      this.createProfessionalStructure();

      // Create decorator templates
      this.createDecoratorTemplates();

      // Create CI/CD configuration if requested
      if (this.options.ci) {
        this.createCIConfig();
      }

      // Create testing configuration if requested
      if (this.options.testing) {
        this.createTestingConfig();
      }

      // Create .gitignore for Storybook
      this.createGitignore();

      console.log(chalk.green('✓ Storybook setup completed successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.cyan('  npm install                    - Install Storybook dependencies'));
      console.log(chalk.cyan('  npm run storybook              - Start Storybook development server'));
      console.log(chalk.cyan('  npm run build-storybook        - Build Storybook for production'));
      if (this.options.ci) {
        console.log(chalk.cyan('  npm run test-storybook         - Run Storybook tests'));
      }
      console.log(chalk.cyan('\nDocumentation:'));
      console.log(chalk.cyan('  Stories: src/stories/'));
      console.log(chalk.cyan('  Components: src/components/'));
      console.log(chalk.cyan('  Config: .storybook/'));

    } catch (error) {
      console.error(chalk.red('✗ Storybook setup failed:'), error.message);
      throw error;
    }
  }

  detectProjectType(packageJson) {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.next) {
      return 'nextjs';
    }
    if (deps['react-scripts']) {
      return 'cra';
    }
    if (deps.vite && deps.vue) {
      return 'vue-vite';
    }
    if (deps.vite && deps.svelte) {
      return 'svelte-vite';
    }
    if (deps.vite) {
      return 'react-vite';
    }
    if (deps.webpack) {
      return 'react-webpack';
    }
    
    return 'react-vite';
  }

  async installDependencies(packageJson, dependencies) {
    // Add to package.json
    Object.assign(packageJson.devDependencies || {}, dependencies);
    
    fs.writeFileSync(
      path.join(this.projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Skip automatic npm install - let user run it manually
    console.log(chalk.yellow('Dependencies added to package.json'));
    console.log(chalk.cyan('Please run: npm install'));
  }

  createStorybookConfig(presetConfig) {
    // Create .storybook directory
    if (!fs.existsSync(this.storybookDir)) {
      fs.mkdirSync(this.storybookDir, { recursive: true });
    }

    // Create main.js
    fs.writeFileSync(
      path.join(this.storybookDir, 'main.js'),
      presetConfig.mainConfig
    );

    // Create preview.js
    fs.writeFileSync(
      path.join(this.storybookDir, 'preview.js'),
      presetConfig.previewConfig
    );

    // Create manager.js for custom manager configuration
    this.createManagerConfig();

    // Create theme.js for theme configuration
    this.createThemeConfig();
  }

  createManagerConfig() {
    const managerConfig = `import { addons } from '@storybook/addons';
import { create } from '@storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'My Design System',
    brandUrl: 'https://example.com',
    brandImage: 'https://example.com/logo.png',
  }),
});
`;
    
    fs.writeFileSync(
      path.join(this.storybookDir, 'manager.js'),
      managerConfig
    );
  }

  createThemeConfig() {
    const themeConfig = `import { create } from '@storybook/theming';

export const lightTheme = create({
  base: 'light',
  brandTitle: 'My Design System',
  brandUrl: '/',
  brandImage: null,
});

export const darkTheme = create({
  base: 'dark',
  brandTitle: 'My Design System',
  brandUrl: '/',
  brandImage: null,
});
`;
    
    fs.writeFileSync(
      path.join(this.storybookDir, 'theme.js'),
      themeConfig
    );
  }

  updatePackageJsonScripts(packageJson) {
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['storybook'] = 'storybook dev -p 6006';
    packageJson.scripts['build-storybook'] = 'storybook build';
    
    if (this.options.testing) {
      packageJson.scripts['test-storybook'] = 'test-storybook';
      packageJson.scripts['chromatic'] = 'chromatic';
    }

    fs.writeFileSync(
      path.join(this.projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  createProfessionalStructure() {
    const srcPath = path.join(this.projectPath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }

    // Create professional folder structure
    const folders = [
      'stories',
      'stories/docs',
      'stories/components',
      'stories/examples',
      'stories/introduction',
      'components',
      'styles',
      'decorators'
    ];

    folders.forEach(folder => {
      const folderPath = path.join(srcPath, folder);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
    });

    // Create introduction story
    this.createIntroductionStory();

    // Create component template
    this.createComponentTemplate();

    // Create MDX documentation template
    this.createDocTemplate();
  }

  createIntroductionStory() {
    const introStory = `import { Meta, StoryObj } from '@storybook/react';
import { Page } from './Page';

const meta: Meta<typeof Page> = {
  title: 'Introduction',
  component: Page,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Default: Story = {
  args: {},
};
`;
    
    fs.writeFileSync(
      path.join(this.projectPath, 'src/stories/introduction/Introduction.stories.js'),
      introStory
    );
  }

  createComponentTemplate() {
    const componentTemplate = `import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from '../YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Components/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // Define your argTypes here for better controls
  },
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Primary: Story = {
  args: {
    // Define primary variant args
  },
};

export const Secondary: Story = {
  args: {
    // Define secondary variant args
  },
};
`;
    
    fs.writeFileSync(
      path.join(this.projectPath, 'src/stories/components/ComponentTemplate.stories.js'),
      componentTemplate
    );
  }

  createDocTemplate() {
    const docTemplate = `import { Meta } from '@storybook/blocks';

<Meta title="Documentation/Design Tokens" />

# Design Tokens

This page documents the design tokens used in this design system.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| primary | #3B82F6 | Primary actions |
| secondary | #6B7280 | Secondary actions |
| success | #10B981 | Success states |
| error | #EF4444 | Error states |

## Typography

| Token | Size | Weight |
|-------|------|--------|
| heading-1 | 32px | 600 |
| heading-2 | 24px | 600 |
| body | 16px | 400 |
| small | 14px | 400 |

## Spacing

| Token | Value |
|-------|-------|
| xs | 4px |
| sm | 8px |
| md | 16px |
| lg | 24px |
| xl | 32px |
`;
    
    fs.writeFileSync(
      path.join(this.projectPath, 'src/stories/docs/DesignTokens.mdx'),
      docTemplate
    );
  }

  createDecoratorTemplates() {
    const decoratorsDir = path.join(this.projectPath, 'src/decorators');
    
    // Theme decorator
    const themeDecorator = `import React from 'react';
import { ThemeProvider } from 'your-theme-library';

export const withTheme = (Story) => (
  <ThemeProvider theme="light">
    <Story />
  </ThemeProvider>
);
`;
    
    fs.writeFileSync(
      path.join(decoratorsDir, 'withTheme.js'),
      themeDecorator
    );

    // Router decorator
    const routerDecorator = `import React from 'react';
import { BrowserRouter } from 'react-router-dom';

export const withRouter = (Story) => (
  <BrowserRouter>
    <Story />
  </BrowserRouter>
);
`;
    
    fs.writeFileSync(
      path.join(decoratorsDir, 'withRouter.js'),
      routerDecorator
    );

    // i18n decorator
    const i18nDecorator = `import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

export const withI18n = (Story) => (
  <I18nextProvider i18n={i18n}>
    <Story />
  </I18nextProvider>
);
`;
    
    fs.writeFileSync(
      path.join(decoratorsDir, 'withI18n.js'),
      i18nDecorator
    );
  }

  createCIConfig() {
    const workflowsDir = path.join(this.projectPath, '.github', 'workflows');
    
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }

    // Create GitHub Actions workflow for Storybook
    const workflow = `name: Build and Deploy Storybook

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Deploy to Storybook (Chromatic)
        if: github.event_name == 'push'
        uses: chromaui/action@v1
        with:
          projectToken: \${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          token: \${{ secrets.GITHUB_TOKEN }}
`;
    
    fs.writeFileSync(
      path.join(workflowsDir, 'storybook.yml'),
      workflow
    );

    console.log(chalk.yellow('CI/CD configuration created'));
  }

  createTestingConfig() {
    // Create test-storybook configuration
    const testConfig = `module.exports = {
  stories: [],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
`;
    
    fs.writeFileSync(
      path.join(this.storybookDir, 'test-main.js'),
      testConfig
    );

    // Create test-runner configuration
    const testRunnerConfig = `module.exports = {
  testRunner: {
    config: {
      // Test runner configuration
    },
  },
};
`;
    
    fs.writeFileSync(
      path.join(this.storybookDir, 'test-runner.js'),
      testRunnerConfig
    );
  }

  createGitignore() {
    const gitignorePath = path.join(this.projectPath, '.storybook', '.gitignore');
    
    const gitignore = `# Storybook build output
storybook-static

# Storybook temp files
.node_modules
`;
    
    fs.writeFileSync(gitignorePath, gitignore);
  }
}

module.exports = StorybookSetup;