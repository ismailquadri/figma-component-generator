const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'figma-component-generator');
    this.configFile = path.join(this.configDir, 'config.json');
  }

  getConfigPath() {
    return this.configFile;
  }

  async ensureConfigDir() {
    await fs.ensureDir(this.configDir);
  }

  async saveConfig(config) {
    await this.ensureConfigDir();

    const configData = {
      figma: {
        api_token: config.apiToken || config.figma?.api_token,
        team_id: config.teamId || config.figma?.team_id
      },
      defaults: {
        output_dir: config.outputDir || config.defaults?.output_dir || './src/components',
        framework: config.framework || config.defaults?.framework || 'react',
        styling: config.styling || config.defaults?.styling || 'css',
        include_storybook: config.includeStorybook || config.defaults?.include_storybook || true,
        include_typescript: config.includeTypescript || config.defaults?.include_typescript || true
      }
    };

    await fs.writeJson(this.configFile, configData, { spaces: 2 });

    // Set file permissions to owner read/write only
    await fs.chmod(this.configFile, 0o600);
  }

  loadConfig() {
    if (!fs.existsSync(this.configFile)) {
      return this.getDefaultConfig();
    }

    try {
      return fs.readJsonSync(this.configFile);
    } catch (error) {
      console.error('Error loading config file:', error.message);
      return this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      figma: {
        api_token: '',
        team_id: ''
      },
      defaults: {
        output_dir: './src/components',
        framework: 'react',
        styling: 'css',
        include_storybook: true,
        include_typescript: true
      }
    };
  }

  hasConfig() {
    return fs.existsSync(this.configFile);
  }
}

module.exports = ConfigManager;