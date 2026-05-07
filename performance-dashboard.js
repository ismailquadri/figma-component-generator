#!/usr/bin/env node

/**
 * Component Performance Dashboard
 * Monitors and analyzes component performance metrics including bundle size, render time, and re-renders.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PerformanceDashboard {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.port = options.port || 3002;
    this.performanceDir = path.join(this.projectDir, '.performance');
    this.dataFile = path.join(this.performanceDir, 'metrics.json');
    this.dashboardDir = path.join(this.performanceDir, 'dashboard');
  }

  async init() {
    console.log('⚡ Initializing Component Performance Dashboard...');
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log(`🔌 Port: ${this.port}`);
    console.log('');

    await this.createDirectoryStructure();
    await this.createDashboard();
    await this.createMonitoringCode();
    await this.createBundleAnalyzerConfig();

    console.log('✅ Performance Dashboard initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Add the performance monitoring wrapper to your components');
    console.log('   2. Run: generate-component start-performance-dashboard');
    console.log('   3. Run: generate-component analyze-performance --component <name>');
  }

  async createDirectoryStructure() {
    const dirs = [
      this.performanceDir,
      this.dashboardDir,
      path.join(this.dashboardDir, 'pages'),
      path.join(this.dashboardDir, 'components'),
      path.join(this.dashboardDir, 'lib'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createDashboard() {
    // Create Next.js-based dashboard
    const packageJson = {
      name: 'performance-dashboard',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: `next dev -p ${this.port}`,
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        recharts: '^2.8.0',
        'lucide-react': '^0.294.0',
        'clsx': '^2.0.0',
        'tailwind-merge': '^2.0.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        autoprefixer: '^10.4.0',
        eslint: '^8.0.0',
        'eslint-config-next': '^14.0.0',
        postcss: '^8.4.0',
        tailwindcss: '^3.3.0',
        typescript: '^5.0.0',
      },
    };

    await fs.writeFile(
      path.join(this.dashboardDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main page
    const indexPage = `import { PerformanceMetrics } from '@/components/PerformanceMetrics';
import { ComponentList } from '@/components/ComponentList';
import { Layout } from '@/components/Layout';

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Performance Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor and analyze component performance metrics
          </p>
        </div>

        <PerformanceMetrics />
        <ComponentList />
      </div>
    </Layout>
  );
}
`;

    await fs.writeFile(
      path.join(this.dashboardDir, 'pages', 'index.tsx'),
      indexPage
    );

    // Create API route for metrics
    const apiRoute = `import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), '..', 'metrics.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      const metrics = JSON.parse(data);
      res.status(200).json(metrics);
    } catch (error) {
      res.status(200).json({ components: {}, history: [] });
    }
  } else if (req.method === 'POST') {
    try {
      const { component, metrics } = req.body;
      
      const data = await fs.readFile(DATA_FILE, 'utf8').catch(() => '{}');
      const allMetrics = JSON.parse(data);
      
      if (!allMetrics.components) {
        allMetrics.components = {};
      }
      
      if (!allMetrics.components[component]) {
        allMetrics.components[component] = {
          renderTimes: [],
          bundleSize: 0,
          reRenderCount: 0,
          memoryUsage: []
        };
      }
      
      allMetrics.components[component].renderTimes.push(metrics.renderTime);
      allMetrics.components[component].reRenderCount += metrics.reRenderCount || 0;
      
      if (metrics.memoryUsage) {
        allMetrics.components[component].memoryUsage.push(metrics.memoryUsage);
      }
      
      if (!allMetrics.history) {
        allMetrics.history = [];
      }
      
      allMetrics.history.push({
        component,
        timestamp: new Date().toISOString(),
        metrics
      });
      
      await fs.writeFile(DATA_FILE, JSON.stringify(allMetrics, null, 2));
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save metrics' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
`;

    await fs.writeFile(
      path.join(this.dashboardDir, 'pages', 'api', 'metrics.ts'),
      apiRoute
    );
  }

  async createMonitoringCode() {
    const monitoringCode = `// Component Performance Monitoring Wrapper
// Add this to your components to track performance

export class PerformanceMonitor {
  static trackRender(componentName: string) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        this.reportMetric(componentName, {
          renderTime,
          timestamp: Date.now()
        });
      }
    };
  }

  static trackBundleSize(componentName: string, size: number) {
    this.reportMetric(componentName, {
      bundleSize: size,
      timestamp: Date.now()
    });
  }

  static trackReRender(componentName: string) {
    this.reportMetric(componentName, {
      reRender: true,
      timestamp: Date.now()
    });
  }

  static trackMemory(componentName: string) {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.reportMetric(componentName, {
        memoryUsage: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        },
        timestamp: Date.now()
      });
    }
  }

  private static async reportMetric(componentName: string, metrics: any) {
    // Store in localStorage for batch reporting
    const pendingMetrics = JSON.parse(
      localStorage.getItem('pending_metrics') || '[]'
    );
    
    pendingMetrics.push({
      component: componentName,
      metrics,
      timestamp: Date.now()
    });
    
    localStorage.setItem('pending_metrics', JSON.stringify(pendingMetrics));
    
    // Report every 5 metrics
    if (pendingMetrics.length >= 5) {
      await this.flushMetrics();
    }
  }

  private static async flushMetrics() {
    const pendingMetrics = JSON.parse(
      localStorage.getItem('pending_metrics') || '[]'
    );
    
    if (pendingMetrics.length === 0) return;
    
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingMetrics[0]) // Send first metric
      });
      
      localStorage.removeItem('pending_metrics');
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }
}

// React HOC for performance tracking
import { useEffect, useRef } from 'react';

export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const renderCount = useRef(0);
    const renderStart = useRef(0);
    
    useEffect(() => {
      renderCount.current += 1;
      renderStart.current = performance.now();
      
      if (renderCount.current > 1) {
        PerformanceMonitor.trackReRender(componentName);
      }
      
      return () => {
        const renderTime = performance.now() - renderStart.current;
        PerformanceMonitor.trackRender(componentName).end();
        PerformanceMonitor.trackMemory(componentName);
      };
    });
    
    return <WrappedComponent {...props} />;
  };
}

// Hook for performance tracking
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const tracker = PerformanceMonitor.trackRender(componentName);
    
    return () => {
      tracker.end();
      PerformanceMonitor.trackMemory(componentName);
    };
  }, [componentName]);
}
`;

    await fs.writeFile(
      path.join(this.performanceDir, 'monitoring.ts'),
      monitoringCode
    );
  }

  async createBundleAnalyzerConfig() {
    const webpackConfig = `const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: '../bundle-report.html',
          generateStatsFile: true,
          statsFilename: '../bundle-stats.json'
        })
      );
    }
    return config;
  }
};
`;

    await fs.writeFile(
      path.join(this.performanceDir, 'webpack.performance.js'),
      webpackConfig
    );
  }

  async analyzeComponent(componentName) {
    console.log('⚡ Analyzing Component Performance...');
    console.log(`Component: ${componentName}`);
    console.log('');

    const metrics = await this.loadMetrics();
    const componentMetrics = metrics.components?.[componentName];

    if (!componentMetrics) {
      console.log('⚠️  No metrics found for this component');
      console.log('Make sure to add performance tracking to the component first');
      return;
    }

    const analysis = {
      componentName,
      renderTime: this.calculateAverage(componentMetrics.renderTimes),
      reRenderCount: componentMetrics.reRenderCount,
      bundleSize: componentMetrics.bundleSize,
      memoryUsage: this.calculateAverageMemory(componentMetrics.memoryUsage),
      score: this.calculatePerformanceScore(componentMetrics),
      recommendations: this.generateRecommendations(componentMetrics)
    };

    console.log('📊 Performance Analysis:');
    console.log('');
    console.log(`Average Render Time: ${analysis.renderTime.toFixed(2)}ms`);
    console.log(`Re-render Count: ${analysis.reRenderCount}`);
    console.log(`Bundle Size: ${this.formatBytes(analysis.bundleSize)}`);
    console.log(`Memory Usage: ${this.formatBytes(analysis.memoryUsage)}`);
    console.log(`Performance Score: ${analysis.score}/100`);
    console.log('');
    console.log('💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });

    return analysis;
  }

  async loadMetrics() {
    try {
      const content = await fs.readFile(this.dataFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return { components: {}, history: [] };
    }
  }

  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  calculateAverageMemory(memoryValues) {
    if (!memoryValues || memoryValues.length === 0) return 0;
    const avgUsed = this.calculateAverage(memoryValues.map(m => m.usedJSHeapSize));
    return avgUsed;
  }

  calculatePerformanceScore(metrics) {
    let score = 100;
    
    // Penalize slow renders
    const avgRenderTime = this.calculateAverage(metrics.renderTimes);
    if (avgRenderTime > 16) {
      score -= Math.min(20, (avgRenderTime - 16) * 2);
    }
    
    // Penalize excessive re-renders
    if (metrics.reRenderCount > 10) {
      score -= Math.min(15, (metrics.reRenderCount - 10) * 2);
    }
    
    // Penalize large bundle size
    if (metrics.bundleSize > 50000) {
      score -= Math.min(25, (metrics.bundleSize - 50000) / 2000);
    }
    
    return Math.max(0, Math.round(score));
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    const avgRenderTime = this.calculateAverage(metrics.renderTimes);
    if (avgRenderTime > 16) {
      recommendations.push('Consider using React.memo() to prevent unnecessary re-renders');
      recommendations.push('Optimize expensive calculations with useMemo()');
      recommendations.push('Use useCallback() for stable function references');
    }
    
    if (metrics.reRenderCount > 10) {
      recommendations.push('High re-render count detected. Review component dependencies');
      recommendations.push('Consider splitting large components into smaller ones');
    }
    
    if (metrics.bundleSize > 50000) {
      recommendations.push('Large bundle size. Consider code splitting');
      recommendations.push('Use dynamic imports for heavy dependencies');
      recommendations.push('Remove unused imports and dependencies');
    }
    
    const avgMemory = this.calculateAverageMemory(metrics.memoryUsage);
    if (avgMemory > 10 * 1024 * 1024) {
      recommendations.push('High memory usage. Check for memory leaks');
      recommendations.push('Clean up event listeners and subscriptions');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance looks good! No major issues detected.');
    }
    
    return recommendations;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async runBundleAnalysis() {
    console.log('📦 Running Bundle Analysis...');
    console.log('');

    try {
      // Check if webpack-bundle-analyzer is installed
      execSync('npx webpack-bundle-analyzer --help', { stdio: 'pipe' });
      
      const reportPath = path.join(this.performanceDir, 'bundle-report.html');
      const statsPath = path.join(this.performanceDir, 'bundle-stats.json');
      
      console.log('✅ Bundle analysis complete');
      console.log(`📊 Report: ${reportPath}`);
      console.log(`📊 Stats: ${statsPath}`);
      
      return { reportPath, statsPath };
    } catch (error) {
      console.log('⚠️  webpack-bundle-analyzer not found');
      console.log('Install it with: npm install --save-dev webpack-bundle-analyzer');
      return null;
    }
  }

  async startDashboard() {
    console.log('🚀 Starting Performance Dashboard...');
    console.log(`🔌 Port: ${this.port}`);
    console.log('');

    try {
      process.chdir(this.dashboardDir);
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm run dev', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to start dashboard:', error.message);
    }
  }
}

module.exports = PerformanceDashboard;