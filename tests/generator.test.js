const ComponentGenerator = require('../generator');

describe('ComponentGenerator', () => {
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const generator = new ComponentGenerator({});

      expect(generator.framework).toBe('react');
      expect(generator.styling).toBe('tailwind');
      expect(generator.includeStorybook).toBe(false);
      expect(generator.includeTypescript).toBe(false);
    });

    it('should initialize with custom options', () => {
      const generator = new ComponentGenerator({
        framework: 'vue',
        styling: 'css',
        includeStorybook: true,
        includeTypescript: true
      });

      expect(generator.framework).toBe('vue');
      expect(generator.styling).toBe('css');
      expect(generator.includeStorybook).toBe(true);
      expect(generator.includeTypescript).toBe(true);
    });
  });

  describe('generateReactComponent', () => {
    it('should generate React component with Tailwind styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'tailwind'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateReactComponent('Button', mockData);

      expect(result.component).toContain('export const Button');
      expect(result.component).toContain('React');
      expect(result.component).toContain('bg-');
      expect(result.component).toContain('text-');
    });

    it('should generate React component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateReactComponent('Button', mockData);

      expect(result.component).toContain('export const Button');
      expect(result.component).toContain('React');
      expect(result.styles).toBeTruthy();
      expect(result.styles).toContain('.button');
    });

    it('should generate Storybook story when requested', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css',
        includeStorybook: true
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateReactComponent('Button', mockData);

      expect(result.storybook).toContain('export default');
      expect(result.storybook).toContain('title:');
    });

    it('should generate TypeScript types when requested', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css',
        includeTypescript: true
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateReactComponent('Button', mockData);

      expect(result.types).toContain('export interface');
      expect(result.types).toContain('ButtonProps');
    });
  });

  describe('toPascalCase', () => {
    it('should convert string to PascalCase', () => {
      const generator = new ComponentGenerator({});

      expect(generator.toPascalCase('button')).toBe('Button');
      expect(generator.toPascalCase('my-button')).toBe('MyButton');
      expect(generator.toPascalCase('my_button')).toBe('MyButton');
      expect(generator.toPascalCase('my button')).toBe('MyButton');
    });
  });
});