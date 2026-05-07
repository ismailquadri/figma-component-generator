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
    } else if (this.framework === 'vue') {
      result = this.generateVueComponent(componentName, componentData);
    } else if (this.framework === 'svelte') {
      result = this.generateSvelteComponent(componentName, componentData);
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

    // Detect component type
    const componentType = this.detectComponentType(componentName, data);

    // Generate component code based on component type and styling approach
    if (componentType === 'input') {
      const inputResult = this.generateInputComponent(componentName, data, variantInfo);
      result.component = inputResult.component;
      result.styles = inputResult.styles;
    } else if (componentType === 'card') {
      const cardResult = this.generateCardComponent(componentName, data, variantInfo);
      result.component = cardResult.component;
      result.styles = cardResult.styles;
    } else if (componentType === 'modal') {
      const modalResult = this.generateModalComponent(componentName, data, variantInfo);
      result.component = modalResult.component;
      result.styles = modalResult.styles;
    } else if (componentType === 'navigation') {
      const navResult = this.generateNavigationComponent(componentName, data, variantInfo);
      result.component = navResult.component;
      result.styles = navResult.styles;
    } else {
      // Default to button generation
      if (this.styling === 'tailwind') {
        result.component = this.generateTailwindComponent(componentName, data, variantInfo);
      } else if (this.styling === 'css') {
        result.component = this.generateCSSComponent(componentName, data, variantInfo);
        result.styles = this.generateCSSStyles(componentName, data, variantInfo);
      } else if (this.styling === 'styled-components') {
        result.component = this.generateStyledComponentsComponent(componentName, data, variantInfo);
      } else if (this.styling === 'css-modules') {
        const cssModulesResult = this.generateCSSModulesComponent(componentName, data, variantInfo);
        result.component = cssModulesResult.component;
        result.styles = cssModulesResult.styles;
      } else if (this.styling === 'stylus') {
        const stylusResult = this.generateStylusComponent(componentName, data, variantInfo);
        result.component = stylusResult.component;
        result.styles = stylusResult.styles;
      } else if (this.styling === 'less') {
        const lessResult = this.generateLessComponent(componentName, data, variantInfo);
        result.component = lessResult.component;
        result.styles = lessResult.styles;
      }
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

  detectComponentType(componentName, data) {
    const name = componentName.toLowerCase();
    
    // Check component name patterns
    if (name.includes('input') || name.includes('textfield') || name.includes('text field')) {
      return 'input';
    }
    if (name.includes('card')) {
      return 'card';
    }
    if (name.includes('modal') || name.includes('dialog') || name.includes('popup')) {
      return 'modal';
    }
    if (name.includes('nav') || name.includes('navbar') || name.includes('menu') || name.includes('header')) {
      return 'navigation';
    }
    if (name.includes('button') || name.includes('btn')) {
      return 'button';
    }
    
    // Check Figma structure hints
    if (data.type === 'INSTANCE' && data.componentId) {
      // Could be an instance of a component
      return 'component-instance';
    }
    
    // Default to button for now
    return 'button';
  }

  generateInputComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract design data
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 400;
    const borderRadius = data.borderRadius || 8;
    const borderColor = data.strokes?.[0]?.color || '#D1D5DB';
    const borderWidth = data.strokeWeight || 1;

    if (this.framework === 'react') {
      result.component = `import React from 'react';
import './${kebabName}.styles.css';

export const ${pascalName} = ({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  disabled = false,
  error = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
  className = '',
  id,
  ...props
}) => {
  const baseClasses = '${kebabName}';
  const typeClasses = \`\${baseClasses}--\${type}\`;
  const errorClasses = error ? \`\${baseClasses}--error\` : '';
  const disabledClasses = disabled ? \`\${baseClasses}--disabled\` : '';

  return (
    <input
      type={type}
      className={\`\${baseClasses} \${typeClasses} \${errorClasses} \${disabledClasses} \${className}\`}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-invalid={error || ariaInvalid}
      {...props}
    />
  );
};

export default ${pascalName};`;

      result.styles = `.${kebabName} {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: ${fontWeight};
  font-size: ${fontSize}px;
  line-height: 1.5;
  border-radius: ${borderRadius}px;
  border: ${borderWidth}px solid ${borderColor};
  padding: 8px 12px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

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

.${kebabName}--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #F3F4F6;
}

.${kebabName}--error {
  border-color: #EF4444;
}

.${kebabName}--error:focus {
  outline-color: #EF4444;
}

.${kebabName}--text {
  /* Default text input styles */
}

.${kebabName}--email {
  /* Email input specific styles */
}

.${kebabName}--password {
  /* Password input specific styles */
}

.${kebabName}::placeholder {
  color: #9CA3AF;
}`;
    }

    return result;
  }

  generateCardComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract design data
    const bgColor = data.fills?.[0]?.color || '#FFFFFF';
    const shadow = data.effects?.[0];
    let boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
    if (shadow && shadow.type === 'drop-shadow') {
      boxShadow = `${shadow.offset.x}px ${shadow.offset.y}px ${shadow.radius}px ${shadow.color}`;
    }
    const borderRadius = data.borderRadius || 12;
    const padding = data.paddingTop || 16;

    if (this.framework === 'react') {
      result.component = `import React from 'react';
import './${kebabName}.styles.css';

export const ${pascalName} = ({
  children,
  title,
  subtitle,
  actions,
  variant = 'default',
  hoverable = false,
  'aria-label': ariaLabel,
  className = '',
  ...props
}) => {
  const baseClasses = '${kebabName}';
  const variantClasses = \`\${baseClasses}--\${variant}\`;
  const hoverClasses = hoverable ? \`\${baseClasses}--hoverable\` : '';

  return (
    <div
      className={\`\${baseClasses} \${variantClasses} \${hoverClasses} \${className}\`}
      aria-label={ariaLabel}
      {...props}
    >
      {(title || subtitle) && (
        <div className="${kebabName}__header">
          {title && <h3 className="${kebabName}__title">{title}</h3>}
          {subtitle && <p className="${kebabName}__subtitle">{subtitle}</p>}
        </div>
      )}
      {children && <div className="${kebabName}__content">{children}</div>}
      {actions && <div className="${kebabName}__actions">{actions}</div>}
    </div>
  );
};

export default ${pascalName};`;

      result.styles = `.${kebabName} {
  background-color: ${bgColor};
  border-radius: ${borderRadius}px;
  box-shadow: ${boxShadow};
  padding: ${padding}px;
  transition: all 0.2s ease;
  overflow: hidden;
}

.${kebabName}__header {
  margin-bottom: ${padding > 16 ? padding - 8 : 8}px;
}

.${kebabName}__title {
  margin: 0 0 0.5rem 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.${kebabName}__subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.${kebabName}__content {
  margin-bottom: ${padding > 16 ? padding - 8 : 8}px;
}

.${kebabName}__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.${kebabName}--hoverable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.${kebabName}--outlined {
  background-color: transparent;
  border: 1px solid #E5E7EB;
}

.${kebabName}--elevated {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}`;
    }

    return result;
  }

  generateModalComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    if (this.framework === 'react') {
      result.component = `import React, { useEffect } from 'react';
import './${kebabName}.styles.css';

export const ${pascalName} = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  closeOnOverlayClick = true,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
  ...props
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  return (
    <div 
      className={\`\${kebabName} ${kebabName}--\${size}\`}
      onKeyDown={handleEscapeKey}
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      {...props}
    >
      <div className="${kebabName}__overlay" onClick={handleOverlayClick} />
      <div className="${kebabName}__container">
        {title && (
          <div className="${kebabName}__header">
            <h2 id={ariaLabelledby} className="${kebabName}__title">{title}</h2>
            <button 
              className="${kebabName}__close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        <div 
          className="${kebabName}__content}"
          id={ariaDescribedby}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ${pascalName};`;

      result.styles = `.${kebabName} {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.${kebabName}__overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease-out;
}

.${kebabName}__container {
  background: white;
  border-radius: 12px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  position: relative;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.${kebabName}__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E5E7EB;
}

.${kebabName}__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
}

.${kebabName}__close {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.${kebabName}__close:hover {
  background: #F3F4F6;
  color: #1a1a1a;
}

.${kebabName}__content {
  padding: 20px;
}

.${kebabName}--small {
  ${kebabName}__container {
    max-width: 400px;
  }
}

.${kebabName}--medium {
  ${kebabName}__container {
    max-width: 600px;
  }
}

.${kebabName}--large {
  ${kebabName}__container {
    max-width: 800px;
  }
}`;
    }

    return result;
  }

  generateNavigationComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract design data
    const bgColor = data.fills?.[0]?.color || '#FFFFFF';
    const textColor = data.typography?.fontSize ? '#1a1a1a' : '#FFFFFF';

    if (this.framework === 'react') {
      result.component = `import React, { useState } from 'react';
import './${kebabName}.styles.css';

export const ${pascalName} = ({
  logo,
  links = [],
  variant = 'default',
  'aria-label': ariaLabel,
  className = '',
  ...props
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav 
      className={\`\${kebabName} \${kebabName}--\${variant} \${className}\`}
      aria-label={ariaLabel || 'Main navigation'}
      {...props}
    >
      <div className="${kebabName}__container">
        {logo && <div className="${kebabName}__logo">{logo}</div>}
        
        <ul className="${kebabName}__links">
          {links.map((link, index) => (
            <li key={index}>
              <a 
                href={link.href} 
                className="${kebabName}__link"
                target={link.external ? '_blank' : '_self'}
                rel={link.external ? 'noopener noreferrer' : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button 
          className="${kebabName}__mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default ${pascalName};`;

      result.styles = `.${kebabName} {
  background-color: ${bgColor};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.${kebabName}__container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}

.${kebabName}__logo {
  font-weight: 700;
  font-size: 1.25rem;
  color: ${textColor};
}

.${kebabName}__links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 2rem;
}

.${kebabName}__link {
  color: ${textColor};
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;
}

.${kebabName}__link:hover {
  opacity: 0.8;
}

.${kebabName}__mobile-toggle {
  display: none;
  background: none;
  border: none;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  cursor: pointer;
}

.${kebabName}__mobile-toggle span {
  width: 24px;
  height: 2px;
  background: ${textColor};
  border-radius: 2px;
  transition: all 0.2s ease;
}

.${kebabName}__mobile-toggle span:nth-child(2) {
  width: 16px;
}

@media (max-width: 768px) {
  .${kebabName}__links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${bgColor};
    flex-direction: column;
    padding: 1rem 2rem;
    gap: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .${kebabName}__links.open {
    display: flex;
  }

  .${kebabName}__mobile-toggle {
    display: flex;
  }
}`;
    }

    return result;
  }

  generateCSSModulesComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const camelName = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    const kebabName = this.toKebabCase(componentName);

    // Extract real colors from Figma
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';

    // Extract typography from Figma
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    // Extract border radius from Figma
    const borderRadius = data.borderRadius || 0;

    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];

    result.component = `import React from 'react';
import styles from './${componentName}.module.css';

export const ${pascalName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-disabled': ariaDisabled,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = styles.${camelName};
  const variantClasses = styles[\`\${camelName}--\${variant}\`];
  const sizeClasses = styles[\`\${camelName}--\${size}\`];
  const disabledClasses = disabled ? styles[\`\${camelName}--disabled\`] : '';

  return (
    <button
      className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabledClasses} \${className}\`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled || ariaDisabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${pascalName};`;

    result.styles = `.${camelName} {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: ${fontWeight};
  font-size: ${fontSize}px;
  line-height: 1.5;
  border-radius: ${borderRadius}px;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.${camelName}:focus {
  outline: 2px solid ${primaryColor};
  outline-offset: 2px;
}

.${camelName}:focus:not(:focus-visible) {
  outline: none;
}

.${camelName}:focus-visible {
  outline: 2px solid ${primaryColor};
  outline-offset: 2px;
}

.${camelName}--primary {
  background-color: ${primaryColor};
  color: white;
}

.${camelName}--primary:hover:not(:disabled) {
  background-color: ${this.adjustColor(primaryColor, -10)};
}

.${camelName}--secondary {
  background-color: #6B7280;
  color: white;
}

.${camelName}--secondary:hover:not(:disabled) {
  background-color: #4B5563;
}

.${camelName}--ghost {
  background-color: transparent;
  color: ${primaryColor};
}

.${camelName}--ghost:hover:not(:disabled) {
  background-color: ${this.adjustColor(primaryColor, 90)};
}

.${camelName}--small {
  padding: 4px 12px;
  font-size: ${fontSize - 2}px;
}

.${camelName}--medium {
  padding: 8px 16px;
  font-size: ${fontSize}px;
}

.${camelName}--large {
  padding: 12px 24px;
  font-size: ${fontSize + 2}px;
}

.${camelName}--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}`;

    return result;
  }

  generateStylusComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract real colors from Figma
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';

    // Extract typography from Figma
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    // Extract border radius from Figma
    const borderRadius = data.borderRadius || 0;

    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];

    result.component = `import React from 'react';
import './${kebabName}.styl';

export const ${pascalName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-disabled': ariaDisabled,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = '${kebabName}';
  const variantClasses = \`\${kebabName}--\${variant}\`;
  const sizeClasses = \`\${kebabName}--\${size}\`;
  const disabledClasses = disabled ? \`\${kebabName}--disabled\` : '';

  return (
    <button
      className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabledClasses} \${className}\`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled || ariaDisabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${pascalName};`;

    result.styles = `.${kebabName}
  font-family 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
  font-weight ${fontWeight}
  font-size ${fontSize}px
  line-height 1.5
  border-radius ${borderRadius}px
  border none
  padding 8px 16px
  cursor pointer
  transition all 0.2s ease

  &:focus
    outline 2px solid ${primaryColor}
    outline-offset 2px

  &:focus:not(:focus-visible)
    outline none

  &:focus-visible
    outline 2px solid ${primaryColor}
    outline-offset 2px

  &--primary
    background-color ${primaryColor}
    color white

    &:hover:not(:disabled)
      background-color ${this.adjustColor(primaryColor, -10)}

  &--secondary
    background-color #6B7280
    color white

    &:hover:not(:disabled)
      background-color #4B5563

  &--ghost
    background-color transparent
    color ${primaryColor}

    &:hover:not(:disabled)
      background-color ${this.adjustColor(primaryColor, 90)}

  &--small
    padding 4px 12px
    font-size ${fontSize - 2}px

  &--medium
    padding 8px 16px
    font-size ${fontSize}px

  &--large
    padding 12px 24px
    font-size ${fontSize + 2}px

  &--disabled
    opacity 0.5
    cursor not-allowed`;

    return result;
  }

  generateLessComponent(componentName, data, variantInfo = null) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract real colors from Figma
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';

    // Extract typography from Figma
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;

    // Extract border radius from Figma
    const borderRadius = data.borderRadius || 0;

    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];

    result.component = `import React from 'react';
import './${kebabName}.less';

export const ${pascalName} = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-disabled': ariaDisabled,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = '${kebabName}';
  const variantClasses = \`\${kebabName}--\${variant}\`;
  const sizeClasses = \`\${kebabName}--\${size}\`;
  const disabledClasses = disabled ? \`\${kebabName}--disabled\` : '';

  return (
    <button
      className={\`\${baseClasses} \${variantClasses} \${sizeClasses} \${disabledClasses} \${className}\`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-disabled={disabled || ariaDisabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default ${pascalName};`;

    result.styles = `@primary-color: ${primaryColor};
@font-size: ${fontSize}px;
@font-weight: ${fontWeight};
@border-radius: ${borderRadius}px;

.${kebabName} {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: @font-weight;
  font-size: @font-size;
  line-height: 1.5;
  border-radius: @border-radius;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: 2px solid @primary-color;
    outline-offset: 2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid @primary-color;
    outline-offset: 2px;
  }

  &--primary {
    background-color: @primary-color;
    color: white;

    &:hover:not(:disabled) {
      background-color: ${this.adjustColor(primaryColor, -10)};
    }
  }

  &--secondary {
    background-color: #6B7280;
    color: white;

    &:hover:not(:disabled) {
      background-color: #4B5563;
    }
  }

  &--ghost {
    background-color: transparent;
    color: @primary-color;

    &:hover:not(:disabled) {
      background-color: ${this.adjustColor(primaryColor, 90)};
    }
  }

  &--small {
    padding: 4px 12px;
    font-size: @font-size - 2px;
  }

  &--medium {
    padding: 8px 16px;
    font-size: @font-size;
  }

  &--large {
    padding: 12px 24px;
    font-size: @font-size + 2px;
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}`;

    return result;
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

  adjustColor(color, amount) {
    // Simple color adjustment for hover states
    // This is a basic implementation - for production use a proper color manipulation library
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(Math.min(255, r), 0);
    g = Math.max(Math.min(255, g), 0);
    b = Math.max(Math.min(255, b), 0);

    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  }

  generateVueComponent(componentName, data) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const variantInfo = this.extractVariantInfo(data);
    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract design data
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;
    const borderRadius = data.borderRadius || 0;

    // Use variant info if available
    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];
    const defaultVariant = variants[0];
    const defaultSize = sizes[1] || 'medium';

    if (this.styling === 'tailwind') {
      const tailwindFontSize = this.getTailwindFontSize(fontSize);
      const tailwindFontWeight = this.getTailwindFontWeight(fontWeight);
      const tailwindBorderRadius = this.getTailwindBorderRadius(borderRadius);

      result.component = `<script setup>
import { ref } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: '${defaultVariant}'
  },
  size: {
    type: String,
    default: '${defaultSize}'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  ariaDescribedby: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click']);
</script>

<template>
  <button
    :class="[
      '${tailwindFontWeight} ${tailwindFontSize} ${tailwindBorderRadius}',
      'transition-colors cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      variantClasses[variant],
      sizeClasses[size],
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
    ]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: '${pascalName}',
  computed: {
    variantClasses() {
      return {
        '${this.getTailwindColor(primaryColor)} text-white hover:opacity-90': this.variant === '${variants[0]}',
        'bg-gray-200 text-gray-900 hover:bg-gray-300': this.variant === '${variants[1] || 'secondary'}',
        'bg-transparent text-gray-700 hover:bg-gray-100': this.variant === '${variants[2] || 'ghost'}'
      };
    },
    sizeClasses() {
      return {
        'px-3 py-1.5 text-sm': this.size === 'small',
        'px-4 py-2 text-base': this.size === 'medium',
        'px-6 py-3 text-lg': this.size === 'large'
      };
    }
  }
};
</script>`;
    } else if (this.styling === 'css') {
      result.component = `<script setup>
import { ref } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: '${defaultVariant}'
  },
  size: {
    type: String,
    default: '${defaultSize}'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: ''
  },
  ariaDescribedby: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click']);
</script>

<template>
  <button
    :class="[baseClasses, variantClasses, sizeClasses, disabledClasses]"
    :disabled="disabled"
    :aria-label="ariaLabel"
    :aria-describedby="ariaDescribedby"
    :aria-disabled="disabled"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script>
export default {
  name: '${pascalName}',
  computed: {
    baseClasses() {
      return '${kebabName}';
    },
    variantClasses() {
      return \`\${this.baseClasses}--\${this.variant}\`;
    },
    sizeClasses() {
      return \`\${this.baseClasses}--\${this.size}\`;
    },
    disabledClasses() {
      return this.disabled ? \`\${this.baseClasses}--disabled\` : '';
    }
  }
};
</script>`;

      result.styles = this.generateCSSStyles(componentName, data, variantInfo);
    }

    return result;
  }

  generateSvelteComponent(componentName, data) {
    const result = {
      component: '',
      styles: '',
      storybook: '',
      types: ''
    };

    const variantInfo = this.extractVariantInfo(data);
    const pascalName = this.toPascalCase(componentName);
    const kebabName = this.toKebabCase(componentName);

    // Extract design data
    const primaryColor = data.fills?.[0]?.color || '#3B82F6';
    const fontSize = data.typography?.fontSize || 16;
    const fontWeight = data.typography?.fontWeight || 600;
    const borderRadius = data.borderRadius || 0;

    // Use variant info if available
    const variants = variantInfo?.availableVariants || ['primary', 'secondary', 'ghost'];
    const sizes = variantInfo?.availableSizes || ['small', 'medium', 'large'];
    const defaultVariant = variants[0];
    const defaultSize = sizes[1] || 'medium';

    if (this.styling === 'tailwind') {
      const tailwindFontSize = this.getTailwindFontSize(fontSize);
      const tailwindFontWeight = this.getTailwindFontWeight(fontWeight);
      const tailwindBorderRadius = this.getTailwindBorderRadius(borderRadius);

      result.component = `<script>
  export let variant = '${defaultVariant}';
  export let size = '${defaultSize}';
  export let disabled = false;
  export let ariaLabel = '';
  export let ariaDescribedby = '';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  $: variantClasses = {
    '${this.getTailwindColor(primaryColor)} text-white hover:opacity-90': variant === '${variants[0]}',
    'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === '${variants[1] || 'secondary'}',
    'bg-transparent text-gray-700 hover:bg-gray-100': variant === '${variants[2] || 'ghost'}'
  };

  $: sizeClasses = {
    'px-3 py-1.5 text-sm': size === 'small',
    'px-4 py-2 text-base': size === 'medium',
    'px-6 py-3 text-lg': size === 'large'
  };

  $: disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';

  function handleClick(e) {
    if (!disabled) {
      dispatch('click', e);
    }
  }
<\/script>

<button
  class="${tailwindFontWeight} ${tailwindFontSize} ${tailwindBorderRadius} transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 {variantClasses[variant]} {sizeClasses[size]} {disabledClasses}"
  {disabled}
  {ariaLabel}
  aria-describedby={ariaDescribedby}
  aria-disabled={disabled}
  on:click={handleClick}
>
  <slot />
</button>`;
    } else if (this.styling === 'css') {
      result.component = `<script>
  export let variant = '${defaultVariant}';
  export let size = '${defaultSize}';
  export let disabled = false;
  export let ariaLabel = '';
  export let ariaDescribedby = '';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  $: baseClasses = '${kebabName}';
  $: variantClasses = \`\${baseClasses}--\${variant}\`;
  $: sizeClasses = \`\${baseClasses}--\${size}\`;
  $: disabledClasses = disabled ? \`\${baseClasses}--disabled\` : '';

  function handleClick(e) {
    if (!disabled) {
      dispatch('click', e);
    }
  }
<\/script>

<button
  class="{baseClasses} {variantClasses} {sizeClasses} {disabledClasses}"
  {disabled}
  {ariaLabel}
  aria-describedby={ariaDescribedby}
  aria-disabled={disabled}
  on:click={handleClick}
>
  <slot />
</button>`;

      result.styles = this.generateCSSStyles(componentName, data, variantInfo);
    }

    return result;
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