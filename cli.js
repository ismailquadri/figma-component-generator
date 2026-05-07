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
  .description('Initialize Storybook in your project')
  .option('-d, --directory <dir>', 'Project directory', '.')
  .option('-f, --framework <framework>', 'Framework (react, vue, svelte)', 'react')
  .action(async (options) => {
    try {
      const projectPath = path.resolve(options.directory);
      
      console.log(chalk.blue('📚 Setting up Storybook'));
      console.log(chalk.gray(`Project: ${projectPath}`));
      console.log(chalk.gray(`Framework: ${options.framework}`));
      console.log('');

      const setup = new StorybookSetup(projectPath, options.framework);
      await setup.setup();

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