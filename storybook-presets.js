const chalk = require('chalk');

class StorybookPresets {
  constructor() {
    this.presets = {
      'react-vite': this.getReactVitePreset(),
      'react-webpack': this.getReactWebpackPreset(),
      'nextjs': this.getNextJSPreset(),
      'cra': this.getCRAPreset(),
      'vue-vite': this.getVueVitePreset(),
      'svelte-vite': this.getSvelteVitePreset(),
      'minimal': this.getMinimalPreset(),
      'full': this.getFullPreset()
    };
  }

  getReactVitePreset() {
    return {
      name: 'React + Vite',
      description: 'Modern React setup with Vite',
      framework: '@storybook/react-vite',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/react-vite': '^7.0.0',
        '@storybook/testing-library': '^0.0.14',
        'storybook': '^7.0.0'
      },
      mainConfig: `/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [],
            rehypePlugins: []
          }
        }
      }
    }
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  }
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/react').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/index.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'iPhone 12',
          styles: {
            width: '390px',
            height: '844px'
          }
        },
        mobile2: {
          name: 'iPhone 12 Pro Max',
          styles: {
            width: '428px',
            height: '926px'
          }
        },
        tablet: {
          name: 'iPad',
          styles: {
            width: '768px',
            height: '1024px'
          }
        }
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getReactWebpackPreset() {
    return {
      name: 'React + Webpack',
      description: 'Traditional React setup with Webpack',
      framework: '@storybook/react-webpack',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/react-webpack': '^7.0.0',
        '@storybook/testing-library': '^0.0.14',
        'storybook': '^7.0.0',
        'webpack': '^5.0.0'
      },
      mainConfig: `/** @type { import('@storybook/react-webpack').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-webpack',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  webpackFinal: async (config) => {
    // Add your custom webpack config here
    return config;
  }
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/react').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getNextJSPreset() {
    return {
      name: 'Next.js',
      description: 'Optimized for Next.js projects',
      framework: '@storybook/nextjs',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/nextjs': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/testing-library': '^0.0.14',
        'storybook': '^7.0.0'
      },
      mainConfig: `/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../app/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  }
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/nextjs').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/globals.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    nextjs: {
      appDirectory: './app',
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getCRAPreset() {
    return {
      name: 'Create React App',
      description: 'For projects created with CRA',
      framework: '@storybook/react-webpack',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/react-webpack': '^7.0.0',
        '@storybook/testing-library': '^0.0.14',
        'storybook': '^7.0.0',
        'webpack': '^5.0.0'
      },
      mainConfig: `/** @type { import('@storybook/react-webpack').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-webpack',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/react').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getVueVitePreset() {
    return {
      name: 'Vue + Vite',
      description: 'Modern Vue setup with Vite',
      framework: '@storybook/vue3-vite',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/vue3': '^7.0.0',
        '@storybook/vue3-vite': '^7.0.0',
        'storybook': '^7.0.0'
      },
      mainConfig: `/** @type { import('@storybook/vue3-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)',
    '../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/vue3').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getSvelteVitePreset() {
    return {
      name: 'Svelte + Vite',
      description: 'Modern Svelte setup with Vite',
      framework: '@storybook/svelte-vite',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/svelte': '^7.0.0',
        '@storybook/svelte-vite': '^7.0.0',
        'storybook': '^7.0.0'
      },
      mainConfig: `/** @type { import('@storybook/svelte-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)',
    '../src/lib/**/*.stories.@(js|jsx|mjs|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/svelte-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/svelte').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
  ],
};

export default preview;`
    };
  }

  getMinimalPreset() {
    return {
      name: 'Minimal',
      description: 'Basic setup with essential addons only',
      framework: '@storybook/react-vite',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/react-vite': '^7.0.0',
        'storybook': '^7.0.0'
      },
      mainConfig: `/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;`
    };
  }

  getFullPreset() {
    return {
      name: 'Full Professional',
      description: 'Complete setup with all professional features',
      framework: '@storybook/react-vite',
      dependencies: {
        '@storybook/addon-essentials': '^7.0.0',
        '@storybook/addon-interactions': '^7.0.0',
        '@storybook/addon-links': '^7.0.0',
        '@storybook/addon-a11y': '^7.0.0',
        '@storybook/addon-themes': '^7.0.0',
        '@storybook/addon-viewport': '^7.0.0',
        '@storybook/addon-docs': '^7.0.0',
        '@storybook/addon-storysource': '^7.0.0',
        '@storybook/addon-measure': '^7.0.0',
        '@storybook/addon-outline': '^7.0.0',
        '@storybook/addon-designs': '^7.0.0',
        '@storybook/blocks': '^7.0.0',
        '@storybook/react': '^7.0.0',
        '@storybook/react-vite': '^7.0.0',
        '@storybook/testing-library': '^0.0.14',
        'storybook': '^7.0.0',
        'storybook-dark-mode': '^3.0.0'
      },
      mainConfig: `/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/components/**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-docs',
    '@storybook/addon-storysource',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    '@storybook/addon-designs',
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [],
            rehypePlugins: []
          }
        }
      }
    }
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  typescript: {
    check: false,
    checkOptions: {},
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true)
    }
  }
};
export default config;`,
      previewConfig: `/** @type { import('@storybook/react').Preview } */
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { withDesign } from 'storybook-addon-designs';
import '../src/index.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true
          }
        ]
      }
    },
    viewport: {
      viewports: {
        mobile1: {
          name: 'iPhone 12',
          styles: {
            width: '390px',
            height: '844px'
          }
        },
        mobile2: {
          name: 'iPhone 12 Pro Max',
          styles: {
            width: '428px',
            height: '926px'
          }
        },
        tablet: {
          name: 'iPad',
          styles: {
            width: '768px',
            height: '1024px'
          }
        }
      }
    },
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/xxxxx'
    }
  },
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-mode',
    }),
    withDesign,
  ],
};

export default preview;`
    };
  }

  getPreset(name) {
    return this.presets[name] || this.presets['react-vite'];
  }

  listPresets() {
    console.log(chalk.blue('Available Storybook Presets:'));
    console.log('');
    
    Object.entries(this.presets).forEach(([key, preset]) => {
      console.log(chalk.cyan(`  ${key}`));
      console.log(chalk.gray(`    ${preset.description}`));
      console.log('');
    });
  }
}

module.exports = StorybookPresets;