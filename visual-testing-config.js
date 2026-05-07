const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class VisualTestingSetup {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  async setup(options = {}) {
    console.log(chalk.blue('Setting up Visual Regression Testing...'));

    try {
      // Create Chromatic configuration
      this.createChromaticConfig(options);

      // Create Percy configuration if requested
      if (options.percy) {
        this.createPercyConfig();
      }

      // Create visual test scripts
      this.createTestScripts(options);

      // Create .chromaignore file
      this.createChromaIgnore();

      console.log(chalk.green('✓ Visual regression testing setup completed successfully!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.cyan('  1. Install dependencies:'));
      console.log(chalk.cyan('     npm install --save-dev chromatic'));
      if (options.percy) {
        console.log(chalk.cyan('     npm install --save-dev @percy/cli'));
      }
      console.log(chalk.cyan('  2. Set up Chromatic project token:'));
      console.log(chalk.cyan('     npx chromatic --project-token=<your-token>'));
      console.log(chalk.cyan('  3. Run visual tests:'));
      console.log(chalk.cyan('     npm run test:visual'));

    } catch (error) {
      console.error(chalk.red('✗ Visual testing setup failed:'), error.message);
      throw error;
    }
  }

  createChromaticConfig(options) {
    const chromaticConfig = `module.exports = {
  // Chromatic project configuration
  projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
  
  // Storybook build directory
  storybookBuildDir: 'storybook-static',
  
  // Exit on first failure
  exitOnFailedChange: false,
  
  // Automatically accept changes
  autoAcceptChanges: false,
  
  // Build output directory
  outputDir: '.chromatic',
  
  // Skip builds for certain branches
  skip: process.env.CHROMATIC_SKIP === 'true',
  
  // Only test changed components
  onlyChanged: process.env.CHROMATIC_ONLY_CHANGED === 'true',
  
  // Script to run before building Storybook
  scriptName: 'build-storybook',
  
  // Number of concurrent builds
  concurrent: ${options.concurrent || 4},
  
  // Ignore files
  ignoreLastBuildOnBranch: ['main', 'master'],
  
  // Custom webpack config
  webpackConfigFileName: './.storybook/webpack.config.js',
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  module.exports.exitOnFailedChange = true;
  module.exports.autoAcceptChanges = false;
}
`;

    fs.writeFileSync(
      path.join(this.projectPath, '.chromaticrc.js'),
      chromaticConfig
    );

    console.log(chalk.yellow('Created Chromatic configuration'));
  }

  createPercyConfig() {
    const percyConfig = `version: 2
snapshot:
  widths: [375, 768, 1024, 1280]
  min-height: 1024
  percy-css: |
    /* Percy-specific CSS adjustments */
    * {
      animation: none !important;
      transition: none !important;
    }
    
  # Disable animations and transitions for consistent screenshots
  .animate, .transition {
    animation: none !important;
    transition: none !important;
  }
  
  # Hide loading states
  [data-loading="true"] {
    display: none !important;
  }
  
  # Force consistent fonts
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

discovery:
  allowed-hostnames:
    - localhost
    - 127.0.0.1

agent:
  asset-discovery:
    network-idle-timeout: 120
`;

    fs.writeFileSync(
      path.join(this.projectPath, '.percy.yml'),
      percyConfig
    );

    console.log(chalk.yellow('Created Percy configuration'));
  }

  createTestScripts(options) {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      // Chromatic scripts
      packageJson.scripts['test:visual'] = 'chromatic --exit-zero-on-changes';
      packageJson.scripts['test:visual:ci'] = 'chromatic --exit-zero-on-changes --auto-accept-changes';
      packageJson.scripts['test:visual:build'] = 'chromatic --build-only';

      // Percy scripts if requested
      if (options.percy) {
        packageJson.scripts['test:visual:percy'] = 'percy exec -- npm run storybook';
        packageJson.scripts['test:visual:percy:build'] = 'percy exec -- npm run build-storybook';
      }

      // Storybook test runner scripts
      packageJson.scripts['test:storybook'] = 'test-storybook';
      packageJson.scripts['test:storybook:ci'] = 'test-storybook --coverage';

      fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2)
      );

      console.log(chalk.yellow('Updated package.json with test scripts'));
    }
  }

  createChromaIgnore() {
    const chromaIgnore = `# Ignore patterns for Chromatic visual tests

# Ignore development stories
**/*.dev.stories.*

# Ignore work in progress
**/*.wip.stories.*
**/*.todo.stories.*

# Ignore test utilities
**/stories/utils/**

# Ignore deprecated components
**/stories/deprecated/**

# Ignore complex examples that don't need visual testing
**/stories/examples/**
`;

    fs.writeFileSync(
      path.join(this.projectPath, '.chromaignore'),
      chromaIgnore
    );

    console.log(chalk.yellow('Created .chromaignore file'));
  }
}

module.exports = VisualTestingSetup;