#!/usr/bin/env node

/**
 * Embeddable Component Examples
 * Generates embeddable iframe examples with CodeSandbox and StackBlitz integration.
 */

const fs = require('fs').promises;
const path = require('path');

class EmbeddableExamples {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.outputDir = options.outputDir || path.join(this.projectDir, 'examples');
    this.platform = options.platform || 'iframe';
  }

  async init() {
    console.log('🎬 Initializing Embeddable Examples...');
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log(`📁 Output: ${this.outputDir}`);
    console.log('');

    await this.createDirectoryStructure();
    await this.createEmbedScript();

    console.log('✅ Embeddable examples initialized successfully!');
    console.log('\n📝 Next steps:');
    console.log('   Run: generate-component embed-example --component <name> --platform <iframe|codesandbox|stackblitz>');
  }

  async createDirectoryStructure() {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'iframe'),
      path.join(this.outputDir, 'codesandbox'),
      path.join(this.outputDir, 'stackblitz'),
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async createEmbedScript() {
    const embedScript = `// Embeddable Component Example Script
// Copy this script to embed component examples in your website

class ComponentEmbed {
  constructor(options = {}) {
    this.componentName = options.componentName;
    this.platform = options.platform || 'iframe';
    this.container = options.container || document.body;
    this.width = options.width || '100%';
    this.height = options.height || '400px';
    this.theme = options.theme || 'light';
    this.props = options.props || {};
  }

  async embed() {
    const embedCode = await this.generateEmbedCode();
    const container = typeof this.container === 'string' 
      ? document.querySelector(this.container) 
      : this.container;
    
    if (!container) {
      throw new Error('Container not found');
    }

    container.innerHTML = embedCode;
    
    if (this.platform === 'iframe') {
      this.setupIframeResize();
    }
  }

  async generateEmbedCode() {
    switch (this.platform) {
      case 'codesandbox':
        return this.generateCodeSandboxEmbed();
      case 'stackblitz':
        return this.generateStackBlitzEmbed();
      case 'iframe':
      default:
        return this.generateIframeEmbed();
    }
  }

  generateIframeEmbed() {
    const propsEncoded = encodeURIComponent(JSON.stringify(this.props));
    const src = \`\${window.location.origin}/examples/iframe/\${this.componentName}.html?props=\${propsEncoded}&theme=\${this.theme}\`;
    
    return \`
      <iframe
        src="\${src}"
        width="\${this.width}"
        height="\${this.height}"
        frameborder="0"
        allowfullscreen
        class="component-embed-iframe"
        data-component="\${this.componentName}"
      ></iframe>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.2/iframeResizer.min.js"><\/script>
      <script>
        iFrameResize({ log: false }, '.component-embed-iframe');
      <\/script>
    \`;
  }

  generateCodeSandboxEmbed() {
    const sandboxId = this.getSandboxId();
    return \`
      <iframe
        src="https://codesandbox.io/embed/\${sandboxId}?fontsize=14&hidenavigation=1&theme=\${this.theme}"
        style="width: \${this.width}; height: \${this.height}; border:0; border-radius: 4px; overflow:hidden;"
        title="\${this.componentName} Example"
        allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      ></iframe>
    \`;
  }

  generateStackBlitzEmbed() {
    const projectId = this.getStackBlitzId();
    return \`
      <iframe
        src="https://stackblitz.com/edit/\${projectId}?embed=1&theme=\${this.theme}"
        style="width: \${this.width}; height: \${this.height}; border:0; border-radius: 4px; overflow:hidden;"
        title="\${this.componentName} Example"
      ></iframe>
    \`;
  }

  getSandboxId() {
    // In a real implementation, this would fetch the sandbox ID from an API
    return 'your-sandbox-id';
  }

  getStackBlitzId() {
    // In a real implementation, this would fetch the project ID from an API
    return 'your-project-id';
  }

  setupIframeResize() {
    if (typeof window !== 'undefined' && window.iFrameResize) {
      window.iFrameResize({ log: false }, '.component-embed-iframe');
    }
  }

  copyToClipboard() {
    const embedCode = this.generateEmbedCode();
    navigator.clipboard.writeText(embedCode).then(() => {
      console.log('Embed code copied to clipboard!');
    });
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentEmbed;
}
`;

    await fs.writeFile(
      path.join(this.outputDir, 'embed.js'),
      embedScript
    );
  }

  async generateExample(componentName, platform = 'iframe', props = {}) {
    console.log(`🎬 Generating Embeddable Example`);
    console.log(`Component: ${componentName}`);
    console.log(`Platform: ${platform}`);
    console.log('');

    switch (platform) {
      case 'codesandbox':
        await this.generateCodeSandboxExample(componentName, props);
        break;
      case 'stackblitz':
        await this.generateStackBlitzExample(componentName, props);
        break;
      case 'iframe':
      default:
        await this.generateIframeExample(componentName, props);
        break;
    }

    console.log(`✅ Example generated for ${platform}`);
  }

  async generateIframeExample(componentName, props) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName} Example</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    
    .example-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .component-wrapper {
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin-top: 20px;
    }
    
    .props-display {
      margin-top: 20px;
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    p {
      color: #666;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="example-container">
    <h1>${componentName} Example</h1>
    <p>This is an interactive example of the ${componentName} component.</p>
    
    <div class="component-wrapper">
      <div id="component-root"></div>
    </div>
    
    <div class="props-display">
      <strong>Props:</strong>
      <pre id="props-display">${JSON.stringify(props, null, 2)}</pre>
    </div>
  </div>

  <script>
    // Parse props from URL
    const urlParams = new URLSearchParams(window.location.search);
    const props = urlParams.get('props') ? JSON.parse(urlParams.get('props')) : ${JSON.stringify(props)};
    const theme = urlParams.get('theme') || 'light';
    
    // Update props display
    document.getElementById('props-display').textContent = JSON.stringify(props, null, 2);
    
    // Apply theme
    if (theme === 'dark') {
      document.body.style.background = '#1a1a1a';
      document.querySelector('.example-container').style.background = '#2d2d2d';
      document.querySelector('.example-container').style.color = '#fff';
      document.querySelector('h1').style.color = '#fff';
      document.querySelector('p').style.color = '#ccc';
    }
    
    // In a real implementation, this would mount the actual component
    document.getElementById('component-root').innerHTML = 
      '<div style="padding: 20px; text-align: center; color: #666;">' +
      '<p><strong>${componentName}</strong></p>' +
      '<p>Component would render here with the provided props</p>' +
      '</div>';
    
    // Send message to parent about load
    window.parent.postMessage({ type: 'component-loaded', component: '${componentName}' }, '*');
  </script>
</body>
</html>
`;

    const filePath = path.join(this.outputDir, 'iframe', `${componentName}.html`);
    await fs.writeFile(filePath, html);
    console.log(`✓ Iframe example: ${filePath}`);
  }

  async generateCodeSandboxExample(componentName, props) {
    const config = {
      template: 'create-react-app',
      files: {
        'public/index.html': {
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${componentName} Example</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`
        },
        'src/App.js': {
          content: `import React from 'react';
import './App.css';

function App() {
  const props = ${JSON.stringify(props, null, 2)};
  
  return (
    <div className="App">
      <h1>${componentName} Example</h1>
      <div className="component-wrapper">
        <p>Component would render here</p>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;`
        },
        'src/App.css': {
          content: `.App {
  text-align: center;
  padding: 20px;
}

.component-wrapper {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

pre {
  text-align: left;
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}`
        },
        'src/index.js': {
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
        },
        'src/index.css': {
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`
        },
        'package.json': {
          content: {
            name: `${componentName.toLowerCase()}-example`,
            version: '0.1.0',
            private: true,
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0',
              'react-scripts': '5.0.1'
            },
            scripts: {
              start: 'react-scripts start',
              build: 'react-scripts build',
              test: 'react-scripts test',
              eject: 'react-scripts eject'
            },
            eslintConfig: {
              extends: ['react-app']
            },
            browserslist: {
              production: ['>0.2%', 'not dead', 'not op_mini all'],
              development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
            }
          }
        }
      }
    };

    const configPath = path.join(this.outputDir, 'codesandbox', `${componentName}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ CodeSandbox config: ${configPath}`);
    console.log(`  Import this file into CodeSandbox to create the example`);
  }

  async generateStackBlitzExample(componentName, props) {
    const config = {
      title: `${componentName} Example`,
      description: `Interactive example of ${componentName} component`,
      template: 'react',
      files: {
        'src/App.jsx': {
          content: `import React from 'react';
import './style.css';

export default function App() {
  const props = ${JSON.stringify(props, null, 2)};
  
  return (
    <div className="container">
      <h1>${componentName} Example</h1>
      <div className="component-wrapper">
        <p>Component would render here</p>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    </div>
  );
}`
        },
        'src/style.css': {
          content: `.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.component-wrapper {
  margin-top: 20px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
}`
        },
        'src/main.jsx': {
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './style.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        },
        'index.html': {
          content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${componentName} Example</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
        },
        'package.json': {
          content: {
            name: `${componentName.toLowerCase()}-example`,
            version: '0.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              react: '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.0',
              '@types/react-dom': '^18.2.0',
              '@vitejs/plugin-react': '^4.0.0',
              vite: '^4.3.9'
            }
          }
        }
      }
    };

    const configPath = path.join(this.outputDir, 'stackblitz', `${componentName}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✓ StackBlitz config: ${configPath}`);
    console.log(`  Import this file into StackBlitz to create the example`);
  }

  async generateEmbedCode(componentName, platform = 'iframe', props = {}) {
    const embed = new ComponentEmbed({
      componentName,
      platform,
      props
    });

    return await embed.generateEmbedCode();
  }

  async generateShareableUrl(componentName, platform = 'iframe', props = {}) {
    const baseUrl = 'https://your-domain.com';
    const propsEncoded = encodeURIComponent(JSON.stringify(props));
    
    switch (platform) {
      case 'iframe':
        return `${baseUrl}/examples/iframe/${componentName}.html?props=${propsEncoded}`;
      case 'codesandbox':
        return `https://codesandbox.io/s/${componentName.toLowerCase()}-example`;
      case 'stackblitz':
        return `https://stackblitz.com/edit/${componentName.toLowerCase()}-example`;
      default:
        return `${baseUrl}/examples/iframe/${componentName}.html?props=${propsEncoded}`;
    }
  }
}

module.exports = EmbeddableExamples;