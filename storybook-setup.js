const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

class StorybookSetup {
  constructor(projectPath, framework) {
    this.projectPath = projectPath;
    this.framework = framework || 'react';
    this.storybookDir = path.join(projectPath, '.storybook');
  }

  async setup() {
    console.log(chalk.blue('Setting up Storybook...'));

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

      // Install Storybook dependencies
      console.log(chalk.yellow('Installing Storybook dependencies...'));
      await this.installDependencies(packageJson);

      // Create .storybook directory and files
      console.log(chalk.yellow('Creating Storybook configuration...'));
      this.createStorybookConfig();

      // Update package.json scripts
      this.updatePackageJsonScripts(packageJson);

      // Create stories directory structure
      this.createStoriesStructure();

      console.log(chalk.green('✓ Storybook setup completed successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.cyan('  npm install              - Install Storybook dependencies'));
      console.log(chalk.cyan('  npm run storybook        - Start Storybook development server'));
      console.log(chalk.cyan('  npm run build-storybook  - Build Storybook for production'));

    } catch (error) {
      console.error(chalk.red('✗ Storybook setup failed:'), error.message);
      throw error;
    }
  }

  async installDependencies(packageJson) {
    const dependencies = this.getDependencies();
    
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

  getDependencies() {
    const baseDependencies = {
      '@storybook/addon-essentials': '^7.0.0',
      '@storybook/addon-interactions': '^7.0.0',
      '@storybook/addon-links': '^7.0.0',
      '@storybook/blocks': '^7.0.0',
      '@storybook/testing-library': '^0.0.14',
      '@storybook/react': '^7.0.0',
      '@storybook/react-vite': '^7.0.0',
      'storybook': '^7.0.0'
    };

    if (this.framework === 'vue') {
      return {
        ...baseDependencies,
        '@storybook/vue3': '^7.0.0',
        '@storybook/vue3-vite': '^7.0.0'
      };
    } else if (this.framework === 'svelte') {
      return {
        ...baseDependencies,
        '@storybook/svelte': '^7.0.0',
        '@storybook/svelte-vite': '^7.0.0'
      };
    }

    return baseDependencies;
  }

  createStorybookConfig() {
    // Create .storybook directory
    if (!fs.existsSync(this.storybookDir)) {
      fs.mkdirSync(this.storybookDir, { recursive: true });
    }

    // Create main.js
    const mainConfig = this.generateMainConfig();
    fs.writeFileSync(
      path.join(this.storybookDir, 'main.js'),
      mainConfig
    );

    // Create preview.js
    const previewConfig = this.generatePreviewConfig();
    fs.writeFileSync(
      path.join(this.storybookDir, 'preview.js'),
      previewConfig
    );
  }

  generateMainConfig() {
    if (this.framework === 'vue') {
      return `/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
`;
    } else if (this.framework === 'svelte') {
      return `/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/svelte-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
`;
    }

    // React default
    return `/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;
`;
  }

  generatePreviewConfig() {
    return `/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
`;
  }

  updatePackageJsonScripts(packageJson) {
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['storybook'] = 'storybook dev -p 6006';
    packageJson.scripts['build-storybook'] = 'storybook build';

    fs.writeFileSync(
      path.join(this.projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  createStoriesStructure() {
    const srcPath = path.join(this.projectPath, 'src');
    
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }

    // Create stories directory if it doesn't exist
    const storiesPath = path.join(srcPath, 'stories');
    if (!fs.existsSync(storiesPath)) {
      fs.mkdirSync(storiesPath, { recursive: true });
    }

    // Create a sample story file
    const sampleStory = this.generateSampleStory();
    fs.writeFileSync(
      path.join(storiesPath, 'Introduction.stories.js'),
      sampleStory
    );
  }

  generateSampleStory() {
    return `import { Meta, StoryObj } from '@storybook/react';
import { Page } from './Page';

const meta: Meta<typeof Page> = {
  title: 'Example/Page',
  component: Page,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Page>;

export const Primary: Story = {
  args: {},
};
`;
  }
}

module.exports = StorybookSetup;