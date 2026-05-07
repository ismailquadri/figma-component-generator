const chalk = require('chalk');

class ComponentGenerator {
  constructor(options) {
    this.framework = options.framework || 'react';
    this.styling = options.styling || 'tailwind';
    this.includeStorybook = options.includeStorybook || false;
    this.includeTypescript = options.includeTypescript || false;
  }

  generate(componentName, figmaData) {
    // Use the FigmaClient to extract real design data
    const FigmaClient = require('./figma');
    const ConfigManager = require('./config');
    const configManager = new ConfigManager();
    const configData = configManager.loadConfig();

    const figmaClient = new FigmaClient(configData.figma.api_token);
    const componentData = figmaClient.extractComponentData(figmaData, componentName);

    console.log(chalk.gray(`Extracted data: ${JSON.stringify(componentData, null, 2)}`));

    let result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    if (this.framework === 'react') {
      result = this.generateReactComponent(componentName, componentData);
    }

    return result;
  }

  generateReactComponent(componentName, data) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    // Extract variant information if available
    const variantInfo = this.extractVariantInfo(data);

    // Generate component code based on styling approach
    if (this.styling === 'tailwind') {
      result.component = this.generateTailwindComponent(componentName, data, variantInfo);
    } else if (this.styling === 'css') {
      result.component = this.generateCSSComponent(componentName, data, variantInfo);
      result.styles = this.generateCSSStyles(componentName, data, variantInfo);
    } else if (this.styling === 'styled-components') {
      result.component = this.generateStyledComponentsComponent(componentName, data, variantInfo);
    }

    // Generate Storybook story
    if (this.includeStorybook) {
      result.storybook = this.generateStorybookStory(componentName, data, variantInfo);
    }

    // Generate TypeScript types
    if (this.includeTypescript) {
      result.types = this.generateTypeScriptTypes(componentName, data, variantInfo);
    }

    return result;
  }

  extractVariantInfo(data) {
    if (!data.variants) {
      return null;
    }

    return {
      availableVariants: data.availableVariants || ['primary', 'secondary', 'ghost'],
      availableStates: data.availableStates || ['default', 'hover', 'active', 'disabled'],
      availableSizes: data.availableSizes || ['small', 'medium', 'large'],
      variantCount: data.variantCount || 0
    };
  }

  generateTailwindComponent(componentName, data, variantInfo = null) {
    const pascalName = this.toPascalCase(componentName);

    // Extract real colors from Figma
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';

    // Extract typography from Figma
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    // Extract border radius from Figma
    const borderRadius = data.borderRadius || 0;

    // Convert to Tailwind classes
    const bgColor = this.getTailwindColor(primaryColor);
    const tailwindFontSize = this.getTailwindFontSize(fontSize);
    const tailwindFontWeight = this.getTailwindFontWeight(fontWeight);
    const tailwindBorderRadius = this.getTailwindBorderRadius(borderRadius);

    return `import React from 'react';

export const ${pascalName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  className = '',
  ...props
}) => {
  const baseClasses = '${tailwindFontWeight} ${tailwindFontSize} ${tailwindBorderRadius} transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const variantClasses = {
    primary: '${bgColor} text-white hover:opacity-90',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]} \${disabledClasses} \${className}\`}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${pascalName};
`;
  }

  generateCSSComponent(componentName, data, variantInfo = null) {
    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);
    const bgColor = data.fills?.[0] || '#3B82F6';
    const borderRadius = data.borderRadius || 0;
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    // Use variant info if available, otherwise use defaults
    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];
    const defaultVariant = variants[0];
    const defaultSize = sizes[1] || 'medium';

    return `import React from 'react';
import './${kebabName}.styles.css';

export const ${pascalName} = ({
  children,
  variant = '${defaultVariant}',
  size = '${defaultSize}',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  className = '',
  ...props
}) => {
  const baseClasses = '${kebabName}';
  const variantClasses = \`\${baseClasses}--\${variant}\`;
  const sizeClasses = \`\${baseClasses}--\${size}\`;
  const disabledClasses = disabled ? \`\${baseClasses}--disabled\` : '';

  return (
    <button
      className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabledClasses} \${className}\`}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${pascalName};
`;
  }

  generateCSSStyles(componentName, data, variantInfo = null) {
    const kebabName = this.toKebabCase(componentName);

    // If this is a component set with variants, generate styles for each variant
    if (data.isComponentSet && data.variants) {
      return this.generateVariantStyles(kebabName, data);
    }

    // Extract real colors from Figma
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';
    const primaryOpacity = data.fills?.[0]?.opacity || 1;

    // Extract typography from Figma
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;
    const fontFamily = data.typography?.fontFamily || 'Inter';
    const lineHeight = data.typography?.lineHeight || 1.5;

    // Extract border radius from Figma
    const borderRadius = data.borderRadius || 0;

    // Extract padding from Figma
    const paddingTop = data.paddingTop || 8;
    const paddingBottom = data.paddingBottom || 8;
    const paddingLeft = data.paddingLeft || 16;
    const paddingRight = data.paddingRight || 16;

    // Extract effects (shadows) from Figma
    const shadow = data.effects?.[0];
    let boxShadow = 'none';
    if (shadow && shadow.type === 'drop-shadow') {
      boxShadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${shadow.color}`;
    }

    return `.${kebabName} {
  font-family: '${fontFamily}', sans-serif;
  font-weight: ${fontWeight};
  font-size: ${fontSize}px;
  line-height: ${lineHeight};
  border-radius: ${borderRadius}px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;
  box-shadow: ${boxShadow};
}

/* Accessibility: Focus styles for keyboard navigation */
.${kebabName}:focus {
  outline: 2px solid ${primaryColor};
  outline-offset: 2px;
}

.${kebabName}:focus:not(:focus-visible) {
  outline: none;
}

.${kebabName}:focus-visible {
  outline: 2px solid ${primaryColor};
  outline-offset: 2px;
}

/* Accessibility: Disabled state */
.${kebabName}--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.${kebabName}--primary {
  background-color: ${primaryColor};
  color: white;
}

.${kebabName}--primary:hover {
  opacity: 0.9;
}

.${kebabName}--secondary {
  background-color: #e5e7eb;
  color: #111827;
}

.${kebabName}--secondary:hover {
  background-color: #d1d5db;
}

.${kebabName}--ghost {
  background-color: transparent;
  color: #374151;
}

.${kebabName}--ghost:hover {
  background-color: #f3f4f6;
}

.${kebabName}--small {
  padding: ${paddingTop * 0.75}px ${paddingRight * 0.75}px ${paddingBottom * 0.75}px ${paddingLeft * 0.75}px;
  font-size: ${fontSize * 0.875}px;
}

.${kebabName}--medium {
  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;
  font-size: ${fontSize}px;
}

.${kebabName}--large {
  padding: ${paddingTop * 1.25}px ${paddingRight * 1.25}px ${paddingBottom * 1.25}px ${paddingLeft * 1.25}px;
  font-size: ${fontSize * 1.125}px;
}
`;
  }

  generateVariantStyles(kebabName, data) {
    let styles = `.${kebabName} {\n`;

    // Base styles from first variant
    const firstVariant = data.variants[0];
    const primaryColor = firstVariant.fills?.[0]?.color || '#3B82F6';
    const fontSize = firstVariant.typography?.fontSize || 16;
    const fontWeight = firstVariant.typography?.fontWeight || 600;
    const fontFamily = firstVariant.typography?.fontFamily || 'Inter';
    const lineHeight = firstVariant.typography?.lineHeight || 1.5;
    const borderRadius = firstVariant.borderRadius || 0;
    const paddingTop = firstVariant.paddingTop || 8;
    const paddingBottom = firstVariant.paddingBottom || 8;
    const paddingLeft = firstVariant.paddingLeft || 16;
    const paddingRight = firstVariant.paddingRight || 16;

    styles += `  font-family: '${fontFamily}', sans-serif;\n`;
    styles += `  font-weight: ${fontWeight};\n`;
    styles += `  font-size: ${fontSize}px;\n`;
    styles += `  line-height: ${lineHeight};\n`;
    styles += `  border-radius: ${borderRadius}px;\n`;
    styles += '  border: none;\n';
    styles += '  cursor: pointer;\n';
    styles += '  transition: all 0.2s ease;\n';
    styles += `  padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;\n`;
    styles += '}\n\n';

    // Generate styles for each variant
    data.variants.forEach(variant => {
      const variantName = this.toKebabCase(variant.name);
      const variantColor = variant.fills?.[0]?.color || primaryColor;

      styles += `.${kebabName}--${variantName} {\n`;
      styles += `  background-color: ${variantColor};\n`;
      styles += '  color: white;\n';
      styles += '}\n\n';

      styles += `.${kebabName}--${variantName}:hover {\n`;
      styles += '  opacity: 0.9;\n';
      styles += '}\n\n';
    });

    return styles;
  }

  generateStyledComponentsComponent(componentName, data) {
    const pascalName = this.toPascalCase(componentName);
    const styledName = `Styled${pascalName}`;
    const bgColor = data.fills?.[0] || '#3B82F6';
    const borderRadius = data.borderRadius || 0;
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    return `import React from 'react';
import styled from 'styled-components';

const ${styledName} = styled.button\`
  font-weight: ${fontWeight};
  font-size: ${fontSize}px;
  border-radius: ${borderRadius}px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0.5rem 1rem;

  \${props => props.variant === 'primary' && \`
    background-color: ${bgColor};
    color: white;

    &:hover {
      opacity: 0.9;
    }
  \`}

  \${props => props.variant === 'secondary' && \`
    background-color: #e5e7eb;
    color: #111827;

    &:hover {
      background-color: #d1d5db;
    }
  \`}

  \${props => props.variant === 'ghost' && \`
    background-color: transparent;
    color: #374151;

    &:hover {
      background-color: #f3f4f6;
    }
  \`}

  \${props => props.size === 'small' && \`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  \`}

  \${props => props.size === 'medium' && \`
    padding: 0.5rem 1rem;
    font-size: 1rem;
  \`}

  \${props => props.size === 'large' && \`
    padding: 0.75rem 1.5rem;
    font-size: 1.125rem;
  \`}
\`;

export const ${pascalName} = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <${styledName}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {children}
    </${styledName}>
  );
};

export default ${pascalName};
`;
  }

  generateStorybookStory(componentName, data) {
    const pascalName = this.toPascalCase(componentName);

    return `import { ${pascalName} } from './${componentName}';

export default {
  title: 'Components/${pascalName}',
  component: ${pascalName},
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Button variant'
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size'
    }
  }
};

export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'medium'
  }
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'medium'
  }
};

export const Ghost = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
    size: 'medium'
  }
};

export const Small = {
  args: {
    children: 'Small Button',
    variant: 'primary',
    size: 'small'
  }
};

export const Large = {
  args: {
    children: 'Large Button',
    variant: 'primary',
    size: 'large'
  }
};
`;
  }

  generateTypeScriptTypes(componentName, data) {
    const pascalName = this.toPascalCase(componentName);

    return `export interface ${pascalName}Props {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}
`;
  }

  // Helper functions
  toPascalCase(str) {
    return str
      .replace(/(?:^|[-_\s])(\w)/g, (_, c) => c.toUpperCase())
      .replace(/[-_\s]/g, '');
  }

  toKebabCase(str) {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  getTailwindColor(hex) {
    // Map common colors to Tailwind classes
    const colorMap = {
      '#3B82F6': 'bg-blue-500',
      '#EF4444': 'bg-red-500',
      '#10B981': 'bg-green-500',
      '#F59E0B': 'bg-yellow-500',
      '#6B7280': 'bg-gray-500'
    };

    return colorMap[hex.toUpperCase()] || 'bg-blue-500';
  }

  getTailwindFontSize(size) {
    if (size <= 12) return 'text-xs';
    if (size <= 14) return 'text-sm';
    if (size <= 16) return 'text-base';
    if (size <= 18) return 'text-lg';
    if (size <= 20) return 'text-xl';
    return 'text-2xl';
  }

  getTailwindFontWeight(weight) {
    if (weight <= 400) return 'font-normal';
    if (weight <= 500) return 'font-medium';
    if (weight <= 600) return 'font-semibold';
    return 'font-bold';
  }

  getTailwindBorderRadius(radius) {
    if (radius === 0) return 'rounded-none';
    if (radius <= 4) return 'rounded-sm';
    if (radius <= 8) return 'rounded';
    if (radius <= 12) return 'rounded-lg';
    if (radius <= 16) return 'rounded-xl';
    if (radius <= 24) return 'rounded-2xl';
    return 'rounded-3xl';
  }
}

module.exports = ComponentGenerator;