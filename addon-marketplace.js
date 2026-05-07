#!/usr/bin/env node

/**
 * Storybook Addon Marketplace
 * Discover and install Storybook addons with auto-configuration.
 */

const fs = require('fs').promises');
const path = require('path');

class AddonMarketplace {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.addons = [
      { name: '@storybook/addon-a11y', description: 'Accessibility testing', category: 'testing' },
      { name: '@storybook/addon-essentials', description: 'Essential addons', category: 'essentials' },
      { name: '@storybook/addon-links', description: 'Link components to stories', category: 'navigation' },
      { name: '@storybook/addon-docs', description: 'Documentation addon', category: 'docs' },
      { name: '@storybook/addon-controls', description: 'Controls for props', category: 'essentials' },
      { name: '@storybook/addon-actions', description: 'Action logger', category: 'essentials' },
      { name: '@storybook/addon-backgrounds', description: 'Background switcher', category: 'appearance' },
      { name: '@storybook/addon-themes', description: 'Theme switcher', category: 'appearance' },
      { name: '@storybook/addon-measure', description: 'Measure components', category: 'tools' },
      { name: '@storybook/addon-outline', description: 'Outline components', category: 'tools' }
    ];
  }

  async list() {
    console.log('📦 Available Storybook Addons:');
    console.log('');
    
    const categories = [...new Set(this.addons.map(a => a.category))];
    
    categories.forEach(category => {
      console.log(`\n${category.toUpperCase()}:`);
      this.addons
        .filter(a => a.category === category)
        .forEach(addon => {
          console.log(`  - ${addon.name}: ${addon.description}`);
        });
    });
  }

  async install(addonName) {
    console.log(`📦 Installing addon: ${addonName}`);
    
    const addon = this.addons.find(a => a.name === addonName);
    if (!addon) {
      console.log(`⚠️  Addon not found`);
      return;
    }
    
    // Install via npm
    try {
      const { execSync } = require('child_process');
      execSync(`npm install ${addonName} --save-dev`, { stdio: 'inherit' });
      console.log(`✓ Installed ${addonName}`);
      
      // Add to main.js
      await this.addToMainJs(addonName);
      console.log(`✓ Added to Storybook config`);
    } catch (error) {
      console.log(`⚠️  Installation failed: ${error.message}`);
    }
  }

  async addToMainJs(addonName) {
    const mainJsPath = path.join(this.projectDir, '.storybook', 'main.js');
    try {
      let content = await fs.readFile(mainJsPath, 'utf8');
      
      // Extract addon name for import
      const shortName = addonName.split('/').pop().replace('@storybook/addon-', '');
      
      if (!content.includes(addonName)) {
        content = content.replace(
          /(addons: \[)/,
          `$1require('${addonName}').${shortName}(), `
        );
        await fs.writeFile(mainJsPath, content);
      }
    } catch (error) {
      console.log('⚠️  Could not update main.js');
    }
  }
}

module.exports = AddonMarketplace;