#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');

const ConfigManager = require('./config');
const FigmaClient = require('./figma');
const ComponentGenerator = require('./generator');
const VersionManager = require('./version-manager');
const GitHubRepoGenerator = require('./github-generator');
const HandoffPackageGenerator = require('./handoff-generator');
const StorybookSetup = require('./storybook-setup');
const VisualTestingSetup = require('./visual-testing-config');
const MonorepoSupport = require('./monorepo-support');
const FigmaRealTimeSync = require('./figma-realtime-sync');
const ComponentPlayground = require('./component-playground');
const DesignTokenSync = require('./design-token-sync');
const DocsSiteGenerator = require('./docs-site-generator');
const ComponentAnalytics = require('./component-analytics');
const FigmaPropsMapper = require('./figma-props-mapper');
const PerformanceDashboard = require('./performance-dashboard');
const ComponentVersioning = require('./component-versioning');
const EmbeddableExamples = require('./embeddable-examples');

const configManager = new ConfigManager();

program
  .name('generate-component')
  .description('Generate React components from Figma designs')
  .version('1.0.0');

// Setup command
program
  .command('setup')
  .description('Set up Figma API token and configuration')
  .action(async () => {
    console.log(chalk.blue('🎨 Figma Component Generator - Setup'));
    console.log('');

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiToken',
        message: 'Enter your Figma API token:',
        validate: (input) => {
          if (!input.startsWith('figd_')) {
            return 'API token must start with "figd_"';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'outputDir',
        message: 'Default output directory:',
        default: './src/components'
      },
      {
        type: 'list',
        name: 'framework',
        message: 'Default framework:',
        choices: ['react', 'vue', 'svelte'],
        default: 'react'
      },
      {
        type: 'list',
        name: 'styling',
        message: 'Default styling approach:',
        choices: ['css', 'tailwind', 'styled-components', 'emotion', 'css-modules', 'stylus', 'less'],
        default: 'css'
      }
    ]);

    await configManager.saveConfig(answers);
    console.log(chalk.green('✓ Configuration saved!'));
    console.log(chalk.gray(`Config file: ${configManager.getConfigPath()}`));
  });

// Update token command
program
  .command('update-token')
  .description('Update your Figma API token')
  .action(async () => {
    const { apiToken } = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiToken',
        message: 'Enter your new Figma API token:',
        validate: (input) => {
          if (!input.startsWith('figd_')) {
            return 'API token must start with "figd_"';
          }
          return true;
        }
      }
    ]);

    const config = configManager.loadConfig();
    config.figma.api_token = apiToken;
    await configManager.saveConfig(config);
    console.log(chalk.green('✓ API token updated!'));
  });

// Show config command
program
  .command('config-show')
  .description('Show current configuration')
  .action(() => {
    const config = configManager.loadConfig();
    console.log(chalk.blue('📋 Current Configuration'));
    console.log(chalk.gray(`Config file: ${configManager.getConfigPath()}`));
    console.log('');
    console.log(chalk.white('Figma:'));
    console.log(chalk.gray(`  API Token: ${config.figma.api_token.substring(0, 8)}...${config.figma.api_token.slice(-4)}`));
    console.log('');
    console.log(chalk.white('Defaults:'));
    console.log(chalk.gray(`  Output Directory: ${config.defaults.output_dir}`));
    console.log(chalk.gray(`  Framework: ${config.defaults.framework}`));
    console.log(chalk.gray(`  Styling: ${config.defaults.styling}`));
  });

// Generate component command
program
  .command('generate')
  .description('Generate a component from Figma')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-n, --name <name>', 'Component name')
  .option('-o, --output <dir>', 'Output directory')
  .option('-f, --framework <framework>', 'Framework (react, vue, svelte)')
  .option('-s, --styling <styling>', 'Styling approach (tailwind, css, styled-components, emotion, css-modules, stylus, less)')
  .option('--storybook', 'Generate Storybook story')
  .option('--typescript', 'Generate TypeScript types')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();

      // Validate API token
      if (!config.figma.api_token) {
        console.log(chalk.red('❌ No API token found. Run "generate-component setup" first.'));
        process.exit(1);
      }

      // Merge CLI options with config defaults
      const figmaUrl = options.url || await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Figma file URL:',
          validate: (input) => {
            if (!input.includes('figma.com')) {
              return 'Please enter a valid Figma URL';
            }
            return true;
          }
        }
      ]).then(a => a.url);

      const componentName = options.name || await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Component name:',
          default: 'MyComponent'
        }
      ]).then(a => a.name);

      const outputDir = options.output || config.defaults.output_dir;
      const framework = options.framework || config.defaults.framework;
      const styling = options.styling || config.defaults.styling;
      const includeStorybook = options.storybook || config.defaults.include_storybook;
      const includeTypescript = options.typescript || config.defaults.include_typescript;

      console.log(chalk.blue('🎨 Generating Component'));
      console.log(chalk.gray(`Name: ${componentName}`));
      console.log(chalk.gray(`Framework: ${framework}`));
      console.log(chalk.gray(`Styling: ${styling}`));
      console.log(chalk.gray(`Output: ${outputDir}`));
      console.log('');

      // Extract file key from URL
      const fileKey = extractFileKey(figmaUrl);

      // Fetch Figma data
      console.log(chalk.yellow('Fetching design data from Figma...'));
      const figmaClient = new FigmaClient(config.figma.api_token);
      const figmaData = await figmaClient.getFile(fileKey);

      console.log(chalk.green('✓ Design data fetched'));

      // Generate component
      console.log(chalk.yellow('Generating component code...'));
      
      // Initialize version manager
      const versionManager = new VersionManager(outputDir);
      await versionManager.init();
      
      const generator = new ComponentGenerator({
        framework,
        styling,
        includeStorybook,
        includeTypescript
      });

      const componentCode = generator.generate(componentName, figmaData);

      // Create output directory
      await fs.ensureDir(outputDir);

      // Write component file
      const componentFile = path.join(outputDir, `${componentName}.jsx`);
      await fs.writeFile(componentFile, componentCode.component);
      console.log(chalk.green(`✓ Component saved: ${componentFile}`));

      // Write styles file if needed
      if (componentCode.styles) {
        const stylesFile = path.join(outputDir, `${componentName}.styles.css`);
        await fs.writeFile(stylesFile, componentCode.styles);
        console.log(chalk.green(`✓ Styles saved: ${stylesFile}`));
      }

      // Write Storybook story if requested
      if (includeStorybook && componentCode.storybook) {
        const storybookFile = path.join(outputDir, `${componentName}.stories.jsx`);
        await fs.writeFile(storybookFile, componentCode.storybook);
        console.log(chalk.green(`✓ Storybook story saved: ${storybookFile}`));
      }

      // Write TypeScript types if requested
      if (includeTypescript && componentCode.types) {
        const typesFile = path.join(outputDir, `${componentName}.types.ts`);
        await fs.writeFile(typesFile, componentCode.types);
        console.log(chalk.green(`✓ TypeScript types saved: ${typesFile}`));
      }

      // Save version history
      const version = await versionManager.saveComponentVersion(componentName, figmaData, componentCode);
      console.log(chalk.green(`✓ Version ${version} saved`));

      console.log('');
      console.log(chalk.green('✅ Component generated successfully!'));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (error.response) {
        console.error(chalk.gray('Figma API Response:'), error.response.data);
      }
      process.exit(1);
    }
  });

// Export design tokens command
program
  .command('export-tokens')
  .description('Export design tokens from Figma file')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-o, --output <dir>', 'Output directory', './design-tokens')
  .option('-f, --format <format>', 'Export format (json, css, scss, js, ts, tailwind)', 'json')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();

      // Validate API token
      if (!config.figma.api_token) {
        console.log(chalk.red('❌ No API token found. Run "generate-component setup" first.'));
        process.exit(1);
      }

      // Get URL
      const figmaUrl = options.url || await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Figma file URL:',
          validate: (input) => {
            if (!input.includes('figma.com')) {
              return 'Please enter a valid Figma URL';
            }
            return true;
          }
        }
      ]).then(a => a.url);

      const outputDir = options.output;
      const format = options.format;

      console.log(chalk.blue('🎨 Exporting Design Tokens'));
      console.log(chalk.gray(`Format: ${format}`));
      console.log(chalk.gray(`Output: ${outputDir}`));
      console.log('');

      // Extract file key from URL
      const fileKey = extractFileKey(figmaUrl);

      // Fetch Figma data
      console.log(chalk.yellow('Fetching design data from Figma...'));
      const figmaClient = new FigmaClient(config.figma.api_token);
      const figmaData = await figmaClient.getFile(fileKey);

      console.log(chalk.green('✓ Design data fetched'));

      // Extract design tokens
      console.log(chalk.yellow('Extracting design tokens...'));
      const tokens = figmaClient.extractDesignTokens(figmaData);

      console.log(chalk.green(`✓ Found ${Object.keys(tokens.colors || {}).length} colors`));
      console.log(chalk.green(`✓ Found ${Object.keys(tokens.typography || {}).length} typography styles`));
      console.log(chalk.green(`✓ Found ${Object.keys(tokens.spacing || {}).length} spacing values`));
      console.log(chalk.green(`✓ Found ${Object.keys(tokens.effects || {}).length} effects`));

      // Create output directory
      await fs.ensureDir(outputDir);

      // Export tokens
      const DesignTokenExporter = require('./token-exporter');
      const exporter = new DesignTokenExporter(tokens);

      console.log(chalk.yellow('Exporting tokens...'));

      switch (format) {
      case 'json':
        await exporter.exportJSON(path.join(outputDir, 'design-tokens.json'));
        break;
      case 'css':
        await exporter.exportCSSVariables(path.join(outputDir, 'design-tokens.css'));
        break;
      case 'scss':
        await exporter.exportSCSS(path.join(outputDir, 'design-tokens.scss'));
        break;
      case 'js':
        await exporter.exportJavaScript(path.join(outputDir, 'design-tokens.js'));
        break;
      case 'ts':
        await exporter.exportTypeScript(path.join(outputDir, 'design-tokens.ts'));
        break;
      case 'tailwind':
        await exporter.exportTailwind(path.join(outputDir, 'tailwind.config.js'));
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
      }

      console.log(chalk.green(`✓ Tokens exported to ${outputDir}`));
      console.log('');
      console.log(chalk.green('✅ Design tokens exported successfully!'));

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (error.response) {
        console.error(chalk.gray('Figma API Response:'), error.response.data);
      }
      process.exit(1);
    }
  });

// GitHub repo generation command
program
  .command('create-repo')
  .description('Generate complete GitHub repository from Figma design system')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-n, --name <name>', 'Repository name', 'design-system')
  .option('-d, --description <description>', 'Repository description')
  .option('-t, --token <token>', 'GitHub token (for creating repo)')
  .option('-p, --private', 'Create private repository', false)
  .option('-o, --output <dir>', 'Output directory', './output')
  .action(async (options) => {
    if (!options.url) {
      console.log(chalk.red('Error: Figma URL is required (--url)'));
      return;
    }

    console.log(chalk.blue('🚀 Creating GitHub Repository from Figma'));
    console.log(chalk.gray(`Figma URL: ${options.url}`));
    console.log(chalk.gray(`Repository: ${options.name}`));
    console.log('');

    const generator = new GitHubRepoGenerator({
      figmaUrl: options.url,
      repoName: options.name,
      description: options.description,
      githubToken: options.token,
      private: options.private,
      outputDir: options.output
    });

    await generator.generate();
  });

// Handoff package generation command
program
  .command('generate-handoff')
  .description('Generate professional client-ready handoff package from Figma design system')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-p, --project <name>', 'Project name', 'Design System')
  .option('-c, --client <name>', 'Client name')
  .option('-d, --designer <name>', 'Designer name')
  .option('--project-version <version>', 'Version', '1.0.0')
  .option('-o, --output <dir>', 'Output directory', './handoff-package')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();

      // Validate API token
      if (!config.figma.api_token) {
        console.log(chalk.red('❌ No API token found. Run "generate-component setup" first.'));
        process.exit(1);
      }

      // Get URL if not provided
      const figmaUrl = options.url || await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Figma file URL:',
          validate: (input) => {
            if (!input.includes('figma.com')) {
              return 'Please enter a valid Figma URL';
            }
            return true;
          }
        }
      ]).then(a => a.url);

      // Get project details if not provided
      const projectName = options.project || await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: 'Design System'
        }
      ]).then(a => a.name);

      const clientName = options.client || await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Client name:',
        }
      ]).then(a => a.name);

      const designerName = options.designer || await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Designer name:',
        }
      ]).then(a => a.name);

      const version = options.projectVersion;

      const generator = new HandoffPackageGenerator({
        figmaUrl,
        projectName,
        clientName,
        designerName,
        version,
        outputDir: options.output,
        figmaApiToken: config.figma.api_token
      });

      await generator.generate();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      if (error.response) {
        console.error(chalk.gray('Figma API Response:'), error.response.data);
      }
      process.exit(1);
    }
  });

// Diff command - compare Figma vs. code
program
  .command('diff')
  .description('Compare current Figma design with generated code')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-n, --name <name>', 'Component name')
  .action(async (options) => {
    const projectDir = '.';
    const versionManager = new VersionManager(projectDir);
    
    if (!options.url || !options.name) {
      console.log(chalk.red('Error: --url and --name are required'));
      return;
    }
    
    console.log(chalk.blue('🔍 Detecting Changes'));
    console.log(chalk.gray(`Component: ${options.name}`));
    console.log('');
    
    const config = configManager.loadConfig();
    const figmaClient = new FigmaClient(config.figma.api_token);
    
    // Fetch current Figma data
    console.log(chalk.yellow('Fetching current Figma data...'));
    const fileKey = extractFileKey(options.url);
    const figmaData = await figmaClient.getFile(fileKey);
    const currentData = figmaClient.extractComponentData(figmaData, options.name);
    
    // Get last version from history
    const history = await versionManager.getComponentHistory(options.name);
    
    if (!history) {
      console.log(chalk.yellow('No previous version found. This will be the first version.'));
      return;
    }
    
    const lastVersion = history.versions[history.currentVersion - 1];
    const lastData = lastVersion.figmaData;
    
    // Compare and show differences
    console.log(chalk.yellow('Comparing versions...'));
    console.log('');
    
    const changes = compareDesignData(lastData, currentData);
    
    if (changes.length === 0) {
      console.log(chalk.green('✓ No changes detected'));
    } else {
      console.log(chalk.red(`✗ ${changes.length} change(s) detected:`));
      console.log('');
      
      changes.forEach(change => {
        const icon = change.type === 'color' ? '🎨' : 
          change.type === 'typography' ? '🔤' : 
            change.type === 'spacing' ? '📐' : 
              change.type === 'size' ? '📏' : '📝';
        
        console.log(`${icon} ${change.type.toUpperCase()}: ${change.message}`);
        
        if (change.previous !== undefined && change.current !== undefined) {
          console.log(chalk.gray(`  Previous: ${JSON.stringify(change.previous)}`));
          console.log(chalk.gray(`  Current:  ${JSON.stringify(change.current)}`));
        }
        console.log('');
      });
      
      console.log(chalk.yellow('Recommendation: Re-generate component to apply changes'));
      console.log(chalk.white(`  generate-component generate --url "${options.url}" --name "${options.name}"`));
    }
  });

function compareDesignData(oldData, newData) {
  const changes = [];
  
  // Compare colors
  if (JSON.stringify(oldData.fills) !== JSON.stringify(newData.fills)) {
    changes.push({
      type: 'color',
      message: 'Colors changed',
      previous: oldData.fills,
      current: newData.fills
    });
  }
  
  // Compare typography
  if (JSON.stringify(oldData.typography) !== JSON.stringify(newData.typography)) {
    changes.push({
      type: 'typography',
      message: 'Typography changed',
      previous: oldData.typography,
      current: newData.typography
    });
  }
  
  // Compare spacing
  const oldPadding = `${oldData.paddingTop}-${oldData.paddingRight}-${oldData.paddingBottom}-${oldData.paddingLeft}`;
  const newPadding = `${newData.paddingTop}-${newData.paddingRight}-${newData.paddingBottom}-${newData.paddingLeft}`;
  if (oldPadding !== newPadding) {
    changes.push({
      type: 'spacing',
      message: 'Padding changed',
      previous: {
        top: oldData.paddingTop,
        right: oldData.paddingRight,
        bottom: oldData.paddingBottom,
        left: oldData.paddingLeft
      },
      current: {
        top: newData.paddingTop,
        right: newData.paddingRight,
        bottom: newData.paddingBottom,
        left: newData.paddingLeft
      }
    });
  }
  
  // Compare size
  if (oldData.width !== newData.width || oldData.height !== newData.height) {
    changes.push({
      type: 'size',
      message: 'Dimensions changed',
      previous: { width: oldData.width, height: oldData.height },
      current: { width: newData.width, height: newData.height }
    });
  }
  
  // Compare border radius
  if (oldData.borderRadius !== newData.borderRadius) {
    changes.push({
      type: 'border-radius',
      message: 'Border radius changed',
      previous: oldData.borderRadius,
      current: newData.borderRadius
    });
  }
  
  return changes;
}

// Initialize design system project command
program
  .command('init')
  .description('Initialize a new design system project')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    const projectDir = path.resolve(options.directory);
    const versionManager = new VersionManager(projectDir);
    
    console.log(chalk.blue('🎨 Initializing Design System Project'));
    console.log(chalk.gray(`Directory: ${projectDir}`));
    console.log('');
    
    await versionManager.init();
    
    console.log(chalk.green('✓ Design system project initialized'));
    console.log(chalk.gray(`Created: ${path.join(projectDir, '.design-system')}`));
    console.log('');
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.white('  1. Run: generate-component generate --url <figma-url> --name <component>'));
    console.log(chalk.white('  2. Run: generate-component status --list to view components'));
  });

// Component status management commands
program
  .command('status')
  .description('Manage component lifecycle status')
  .option('-l, --list', 'List all components')
  .option('-s, --set <status>', 'Set status for a component')
  .option('-n, --name <name>', 'Component name')
  .action(async (options) => {
    const projectDir = '.';
    const versionManager = new VersionManager(projectDir);
    
    if (options.list) {
      const components = await versionManager.getAllComponents();
      
      console.log(chalk.blue('📋 Component Status'));
      console.log('');
      
      if (components.length === 0) {
        console.log(chalk.yellow('No components found. Generate a component first.'));
        return;
      }
      
      components.forEach(comp => {
        const statusColor = comp.status === 'approved' ? chalk.green : 
          comp.status === 'review' ? chalk.yellow : 
            comp.status === 'deprecated' ? chalk.red : chalk.gray;
        
        console.log(`${statusColor(comp.status.padEnd(12))} ${chalk.white(comp.name)} v${comp.version}`);
      });
    } else if (options.set && options.name) {
      await versionManager.updateComponentStatus(options.name, options.set);
      console.log(chalk.green(`✓ Updated ${options.name} status to ${options.set}`));
    } else {
      console.log(chalk.red('Error: Use --list to view components or --set <status> --name <name> to update status'));
    }
  });

// Version history command
program
  .command('history')
  .description('View component version history')
  .option('-n, --name <name>', 'Component name')
  .option('-c, --changelog', 'Show full changelog')
  .action(async (options) => {
    const projectDir = '.';
    const versionManager = new VersionManager(projectDir);
    
    if (options.changelog) {
      const changeLog = await versionManager.getChangeLog();
      
      console.log(chalk.blue('📜 Design System Changelog'));
      console.log('');
      
      changeLog.forEach(entry => {
        const typeColor = entry.type === 'initial' ? chalk.green : 
          entry.type === 'update' ? chalk.yellow : chalk.gray;
        
        console.log(`${typeColor(entry.type.toUpperCase())} ${chalk.white(entry.component)} v${entry.version}`);
        console.log(chalk.gray(`  ${entry.message}`));
        console.log(chalk.gray(`  ${new Date(entry.timestamp).toLocaleString()}`));
        console.log('');
      });
    } else if (options.name) {
      const history = await versionManager.getComponentHistory(options.name);
      
      if (!history) {
        console.log(chalk.red(`Component "${options.name}" not found`));
        return;
      }
      
      console.log(chalk.blue(`📜 ${options.name} History`));
      console.log('');
      console.log(chalk.white(`Status: ${history.status}`));
      console.log(chalk.white(`Current Version: ${history.currentVersion}`));
      console.log(chalk.white(`Total Versions: ${history.versions.length}`));
      console.log('');
      
      history.versions.forEach(version => {
        const typeColor = version.changes.type === 'initial' ? chalk.green : 
          version.changes.type === 'update' ? chalk.yellow : chalk.gray;
        
        console.log(`${typeColor(`v${version.version}`)} ${version.changes.message}`);
        console.log(chalk.gray(`  ${new Date(version.timestamp).toLocaleString()}`));
        if (version.changes.changes && version.changes.changes.length > 0) {
          version.changes.changes.forEach(change => {
            console.log(chalk.gray(`  - ${change.type}: ${change.message}`));
          });
        }
        console.log('');
      });
    } else {
      console.log(chalk.red('Error: Use --name <component> to view history or --changelog for full changelog'));
    }
  });

// Storybook setup command
program
  .command('init-storybook')
  .description('Initialize professional Storybook in your project')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-f, --framework <framework>', 'Framework (react, vue, svelte)', 'react')
  .option('-p, --preset <preset>', 'Storybook preset (auto, react-vite, react-webpack, nextjs, cra, vue-vite, svelte-vite, minimal, full)', 'auto')
  .option('--ci', 'Include CI/CD configuration (GitHub Actions)')
  .option('--testing', 'Include testing configuration')
  .option('--visual', 'Include visual regression testing setup')
  .option('--monorepo', 'Include monorepo support')
  .option('--list-presets', 'List available presets')
  .action(async (options) => {
    try {
      if (options.listPresets) {
        const StorybookPresets = require('./storybook-presets');
        const presets = new StorybookPresets();
        presets.listPresets();
        return;
      }

      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📚 Setting up Professional Storybook'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Framework: ${options.framework}`));
      console.log(chalk.gray(`Preset: ${options.preset}`));
      console.log('');

      const setup = new StorybookSetup(projectPath, options.framework, {
        preset: options.preset,
        ci: options.ci,
        testing: options.testing
      });
      await setup.setup();

      // Set up visual testing if requested
      if (options.visual) {
        console.log('');
        const visualSetup = new VisualTestingSetup(projectPath);
        await visualSetup.setup({ percy: true });
      }

      // Set up monorepo support if requested
      if (options.monorepo) {
        console.log('');
        const monorepoSetup = new MonorepoSupport(projectPath);
        await monorepo.setup();
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Visual testing setup command
program
  .command('init-visual-testing')
  .description('Set up visual regression testing (Chromatic, Percy)')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('--percy', 'Include Percy configuration')
  .option('--concurrent <number>', 'Number of concurrent builds', '4')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🎨 Setting up Visual Regression Testing'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const setup = new VisualTestingSetup(projectPath);
      await setup.setup({
        percy: options.percy,
        concurrent: parseInt(options.concurrent)
      });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Monorepo support command
program
  .command('init-monorepo')
  .description('Set up Storybook for monorepo (Nx, Turborepo, Lerna, Yarn Workspaces)')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-t, --type <type>', 'Monorepo type (auto, nx, turborepo, lerna, yarn-workspaces)', 'auto')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📦 Setting up Monorepo Support'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Type: ${options.type}`));
      console.log('');

      const setup = new MonorepoSupport(projectPath);
      await setup.setup({ type: options.type });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Figma sync setup command
program
  .command('sync-setup')
  .description('Set up real-time Figma synchronization')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-p, --port <port>', 'Webhook server port', '3000')
  .option('-w, --webhook-url <url>', 'Custom webhook URL')
  .option('-s, --secret <secret>', 'Webhook secret (auto-generated if not provided)')
  .option('--auto-sync', 'Enable automatic sync', true)
  .option('--slack-webhook <url>', 'Slack webhook for notifications')
  .option('--discord-webhook <url>', 'Discord webhook for notifications')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🔄 Setting up Figma Real-Time Sync'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const figmaClient = new FigmaClient(config.figma.api_token);
      const sync = new FigmaRealTimeSync(figmaClient, projectPath);
      
      await sync.setup({
        fileKey: options.fileKey,
        port: parseInt(options.port),
        webhookUrl: options.webhookUrl,
        secret: options.secret,
        autoSync: options.autoSync,
        slackWebhook: options.slackWebhook,
        discordWebhook: options.discordWebhook
      });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Figma sync server command
program
  .command('sync-server')
  .description('Start Figma sync webhook server')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🔄 Starting Figma Sync Server'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const figmaClient = new FigmaClient(config.figma.api_token);
      const sync = new FigmaRealTimeSync(figmaClient, projectPath);
      
      await sync.startServer();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Figma watch command
program
  .command('sync')
  .description('Watch Figma for changes and sync automatically')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('--server', 'Also start webhook server')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🔄 Starting Figma Watch Mode'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const figmaClient = new FigmaClient(config.figma.api_token);
      const sync = new FigmaRealTimeSync(figmaClient, projectPath);
      
      if (options.server) {
        await sync.startServer();
      }
      
      await sync.watch();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Playground setup command
program
  .command('init-playground')
  .description('Set up interactive component playground')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-p, --port <port>', 'Playground server port', '3001')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🎮 Setting up Interactive Component Playground'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const playground = new ComponentPlayground(projectPath);
      await playground.setup({ port: parseInt(options.port) });

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Token sync setup command
program
  .command('sync-tokens')
  .description('Sync design tokens from Figma to code')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-f, --file-key <key>', 'Figma file key')
  .option('-o, --output <dir>', 'Output directory', './src/styles/tokens')
  .option('--formats <formats>', 'Output formats (css,scss,js,ts,tailwind,json)', 'css,scss,js,tailwind,json')
  .option('--watch', 'Watch for changes')
  .option('--diff', 'Show diff of changes')
  .option('--backup', 'Create backup before sync')
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🎨 Syncing Design Tokens'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const figmaClient = new FigmaClient(config.figma.api_token);
      const sync = new DesignTokenSync(figmaClient, projectPath);
      
      // Setup if file key provided
      if (options.fileKey) {
        await sync.setup({
          fileKey: options.fileKey,
          outputDir: options.output,
          formats: options.formats.split(','),
          watch: options.watch
        });
      }
      
      // Perform sync
      const result = await sync.syncTokens({
        diff: options.diff,
        backup: options.backup
      });
      
      if (options.watch) {
        await sync.watch();
      } else {
        console.log(chalk.green('✓ Token sync completed!'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Documentation site setup command
program
  .command('init-docs-site')
  .description('Initialize automated design system documentation site')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-t, --title <title>', 'Documentation site title', 'Design System')
  .option('--description <description>', 'Site description')
  .option('--theme <theme>', 'Theme (light, dark)', 'light')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📚 Setting up Design System Documentation Site'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Title: ${options.title}`));
      console.log(chalk.gray(`Theme: ${options.theme}`));
      console.log('');

      const generator = new DocsSiteGenerator({
        directory: projectPath,
        title: options.title,
        description: options.description,
        theme: options.theme
      });
      
      await generator.init();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Analytics setup command
program
  .command('init-analytics')
  .description('Initialize component usage analytics tracking')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-p, --provider <provider>', 'Analytics provider (local, ga, plausible)', 'local')
  .option('--tracking-id <id>', 'Tracking ID for GA or Plausible')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📊 Setting up Component Usage Analytics'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Provider: ${options.provider}`));
      console.log('');

      const analytics = new ComponentAnalytics({
        directory: projectPath,
        provider: options.provider,
        trackingId: options.trackingId
      });
      
      await analytics.init();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Analytics report command
program
  .command('analytics-report')
  .description('Generate component usage analytics report')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-f, --format <format>', 'Report format (json, csv)', 'json')
  .option('-o, --output <file>', 'Output file path')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📊 Generating Analytics Report'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Format: ${options.format}`));
      console.log('');

      const analytics = new ComponentAnalytics({ directory: projectPath });
      const report = await analytics.generateReport({
        format: options.format,
        startDate: options.startDate,
        endDate: options.endDate
      });
      
      if (options.output) {
        await fs.writeFile(options.output, report);
        console.log(chalk.green(`✓ Report saved to ${options.output}`));
      } else {
        console.log(report);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Analytics scan command
program
  .command('analytics-scan')
  .description('Scan project for component usage')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🔍 Scanning Project for Component Usage'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const analytics = new ComponentAnalytics({ directory: projectPath });
      await analytics.scanProject();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Props mapping command
program
  .command('map-props')
  .description('Auto-map Figma component properties to React props')
  .option('-u, --url <url>', 'Figma file URL')
  .option('-f, --file-id <id>', 'Figma file ID')
  .option('-c, --component-id <id>', 'Component ID (maps single component)')
  .option('-a, --all', 'Map all components in the file')
  .option('-o, --output <dir>', 'Output directory', './src/components')
  .option('--typescript', 'Generate TypeScript types', true)
  .option('--validation', 'Generate validation schemas', true)
  .action(async (options) => {
    try {
      const config = configManager.loadConfig();

      // Validate API token
      if (!config.figma.api_token) {
        console.log(chalk.red('❌ No API token found. Run "generate-component setup" first.'));
        process.exit(1);
      }

      // Get file ID
      let fileId = options.fileId;
      if (!fileId && options.url) {
        fileId = extractFileKey(options.url);
      } else if (!fileId) {
        console.log(chalk.red('Error: --file-id or --url is required'));
        return;
      }

      const outputDir = options.output;
      
      console.log(chalk.blue('🎯 Mapping Figma Component Properties'));
      console.log(chalk.gray(`File ID: ${fileId}`));
      console.log(chalk.gray(`Output: ${outputDir}`));
      console.log('');

      const figmaClient = new FigmaClient(config.figma.api_token);
      const mapper = new FigmaPropsMapper(figmaClient, {
        outputDir,
        typescript: options.typescript,
        validation: options.validation
      });

      if (options.all) {
        await mapper.mapAllComponents(fileId);
      } else if (options.componentId) {
        await mapper.mapComponentProps(fileId, options.componentId);
      } else {
        console.log(chalk.red('Error: Use --component-id to map a single component or --all to map all components'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Performance dashboard setup command
program
  .command('init-performance-dashboard')
  .description('Initialize component performance monitoring dashboard')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-p, --port <port>', 'Dashboard port', '3002')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('⚡ Setting up Performance Dashboard'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Port: ${options.port}`));
      console.log('');

      const dashboard = new PerformanceDashboard({
        directory: projectPath,
        port: parseInt(options.port)
      });
      
      await dashboard.init();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Performance analysis command
program
  .command('analyze-performance')
  .description('Analyze component performance metrics')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name to analyze')
  .option('--bundle', 'Run bundle analysis')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('⚡ Analyzing Performance'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const dashboard = new PerformanceDashboard({ directory: projectPath });
      
      if (options.bundle) {
        await dashboard.runBundleAnalysis();
      } else if (options.component) {
        await dashboard.analyzeComponent(options.component);
      } else {
        console.log(chalk.red('Error: Use --component to analyze a specific component or --bundle for bundle analysis'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Start performance dashboard command
program
  .command('start-performance-dashboard')
  .description('Start the performance dashboard web server')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🚀 Starting Performance Dashboard'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const dashboard = new PerformanceDashboard({ directory: projectPath });
      await dashboard.startDashboard();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Versioning init command
program
  .command('init-versioning')
  .description('Initialize component versioning system')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📦 Setting up Component Versioning'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log('');

      const versioning = new ComponentVersioning({ directory: projectPath });
      await versioning.init();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Version component command
program
  .command('version')
  .description('Version a component with semantic versioning')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name')
  .option('-t, --type <type>', 'Version type (major, minor, patch)', 'patch')
  .option('--changes <changes>', 'Comma-separated list of changes')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      if (!options.component) {
        console.log(chalk.red('Error: --component is required'));
        return;
      }

      console.log(chalk.blue('📦 Versioning Component'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`Type: ${options.type}`));
      console.log('');

      const versioning = new ComponentVersioning({ directory: projectPath });
      
      const changes = options.changes ? options.changes.split(',').map(c => c.trim()) : [];
      await versioning.versionComponent(options.component, options.type, changes);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Migration guide command
program
  .command('migration-guide')
  .description('Generate or view migration guide between versions')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name')
  .option('--from <version>', 'From version')
  .option('--to <version>', 'To version')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      if (!options.component || !options.from || !options.to) {
        console.log(chalk.red('Error: --component, --from, and --to are required'));
        return;
      }

      console.log(chalk.blue('📋 Migration Guide'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`From: ${options.from}`));
      console.log(chalk.gray(`To: ${options.to}`));
      console.log('');

      const versioning = new ComponentVersioning({ directory: projectPath });
      await versioning.compareVersions(options.component, options.from, options.to);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Compare versions command
program
  .command('compare-versions')
  .description('Compare two component versions')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name')
  .option('--from <version>', 'From version')
  .option('--to <version>', 'To version')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      if (!options.component || !options.from || !options.to) {
        console.log(chalk.red('Error: --component, --from, and --to are required'));
        return;
      }

      const versioning = new ComponentVersioning({ directory: projectPath });
      await versioning.compareVersions(options.component, options.from, options.to);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Rollback command
program
  .command('rollback')
  .description('Rollback a component to a previous version')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name')
  .option('--to <version>', 'Target version')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      if (!options.component || !options.to) {
        console.log(chalk.red('Error: --component and --to are required'));
        return;
      }

      console.log(chalk.blue('⏪ Rolling Back Component'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`To: ${options.to}`));
      console.log('');

      const versioning = new ComponentVersioning({ directory: projectPath });
      await versioning.rollbackComponent(options.component, options.to);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// List versions command
program
  .command('list-versions')
  .description('List all component versions')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      const versioning = new ComponentVersioning({ directory: projectPath });
      await versioning.listAllVersions();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate changelog command
program
  .command('generate-changelog')
  .description('Generate full component changelog')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📝 Generating Changelog'));
      console.log('');

      const versioning = new ComponentVersioning({ directory: projectPath });
      const changelog = await versioning.generateFullChangelog();
      
      if (options.output) {
        await fs.writeFile(options.output, changelog);
        console.log(chalk.green(`✓ Changelog saved to ${options.output}`));
      } else {
        console.log(changelog);
      }

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Embeddable examples init command
program
  .command('init-embed-examples')
  .description('Initialize embeddable component examples system')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-o, --output <dir>', 'Output directory', './examples')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('🎬 Setting up Embeddable Examples'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Output: ${options.output}`));
      console.log('');

      const examples = new EmbeddableExamples({
        directory: projectPath,
        outputDir: options.output
      });
      
      await examples.init();

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate embed example command
program
  .command('embed-example')
  .description('Generate embeddable component example')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-c, --component <name>', 'Component name')
  .option('-p, --platform <platform>', 'Platform (iframe, codesandbox, stackblitz)', 'iframe')
  .option('--props <props>', 'Component props as JSON string')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      if (!options.component) {
        console.log(chalk.red('Error: --component is required'));
        return;
      }

      console.log(chalk.blue('🎬 Generating Embeddable Example'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`Platform: ${options.platform}`));
      console.log('');

      const examples = new EmbeddableExamples({ directory: projectPath });
      
      const props = options.props ? JSON.parse(options.props) : {};
      await examples.generateExample(options.component, options.platform, props);

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate embed code command
program
  .command('generate-embed-code')
  .description('Generate embed code for a component')
  .option('-c, --component <name>', 'Component name')
  .option('-p, --platform <platform>', 'Platform (iframe, codesandbox, stackblitz)', 'iframe')
  .option('--props <props>', 'Component props as JSON string')
  .action(async (options) => {
    try {
      if (!options.component) {
        console.log(chalk.red('Error: --component is required'));
        return;
      }

      console.log(chalk.blue('📋 Generating Embed Code'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`Platform: ${options.platform}`));
      console.log('');

      const examples = new EmbeddableExamples();
      
      const props = options.props ? JSON.parse(options.props) : {};
      const embedCode = await examples.generateEmbedCode(options.component, options.platform, props);
      
      console.log('Embed Code:');
      console.log('---');
      console.log(embedCode);
      console.log('---');
      console.log('');
      console.log('Copy this code to embed the component in your website.');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Generate shareable URL command
program
  .command('shareable-url')
  .description('Generate shareable URL for component example')
  .option('-c, --component <name>', 'Component name')
  .option('-p, --platform <platform>', 'Platform (iframe, codesandbox, stackblitz)', 'iframe')
  .option('--props <props>', 'Component props as JSON string')
  .action(async (options) => {
    try {
      if (!options.component) {
        console.log(chalk.red('Error: --component is required'));
        return;
      }

      console.log(chalk.blue('🔗 Generating Shareable URL'));
      console.log(chalk.gray(`Component: ${options.component}`));
      console.log(chalk.gray(`Platform: ${options.platform}`));
      console.log('');

      const examples = new EmbeddableExamples();
      
      const props = options.props ? JSON.parse(options.props) : {};
      const url = await examples.generateShareableUrl(options.component, options.platform, props);
      
      console.log('Shareable URL:');
      console.log(url);
      console.log('');
      console.log('Share this URL to let others view the component example.');

    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Helper function to extract file key from Figma URL
function extractFileKey(url) {
  // Handle both old (/file/) and new (/design/) URL formats
  const oldFormatMatch = url.match(/figma\.com\/file\/([a-zA-Z0-9]+)/);
  const newFormatMatch = url.match(/figma\.com\/design\/([a-zA-Z0-9]+)/);

  if (oldFormatMatch) {
    return oldFormatMatch[1];
  } else if (newFormatMatch) {
    return newFormatMatch[1];
  } else {
    throw new Error('Invalid Figma URL. Could not extract file key.');
  }
}

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}