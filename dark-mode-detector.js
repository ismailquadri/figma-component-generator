#!/usr/bin/env node

/**
 * Dark Mode Auto-Detection
 * Auto-detect dark mode from Figma designs and generate theme variants.
 */

const fs = require('fs').promises';
const path = require('path');

class DarkModeDetector {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
  }

  async detectFromFigma(figmaData) {
    console.log('🌙 Detecting dark mode from Figma...');
    
    const darkModeComponents = [];
    
    const traverse = (node) => {
      if (node.name && node.name.toLowerCase().includes('dark')) {
        darkModeComponents.push(node.name);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(figmaData);
    
    if (darkModeComponents.length > 0) {
      console.log(`✓ Found ${darkModeComponents.length} dark mode components`);
      return {
        hasDarkMode: true,
        components: darkModeComponents
      };
    }
    
    console.log('⚠️  No dark mode components detected');
    return { hasDarkMode: false, components: [] };
  }

  async generateThemeVariant(componentName) {
    console.log(`🌙 Generating dark mode variant for ${componentName}`);
    const darkStyles = this.generateDarkStyles();
    const stylePath = path.join(this.projectDir, 'src', 'styles', `${componentName}.dark.css`);
    await fs.mkdir(path.dirname(stylePath), { recursive: true });
    await fs.writeFile(stylePath, darkStyles);
    console.log('✅ Dark mode variant generated');
  }

  generateDarkStyles() {
    return `/* Dark mode styles */
[data-theme="dark"] .component {
  background-color: #1a1a1a;
  color: #ffffff;
  border-color: #333;
}

[data-theme="dark"] .component:hover {
  background-color: #2a2a2a;
}
`;
  }
}

module.exports = DarkModeDetector;