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

  describe('Vue Component Generation', () => {
    it('should generate Vue component with Tailwind styling', () => {
      const generator = new ComponentGenerator({
        framework: 'vue',
        styling: 'tailwind'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateVueComponent('Button', mockData);

      expect(result.component).toContain('<script setup>');
      expect(result.component).toContain('<template>');
      expect(result.component).toContain('defineProps');
      expect(result.component).toContain('<slot />');
    });

    it('should generate Vue component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'vue',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateVueComponent('Button', mockData);

      expect(result.component).toContain('<script setup>');
      expect(result.component).toContain('<template>');
      expect(result.styles).toBeTruthy();
      expect(result.styles).toContain('.button');
    });
  });

  describe('Svelte Component Generation', () => {
    it('should generate Svelte component with Tailwind styling', () => {
      const generator = new ComponentGenerator({
        framework: 'svelte',
        styling: 'tailwind'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateSvelteComponent('Button', mockData);

      expect(result.component).toContain('<script>');
      expect(result.component).toContain('export let variant');
      expect(result.component).toContain('<slot />');
      expect(result.component).toContain('on:click');
    });

    it('should generate Svelte component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'svelte',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateSvelteComponent('Button', mockData);

      expect(result.component).toContain('<script>');
      expect(result.component).toContain('export let variant');
      expect(result.styles).toBeTruthy();
      expect(result.styles).toContain('.button');
    });
  });

  describe('Component Type Detection', () => {
    it('should detect input component', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('TextInput', mockData)).toBe('input');
      expect(generator.detectComponentType('EmailInput', mockData)).toBe('input');
      expect(generator.detectComponentType('TextField', mockData)).toBe('input');
    });

    it('should detect card component', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('Card', mockData)).toBe('card');
      expect(generator.detectComponentType('ProductCard', mockData)).toBe('card');
    });

    it('should detect modal component', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('Modal', mockData)).toBe('modal');
      expect(generator.detectComponentType('Dialog', mockData)).toBe('modal');
      expect(generator.detectComponentType('Popup', mockData)).toBe('modal');
    });

    it('should detect navigation component', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('Navbar', mockData)).toBe('navigation');
      expect(generator.detectComponentType('Navigation', mockData)).toBe('navigation');
      expect(generator.detectComponentType('Menu', mockData)).toBe('navigation');
    });

    it('should detect button component', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('Button', mockData)).toBe('button');
      expect(generator.detectComponentType('PrimaryButton', mockData)).toBe('button');
    });

    it('should default to button for unknown component types', () => {
      const generator = new ComponentGenerator({});
      const mockData = {};

      expect(generator.detectComponentType('UnknownComponent', mockData)).toBe('button');
    });
  });

  describe('Input Component Generation', () => {
    it('should generate input component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 400 },
        borderRadius: 8,
        strokes: [{ color: '#D1D5DB' }],
        strokeWeight: 1
      };

      const result = generator.generateInputComponent('TextInput', mockData);

      expect(result.component).toContain('export const TextInput');
      expect(result.component).toContain('type={type}');
      expect(result.component).toContain('aria-label');
      expect(result.component).toContain('aria-invalid');
      expect(result.styles).toContain('.text-input');
      expect(result.styles).toContain('focus-visible');
    });

    it('should generate input component with error state', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 400 },
        borderRadius: 8
      };

      const result = generator.generateInputComponent('TextInput', mockData);

      expect(result.component).toContain('error = false');
      expect(result.styles).toContain('.text-input--error');
    });
  });

  describe('Card Component Generation', () => {
    it('should generate card component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#FFFFFF' }],
        borderRadius: 12,
        paddingTop: 16,
        effects: [{ type: 'drop-shadow', offset: { x: 0, y: 1 }, radius: 3, color: 'rgba(0, 0, 0, 0.1)' }]
      };

      const result = generator.generateCardComponent('Card', mockData);

      expect(result.component).toContain('export const Card');
      expect(result.component).toContain('title');
      expect(result.component).toContain('subtitle');
      expect(result.component).toContain('hoverable = false');
      expect(result.styles).toContain('.card');
      expect(result.styles).toContain('.card__header');
      expect(result.styles).toContain('.card__title');
    });
  });

  describe('Modal Component Generation', () => {
    it('should generate modal component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {};

      const result = generator.generateModalComponent('Modal', mockData);

      expect(result.component).toContain('export const Modal');
      expect(result.component).toContain('isOpen');
      expect(result.component).toContain('onClose');
      expect(result.component).toContain('useEffect');
      expect(result.component).toContain('role="dialog"');
      expect(result.component).toContain('aria-modal="true"');
      expect(result.styles).toContain('.modal');
      expect(result.styles).toContain('.modal__overlay');
      expect(result.styles).toContain('.modal__container');
    });

    it('should generate modal with escape key handling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {};

      const result = generator.generateModalComponent('Modal', mockData);

      expect(result.component).toContain('handleEscapeKey');
      expect(result.component).toContain('e.key === \'Escape\'');
    });
  });

  describe('Navigation Component Generation', () => {
    it('should generate navigation component with CSS styling', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#FFFFFF' }],
        typography: { fontSize: 16 }
      };

      const result = generator.generateNavigationComponent('Navbar', mockData);

      expect(result.component).toContain('export const Navbar');
      expect(result.component).toContain('logo');
      expect(result.component).toContain('links');
      expect(result.component).toContain('aria-label');
      expect(result.styles).toContain('.navbar');
      expect(result.styles).toContain('.navbar__links');
      expect(result.styles).toContain('.navbar__logo');
    });

    it('should generate navigation with mobile responsive styles', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css'
      });

      const mockData = {
        fills: [{ color: '#FFFFFF' }]
      };

      const result = generator.generateNavigationComponent('Navbar', mockData);

      expect(result.styles).toContain('@media (max-width: 768px)');
      expect(result.styles).toContain('.navbar__mobile-toggle');
    });
  });

  describe('CSS Modules Component Generation', () => {
    it('should generate CSS Modules component', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'css-modules'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateCSSModulesComponent('Button', mockData);

      expect(result.component).toContain('import styles from');
      expect(result.component).toContain('.module.css');
      expect(result.component).toContain('styles.button');
      expect(result.styles).toContain('.button');
      expect(result.styles).toContain('--primary');
    });
  });

  describe('Stylus Component Generation', () => {
    it('should generate Stylus component', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'stylus'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateStylusComponent('Button', mockData);

      expect(result.component).toContain('.styl');
      expect(result.styles).toContain('.button');
      expect(result.styles).toContain('&:focus');
      expect(result.styles).toContain('&--primary');
    });
  });

  describe('Less Component Generation', () => {
    it('should generate Less component', () => {
      const generator = new ComponentGenerator({
        framework: 'react',
        styling: 'less'
      });

      const mockData = {
        fills: [{ color: '#3B82F6' }],
        typography: { fontSize: 16, fontWeight: 600 },
        borderRadius: 8
      };

      const result = generator.generateLessComponent('Button', mockData);

      expect(result.component).toContain('.less');
      expect(result.styles).toContain('@primary-color:');
      expect(result.styles).toContain('&:focus');
      expect(result.styles).toContain('&--primary');
    });
  });
});