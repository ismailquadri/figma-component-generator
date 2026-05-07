const chalk = require('chalk');

class FigmaStorybookBridge {
  constructor(figmaClient) {
    this.figmaClient = figmaClient;
  }

  extractComponentMetadata(figmaData, componentName) {
    const componentData = this.figmaClient.extractComponentData(figmaData, componentName);
    
    return {
      name: componentName,
      description: this.extractDescription(componentData),
      designTokens: this.extractDesignTokens(componentData),
      variants: this.extractVariants(componentData),
      interactions: this.extractInteractions(componentData),
      accessibility: this.extractAccessibilityInfo(componentData),
      responsive: this.extractResponsiveInfo(componentData),
      figmaUrl: this.extractFigmaUrl(componentData)
    };
  }

  extractDescription(componentData) {
    // Try to extract description from Figma component description
    if (componentData.description) {
      return componentData.description;
    }
    
    // Generate description based on component type
    if (componentData.name) {
      const name = componentData.name.toLowerCase();
      if (name.includes('button')) {
        return 'Interactive button component for user actions.';
      } else if (name.includes('input') || name.includes('textfield')) {
        return 'Form input component for user data entry.';
      } else if (name.includes('card')) {
        return 'Card component for grouping related content.';
      } else if (name.includes('modal') || name.includes('dialog')) {
        return 'Modal component for focused user interactions.';
      } else if (name.includes('nav') || name.includes('menu')) {
        return 'Navigation component for site navigation.';
      }
    }
    
    return 'Component generated from Figma design.';
  }

  extractDesignTokens(componentData) {
    return {
      colors: {
        primary: componentData.fills?.[0]?.color || '#3B82F6',
        text: this.extractTextColor(componentData),
        border: componentData.strokes?.[0]?.color || '#D1D5DB'
      },
      typography: {
        fontSize: componentData.typography?.fontSize || 16,
        fontWeight: componentData.typography?.fontWeight || 400,
        lineHeight: componentData.typography?.lineHeight || 1.5
      },
      spacing: {
        padding: {
          top: componentData.paddingTop || 0,
          right: componentData.paddingRight || 0,
          bottom: componentData.paddingBottom || 0,
          left: componentData.paddingLeft || 0
        }
      },
      borders: {
        radius: componentData.borderRadius || 0,
        width: componentData.strokeWeight || 0
      },
      effects: {
        shadow: this.extractShadow(componentData)
      }
    };
  }

  extractTextColor(componentData) {
    // Try to extract text color from component
    if (componentData.textColor) {
      return componentData.textColor;
    }
    return '#1a1a1a';
  }

  extractShadow(componentData) {
    if (componentData.effects && componentData.effects.length > 0) {
      const shadow = componentData.effects.find(e => e.type === 'drop-shadow');
      if (shadow) {
        return {
          x: shadow.offset?.x || 0,
          y: shadow.offset?.y || 0,
          blur: shadow.radius || 0,
          color: shadow.color || 'rgba(0,0,0,0.1)'
        };
      }
    }
    return null;
  }

  extractVariants(componentData) {
    const variants = [];
    
    if (componentData.variants) {
      componentData.variants.forEach(variant => {
        variants.push({
          name: variant.name,
          properties: variant.properties,
          componentId: variant.componentId
        });
      });
    }
    
    // If no variants found, infer from component name
    if (variants.length === 0 && componentData.name) {
      const name = componentData.name.toLowerCase();
      if (name.includes('primary') || name.includes('secondary') || name.includes('ghost')) {
        variants.push(
          { name: 'primary', properties: {} },
          { name: 'secondary', properties: {} },
          { name: 'ghost', properties: {} }
        );
      }
    }
    
    return variants;
  }

  extractInteractions(componentData) {
    const interactions = [];
    
    // Check for prototype interactions in Figma
    if (componentData.prototypeInteractions) {
      componentData.prototypeInteractions.forEach(interaction => {
        interactions.push({
          type: interaction.trigger,
          action: interaction.action,
          destination: interaction.destination
        });
      });
    }
    
    return interactions;
  }

  extractAccessibilityInfo(componentData) {
    return {
      label: componentData.accessibilityLabel || componentData.name,
      description: componentData.accessibilityDescription || '',
      role: this.inferAriaRole(componentData),
      keyboardNavigable: this.isKeyboardNavigable(componentData)
    };
  }

  inferAriaRole(componentData) {
    const name = componentData.name.toLowerCase();
    
    if (name.includes('button')) return 'button';
    if (name.includes('input') || name.includes('textfield')) return 'textbox';
    if (name.includes('modal') || name.includes('dialog')) return 'dialog';
    if (name.includes('nav') || name.includes('menu')) return 'navigation';
    if (name.includes('link')) return 'link';
    
    return 'generic';
  }

  isKeyboardNavigable(componentData) {
    const name = componentData.name.toLowerCase();
    return ['button', 'input', 'textfield', 'modal', 'dialog', 'nav', 'menu', 'link']
      .some(keyword => name.includes(keyword));
  }

  extractResponsiveInfo(componentData) {
    return {
      minWidth: componentData.minWidth || null,
      maxWidth: componentData.maxWidth || null,
      responsive: componentData.responsive || false,
      breakpoints: this.extractBreakpoints(componentData)
    };
  }

  extractBreakpoints(componentData) {
    // Try to extract responsive variants
    if (componentData.responsiveVariants) {
      return componentData.responsiveVariants.map(variant => ({
        name: variant.name,
        width: variant.width,
        componentId: variant.componentId
      }));
    }
    
    return [];
  }

  extractFigmaUrl(componentData) {
    if (componentData.fileKey) {
      return `https://www.figma.com/file/${componentData.fileKey}`;
    }
    return null;
  }

  generateStoryParameters(metadata) {
    return {
      design: metadata.figmaUrl ? {
        type: 'figma',
        url: metadata.figmaUrl
      } : undefined,
      docs: {
        description: {
          component: metadata.description
        }
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
    };
  }

  generateDesignTokensDocs(metadata) {
    return `
## Design Tokens

### Colors
- Primary: \`${metadata.designTokens.colors.primary}\`
- Text: \`${metadata.designTokens.colors.text}\`
- Border: \`${metadata.designTokens.colors.border}\`

### Typography
- Font Size: \`${metadata.designTokens.typography.fontSize}px\`
- Font Weight: \`${metadata.designTokens.typography.fontWeight}\`
- Line Height: \`${metadata.designTokens.typography.lineHeight}\`

### Spacing
- Padding Top: \`${metadata.designTokens.spacing.padding.top}px\`
- Padding Right: \`${metadata.designTokens.spacing.padding.right}px\`
- Padding Bottom: \`${metadata.designTokens.spacing.padding.bottom}px\`
- Padding Left: \`${metadata.designTokens.spacing.padding.left}px\`

### Borders
- Radius: \`${metadata.designTokens.borders.radius}px\`
- Width: \`${metadata.designTokens.borders.width}px\`

${metadata.designTokens.effects.shadow ? `
### Effects
- Shadow: \`x: ${metadata.designTokens.effects.shadow.x}, y: ${metadata.designTokens.effects.shadow.y}, blur: ${metadata.designTokens.effects.shadow.blur}\`
` : ''}
`;
  }

  generateArgTypes(metadata) {
    const argTypes = {};
    
    // Add variant arg type if variants exist
    if (metadata.variants.length > 0) {
      argTypes.variant = {
        control: 'select',
        options: metadata.variants.map(v => v.name),
        description: 'Component variant',
        table: {
          defaultValue: { summary: metadata.variants[0].name }
        }
      };
    }
    
    // Add accessibility arg types
    argTypes['aria-label'] = {
      control: 'text',
      description: 'Accessibility label',
      table: {
        defaultValue: { summary: metadata.accessibility.label }
      }
    };
    
    if (metadata.accessibility.description) {
      argTypes['aria-describedby'] = {
        control: 'text',
        description: 'Accessibility description'
      };
    }
    
    return argTypes;
  }
}

module.exports = FigmaStorybookBridge;