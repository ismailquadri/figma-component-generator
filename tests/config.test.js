const ConfigManager = require('../config');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('ConfigManager', () => {
  const configManager = new ConfigManager();
  const testConfigDir = path.join(os.tmpdir(), 'figma-component-generator-test');

  beforeEach(() => {
    // Set a custom config directory for testing
    configManager.configDir = testConfigDir;
    configManager.configFile = path.join(testConfigDir, 'config.json');
  });

  afterEach(async () => {
    // Clean up test config directory
    await fs.remove(testConfigDir);
  });

  describe('saveConfig', () => {
    it('should save configuration to file', async () => {
      const config = {
        figma: { api_token: 'figd_test123' },
        defaults: {
          output_dir: './src/components',
          framework: 'react',
          styling: 'css'
        }
      };

      await configManager.saveConfig(config);

      const savedConfig = await fs.readJson(configManager.configFile);
      expect(savedConfig.figma.api_token).toBe(config.figma.api_token);
      expect(savedConfig.defaults.output_dir).toBe(config.defaults.output_dir);
      expect(savedConfig.defaults.framework).toBe(config.defaults.framework);
      expect(savedConfig.defaults.styling).toBe(config.defaults.styling);
    });

    it('should create config directory if it does not exist', async () => {
      const config = {
        figma: { api_token: 'figd_test123' },
        defaults: { output_dir: './src/components', framework: 'react', styling: 'css' }
      };

      await configManager.saveConfig(config);

      expect(await fs.pathExists(configManager.configDir)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should load configuration from file', async () => {
      const config = {
        figma: { api_token: 'figd_test123' },
        defaults: { output_dir: './src/components', framework: 'react', styling: 'css' }
      };

      await configManager.saveConfig(config);
      const loadedConfig = configManager.loadConfig();

      expect(loadedConfig.figma.api_token).toBe(config.figma.api_token);
      expect(loadedConfig.defaults.output_dir).toBe(config.defaults.output_dir);
      expect(loadedConfig.defaults.framework).toBe(config.defaults.framework);
      expect(loadedConfig.defaults.styling).toBe(config.defaults.styling);
    });

    it('should return default config if file does not exist', () => {
      const loadedConfig = configManager.loadConfig();

      expect(loadedConfig).toHaveProperty('figma');
      expect(loadedConfig).toHaveProperty('defaults');
      expect(loadedConfig.figma.api_token).toBe('');
    });
  });

  describe('getConfigPath', () => {
    it('should return the config file path', () => {
      const configPath = configManager.getConfigPath();

      expect(configPath).toBe(configManager.configFile);
    });
  });
});