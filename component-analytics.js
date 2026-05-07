#!/usr/bin/env node

/**
 * Component Usage Analytics Tracking
 * Tracks component usage across projects, identifies trends, and generates reports.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ComponentAnalytics {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.analyticsDir = path.join(this.projectDir, '.analytics');
    this.dataFile = path.join(this.analyticsDir, 'usage-data.json');
    this.configFile = path.join(this.analyticsDir, 'config.json');
    this.provider = options.provider || 'local';
    this.trackingId = options.trackingId;
    this.config = null;
  }

  async init() {
    console.log('📊 Initializing Component Usage Analytics...');
    
    await this.createDirectoryStructure();
    await this.createConfig();
    await this.setupTracking();
    
    console.log('✅ Analytics initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   Add the tracking wrapper to your components');
    console.log('   Run: generate-component analytics-report to view usage data');
  }

  async createDirectoryStructure() {
    await fs.mkdir(this.analyticsDir, { recursive: true });
  }

  async createConfig() {
    const config = {
      provider: this.provider,
      trackingId: this.trackingId,
      enabled: true,
      trackImports: true,
      trackRenders: true,
      trackProps: false,
      anonymizeData: true,
      samplingRate: 1.0,
      createdAt: new Date().toISOString()
    };

    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    this.config = config;
  }

  async setupTracking() {
    // Create tracking wrapper code
    const trackingWrapper = `// Component Usage Analytics Wrapper
// Add this to your component library to track usage

const ComponentAnalytics = {
  trackComponent: (componentName, props = {}) => {
    if (typeof window === 'undefined') return;
    
    const eventData = {
      event: 'component_used',
      component: componentName,
      timestamp: Date.now(),
      props: this.anonymizeData ? this.anonymizeProps(props) : props
    };

    // Send to local storage for later collection
    const events = JSON.parse(localStorage.getItem('component_events') || '[]');
    events.push(eventData);
    localStorage.setItem('component_events', JSON.stringify(events));

    // Send to analytics provider if configured
    if (this.provider === 'ga' && window.gtag) {
      window.gtag('event', 'component_used', {
        component_name: componentName
      });
    }
  },

  trackRender: (componentName, renderTime) => {
    if (typeof window === 'undefined') return;
    
    const eventData = {
      event: 'component_rendered',
      component: componentName,
      renderTime: renderTime,
      timestamp: Date.now()
    };

    const events = JSON.parse(localStorage.getItem('component_events') || '[]');
    events.push(eventData);
    localStorage.setItem('component_events', JSON.stringify(events));
  },

  anonymizeProps: (props) => {
    // Remove sensitive data from props
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const anonymized = { ...props };
    
    Object.keys(anonymized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        anonymized[key] = '[REDACTED]';
      }
    });
    
    return anonymized;
  },

  collectEvents: () => {
    const events = JSON.parse(localStorage.getItem('component_events') || '[]');
    localStorage.removeItem('component_events');
    return events;
  }
};

// React HOC for tracking
export const withAnalytics = (WrappedComponent, componentName) => {
  const ComponentWithAnalytics = (props) => {
    const startTime = Date.now();
    
    React.useEffect(() => {
      ComponentAnalytics.trackComponent(componentName, props);
      
      return () => {
        const renderTime = Date.now() - startTime;
        ComponentAnalytics.trackRender(componentName, renderTime);
      };
    }, [props]);

    return <WrappedComponent {...props} />;
  };

  ComponentWithAnalytics.displayName = \`WithAnalytics(\${componentName})\`;
  return ComponentWithAnalytics;
};

// Hook for tracking
export const useAnalytics = (componentName) => {
  React.useEffect(() => {
    ComponentAnalytics.trackComponent(componentName);
  }, [componentName]);
};
`;

    await fs.writeFile(
      path.join(this.analyticsDir, 'tracking-wrapper.js'),
      trackingWrapper
    );
  }

  async trackUsage(componentName, metadata = {}) {
    const data = await this.loadData();
    
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    
    if (!data.daily[dateKey]) {
      data.daily[dateKey] = {};
    }
    
    if (!data.daily[dateKey][componentName]) {
      data.daily[dateKey][componentName] = {
        count: 0,
        firstSeen: now.toISOString(),
        lastSeen: now.toISOString(),
        props: {}
      };
    }
    
    data.daily[dateKey][componentName].count++;
    data.daily[dateKey][componentName].lastSeen = now.toISOString();
    
    // Track prop usage
    if (metadata.props) {
      Object.keys(metadata.props).forEach(prop => {
        if (!data.daily[dateKey][componentName].props[prop]) {
          data.daily[dateKey][componentName].props[prop] = 0;
        }
        data.daily[dateKey][componentName].props[prop]++;
      });
    }
    
    // Update component summary
    if (!data.components[componentName]) {
      data.components[componentName] = {
        totalUsage: 0,
        firstSeen: now.toISOString(),
        lastSeen: now.toISOString(),
        files: new Set(),
        propsUsage: {}
      };
    }
    
    data.components[componentName].totalUsage++;
    data.components[componentName].lastSeen = now.toISOString();
    
    if (metadata.file) {
      data.components[componentName].files.add(metadata.file);
    }
    
    await this.saveData(data);
  }

  async loadData() {
    try {
      const content = await fs.readFile(this.dataFile, 'utf8');
      const data = JSON.parse(content);
      
      // Convert Set back to Array
      Object.keys(data.components || {}).forEach(comp => {
        if (data.components[comp].files && Array.isArray(data.components[comp].files)) {
          data.components[comp].files = new Set(data.components[comp].files);
        }
      });
      
      return data;
    } catch (error) {
      return {
        daily: {},
        components: {},
        createdAt: new Date().toISOString()
      };
    }
  }

  async saveData(data) {
    // Convert Set to Array for JSON serialization
    const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Set) {
        return Array.from(value);
      }
      return value;
    }));
    
    await fs.writeFile(this.dataFile, JSON.stringify(serializedData, null, 2));
  }

  async generateReport(options = {}) {
    const data = await this.loadData();
    const format = options.format || 'json';
    const startDate = options.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: this.generateSummary(data, startDate, endDate),
      topComponents: this.getTopComponents(data, startDate, endDate),
      leastUsedComponents: this.getLeastUsedComponents(data, startDate, endDate),
      usageTrends: this.getUsageTrends(data),
      propUsage: this.getPropUsage(data),
      recommendations: this.generateRecommendations(data)
    };
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    } else if (format === 'csv') {
      return this.generateCSV(report);
    } else {
      return report;
    }
  }

  generateSummary(data, startDate, endDate) {
    let totalUsage = 0;
    let uniqueComponents = 0;
    let dailyActive = 0;
    
    Object.keys(data.daily || {}).forEach(date => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        const dayData = data.daily[date];
        Object.values(dayData || {}).forEach(comp => {
          totalUsage += comp.count;
        });
        if (Object.keys(dayData || {}).length > 0) {
          dailyActive++;
        }
      }
    });
    
    uniqueComponents = Object.keys(data.components || {}).length;
    
    return {
      totalUsage,
      uniqueComponents,
      daysWithUsage: dailyActive,
      avgDailyUsage: dailyActive > 0 ? Math.round(totalUsage / dailyActive) : 0
    };
  }

  getTopComponents(data, startDate, endDate, limit = 10) {
    const usage = {};
    
    Object.keys(data.daily || {}).forEach(date => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        const dayData = data.daily[date];
        Object.entries(dayData || {}).forEach(([comp, stats]) => {
          if (!usage[comp]) {
            usage[comp] = 0;
          }
          usage[comp] += stats.count;
        });
      }
    });
    
    return Object.entries(usage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([comp, count]) => ({
        component: comp,
        usage: count,
        percentage: this.calculatePercentage(count, this.getTotalUsage(data, startDate, endDate))
      }));
  }

  getLeastUsedComponents(data, startDate, endDate, limit = 10) {
    const usage = {};
    
    Object.keys(data.components || {}).forEach(comp => {
      usage[comp] = data.components[comp].totalUsage;
    });
    
    return Object.entries(usage)
      .sort((a, b) => a[1] - b[1])
      .slice(0, limit)
      .map(([comp, count]) => ({
        component: comp,
        usage: count,
        lastUsed: data.components[comp].lastSeen
      }));
  }

  getUsageTrends(data) {
    const trends = [];
    const dates = Object.keys(data.daily || {}).sort();
    
    dates.forEach(date => {
      const dayData = data.daily[date];
      let totalUsage = 0;
      
      Object.values(dayData || {}).forEach(comp => {
        totalUsage += comp.count;
      });
      
      trends.push({
        date,
        usage: totalUsage,
        uniqueComponents: Object.keys(dayData || {}).length
      });
    });
    
    return trends.slice(-30); // Last 30 days
  }

  getPropUsage(data) {
    const propUsage = {};
    
    Object.values(data.components || {}).forEach(comp => {
      Object.entries(comp.propsUsage || {}).forEach(([prop, count]) => {
        if (!propUsage[prop]) {
          propUsage[prop] = 0;
        }
        propUsage[prop] += count;
      });
    });
    
    return Object.entries(propUsage)
      .sort((a, b) => b[1] - a[1])
      .map(([prop, count]) => ({ prop, count }));
  }

  getTotalUsage(data, startDate, endDate) {
    let total = 0;
    
    Object.keys(data.daily || {}).forEach(date => {
      const dateObj = new Date(date);
      if (dateObj >= startDate && dateObj <= endDate) {
        const dayData = data.daily[date];
        Object.values(dayData || {}).forEach(comp => {
          total += comp.count;
        });
      }
    });
    
    return total;
  }

  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  generateRecommendations(data) {
    const recommendations = [];
    
    // Check for unused components
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    Object.entries(data.components || {}).forEach(([comp, stats]) => {
      if (new Date(stats.lastSeen) < thirtyDaysAgo) {
        recommendations.push({
          type: 'warning',
          message: `Component "${comp}" hasn't been used in 30 days. Consider deprecating.`,
          component: comp
        });
      }
    });
    
    // Check for heavily used components that could benefit from optimization
    const topComponents = this.getTopComponents(data, thirtyDaysAgo, new Date(), 5);
    topComponents.forEach(comp => {
      if (comp.usage > 1000) {
        recommendations.push({
          type: 'info',
          message: `Component "${comp.component}" is heavily used (${comp.usage} times). Consider performance optimization.`,
          component: comp.component
        });
      }
    });
    
    return recommendations;
  }

  generateCSV(report) {
    let csv = 'Date,Usage,Unique Components\n';
    
    report.usageTrends.forEach(trend => {
      csv += `${trend.date},${trend.usage},${trend.uniqueComponents}\n`;
    });
    
    csv += '\nComponent,Usage,Percentage\n';
    report.topComponents.forEach(comp => {
      csv += `${comp.component},${comp.usage},${comp.percentage}%\n`;
    });
    
    return csv;
  }

  async scanProject() {
    console.log('🔍 Scanning project for component usage...');
    
    const data = await this.loadData();
    
    // Scan common component directories
    const componentDirs = [
      path.join(this.projectDir, 'src', 'components'),
      path.join(this.projectDir, 'components'),
      path.join(this.projectDir, 'app', 'components'),
    ];
    
    for (const dir of componentDirs) {
      try {
        await this.scanDirectory(dir, data);
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }
    
    await this.saveData(data);
    console.log('✅ Project scan completed');
  }

  async scanDirectory(dir, data) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        await this.scanDirectory(fullPath, data);
      } else if (file.name.match(/\.(jsx?|tsx?|vue)$/)) {
        await this.scanFile(fullPath, data);
      }
    }
  }

  async scanFile(filePath, data) {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract component names from imports and usage
    const importMatches = content.match(/import\s+{([^}]+)}\s+from/g) || [];
    const componentMatches = content.match(/<([A-Z][a-zA-Z]*)/g) || [];
    
    const componentName = path.basename(filePath, path.extname(filePath));
    
    // Track that this file exists
    await this.trackUsage(componentName, {
      file: filePath,
      props: this.extractProps(content)
    });
  }

  extractProps(content) {
    const props = {};
    const propMatches = content.match(/(\w+)={/g) || [];
    
    propMatches.forEach(match => {
      const propName = match.replace('={', '');
      props[propName] = (props[propName] || 0) + 1;
    });
    
    return props;
  }
}

module.exports = ComponentAnalytics;