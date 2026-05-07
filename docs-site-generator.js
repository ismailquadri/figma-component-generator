#!/usr/bin/env node

/**
 * Automated Design System Documentation Site Generator
 * Generates a static documentation site for design systems with component catalog,
 * token reference, usage guidelines, and interactive examples.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DocsSiteGenerator {
  constructor(options = {}) {
    this.directory = options.directory || process.cwd();
    this.theme = options.theme || 'light';
    this.title = options.title || 'Design System';
    this.description = options.description || 'Component library and design tokens';
    this.outputDir = path.join(this.directory, 'docs-site');
  }

  async init() {
    console.log('🚀 Initializing Design System Documentation Site...');
    console.log(`📁 Directory: ${this.directory}`);
    console.log(`🎨 Theme: ${this.theme}`);

    await this.createDirectoryStructure();
    await this.createPackageJson();
    await this.createNextConfig();
    await this.createPages();
    await this.createComponents();
    await this.createStyles();
    await this.createContentStructure();
    await this.installDependencies();

    console.log('✅ Documentation site initialized successfully!');
    console.log(`\n📝 Next steps:`);
    console.log(`   cd ${this.outputDir}`);
    console.log(`   npm run dev`);
    console.log(`   npm run build`);
    console.log(`   npm run export`);
  }

  async createDirectoryStructure() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'pages'),
      path.join(this.outputDir, 'pages', 'components'),
      path.join(this.outputDir, 'pages', 'tokens'),
      path.join(this.outputDir, 'pages', 'guidelines'),
      path.join(this.outputDir, 'components'),
      path.join(this.outputDir, 'components', 'layout'),
      path.join(this.outputDir, 'components', 'docs'),
      path.join(this.outputDir, 'styles'),
      path.join(this.outputDir, 'content'),
      path.join(this.outputDir, 'content', 'components'),
      path.join(this.outputDir, 'content', 'tokens'),
      path.join(this.outputDir, 'content', 'guidelines'),
      path.join(this.outputDir, 'public'),
      path.join(this.outputDir, 'lib'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createPackageJson() {
    const packageJson = {
      name: 'design-system-docs',
      version: '1.0.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        export: 'next build && next export',
        lint: 'next lint',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-markdown': '^9.0.0',
        'remark-gfm': '^4.0.0',
        'remark-prism': '^1.3.6',
        'rehype-slug': '^6.0.0',
        'rehype-autolink-headings': '^7.0.0',
        fuse: '^7.0.0',
        'lucide-react': '^0.294.0',
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        eslint: '^8.0.0',
        'eslint-config-next': '^14.0.0',
        typescript: '^5.0.0',
      },
    };

    await fs.writeFile(
      path.join(this.outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  async createNextConfig() {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
`;

    await fs.writeFile(path.join(this.outputDir, 'next.config.js'), nextConfig);

    const tsConfig = {
      compilerOptions: {
        target: 'es5',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [
          {
            name: 'next',
          },
        ],
        paths: {
          '@/*': ['./*'],
        },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules'],
    };

    await fs.writeFile(
      path.join(this.outputDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  async createPages() {
    // _app.tsx
    const appTs = `import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
`;

    await fs.writeFile(path.join(this.outputDir, 'pages', '_app.tsx'), appTs);

    // _document.tsx
    const documentTs = `import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
`;

    await fs.writeFile(path.join(this.outputDir, 'pages', '_document.tsx'), documentTs);

    // index.tsx
    const indexTs = `import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, BookOpen, Layers, Palette } from 'lucide-react';

export default function Home() {
  return (
    <>
      <Head>
        <title>${this.title}</title>
        <meta name="description" content="${this.description}" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              ${this.title}
            </h1>
            <nav className="flex gap-6">
              <Link href="/components" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition">
                Components
              </Link>
              <Link href="/tokens" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition">
                Tokens
              </Link>
              <Link href="/guidelines" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition">
                Guidelines
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              Build Consistent UIs
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              ${this.description}. Explore our component library, design tokens, and best practices.
            </p>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Link href="/components" className="group bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Components
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Explore our library of reusable UI components
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                Browse components <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/tokens" className="group bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Design Tokens
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Colors, typography, spacing, and more
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 group-hover:gap-2 transition-all">
                View tokens <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>

            <Link href="/guidelines" className="group bg-white dark:bg-slate-800 rounded-lg p-8 shadow-lg hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Guidelines
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Best practices and usage patterns
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 group-hover:gap-2 transition-all">
                Read guidelines <ArrowRight className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
`;

    await fs.writeFile(path.join(this.outputDir, 'pages', 'index.tsx'), indexTs);

    // components/index.tsx
    const componentsIndex = `import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function ComponentsIndex() {
  return (
    <>
      <Head>
        <title>Components - ${this.title}</title>
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Components
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search components..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Component Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Components will be dynamically generated here */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Button
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                Interactive button with variants and states
              </p>
              <Link href="/components/button" className="text-blue-600 dark:text-blue-400 hover:underline">
                View documentation →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'pages', 'components', 'index.tsx'),
      componentsIndex
    );

    // tokens/index.tsx
    const tokensIndex = `import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TokensIndex() {
  return (
    <>
      <Head>
        <title>Design Tokens - ${this.title}</title>
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Design Tokens
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Colors
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Color palette for UI elements
              </p>
              <Link href="/tokens/colors" className="text-blue-600 dark:text-blue-400 hover:underline">
                View colors →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Typography
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Font sizes, weights, and line heights
              </p>
              <Link href="/tokens/typography" className="text-blue-600 dark:text-blue-400 hover:underline">
                View typography →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Spacing
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Consistent spacing scale
              </p>
              <Link href="/tokens/spacing" className="text-blue-600 dark:text-blue-400 hover:underline">
                View spacing →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Shadows
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Elevation and depth tokens
              </p>
              <Link href="/tokens/shadows" className="text-blue-600 dark:text-blue-400 hover:underline">
                View shadows →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'pages', 'tokens', 'index.tsx'),
      tokensIndex
    );

    // guidelines/index.tsx
    const guidelinesIndex = `import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GuidelinesIndex() {
  return (
    <>
      <Head>
        <title>Guidelines - ${this.title}</title>
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Guidelines
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Getting Started
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Quick start guide for using the design system
              </p>
              <Link href="/guidelines/getting-started" className="text-blue-600 dark:text-blue-400 hover:underline">
                Read more →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Accessibility
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                WCAG compliance and best practices
              </p>
              <Link href="/guidelines/accessibility" className="text-blue-600 dark:text-blue-400 hover:underline">
                Read more →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Responsive Design
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Mobile-first approach and breakpoints
              </p>
              <Link href="/guidelines/responsive" className="text-blue-600 dark:text-blue-400 hover:underline">
                Read more →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'pages', 'guidelines', 'index.tsx'),
      guidelinesIndex
    );
  }

  async createComponents() {
    // Layout components
    const headerTsx = `import Link from 'next/link';

interface HeaderProps {
  currentPath?: string;
}

export default function Header({ currentPath }: HeaderProps) {
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/components', label: 'Components' },
    { href: '/tokens', label: 'Tokens' },
    { href: '/guidelines', label: 'Guidelines' },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          ${this.title}
        </Link>
        <nav className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={\`text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition \${
                currentPath === item.href ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
              }\`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'components', 'layout', 'Header.tsx'),
      headerTsx
    );

    // Docs components
    const codeBlockTsx = `interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  return (
    <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
      <pre className="text-sm text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'components', 'docs', 'CodeBlock.tsx'),
      codeBlockTsx
    );

    const propTableTsx = `interface Prop {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

interface PropTableProps {
  props: Prop[];
}

export default function PropTable({ props }: PropTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Prop</th>
            <th className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Type</th>
            <th className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Default</th>
            <th className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((prop) => (
            <tr key={prop.name} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-3 px-4">
                <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {prop.name}
                  {prop.required && <span className="text-red-500 ml-1">*</span>}
                </code>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                <code>{prop.type}</code>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {prop.default || '-'}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {prop.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'components', 'docs', 'PropTable.tsx'),
      propTableTsx
    );
  }

  async createStyles() {
    const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 15, 23, 42;
  --background-start-rgb: 248, 250, 252;
  --background-end-rgb: 241, 245, 249;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 241, 245, 249;
    --background-start-rgb: 15, 23, 42;
    --background-end-rgb: 30, 41, 59;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'styles', 'globals.css'),
      globalsCss
    );

    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
`;

    await fs.writeFile(
      path.join(this.outputDir, 'tailwind.config.js'),
      tailwindConfig
    );

    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

    await fs.writeFile(
      path.join(this.outputDir, 'postcss.config.js'),
      postcssConfig
    );
  }

  async createContentStructure() {
    // Sample component documentation
    const buttonDoc = `# Button

Buttons are interactive elements that allow users to perform actions.

## Usage

\`\`\`tsx
import { Button } from '@/components/Button';

<Button variant="primary">Click me</Button>
\`\`\`

## Variants

- **primary**: Main action button
- **secondary**: Secondary action button
- **outline**: Outlined button
- **ghost**: Minimal button

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| children | ReactNode | - | Yes | Button content |
| variant | 'primary' \| 'secondary' \| 'outline' \| 'ghost' | 'primary' | No | Button style variant |
| size | 'sm' \| 'md' \| 'lg' | 'md' | No | Button size |
| disabled | boolean | false | No | Disable the button |
| onClick | () => void | - | No | Click handler |

## Accessibility

Buttons should have clear, descriptive text. Avoid using "Click here" or similar vague labels.
`;

    await fs.writeFile(
      path.join(this.outputDir, 'content', 'components', 'button.md'),
      buttonDoc
    );

    // Sample token documentation
    const colorsDoc = `# Color Tokens

Our color system provides a consistent palette for UI elements.

## Primary Colors

- **Blue 500**: #3b82f6 - Primary actions
- **Blue 600**: #2563eb - Primary hover
- **Blue 700**: #1d4ed8 - Primary active

## Neutral Colors

- **Slate 50**: #f8fafc - Background light
- **Slate 900**: #0f172a - Background dark
- **Slate 500**: #64748b - Text secondary

## Semantic Colors

- **Green 500**: #22c55e - Success
- **Red 500**: #ef4444 - Error
- **Yellow 500**: #eab308 - Warning

## Usage

\`\`\`css
.button-primary {
  background-color: var(--color-blue-500);
  color: var(--color-white);
}
\`\`\`
`;

    await fs.writeFile(
      path.join(this.outputDir, 'content', 'tokens', 'colors.md'),
      colorsDoc
    );

    // Sample guideline
    const gettingStartedDoc = `# Getting Started

This guide will help you get started with our design system.

## Installation

\`\`\`bash
npm install @your-org/design-system
\`\`\`

## Setup

Import the CSS in your application:

\`\`\`tsx
import '@your-org/design-system/styles.css';
\`\`\`

## Using Components

\`\`\`tsx
import { Button, Card } from '@your-org/design-system';

function App() {
  return (
    <Card>
      <Button variant="primary">Get Started</Button>
    </Card>
  );
}
\`\`\`

## Next Steps

- Explore the [Components](/components) section
- Learn about [Design Tokens](/tokens)
- Read our [Accessibility Guidelines](/guidelines/accessibility)
`;

    await fs.writeFile(
      path.join(this.outputDir, 'content', 'guidelines', 'getting-started.md'),
      gettingStartedDoc
    );
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    const originalDir = process.cwd();
    process.chdir(this.outputDir);

    try {
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm install -D tailwindcss autoprefixer', { stdio: 'inherit' });
      execSync('npx tailwindcss init -p', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  Dependency installation failed. You may need to run npm install manually.');
    } finally {
      process.chdir(originalDir);
    }
  }

  async generateComponentDocs(components) {
    // Generate documentation pages for each component
    for (const component of components) {
      const componentPage = `import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/docs/CodeBlock';
import PropTable from '@/components/docs/PropTable';

export default function ${component.name}Page() {
  const props = ${JSON.stringify(component.props || [])};

  return (
    <>
      <Head>
        <title>${component.name} - ${this.title}</title>
      </Head>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/components" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Components
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              ${component.name}
            </h1>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Description
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  ${component.description || 'No description available.'}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Example
                </h2>
                <CodeBlock code="${component.example || '// Example code'}" />
              </div>

              {props.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                  <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                    Props
                  </h2>
                  <PropTable props={props} />
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 sticky top-24">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  On this page
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#description" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      Description
                    </a>
                  </li>
                  <li>
                    <a href="#example" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                      Example
                    </a>
                  </li>
                  {props.length > 0 && (
                    <li>
                      <a href="#props" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                        Props
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
`;

      await fs.writeFile(
        path.join(this.outputDir, 'pages', 'components', `${component.name.toLowerCase()}.tsx`),
        componentPage
      );
    }
  }
}

module.exports = DocsSiteGenerator;