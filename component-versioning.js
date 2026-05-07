#!/usr/bin/env node

/**
 * Component Versioning & Migration Guides
 * Manages semantic versioning for components with auto-generated migration guides.
 */

const fs = require('fs').promises;
const path = require('path');
const semver = require('semver');

class ComponentVersioning {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.versioningDir = path.join(this.projectDir, '.versioning');
    this.changelogFile = path.join(this.versioningDir, 'CHANGELOG.md');
    this.versionsFile = path.join(this.versioningDir, 'versions.json');
    this.migrationsDir = path.join(this.versioningDir, 'migrations');
  }

  async init() {
    console.log('📦 Initializing Component Versioning System...');
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log('');

    await this.createDirectoryStructure();
    await this.createVersioningConfig();

    console.log('✅ Versioning system initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   Run: generate-component version --component <name> --type <major|minor|patch>');
    console.log('   Run: generate-component migration-guide --component <name> --from <version> --to <version>');
  }

  async createDirectoryStructure() {
    const dirs = [
      this.versioningDir,
      this.migrationsDir,
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createVersioningConfig() {
    const config = {
      components: {},
      changelog: [],
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(this.versionsFile, JSON.stringify(config, null, 2));
    
    const changelog = `# Changelog\n\nAll notable changes to components will be documented in this file.\n\n`;
    await fs.writeFile(this.changelogFile, changelog);
  }

  async versionComponent(componentName, versionType, changes = []) {
    console.log(`📦 Versioning Component: ${componentName}`);
    console.log(`Type: ${versionType}`);
    console.log('');

    const versions = await this.loadVersions();
    
    // Get current version
    const currentVersion = versions.components[componentName]?.version || '0.0.0';
    const newVersion = semver.inc(currentVersion, versionType);
    
    if (!newVersion) {
      throw new Error(`Invalid version type: ${versionType}`);
    }

    // Create version entry
    const versionEntry = {
      version: newVersion,
      type: versionType,
      previousVersion: currentVersion,
      changes: changes.length > 0 ? changes : this.suggestChanges(versionType),
      timestamp: new Date().toISOString(),
      breaking: versionType === 'major'
    };

    // Update component version
    if (!versions.components[componentName]) {
      versions.components[componentName] = {
        versions: [],
        currentVersion: newVersion,
        createdAt: new Date().toISOString()
      };
    }

    versions.components[componentName].versions.push(versionEntry);
    versions.components[componentName].currentVersion = newVersion;

    // Add to changelog
    versions.changelog.unshift({
      component: componentName,
      version: newVersion,
      type: versionType,
      changes: versionEntry.changes,
      timestamp: new Date().toISOString()
    });

    // Save versions
    await this.saveVersions(versions);

    // Update changelog file
    await this.updateChangelogFile(componentName, newVersion, versionEntry.changes, versionType);

    // Generate migration guide if breaking
    if (versionType === 'major') {
      await this.generateMigrationGuide(componentName, currentVersion, newVersion, versionEntry.changes);
    }

    console.log(`✅ Component versioned: ${currentVersion} → ${newVersion}`);
    console.log(`\n📝 Changes:`);
    versionEntry.changes.forEach(change => {
      console.log(`   - ${change}`);
    });

    if (versionType === 'major') {
      console.log(`\n⚠️  Migration guide generated: ${path.join(this.migrationsDir, `${componentName}-${currentVersion}-to-${newVersion}.md`)}`);
    }

    return newVersion;
  }

  async loadVersions() {
    try {
      const content = await fs.readFile(this.versionsFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {
        components: {},
        changelog: []
      };
    }
  }

  async saveVersions(versions) {
    await fs.writeFile(this.versionsFile, JSON.stringify(versions, null, 2));
  }

  suggestChanges(versionType) {
    const suggestions = {
      major: [
        'Breaking change: API updated',
        'Breaking change: Props renamed or removed',
        'Breaking change: Component behavior changed'
      ],
      minor: [
        'New feature added',
        'New prop added',
        'Enhanced functionality'
      ],
      patch: [
        'Bug fix',
        'Performance improvement',
        'Documentation update'
      ]
    };

    return suggestions[versionType] || [];
  }

  async updateChangelogFile(componentName, version, changes, type) {
    const changelog = await fs.readFile(this.changelogFile, 'utf8');
    
    const typeEmoji = type === 'major' ? '💥' : type === 'minor' ? '✨' : '🐛';
    const entry = `## [${version}] - ${new Date().toISOString().split('T')[0]}

### ${componentName} ${typeEmoji}

${changes.map(change => `- ${change}`).join('\n')}

`;

    // Insert after the header
    const lines = changelog.split('\n');
    const insertIndex = lines.findIndex(line => line === 'All notable changes to components will be documented in this file.') + 2;
    
    lines.splice(insertIndex, 0, entry.trim());
    
    await fs.writeFile(this.changelogFile, lines.join('\n'));
  }

  async generateMigrationGuide(componentName, fromVersion, toVersion, changes) {
    const breakingChanges = changes.filter(c => c.toLowerCase().includes('breaking'));
    
    let guide = `# Migration Guide: ${componentName} ${fromVersion} → ${toVersion}\n\n`;
    guide += `**Generated:** ${new Date().toISOString()}\n\n`;
    guide += `## Overview\n\n`;
    guide += `This guide helps you migrate from version ${fromVersion} to ${toVersion} of ${componentName}.\n\n`;
    
    if (breakingChanges.length > 0) {
      guide += `## ⚠️ Breaking Changes\n\n`;
      breakingChanges.forEach((change, index) => {
        guide += `${index + 1}. ${change}\n\n`;
        guide += `   **Migration:** \n`;
        guide += `   - Review your usage of this component\n`;
        guide += `   - Update props accordingly\n`;
        guide += `   - Test thoroughly after updating\n\n`;
      });
    }

    guide += `## Steps to Migrate\n\n`;
    guide += `1. **Update the dependency**\n`;
    guide += `   \`\`\`bash\n`;
    guide += `   npm update ${componentName}\n`;
    guide += `   \`\`\`\n\n`;
    
    guide += `2. **Review breaking changes** (if any)\n`;
    guide += `   Check the list above for any breaking changes that affect your usage.\n\n`;
    
    guide += `3. **Update your code**\n`;
    guide += `   Make the necessary changes to your component usage based on the breaking changes.\n\n`;
    
    guide += `4. **Test your application**\n`;
    guide += `   Run your test suite and manually test the component to ensure everything works correctly.\n\n`;
    
    guide += `## Rollback\n\n`;
    guide += `If you encounter issues, you can rollback to the previous version:\n`;
    guide += `\`\`\`bash\n`;
    guide += `npm install ${componentName}@${fromVersion}\n`;
    guide += `\`\`\`\n\n`;
    
    guide += `## Need Help?\n\n`;
    guide += `If you need assistance with the migration, please refer to the component documentation or open an issue.\n`;

    const guideFile = path.join(this.migrationsDir, `${componentName}-${fromVersion}-to-${toVersion}.md`);
    await fs.writeFile(guideFile, guide);
  }

  async getComponentHistory(componentName) {
    const versions = await this.loadVersions();
    return versions.components[componentName] || null;
  }

  async compareVersions(componentName, fromVersion, toVersion) {
    console.log(`🔍 Comparing Versions: ${fromVersion} → ${toVersion}`);
    console.log(`Component: ${componentName}`);
    console.log('');

    const history = await this.getComponentHistory(componentName);
    
    if (!history) {
      console.log('⚠️  Component not found in versioning system');
      return null;
    }

    const fromEntry = history.versions.find(v => v.version === fromVersion);
    const toEntry = history.versions.find(v => v.version === toVersion);

    if (!fromEntry || !toEntry) {
      console.log('⚠️  One or both versions not found');
      return null;
    }

    const comparison = {
      component: componentName,
      from: fromVersion,
      to: toVersion,
      isBreaking: semver.diff(fromVersion, toVersion) === 'major',
      changes: {
        added: this.diffChanges(fromEntry.changes, toEntry.changes, 'added'),
        removed: this.diffChanges(toEntry.changes, fromEntry.changes, 'removed'),
        modified: this.findModifiedChanges(fromEntry.changes, toEntry.changes)
      },
      recommendation: this.getMigrationRecommendation(fromVersion, toVersion)
    };

    console.log('📊 Comparison Results:');
    console.log('');
    console.log(`Breaking Change: ${comparison.isBreaking ? 'Yes ⚠️' : 'No'}`);
    console.log('');
    
    if (comparison.changes.added.length > 0) {
      console.log('Added:');
      comparison.changes.added.forEach(change => console.log(`  + ${change}`));
    }
    
    if (comparison.changes.removed.length > 0) {
      console.log('Removed:');
      comparison.changes.removed.forEach(change => console.log(`  - ${change}`));
    }
    
    console.log('');
    console.log('Recommendation:', comparison.recommendation);

    return comparison;
  }

  diffChanges(oldChanges, newChanges, type) {
    if (type === 'added') {
      return newChanges.filter(change => !oldChanges.includes(change));
    } else {
      return oldChanges.filter(change => !newChanges.includes(change));
    }
  }

  findModifiedChanges(oldChanges, newChanges) {
    // Simple heuristic: changes with similar but different text
    const modified = [];
    
    newChanges.forEach(newChange => {
      const similar = oldChanges.find(oldChange => 
        oldChange.toLowerCase().includes(newChange.toLowerCase().split(' ')[0]) ||
        newChange.toLowerCase().includes(oldChange.toLowerCase().split(' ')[0])
      );
      
      if (similar && similar !== newChange) {
        modified.push({
          from: similar,
          to: newChange
        });
      }
    });
    
    return modified;
  }

  getMigrationRecommendation(fromVersion, toVersion) {
    const diff = semver.diff(fromVersion, toVersion);
    
    switch (diff) {
      case 'major':
        return 'This is a major version update. Review the migration guide carefully and test thoroughly.';
      case 'minor':
        return 'This is a minor version update with new features. Should be safe to upgrade.';
      case 'patch':
        return 'This is a patch update with bug fixes. Safe to upgrade.';
      default:
        return 'Unable to determine version difference. Manual review recommended.';
    }
  }

  async rollbackComponent(componentName, targetVersion) {
    console.log(`⏪ Rolling Back: ${componentName}`);
    console.log(`Target Version: ${targetVersion}`);
    console.log('');

    const versions = await this.loadVersions();
    const history = versions.components[componentName];
    
    if (!history) {
      console.log('⚠️  Component not found in versioning system');
      return false;
    }

    const targetEntry = history.versions.find(v => v.version === targetVersion);
    
    if (!targetEntry) {
      console.log('⚠️  Target version not found');
      return false;
    }

    // Update current version
    history.currentVersion = targetVersion;
    
    // Record rollback
    history.versions.push({
      version: targetVersion,
      type: 'rollback',
      previousVersion: history.currentVersion,
      changes: [`Rollback to version ${targetVersion}`],
      timestamp: new Date().toISOString(),
      breaking: false
    });

    await this.saveVersions(versions);

    console.log(`✅ Rolled back to version ${targetVersion}`);
    console.log(`\n📝 Note: This only updates the versioning system.`);
    console.log(`   You may need to manually revert code changes or reinstall dependencies.`);

    return true;
  }

  async listAllVersions() {
    const versions = await this.loadVersions();
    
    console.log('📦 Component Versions:');
    console.log('');
    
    const components = Object.keys(versions.components);
    
    if (components.length === 0) {
      console.log('No components versioned yet.');
      return;
    }

    components.forEach(comp => {
      const history = versions.components[comp];
      console.log(`${comp}:`);
      console.log(`  Current: ${history.currentVersion}`);
      console.log(`  Versions: ${history.versions.map(v => v.version).join(', ')}`);
      console.log(`  Total: ${history.versions.length} version(s)`);
      console.log('');
    });
  }

  async generateFullChangelog() {
    const versions = await this.loadVersions();
    
    let changelog = `# Component Changelog\n\n`;
    changelog += `Generated: ${new Date().toISOString()}\n\n`;
    changelog += `---\n\n`;

    // Group by date
    const groupedByDate = {};
    
    versions.changelog.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(entry);
    });

    // Generate changelog by date
    Object.keys(groupedByDate)
      .sort()
      .reverse()
      .forEach(date => {
        changelog += `## ${date}\n\n`;
        
        groupedByDate[date].forEach(entry => {
          const typeEmoji = entry.type === 'major' ? '💥' : entry.type === 'minor' ? '✨' : '🐛';
          changelog += `### ${entry.component} ${typeEmoji} (${entry.version})\n\n`;
          
          entry.changes.forEach(change => {
            changelog += `- ${change}\n`;
          });
          
          changelog += '\n';
        });
      });

    return changelog;
  }
}

module.exports = ComponentVersioning;