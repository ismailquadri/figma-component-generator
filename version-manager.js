const fs = require('fs-extra');
const path = require('path');

class VersionManager {
  constructor(projectDir) {
    this.projectDir = projectDir;
    this.versionFile = path.join(projectDir, '.design-system', 'versions.json');
    this.componentsDir = path.join(projectDir, '.design-system', 'components');
  }

  async init() {
    await fs.ensureDir(this.projectDir);
    await fs.ensureDir(path.join(this.projectDir, '.design-system'));
    await fs.ensureDir(this.componentsDir);
    
    if (!await fs.pathExists(this.versionFile)) {
      await fs.writeJson(this.versionFile, {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        components: {}
      }, { spaces: 2 });
    }
  }

  async getVersions() {
    return await fs.readJson(this.versionFile);
  }

  async saveComponentVersion(componentName, figmaData, generatedCode) {
    const versions = await this.getVersions();
    
    if (!versions.components[componentName]) {
      versions.components[componentName] = {
        versions: [],
        currentVersion: 0,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
    }

    const component = versions.components[componentName];
    const newVersion = component.currentVersion + 1;
    
    // Create version snapshot
    const versionSnapshot = {
      version: newVersion,
      figmaData: this.extractDesignData(figmaData),
      generatedCode: generatedCode,
      timestamp: new Date().toISOString(),
      changes: this.detectChanges(component.versions[component.currentVersion - 1], figmaData)
    };

    component.versions.push(versionSnapshot);
    component.currentVersion = newVersion;
    component.lastUpdated = new Date().toISOString();

    versions.lastUpdated = new Date().toISOString();
    
    await fs.writeJson(this.versionFile, versions, { spaces: 2 });
    
    // Save component metadata
    await this.saveComponentMetadata(componentName, component);
    
    return newVersion;
  }

  extractDesignData(figmaData) {
    return {
      name: figmaData.name,
      type: figmaData.type,
      width: figmaData.width,
      height: figmaData.height,
      fills: figmaData.fills,
      typography: figmaData.typography,
      borderRadius: figmaData.borderRadius,
      padding: {
        top: figmaData.paddingTop,
        right: figmaData.paddingRight,
        bottom: figmaData.paddingBottom,
        left: figmaData.paddingLeft
      }
    };
  }

  detectChanges(previousVersion, currentData) {
    if (!previousVersion) {
      return {
        type: 'initial',
        message: 'Initial version'
      };
    }

    const changes = [];
    const prevData = previousVersion.figmaData;
    
    // Detect color changes
    if (JSON.stringify(prevData.fills) !== JSON.stringify(currentData.fills)) {
      changes.push({
        type: 'color',
        message: 'Colors changed',
        previous: prevData.fills,
        current: currentData.fills
      });
    }
    
    // Detect typography changes
    if (JSON.stringify(prevData.typography) !== JSON.stringify(currentData.typography)) {
      changes.push({
        type: 'typography',
        message: 'Typography changed',
        previous: prevData.typography,
        current: currentData.typography
      });
    }
    
    // Detect spacing changes
    const prevPadding = `${prevData.padding?.top}-${prevData.padding?.right}-${prevData.padding?.bottom}-${prevData.padding?.left}`;
    const currPadding = `${currentData.paddingTop}-${currentData.paddingRight}-${currentData.paddingBottom}-${currentData.paddingLeft}`;
    if (prevPadding !== currPadding) {
      changes.push({
        type: 'spacing',
        message: 'Padding changed',
        previous: prevData.padding,
        current: {
          top: currentData.paddingTop,
          right: currentData.paddingRight,
          bottom: currentData.paddingBottom,
          left: currentData.paddingLeft
        }
      });
    }

    return {
      type: changes.length > 0 ? 'update' : 'minor',
      message: changes.length > 0 ? `${changes.length} change(s) detected` : 'No significant changes',
      changes
    };
  }

  async saveComponentMetadata(componentName, componentData) {
    const metadataPath = path.join(this.componentsDir, `${componentName}.json`);
    await fs.writeJson(metadataPath, componentData, { spaces: 2 });
  }

  async getComponentHistory(componentName) {
    const versions = await this.getVersions();
    return versions.components[componentName] || null;
  }

  async updateComponentStatus(componentName, status) {
    const versions = await this.getVersions();
    
    if (versions.components[componentName]) {
      versions.components[componentName].status = status;
      versions.components[componentName].lastUpdated = new Date().toISOString();
      versions.lastUpdated = new Date().toISOString();
      
      await fs.writeJson(this.versionFile, versions, { spaces: 2 });
      await this.saveComponentMetadata(componentName, versions.components[componentName]);
    }
  }

  async getAllComponents() {
    const versions = await this.getVersions();
    return Object.entries(versions.components).map(([name, data]) => ({
      name,
      version: data.currentVersion,
      status: data.status,
      lastUpdated: data.lastUpdated,
      createdAt: data.createdAt
    }));
  }

  async getChangeLog() {
    const versions = await this.getVersions();
    const changeLog = [];
    
    Object.entries(versions.components).forEach(([componentName, component]) => {
      component.versions.forEach(version => {
        changeLog.push({
          component: componentName,
          version: version.version,
          type: version.changes.type,
          message: version.changes.message,
          timestamp: version.timestamp
        });
      });
    });
    
    return changeLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

module.exports = VersionManager;