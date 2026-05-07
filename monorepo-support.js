const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class MonorepoSupport {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  async setup(options = {}) {
    console.log(chalk.blue('Setting up Monorepo Support...'));

    try {
      const monorepoType = options.type || this.detectMonorepoType();

      switch (monorepoType) {
        case 'nx':
          await this.setupNxSupport(options);
          break;
        case 'turborepo':
          await this.setupTurboSupport(options);
          break;
        case 'lerna':
          await this.setupLernaSupport(options);
          break;
        case 'yarn-workspaces':
          await this.setupYarnWorkspaces(options);
          break;
        default:
          console.log(chalk.yellow('No monorepo detected. Skipping monorepo setup.'));
          return;
      }

      console.log(chalk.green(`✓ ${monorepoType} support setup completed successfully!`));

    } catch (error) {
      console.error(chalk.red('✗ Monorepo setup failed:'), error.message);
      throw error;
    }
  }

  detectMonorepoType() {
    // Check for Nx
    if (fs.existsSync(path.join(this.projectPath, 'nx.json'))) {
      return 'nx';
    }

    // Check for Turborepo
    if (fs.existsSync(path.join(this.projectPath, 'turbo.json'))) {
      return 'turborepo';
    }

    // Check for Lerna
    if (fs.existsSync(path.join(this.projectPath, 'lerna.json'))) {
      return 'lerna';
    }

    // Check for Yarn Workspaces
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.workspaces) {
        return 'yarn-workspaces';
      }
    }

    return null;
  }

  async setupNxSupport(options) {
    console.log(chalk.yellow('Setting up Nx support...'));

    // Create Nx Storybook configuration
    const nxConfig = `{
  "version": 2,
  "cli": {
    "defaultCollection": "@storybook/angular"
  },
  "generators": {
    "@storybook/angular": {
      "tsConfig": "tsconfig.base.json"
    }
  },
  "defaultProject": "app"
}
`;

    // Update project configuration
    this.updateProjectJson(options);
    
    // Create workspace Storybook configuration
    this.createWorkspaceStorybookConfig('nx');

    console.log(chalk.yellow('Nx support configured'));
  }

  async setupTurboSupport(options) {
    console.log(chalk.yellow('Setting up Turborepo support...'));

    // Update turbo.json to include Storybook tasks
    const turboJsonPath = path.join(this.projectPath, 'turbo.json');
    
    if (fs.existsSync(turboJsonPath)) {
      const turboJson = JSON.parse(fs.readFileSync(turboJsonPath, 'utf8'));
      
      if (!turboJson.pipeline) {
        turboJson.pipeline = {};
      }

      turboJson.pipeline['storybook'] = {
        'dependsOn': ['^build'],
        'outputs': ['dist/storybook/**'],
        'cache': true
      };

      turboJson.pipeline['build-storybook'] = {
        'dependsOn': ['^build'],
        'outputs': ['storybook-static/**'],
        'cache': true
      };

      turboJson.pipeline['test-storybook'] = {
        'dependsOn': ['build-storybook'],
        'cache': true
      };

      fs.writeFileSync(
        turboJsonPath,
        JSON.stringify(turboJson, null, 2)
      );
    }

    // Create workspace Storybook configuration
    this.createWorkspaceStorybookConfig('turbo');

    console.log(chalk.yellow('Turborepo support configured'));
  }

  async setupLernaSupport(options) {
    console.log(chalk.yellow('Setting up Lerna support...'));

    // Update lerna.json
    const lernaJsonPath = path.join(this.projectPath, 'lerna.json');
    
    if (fs.existsSync(lernaJsonPath)) {
      const lernaJson = JSON.parse(fs.readFileSync(lernaJsonPath, 'utf8'));
      
      if (!lernaJson.scripts) {
        lernaJson.scripts = {};
      }

      lernaJson.scripts.storybook = 'lerna run storybook --stream';
      lernaJson.scripts['build-storybook'] = 'lerna run build-storybook --stream';
      lernaJson.scripts['test-storybook'] = 'lerna run test-storybook --stream';

      fs.writeFileSync(
        lernaJsonPath,
        JSON.stringify(lernaJson, null, 2)
      );
    }

    // Create workspace Storybook configuration
    this.createWorkspaceStorybookConfig('lerna');

    console.log(chalk.yellow('Lerna support configured'));
  }

  async setupYarnWorkspaces(options) {
    console.log(chalk.yellow('Setting up Yarn Workspaces support...'));

    // Update root package.json
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      packageJson.scripts.storybook = 'yarn workspaces foreach -p run storybook';
      packageJson.scripts['build-storybook'] = 'yarn workspaces foreach -p run build-storybook';
      packageJson.scripts['test-storybook'] = 'yarn workspaces foreach -p run test-storybook';

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );
    }

    // Create workspace Storybook configuration
    this.createWorkspaceStorybookConfig('yarn');

    console.log(chalk.yellow('Yarn Workspaces support configured'));
  }

  updateProjectJson(options) {
    // Update individual project.json files
    const appsDir = path.join(this.projectPath, 'apps');
    const packagesDir = path.join(this.projectPath, 'packages');

    [appsDir, packagesDir].forEach(dir => {
      if (fs.existsSync(dir)) {
        const projects = fs.readdirSync(dir, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);

        projects.forEach(project => {
          const projectJsonPath = path.join(dir, project, 'project.json');
          
          if (fs.existsSync(projectJsonPath)) {
            const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));
            
            if (!projectJson.targets) {
              projectJson.targets = {};
            }

            projectJson.targets.storybook = {
              'executor': '@storybook/angular:storybook',
              'options': {
                'port': 4400,
                'configDir': '.storybook'
              },
              'configurations': {
                'ci': {
                  'quiet': true
                }
              }
            };

            projectJson.targets['build-storybook'] = {
              'executor': '@storybook/angular:build',
              'options': {
                'outputDir': 'dist/storybook',
                'configDir': '.storybook'
              },
              'configurations': {
                'ci': {
                  'quiet': true
                }
              }
            };

            fs.writeFileSync(
              projectJsonPath,
              JSON.stringify(projectJson, null, 2)
            );
          }
        });
      }
    });
  }

  createWorkspaceStorybookConfig(monorepoType) {
    // Create shared Storybook configuration for monorepo
    const storybookDir = path.join(this.projectPath, '.storybook');
    
    if (!fs.existsSync(storybookDir)) {
      fs.mkdirSync(storybookDir, { recursive: true });
    }

    const mainConfig = `/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../packages/**/src/**/*.mdx',
    '../packages/**/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../apps/**/src/**/*.mdx',
    '../apps/**/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  // Monorepo-specific configuration
  features: {
    storyStoreV7: true,
    buildStoriesJson: true,
  },
};

export default config;
`;

    fs.writeFileSync(
      path.join(storybookDir, 'main.js'),
      mainConfig
    );

    // Create manager configuration for monorepo
    const managerConfig = `import { addons } from '@storybook/addons';
import { create } from '@storybook/theming';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Monorepo Design System',
    brandUrl: '/',
    brandImage: null,
  }),
  sidebar: {
    showRoots: true,
  },
});
`;

    fs.writeFileSync(
      path.join(storybookDir, 'manager.js'),
      managerConfig
    );
  }
}

module.exports = MonorepoSupport;