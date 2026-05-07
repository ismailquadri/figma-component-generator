const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const WebSocket = require('ws');
const chokidar = require('chokidar');

class FigmaRealTimeSync {
  constructor(figmaClient, projectPath) {
    this.figmaClient = figmaClient;
    this.projectPath = projectPath;
    this.watchMode = false;
    this.webhookServer = null;
    this.componentCache = new Map();
    this.debounceTimers = new Map();
  }

  async setup(options = {}) {
    console.log(chalk.blue('Setting up Real-Time Figma Sync...'));

    try {
      // Create webhook configuration
      this.createWebhookConfig(options);

      // Create sync configuration
      this.createSyncConfig(options);

      // Create file watcher for local changes
      if (options.watch) {
        this.setupFileWatcher();
      }

      console.log(chalk.green('✓ Real-Time Figma Sync setup completed!'));
      console.log(chalk.cyan('\nNext steps:'));
      console.log(chalk.cyan('  1. Set up webhook in Figma:'));
      console.log(chalk.cyan('     - Go to Figma file settings'));
      console.log(chalk.cyan('     - Add webhook URL from .storybook/webhook-endpoint.txt'));
      console.log(chalk.cyan('  2. Start sync server:'));
      console.log(chalk.cyan('     generate-component sync --server'));
      console.log(chalk.cyan('  3. Or watch for Figma changes:'));
      console.log(chalk.cyan('     generate-component sync --watch'));

    } catch (error) {
      console.error(chalk.red('✗ Figma Sync setup failed:'), error.message);
      throw error;
    }
  }

  createWebhookConfig(options) {
    const webhookDir = path.join(this.projectPath, '.storybook');
    
    if (!fs.existsSync(webhookDir)) {
      fs.mkdirSync(webhookDir, { recursive: true });
    }

    // Generate webhook endpoint URL
    const webhookUrl = options.webhookUrl || this.generateWebhookUrl(options.port || 3000);
    
    const webhookConfig = {
      figmaWebhookUrl: webhookUrl,
      secret: options.secret || this.generateSecret(),
      fileKey: options.fileKey || '',
      syncEnabled: true,
      autoSync: options.autoSync !== false,
      syncInterval: options.syncInterval || 60000, // 1 minute
      debounceDelay: options.debounceDelay || 5000, // 5 seconds
      components: options.components || [],
      ignoredComponents: options.ignoredComponents || [],
      notifications: {
        enabled: options.notifications !== false,
        slack: options.slackWebhook || null,
        discord: options.discordWebhook || null
      }
    };

    fs.writeFileSync(
      path.join(webhookDir, 'figma-sync.json'),
      JSON.stringify(webhookConfig, null, 2)
    );

    // Save webhook endpoint for user
    fs.writeFileSync(
      path.join(webhookDir, 'webhook-endpoint.txt'),
      webhookUrl
    );

    console.log(chalk.yellow(`Webhook endpoint: ${webhookUrl}`));
    console.log(chalk.yellow('Add this URL to your Figma file webhook settings'));
  }

  generateWebhookUrl(port) {
    // Try to get public URL from environment or use localhost
    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
    return `${publicUrl}/webhooks/figma`;
  }

  generateSecret() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  createSyncConfig(options) {
    const syncConfig = `module.exports = {
  // Figma Sync Configuration
  sync: {
    enabled: true,
    autoSync: true,
    debounceDelay: 5000, // Wait 5 seconds after last change before syncing
    syncInterval: 60000, // Poll every 60 seconds as fallback
    
    // Component filtering
    include: [
      // Component names to sync (regex patterns)
      /^Button/,
      /^Input/,
      /^Card/,
      /^Modal/,
      /^Navigation/
    ],
    exclude: [
      // Component names to exclude (regex patterns)
      /^.*\\[Copy\\].*$/,
      /^.*\\[Instance\\].*$/
    ],
    
    // Sync behavior
    behavior: {
      updateStories: true,
      updateComponents: false, // Don't auto-update component code
      generateDiff: true,
      createBackup: true
    },
    
    // Notifications
    notifications: {
      onSyncStart: true,
      onSyncComplete: true,
      onError: true
    }
  },
  
  // Webhook server configuration
  server: {
    port: ${options.port || 3000},
    path: '/webhooks/figma'
  }
};
`;

    fs.writeFileSync(
      path.join(this.projectPath, '.storybook', 'sync.config.js'),
      syncConfig
    );
  }

  setupFileWatcher() {
    const componentsPath = path.join(this.projectPath, 'src/components');
    
    if (fs.existsSync(componentsPath)) {
      const watcher = chokidar.watch(componentsPath, {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });

      watcher.on('change', (filePath) => {
        this.handleLocalChange(filePath);
      });

      console.log(chalk.yellow('Watching for local component changes...'));
    }
  }

  async handleLocalChange(filePath) {
    const componentName = path.basename(filePath, path.extname(filePath));
    console.log(chalk.yellow(`Local change detected: ${componentName}`));
    
    // Could trigger Figma update or notify team
    await this.notifyTeam('local_change', { component: componentName, file: filePath });
  }

  async startServer() {
    const express = require('express');
    const bodyParser = require('body-parser');
    const crypto = require('crypto');
    
    const app = express();
    const config = this.loadSyncConfig();
    
    app.use(bodyParser.json());
    
    // Webhook endpoint
    app.post('/webhooks/figma', async (req, res) => {
      try {
        // Verify webhook signature
        const signature = req.headers['x-figma-signature'];
        if (signature && config.secret) {
          const expectedSignature = crypto
            .createHmac('sha256', config.secret)
            .update(JSON.stringify(req.body))
            .digest('hex');
          
          if (signature !== expectedSignature) {
            return res.status(401).json({ error: 'Invalid signature' });
          }
        }
        
        // Handle webhook event
        await this.handleWebhookEvent(req.body);
        
        res.json({ success: true });
      } catch (error) {
        console.error(chalk.red('Webhook error:'), error.message);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', syncEnabled: true });
    });
    
    // Sync status
    app.get('/sync/status', (req, res) => {
      res.json({
        lastSync: this.lastSyncTime || null,
        componentCount: this.componentCache.size,
        watching: this.watchMode
      });
    });
    
    // Manual sync trigger
    app.post('/sync/trigger', async (req, res) => {
      try {
        await this.syncAllComponents();
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    const port = config.server?.port || 3000;
    this.webhookServer = app.listen(port, () => {
      console.log(chalk.green(`✓ Figma sync server running on port ${port}`));
      console.log(chalk.cyan(`Webhook endpoint: http://localhost:${port}/webhooks/figma`));
    });
  }

  loadSyncConfig() {
    const configPath = path.join(this.projectPath, '.storybook', 'figma-sync.json');
    
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    return {};
  }

  async handleWebhookEvent(event) {
    console.log(chalk.yellow(`Figma webhook event: ${event.event_type}`));
    
    switch (event.event_type) {
      case 'FILE_UPDATE':
        await this.handleFileUpdate(event);
        break;
      case 'FILE_COMMENT':
        await this.handleComment(event);
        break;
      case 'LIBRARY_UPDATE':
        await this.handleLibraryUpdate(event);
        break;
      default:
        console.log(chalk.gray(`Unhandled event type: ${event.event_type}`));
    }
  }

  async handleFileUpdate(event) {
    const fileKey = event.file_key;
    
    // Debounce rapid updates
    if (this.debounceTimers.has(fileKey)) {
      clearTimeout(this.debounceTimers.get(fileKey));
    }
    
    this.debounceTimers.set(fileKey, setTimeout(async () => {
      await this.syncFileChanges(fileKey);
      this.debounceTimers.delete(fileKey);
    }, 5000));
  }

  async syncFileChanges(fileKey) {
    console.log(chalk.yellow(`Syncing changes for file: ${fileKey}`));
    
    try {
      const figmaData = await this.figmaClient.getFile(fileKey);
      const components = this.extractComponents(figmaData);
      
      for (const component of components) {
        await this.syncComponent(component);
      }
      
      this.lastSyncTime = new Date().toISOString();
      await this.notifyTeam('sync_complete', { componentCount: components.length });
      
    } catch (error) {
      console.error(chalk.red('Sync failed:'), error.message);
      await this.notifyTeam('sync_error', { error: error.message });
    }
  }

  extractComponents(figmaData) {
    const components = [];
    
    const traverse = (node) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type,
          description: node.description,
          componentPropertyDefinitions: node.componentPropertyDefinitions,
          variants: this.extractVariants(node)
        });
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    if (figmaData.document) {
      traverse(figmaData.document);
    }
    
    return components;
  }

  extractVariants(component) {
    if (component.type === 'COMPONENT_SET') {
      return component.children?.map(child => ({
        id: child.id,
        name: child.name,
        properties: child.componentPropertyDefinitions
      })) || [];
    }
    return [];
  }

  async syncComponent(component) {
    const componentName = component.name;
    const previousState = this.componentCache.get(componentName);
    
    // Check if component should be synced
    if (!this.shouldSyncComponent(componentName)) {
      return;
    }
    
    // Detect changes
    const changes = this.detectChanges(previousState, component);
    
    if (changes.length > 0) {
      console.log(chalk.yellow(`Changes detected in ${componentName}:`));
      changes.forEach(change => {
        console.log(chalk.gray(`  - ${change.type}: ${change.description}`));
      });
      
      // Update component cache
      this.componentCache.set(componentName, component);
      
      // Trigger story update
      await this.updateComponentStory(component, changes);
      
      // Create backup if configured
      await this.createBackup(componentName);
    }
  }

  shouldSyncComponent(componentName) {
    const config = this.loadSyncConfig();
    
    // Check include patterns
    if (config.sync?.include) {
      const included = config.sync.include.some(pattern => pattern.test(componentName));
      if (!included) return false;
    }
    
    // Check exclude patterns
    if (config.sync?.exclude) {
      const excluded = config.sync.exclude.some(pattern => pattern.test(componentName));
      if (excluded) return false;
    }
    
    return true;
  }

  detectChanges(previous, current) {
    const changes = [];
    
    if (!previous) {
      changes.push({
        type: 'new',
        description: 'New component detected'
      });
      return changes;
    }
    
    // Compare properties
    if (JSON.stringify(previous.componentPropertyDefinitions) !== 
        JSON.stringify(current.componentPropertyDefinitions)) {
      changes.push({
        type: 'properties',
        description: 'Component properties changed'
      });
    }
    
    // Compare description
    if (previous.description !== current.description) {
      changes.push({
        type: 'description',
        description: 'Component description changed'
      });
    }
    
    // Compare variants
    if (JSON.stringify(previous.variants) !== JSON.stringify(current.variants)) {
      changes.push({
        type: 'variants',
        description: 'Component variants changed'
      });
    }
    
    return changes;
  }

  async updateComponentStory(component, changes) {
    // This would call the component generator to update the story
    console.log(chalk.cyan(`Updating story for ${component.name}...`));
    
    // Generate updated story based on new Figma data
    // This would integrate with the existing component generator
  }

  async createBackup(componentName) {
    const backupDir = path.join(this.projectPath, '.storybook', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${componentName}-${timestamp}.json`);
    
    const backup = {
      componentName,
      timestamp: new Date().toISOString(),
      data: this.componentCache.get(componentName)
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    console.log(chalk.gray(`Backup created: ${backupPath}`));
  }

  async syncAllComponents() {
    const config = this.loadSyncConfig();
    
    if (!config.fileKey) {
      throw new Error('No fileKey configured in figma-sync.json');
    }
    
    await this.syncFileChanges(config.fileKey);
  }

  async handleComment(event) {
    console.log(chalk.yellow(`New comment on file: ${event.file_key}`));
    await this.notifyTeam('comment', event);
  }

  async handleLibraryUpdate(event) {
    console.log(chalk.yellow(`Library update: ${event.library_id}`));
    await this.syncFileChanges(event.file_key);
  }

  async notifyTeam(type, data) {
    const config = this.loadSyncConfig();
    
    if (!config.notifications?.enabled) return;
    
    // Send Slack notification
    if (config.notifications.slack && type !== 'local_change') {
      await this.sendSlackNotification(config.notifications.slack, type, data);
    }
    
    // Send Discord notification
    if (config.notifications.discord && type !== 'local_change') {
      await this.sendDiscordNotification(config.notifications.discord, type, data);
    }
  }

  async sendSlackNotification(webhookUrl, type, data) {
    try {
      const message = this.formatSlackMessage(type, data);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log(chalk.gray('Slack notification sent'));
      }
    } catch (error) {
      console.error(chalk.gray('Failed to send Slack notification'));
    }
  }

  formatSlackMessage(type, data) {
    const colors = {
      sync_complete: '#36a64f',
      sync_error: '#dc3545',
      comment: '#007bff',
      local_change: '#6c757d'
    };
    
    return {
      text: `Figma Sync: ${type}`,
      attachments: [{
        color: colors[type] || '#6c757d',
        fields: Object.entries(data).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })),
        footer: 'Figma Component Generator',
        ts: Date.now()
      }]
    };
  }

  async sendDiscordNotification(webhookUrl, type, data) {
    try {
      const message = this.formatDiscordMessage(type, data);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (response.ok) {
        console.log(chalk.gray('Discord notification sent'));
      }
    } catch (error) {
      console.error(chalk.gray('Failed to send Discord notification'));
    }
  }

  formatDiscordMessage(type, data) {
    const colors = {
      sync_complete: 5763719,
      sync_error: 15548997,
      comment: 3426654,
      local_change: 11184810
    };
    
    return {
      embeds: [{
        title: `Figma Sync: ${type}`,
        color: colors[type] || 11184810,
        fields: Object.entries(data).map(([key, value]) => ({
          name: key,
          value: String(value),
          inline: true
        })),
        timestamp: new Date().toISOString()
      }]
    };
  }

  async watch() {
    this.watchMode = true;
    const config = this.loadSyncConfig();
    
    console.log(chalk.blue('Starting Figma watch mode...'));
    console.log(chalk.gray(`Sync interval: ${config.syncInterval}ms`));
    
    // Start periodic sync
    setInterval(async () => {
      if (config.fileKey) {
        await this.syncFileChanges(config.fileKey);
      }
    }, config.syncInterval);
    
    // Keep process alive
    console.log(chalk.green('✓ Watch mode active. Press Ctrl+C to stop.'));
    
    return new Promise((resolve) => {
      // Keep the process running
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nStopping watch mode...'));
        this.watchMode = false;
        resolve();
      });
    });
  }

  async stop() {
    if (this.webhookServer) {
      this.webhookServer.close();
      console.log(chalk.yellow('Sync server stopped'));
    }
    this.watchMode = false;
  }
}

module.exports = FigmaRealTimeSync;