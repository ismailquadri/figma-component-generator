const fs = require('fs-extra');
const path = require('path');

class DesignTokenExporter {
  constructor(tokens) {
    this.tokens = tokens;
  }

  exportJSON(outputPath) {
    return fs.writeJson(outputPath, this.tokens, { spaces: 2 });
  }

  exportCSSVariables(outputPath) {
    let css = ':root {\n';

    // Colors
    if (this.tokens.colors) {
      Object.entries(this.tokens.colors).forEach(([name, value]) => {
        css += `  --color-${name}: ${value};\n`;
      });
    }

    // Typography
    if (this.tokens.typography) {
      Object.entries(this.tokens.typography).forEach(([name, value]) => {
        // Remove 'font-' prefix if it already exists in the name
        const cleanName = name.replace(/^font-/, '');
        css += `  --font-${cleanName}: ${value.fontFamily};\n`;
        css += `  --font-${cleanName}-weight: ${value.fontWeight};\n`;
        css += `  --font-${cleanName}-size: ${value.fontSize}px;\n`;
        css += `  --font-${cleanName}-line-height: ${value.lineHeight};\n`;
      });
    }

    // Spacing
    if (this.tokens.spacing) {
      Object.entries(this.tokens.spacing).forEach(([name, value]) => {
        // Remove 'space-' prefix if it already exists in the name
        const cleanName = name.replace(/^space-/, '');
        css += `  --spacing-${cleanName}: ${value};\n`;
      });
    }

    // Border radius
    if (this.tokens.borderRadius) {
      Object.entries(this.tokens.borderRadius).forEach(([name, value]) => {
        // Remove 'radius-' prefix if it already exists in the name
        const cleanName = name.replace(/^radius-/, '');
        css += `  --radius-${cleanName}: ${value};\n`;
      });
    }

    // Effects (shadows)
    if (this.tokens.effects) {
      Object.entries(this.tokens.effects).forEach(([name, value]) => {
        css += `  --${name}: ${value};\n`;
      });
    }

    css += '}';

    return fs.writeFile(outputPath, css);
  }

  exportSCSS(outputPath) {
    let scss = '// Design Tokens\n\n';

    // Colors
    if (this.tokens.colors) {
      scss += '// Colors\n';
      Object.entries(this.tokens.colors).forEach(([name, value]) => {
        scss += `$color-${name}: ${value};\n`;
      });
      scss += '\n';
    }

    // Typography
    if (this.tokens.typography) {
      scss += '// Typography\n';
      Object.entries(this.tokens.typography).forEach(([name, value]) => {
        scss += `$font-${name}: '${value.fontFamily}';\n`;
        scss += `$font-${name}-weight: ${value.fontWeight};\n`;
        scss += `$font-${name}-size: ${value.fontSize}px;\n`;
        scss += `$font-${name}-line-height: ${value.lineHeight};\n`;
      });
      scss += '\n';
    }

    // Spacing
    if (this.tokens.spacing) {
      scss += '// Spacing\n';
      Object.entries(this.tokens.spacing).forEach(([name, value]) => {
        scss += `$spacing-${name}: ${value};\n`;
      });
      scss += '\n';
    }

    // Border radius
    if (this.tokens.borderRadius) {
      scss += '// Border Radius\n';
      Object.entries(this.tokens.borderRadius).forEach(([name, value]) => {
        scss += `$radius-${name}: ${value};\n`;
      });
      scss += '\n';
    }

    // Effects
    if (this.tokens.effects) {
      scss += '// Effects\n';
      Object.entries(this.tokens.effects).forEach(([name, value]) => {
        scss += `$${name}: ${value};\n`;
      });
      scss += '\n';
    }

    return fs.writeFile(outputPath, scss);
  }

  exportJavaScript(outputPath) {
    const js = `// Design Tokens
export const tokens = ${JSON.stringify(this.tokens, null, 2)};

export default tokens;
`;

    return fs.writeFile(outputPath, js);
  }

  exportTypeScript(outputPath) {
    const ts = `// Design Tokens
interface DesignTokens {
  colors?: Record<string, string>;
  typography?: Record<string, {
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    lineHeight: number;
    letterSpacing: number;
  }>;
  spacing?: Record<string, string>;
  effects?: Record<string, string>;
  borderRadius?: Record<string, string>;
}

export const tokens: DesignTokens = ${JSON.stringify(this.tokens, null, 2)};

export default tokens;
`;

    return fs.writeFile(outputPath, ts);
  }

  exportTailwind(outputPath) {
    let tailwind = `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
`;

    // Colors
    if (this.tokens.colors) {
      Object.entries(this.tokens.colors).forEach(([name, value]) => {
        tailwind += `        '${name}': '${value}',\n`;
      });
    }

    tailwind += `      },
      fontFamily: {
`;

    // Typography
    if (this.tokens.typography) {
      Object.entries(this.tokens.typography).forEach(([name, value]) => {
        tailwind += `        '${name}': ['${value.fontFamily}', { weight: value.fontWeight }],\n`;
      });
    }

    tailwind += `      },
      spacing: {
`;

    // Spacing
    if (this.tokens.spacing) {
      Object.entries(this.tokens.spacing).forEach(([name, value]) => {
        const cleanName = name.replace('padding-', '').replace('gap-', '');
        tailwind += `        '${cleanName}': '${value}',\n`;
      });
    }

    tailwind += `      },
      borderRadius: {
`;

    // Border radius
    if (this.tokens.borderRadius) {
      Object.entries(this.tokens.borderRadius).forEach(([name, value]) => {
        const cleanName = name.replace('radius-', '');
        tailwind += `        '${cleanName}': '${value}',\n`;
      });
    }

    tailwind += `      },
      boxShadow: {
`;

    // Effects
    if (this.tokens.effects) {
      Object.entries(this.tokens.effects).forEach(([name, value]) => {
        const cleanName = name.replace('shadow-', '');
        tailwind += `        '${cleanName}': '${value}',\n`;
      });
    }

    tailwind += `      }
    }
  }
};
`;

    return fs.writeFile(outputPath, tailwind);
  }
}

module.exports = DesignTokenExporter;