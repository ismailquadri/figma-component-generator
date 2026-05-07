#!/usr/bin/env node

/**
 * Accessibility Scoring Dashboard
 * Analyzes components for WCAG compliance and provides accessibility scores with fix suggestions.
 */

const fs = require('fs').promises;
const path = require('path');

class AccessibilityDashboard {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.a11yDir = path.join(this.projectDir, '.a11y');
    this.reportsFile = path.join(this.a11yDir, 'reports.json');
  }

  async init() {
    console.log('♿ Initializing Accessibility Dashboard...');
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log('');

    await this.createDirectoryStructure();
    await this.createConfig();

    console.log('✅ Accessibility Dashboard initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   Run: generate-component a11y-check --component <name>');
    console.log('   Run: generate-component a11y-dashboard');
  }

  async createDirectoryStructure() {
    await fs.mkdir(this.a11yDir, { recursive: true });
  }

  async createConfig() {
    const config = {
      wcagLevel: 'AA',
      rules: {
        colorContrast: true,
        ariaAttributes: true,
        keyboardNavigation: true,
        altText: true,
        formLabels: true,
        headingStructure: true,
        focusManagement: true
      },
      thresholds: {
        excellent: 90,
        good: 75,
        fair: 60,
        poor: 0
      }
    };

    await fs.writeFile(
      path.join(this.a11yDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  async checkComponent(componentName) {
    console.log('♿ Checking Component Accessibility');
    console.log(`Component: ${componentName}`);
    console.log('');

    const componentPath = await this.findComponent(componentName);
    
    if (!componentPath) {
      console.log(`⚠️  Component "${componentName}" not found`);
      return null;
    }

    const content = await fs.readFile(componentPath, 'utf8');
    const issues = this.analyzeAccessibility(content);
    
    const score = this.calculateScore(issues);
    const report = {
      componentName,
      componentPath,
      score,
      grade: this.getGrade(score),
      issues,
      recommendations: this.generateRecommendations(issues),
      timestamp: new Date().toISOString()
    };

    // Save report
    await this.saveReport(report);

    // Display results
    this.displayResults(report);

    return report;
  }

  async findComponent(componentName) {
    const componentDirs = [
      path.join(this.projectDir, 'src', 'components'),
      path.join(this.projectDir, 'components'),
    ];

    for (const dir of componentDirs) {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          const baseName = path.basename(file, path.extname(file));
          if (baseName === componentName || baseName === componentName + '.jsx' || baseName === componentName + '.tsx') {
            return path.join(dir, file);
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    return null;
  }

  analyzeAccessibility(content) {
    const issues = [];

    // Check for alt text on images
    if (!content.includes('alt=')) {
      issues.push({
        id: 'no-alt-text',
        severity: 'critical',
        category: 'Images',
        description: 'Missing alt text on images',
        suggestion: 'Add descriptive alt text to all img elements'
      });
    }

    // Check for form labels
    if (content.includes('<input') && !content.includes('htmlFor')) {
      issues.push({
        id: 'no-form-labels',
        severity: 'serious',
        category: 'Forms',
        description: 'Form inputs missing labels',
        suggestion: 'Use htmlFor on labels to associate with form inputs'
      });
    }

    // Check for ARIA labels
    if (content.includes('role=') && !content.includes('aria-label')) {
      issues.push({
        id: 'no-aria-label',
        severity: 'moderate',
        category: 'ARIA',
        description: 'ARIA role without accessible name',
        suggestion: 'Add aria-label or aria-labelledby to provide accessible name'
      });
    }

    // Check for heading structure
    const headingMatch = content.match(/<h(\d)/g);
    if (headingMatch) {
      const levels = headingMatch.map(h => parseInt(h[1]));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i-1] > 1) {
          issues.push({
            id: 'heading-skip',
            severity: 'moderate',
            category: 'Headings',
            description: 'Heading levels skipped',
            suggestion: 'Use heading levels in sequential order (h1, h2, h3...)'
          });
          break;
        }
      }
    }

    // Check for button content
    if (content.includes('<button') && !content.includes('aria-label') && content.includes('<button><')) {
      issues.push({
        id: 'empty-button',
        severity: 'serious',
        category: 'Buttons',
        description: 'Button may have no accessible name',
        suggestion: 'Add text content or aria-label to buttons'
      });
    }

    // Check for focus management
    if (content.includes('focus') || content.includes('onFocus')) {
      if (!content.includes('tabIndex')) {
        issues.push({
          id: 'no-tabindex',
          severity: 'minor',
          category: 'Focus',
          description: 'Focus management without tabIndex',
          suggestion: 'Consider adding tabIndex for custom focusable elements'
        });
      }
    }

    // Check for color contrast (basic heuristic)
    if (content.includes('#fff') || content.includes('#ffffff')) {
      // Check if paired with light colors
      const lightColors = ['#ffffff', '#f0f0f0', '#e0e0e0', '#cccccc'];
      lightColors.forEach(color => {
        if (content.includes(color) && content.includes('#fff')) {
          issues.push({
            id: 'low-contrast',
            severity: 'serious',
            category: 'Color',
            description: 'Potential low color contrast',
            suggestion: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text)'
          });
        }
      });
    }

    // Check for semantic HTML
    const semanticElements = ['<nav', '<main', '<header', '<footer', '<article', '<section'];
    const hasSemantic = semanticElements.some(el => content.includes(el));
    if (!hasSemantic && content.includes('<div')) {
      issues.push({
        id: 'no-semantic-html',
        severity: 'moderate',
        category: 'Semantic HTML',
        description: 'Using div elements instead of semantic HTML',
        suggestion: 'Use semantic HTML elements (nav, main, header, footer, etc.) for better accessibility'
      });
    }

    return issues;
  }

  calculateScore(issues) {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'serious':
          score -= 15;
          break;
        case 'moderate':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  getGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  generateRecommendations(issues) {
    const recommendations = [];

    if (issues.some(i => i.category === 'Images')) {
      recommendations.push({
        priority: 'high',
        action: 'Add alt text to all images',
        description: 'Provide descriptive alt text for screen reader users'
      });
    }

    if (issues.some(i => i.category === 'Forms')) {
      recommendations.push({
        priority: 'high',
        action: 'Associate labels with form inputs',
        description: 'Use htmlFor on labels to ensure form inputs are accessible'
      });
    }

    if (issues.some(i => i.category === 'Color')) {
      recommendations.push({
        priority: 'high',
        action: 'Improve color contrast',
        description: 'Ensure text meets WCAG AA contrast ratio of 4.5:1'
      });
    }

    if (issues.some(i => i.category === 'ARIA')) {
      recommendations.push({
        priority: 'medium',
        action: 'Add ARIA attributes',
        description: 'Provide accessible names and descriptions for interactive elements'
      });
    }

    if (issues.some(i => i.category === 'Semantic HTML')) {
      recommendations.push({
        priority: 'medium',
        action: 'Use semantic HTML',
        description: 'Replace divs with semantic elements where appropriate'
      });
    }

    if (issues.some(i => i.category === 'Headings')) {
      recommendations.push({
        priority: 'low',
        action: 'Fix heading structure',
        description: 'Use heading levels in sequential order'
      });
    }

    return recommendations;
  }

  displayResults(report) {
    const gradeColor = report.grade === 'A' ? '🟢' : 
                      report.grade === 'B' ? '🟡' : 
                      report.grade === 'C' ? '🟠' : '🔴';

    console.log(`${gradeColor} Accessibility Score: ${report.score}/100 (Grade: ${report.grade})`);
    console.log('');
    
    if (report.issues.length === 0) {
      console.log('✅ No accessibility issues found!');
    } else {
      console.log(`⚠️  Found ${report.issues.length} issue(s):`);
      console.log('');
      
      report.issues.forEach(issue => {
        const severityIcon = issue.severity === 'critical' ? '🔴' :
                           issue.severity === 'serious' ? '🟠' :
                           issue.severity === 'moderate' ? '🟡' : '⚪';
        
        console.log(`${severityIcon} [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`   Category: ${issue.category}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
        console.log('');
      });
    }

    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach(rec => {
        const priorityIcon = rec.priority === 'high' ? '🔴' :
                           rec.priority === 'medium' ? '🟡' : '⚪';
        console.log(`${priorityIcon} [${rec.priority.toUpperCase()}] ${rec.action}`);
        console.log(`   ${rec.description}`);
      });
    }
  }

  async saveReport(report) {
    const reports = await this.loadReports();
    reports[report.componentName] = report;
    await fs.writeFile(this.reportsFile, JSON.stringify(reports, null, 2));
  }

  async loadReports() {
    try {
      const content = await fs.readFile(this.reportsFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return {};
    }
  }

  async generateDashboard() {
    console.log('♿ Generating Accessibility Dashboard');
    console.log('');

    const reports = await this.loadReports();
    const components = Object.values(reports);

    if (components.length === 0) {
      console.log('⚠️  No accessibility reports found. Run a11y-check first.');
      return;
    }

    const avgScore = components.reduce((sum, comp) => sum + comp.score, 0) / components.length;
    const criticalIssues = components.flatMap(comp => comp.issues.filter(i => i.severity === 'critical'));
    const seriousIssues = components.flatMap(comp => comp.issues.filter(i => i.severity === 'serious'));

    console.log('📊 Accessibility Dashboard');
    console.log('');
    console.log(`Components Analyzed: ${components.length}`);
    console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
    console.log(`Critical Issues: ${criticalIssues.length}`);
    console.log(`Serious Issues: ${seriousIssues.length}`);
    console.log('');

    console.log('Component Scores:');
    components
      .sort((a, b) => a.score - b.score)
      .forEach(comp => {
        const gradeColor = comp.grade === 'A' ? '🟢' : 
                          comp.grade === 'B' ? '🟡' : 
                          comp.grade === 'C' ? '🟠' : '🔴';
        console.log(`  ${gradeColor} ${comp.componentName}: ${comp.score}/100 (${comp.grade}) - ${comp.issues.length} issues`);
      });

    console.log('');
    console.log('Common Issues:');
    const issueCategories = {};
    components.forEach(comp => {
      comp.issues.forEach(issue => {
        if (!issueCategories[issue.category]) {
          issueCategories[issue.category] = 0;
        }
        issueCategories[issue.category]++;
      });
    });

    Object.entries(issueCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  - ${category}: ${count}`);
      });
  }
}

module.exports = AccessibilityDashboard;