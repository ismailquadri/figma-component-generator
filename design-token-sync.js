#!/usr/bin/env node

/**
 * Design Token Sync System
 * Syncs design tokens from Figma to code with watch mode, diff, and backup support.
 */

const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const ora = require('ora');

class DesignTokenSync {
  constructor(figmaClient, projectPath) {
    this.figmaClient = figmaClient;
    this.projectPath = projectPath;
    this.configPath = path.join(projectPath, '.design-tokens', 'config.json');
    this.tokensPath = path.join(projectPath, '.design-tokens', 'tokens.json');
    this.backupPath = path.join(projectPath, '.design-tokens', 'backups');
    this.config = null;
    this.tokens = null;
  }

  async setup(options) {
    console.log('🎨 Setting up Design Token Sync...');
    
    await this.createDirectoryStructure();
    await this.createConfig(options);
    
    console.log('✅ Design Token Sync configured successfully!');
  }

  async createDirectoryStructure() {
    const dirs = [
      path.join(this.projectPath, '.design-tokens'),
      this.backupPath,
      path.join(this.projectPath, 'src', 'styles', 'tokens'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createConfig(options) {
    const config = {
      fileKey: options.fileKey,
      output: options.output || './src/styles/tokens',
      formats: options.formats || ['css', 'scss', 'js', 'tailwind', 'json'],
      watch: options.watch || false,
      sync: {
        autoSync: true,
        createVersionHistory: true,
        generateMigrationGuides: true
      },
      naming: {
        camelCase: true,
        prefix: 'ds'
      }
    };

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  async loadConfig() {
    try {
      const content = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(content);
      return this.config;
    } catch (error) {
      throw new Error('Config not found. Run sync-tokens with --file-key to set up first.');
    }
  }

  async syncTokens(options = {}) {
    await this.loadConfig();
    
    const spinner = ora('Fetching tokens from Figma...').start();
    
    try {
      // Fetch Figma file
      const figmaData = await this.figmaClient.getFile(this.config.fileKey);
      const tokens = this.figmaClient.extractDesignTokens(figmaData);
      
      spinner.succeed('Tokens fetched from Figma');
      
      // Check for changes
      const changes = this.detectTokenChanges(tokens);
      
      if (changes.length > 0 && options.diff) {
        console.log(chalk.yellow('\nToken changes detected:'));
        changes.forEach(change => {
          console.log(chalk.gray(`  - ${change.type}: ${change.description}`));
        });
      }
      
      // Create backup if requested
      if (options.backup) {
        await this.createBackup(tokens);
      }
      
      // Export tokens to configured formats
      await this.exportTokens(tokens, this.config.output);
      
      // Update version
      if (this.config.sync.createVersionHistory) {
        await this.updateVersion(tokens, changes);
      }
      
      // Save current tokens
      await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
      this.tokens = tokens;
      
      console.log(chalk.green('\n✅ Tokens synced successfully!'));
      
      return {
        tokens,
        changes,
        exportedFormats: this.config.formats
      };
      
    } catch (error) {
      spinner.fail('Failed to sync tokens');
      throw error;
    }
  }

  detectTokenChanges(newTokens) {
    const changes = [];
    
    if (!this.tokens) {
      changes.push({
        type: 'initial',
        description: 'Initial token sync',
        breaking: false
      });
      return changes;
    }
    
    // Detect added tokens
    const detectAdded = (category, newSet, oldSet) => {
      Object.keys(newSet || {}).forEach(key => {
        if (!oldSet || !oldSet[key]) {
          changes.push({
            type: 'added',
            category,
            key,
            description: `${category}.${key} added`,
            breaking: false
          });
        }
      });
    };
    
    // Detect deleted tokens
    const detectDeleted = (category, newSet, oldSet) => {
      Object.keys(oldSet || {}).forEach(key => {
        if (!newSet || !newSet[key]) {
          changes.push({
            type: 'deleted',
            category,
            key,
            description: `${category}.${key} deleted`,
            breaking: true
          });
        }
      });
    };
    
    // Detect modified tokens
    const detectModified = (category, newSet, oldSet) => {
      Object.keys(newSet || {}).forEach(key => {
        if (oldSet && oldSet[key] && JSON.stringify(newSet[key]) !== JSON.stringify(oldSet[key])) {
          changes.push({
            type: 'modified',
            category,
            key,
            description: `${category}.${key} modified`,
            breaking: this.isBreakingChange(oldSet[key], newSet[key])
          });
        }
      });
    };
    
    detectAdded('colors', newTokens.colors, this.tokens.colors);
    detectDeleted('colors', newTokens.colors, this.tokens.colors);
    detectModified('colors', newTokens.colors, this.tokens.colors);
    
    detectAdded('typography', newTokens.typography, this.tokens.typography);
    detectDeleted('typography', newTokens.typography, this.tokens.typography);
    detectModified('typography', newTokens.typography, this.tokens.typography);
    
    detectAdded('spacing', newTokens.spacing, this.tokens.spacing);
    detectDeleted('spacing', newTokens.spacing, this.tokens.spacing);
    detectModified('spacing', newTokens.spacing, this.tokens.spacing);
    
    detectAdded('effects', newTokens.effects, this.tokens.effects);
    detectDeleted('effects', newTokens.effects, this.tokens.effects);
    detectModified('effects', newTokens.effects, this.tokens.effects);
    
    return changes;
  }

  isBreakingChange(oldValue, newValue) {
    // Color changes are breaking
    if (typeof oldValue === 'string' && typeof newValue === 'string') {
      return oldValue !== newValue;
    }
    
    // Typography changes are breaking
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }
    
    return false;
  }

  async exportTokens(tokens, outputPath) {
    const DesignTokenExporter = require('./token-exporter');
    const exporter = new DesignTokenExporter(tokens);
    
    const spinner = ora('Exporting tokens...').start();
    
    try {
      for (const format of this.config.formats) {
        const filename = this.config.naming.camelCase 
          ? 'designTokens' 
          : 'design-tokens';
        
        switch (format) {
          case 'css':
            await exporter.exportCSSVariables(path.join(outputPath, `${filename}.css`));
            break;
          case 'scss':
            await exporter.exportSCSS(path.join(outputPath, `${filename}.scss`));
            break;
          case 'js':
            await exporter.exportJavaScript(path.join(outputPath, `${filename}.js`));
            break;
          case 'ts':
            await exporter.exportTypeScript(path.join(outputPath, `${filename}.ts`));
            break;
          case 'json':
            await exporter.exportJSON(path.join(outputPath, `${filename}.json`));
            break;
          case 'tailwind':
            await exporter.exportTailwind(path.join(outputPath, 'tailwind.config.js'));
            break;
        }
      }
      
      spinner.succeed(`Tokens exported to ${this.config.formats.join(', ')}`);
    } catch (error) {
      spinner.fail('Failed to export tokens');
      throw error;
    }
  }

  async createBackup(tokens) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupPath, `tokens-${timestamp}.json`);
    
    await fs.writeFile(backupPath, JSON.stringify(tokens, null, 2));
    console.log(chalk.gray(`Backup created: ${backupPath}`));
  }

  async updateVersion(tokens, changes) {
    const versionPath = path.join(this.projectPath, '.storybook', 'tokens', 'history');
    await fs.mkdir(versionPath, { recursive: true });
    
    const currentVersion = await this.getCurrentVersion();
    const newVersion = this.incrementVersion(currentVersion, changes);
    
    const versioningConfig = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      changes: changes.map(c => ({
        type: c.type,
        description: c.description,
        breaking: c.breaking
      }))
    };
    
    const versionFile = path.join(versionPath, `v${newVersion}.json`);
    await fs.writeFile(versionFile, JSON.stringify(versioningConfig, null, 2));
    
    // Update main config
    const mainConfigPath = path.join(this.projectPath, '.storybook', 'tokens', 'config.js');
    const configContent = `module.exports = ${JSON.stringify({ currentVersion: newVersion })};`;
    await fs.writeFile(mainConfigPath, configContent);
    
    console.log(chalk.yellow(`Token version updated to v${newVersion}`));
    
    // Generate migration guide if there are breaking changes
    if (this.config.sync.generateMigrationGuides && changes.some(c => c.breaking)) {
      await this.generateMigrationGuide(changes, newVersion);
    }
  }

  async getCurrentVersion() {
    const configPath = path.join(this.projectPath, '.storybook', 'tokens', 'config.js');
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const config = eval(content);
      return config.currentVersion || '0.0.0';
    } catch (error) {
      return '0.0.0';
    }
  }

  incrementVersion(current, changes) {
    const currentParts = current.split('.').map(Number);
    
    if (changes.some(c => c.breaking)) {
      return `${currentParts[0] + 1}.0.0`;
    } else if (changes.some(c => c.type === 'added' || c.type === 'modified')) {
      return `${currentParts[0]}.${currentParts[1] + 1}.0`;
    } else {
      return `${currentParts[0]}.${currentParts[1]}.${currentParts[2] + 1}`;
    }
  }

  async generateMigrationGuide(changes, version) {
    const guidePath = path.join(this.projectPath, '.storybook', 'tokens', 'migrations');
    await fs.mkdir(guidePath, { recursive: true });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const guideFile = path.join(guidePath, `migration-${timestamp}.md`);
    
    const guide = `# Token Migration Guide

## Version ${version}

Generated: ${new Date().toISOString()}

### Changes

${changes.map(change => `- **${change.type}**: ${change.description}${change.breaking ? ' (Breaking)' : ''}`).join('\n')}

### Migration Steps

${changes.filter(c => c.breaking).map(c => {
  if (c.category === 'colors') {
    return `- Update ${c.description.split(':')[0]} variables in your CSS files`;
  }
  if (c.category === 'typography') {
    return `- Update font configuration in your component files`;
  }
  if (c.category === 'spacing') {
    return `- Update spacing utilities in your tailwind.config.js`;
  }
  return `- ${c.description} - Please use alternative tokens`;
}).join('\n')}

### Deprecated Tokens

${changes.filter(c => c.type === 'deleted').map(c => `- \`${c.category}.${c.key}\``).join('\n')}
`;
    
    await fs.writeFile(guideFile, guide);
    console.log(chalk.yellow(`Migration guide created: ${guideFile}`));
  }

  async watch() {
    await this.loadConfig();
    
    console.log(chalk.blue('👀 Watching for token changes...'));
    console.log(chalk.gray(`File Key: ${this.config.fileKey}`));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    // Watch for Figma changes (polling)
    const pollInterval = 60000; // 1 minute
    
    const poll = async () => {
      try {
        await this.syncTokens({ diff: true, backup: true });
      } catch (error) {
        console.error(chalk.red('Sync failed:'), error.message);
      }
    };
    
    // Initial sync
    await poll();
    
    // Set up polling
    const interval = setInterval(poll, pollInterval);
    
    // Watch local token files for manual changes
    const watcher = chokidar.watch(this.config.output, {
      ignored: /(^|[\/\\])\../,
      persistent: true
    });
    
    watcher.on('change', async (filepath) => {
      console.log(chalk.yellow(`\nFile changed: ${filepath}`));
      console.log(chalk.gray('Triggering sync...'));
      await poll();
    });
    
    // Handle cleanup
    process.on('SIGINT', () => {
      clearInterval(interval);
      watcher.close();
      console.log(chalk.yellow('\nStopped watching'));
      process.exit(0);
    });
  }
}

module.exports = DesignTokenSync;