const DesignTokenExporter = require('../token-exporter');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

describe('DesignTokenExporter', () => {
  const testOutputDir = path.join(os.tmpdir(), 'token-exporter-test');
  const mockTokens = {
    colors: {
      primary: '#476cff',
      secondary: '#f5576c',
      'text-primary': '#1a1a1a'
    },
    typography: {
      'body-regular': {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.6
      }
    },
    spacing: {
      1: '4px',
      2: '8px',
      4: '16px'
    },
    borderRadius: {
      sm: '4px',
      md: '8px'
    },
    effects: {
      'shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)'
    }
  };

  beforeEach(async () => {
    await fs.ensureDir(testOutputDir);
  });

  afterEach(async () => {
    await fs.remove(testOutputDir);
  });

  describe('constructor', () => {
    it('should initialize with tokens', () => {
      const exporter = new DesignTokenExporter(mockTokens);

      expect(exporter.tokens).toEqual(mockTokens);
    });
  });

  describe('exportJSON', () => {
    it('should export tokens as JSON', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.json');

      await exporter.exportJSON(outputPath);

      expect(await fs.pathExists(outputPath)).toBe(true);
      const exportedTokens = await fs.readJson(outputPath);
      expect(exportedTokens).toEqual(mockTokens);
    });
  });

  describe('exportCSSVariables', () => {
    it('should export tokens as CSS variables', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.css');

      await exporter.exportCSSVariables(outputPath);

      expect(await fs.pathExists(outputPath)).toBe(true);
      const cssContent = await fs.readFile(outputPath, 'utf-8');

      expect(cssContent).toContain(':root');
      expect(cssContent).toContain('--color-primary: #476cff');
      expect(cssContent).toContain('--color-secondary: #f5576c');
      expect(cssContent).toContain('--spacing-1: 4px');
      expect(cssContent).toContain('--radius-sm: 4px');
    });

    it('should handle typography tokens correctly', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.css');

      await exporter.exportCSSVariables(outputPath);
      const cssContent = await fs.readFile(outputPath, 'utf-8');

      expect(cssContent).toContain('--font-body-regular: Inter');
      expect(cssContent).toContain('--font-body-regular-weight: 400');
      expect(cssContent).toContain('--font-body-regular-size: 16px');
    });
  });

  describe('exportSCSS', () => {
    it('should export tokens as SCSS variables', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.scss');

      await exporter.exportSCSS(outputPath);

      expect(await fs.pathExists(outputPath)).toBe(true);
      const scssContent = await fs.readFile(outputPath, 'utf-8');

      expect(scssContent).toContain('$color-primary: #476cff');
      expect(scssContent).toContain('$spacing-1: 4px');
      expect(scssContent).toContain('$radius-sm: 4px');
    });
  });

  describe('exportJavaScript', () => {
    it('should export tokens as JavaScript module', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.js');

      await exporter.exportJavaScript(outputPath);

      expect(await fs.pathExists(outputPath)).toBe(true);
      const jsContent = await fs.readFile(outputPath, 'utf-8');

      expect(jsContent).toContain('export const');
      expect(jsContent).toContain('export default');
      expect(jsContent).toContain('#476cff');
    });
  });

  describe('exportTypeScript', () => {
    it('should export tokens as TypeScript module', async () => {
      const exporter = new DesignTokenExporter(mockTokens);
      const outputPath = path.join(testOutputDir, 'tokens.ts');

      await exporter.exportTypeScript(outputPath);

      expect(await fs.pathExists(outputPath)).toBe(true);
      const tsContent = await fs.readFile(outputPath, 'utf-8');

      expect(tsContent).toContain('export const');
      expect(tsContent).toContain('interface');
      expect(tsContent).toContain('#476cff');
    });
  });
});