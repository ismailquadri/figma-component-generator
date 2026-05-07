const axios = require('axios');
const chalk = require('chalk');

class FigmaClient {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseURL = 'https://api.figma.com/v1';
  }

  async getFile(fileKey) {
    try {
      const response = await axios.get(`${this.baseURL}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.apiToken
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Invalid API token. Please run "generate-component update-token"');
        } else if (error.response.status === 403) {
          throw new Error('Access denied. Check your API token permissions.');
        } else if (error.response.status === 404) {
          throw new Error('File not found. Check the Figma URL.');
        }
      }
      throw new Error(`Failed to fetch Figma file: ${error.message}`);
    }
  }

  async getFileNodes(fileKey, nodeIds) {
    try {
      const response = await axios.get(`${this.baseURL}/files/${fileKey}/nodes`, {
        headers: {
          'X-Figma-Token': this.apiToken
        },
        params: {
          ids: nodeIds.join(',')
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma nodes: ${error.message}`);
    }
  }

  extractComponentData(figmaData, componentName) {
    const document = figmaData.document;

    // Try to find component by exact name match
    let component = this.findComponentByName(document, componentName);

    // If not found, try case-insensitive search
    if (!component) {
      component = this.findComponentByNameCaseInsensitive(document, componentName);
    }

    // If still not found, try partial match
    if (!component) {
      component = this.findComponentByPartialName(document, componentName);
    }

    if (!component) {
      console.log(chalk.yellow(`Warning: Component "${componentName}" not found exactly. Using first available component as fallback.`));
      // Fallback to first component found
      component = this.findFirstComponent(document);
    }

    if (!component) {
      throw new Error('No components found in Figma file. Please check the file contains components.');
    }

    console.log(chalk.gray(`Found component: ${component.name}`));

    // Check if this is a component set (has variants)
    const isComponentSet = component.type === 'COMPONENT_SET';
    const variants = isComponentSet ? this.extractVariants(component) : null;

    return {
      name: component.name,
      type: component.type,
      isComponentSet,
      variants,
      width: component.absoluteBoundingBox?.width || component.width,
      height: component.absoluteBoundingBox?.height || component.height,
      fills: this.extractColors(component),
      strokes: this.extractStrokes(component),
      effects: this.extractEffects(component),
      typography: this.extractTypography(component),
      borderRadius: this.extractBorderRadius(component),
      strokeWeight: component.strokeWeight,
      strokeAlign: component.strokeAlign,
      layoutMode: component.layoutMode,
      primaryAxisAlignItems: component.primaryAxisAlignItems,
      counterAxisAlignItems: component.counterAxisAlignItems,
      paddingLeft: component.paddingLeft,
      paddingRight: component.paddingRight,
      paddingTop: component.paddingTop,
      paddingBottom: component.paddingBottom,
      itemSpacing: component.itemSpacing,
      componentPropertyDefinitions: component.componentPropertyDefinitions,
      children: component.children ? this.extractChildren(component.children) : []
    };
  }

  extractVariants(componentSet) {
    if (!componentSet.children || componentSet.children.length === 0) {
      return null;
    }

    const variants = componentSet.children.map(child => {
      // Extract variant properties from componentPropertyDefinitions
      const variantProps = {};
      if (child.componentPropertyDefinitions) {
        Object.keys(child.componentPropertyDefinitions).forEach(key => {
          const prop = child.componentPropertyDefinitions[key];
          variantProps[key] = {
            type: prop.type,
            value: prop.defaultValue,
            options: prop.variantOptions
          };
        });
      }

      // Parse variant name to extract properties (e.g., "Button/Primary/Hover" -> {variant: "Primary", state: "Hover"})
      const parsedName = this.parseVariantName(child.name);

      return {
        id: child.id,
        name: child.name,
        parsedName,
        width: child.absoluteBoundingBox?.width || child.width,
        height: child.absoluteBoundingBox?.height || child.height,
        fills: this.extractColors(child),
        strokes: this.extractStrokes(child),
        effects: this.extractEffects(child),
        typography: this.extractTypography(child),
        borderRadius: this.extractBorderRadius(child),
        strokeWeight: child.strokeWeight,
        paddingLeft: child.paddingLeft,
        paddingRight: child.paddingRight,
        paddingTop: child.paddingTop,
        paddingBottom: child.paddingBottom,
        properties: variantProps
      };
    });

    // Group variants by their properties
    return this.groupVariants(variants);
  }

  parseVariantName(name) {
    // Split by common separators: /, , -, _
    const parts = name.split(/[\/\-\_]/).map(part => part.trim()).filter(Boolean);

    const result = {
      component: parts[0] || name,
      variant: 'default',
      state: 'default',
      size: 'medium'
    };

    // Detect common patterns
    parts.forEach((part, index) => {
      const lowerPart = part.toLowerCase();

      // Variant detection
      if (['primary', 'secondary', 'tertiary', 'ghost', 'outline', 'text'].includes(lowerPart)) {
        result.variant = lowerPart;
      }

      // State detection
      if (['hover', 'active', 'pressed', 'disabled', 'focused', 'focus'].includes(lowerPart)) {
        result.state = lowerPart === 'focused' ? 'focus' : lowerPart;
      }

      // Size detection
      if (['small', 'sm', 'medium', 'md', 'large', 'lg', 'xlarge', 'xl'].includes(lowerPart)) {
        const sizeMap = {
          'sm': 'small', 'small': 'small',
          'md': 'medium', 'medium': 'medium',
          'lg': 'large', 'large': 'large',
          'xl': 'xlarge', 'xlarge': 'xlarge'
        };
        result.size = sizeMap[lowerPart] || lowerPart;
      }
    });

    return result;
  }

  groupVariants(variants) {
    const grouped = {
      byVariant: {},
      byState: {},
      bySize: {},
      all: variants
    };

    variants.forEach(variant => {
      const { parsedName } = variant;

      // Group by variant
      if (!grouped.byVariant[parsedName.variant]) {
        grouped.byVariant[parsedName.variant] = [];
      }
      grouped.byVariant[parsedName.variant].push(variant);

      // Group by state
      if (!grouped.byState[parsedName.state]) {
        grouped.byState[parsedName.state] = [];
      }
      grouped.byState[parsedName.state].push(variant);

      // Group by size
      if (!grouped.bySize[parsedName.size]) {
        grouped.bySize[parsedName.size] = [];
      }
      grouped.bySize[parsedName.size].push(variant);
    });

    return grouped;
  }

  findComponentByName(node, name) {
    if (node.name === name) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findComponentByName(child, name);
        if (found) return found;
      }
    }

    return null;
  }

  findComponentByNameCaseInsensitive(node, name) {
    if (node.name.toLowerCase() === name.toLowerCase()) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findComponentByNameCaseInsensitive(child, name);
        if (found) return found;
      }
    }

    return null;
  }

  findComponentByPartialName(node, name) {
    if (node.name.toLowerCase().includes(name.toLowerCase())) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findComponentByPartialName(child, name);
        if (found) return found;
      }
    }

    return null;
  }

  findFirstComponent(node) {
    // Return the first node that looks like a component (has children or fills)
    if ((node.children && node.children.length > 0) || (node.fills && node.fills.length > 0)) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findFirstComponent(child);
        if (found) return found;
      }
    }

    return null;
  }

  extractColors(node) {
    if (!node.fills || node.fills.length === 0) {
      return null;
    }

    return node.fills
      .filter(fill => fill.visible !== false)
      .map(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          return {
            type: 'solid',
            color: this.rgbaToHex(fill.color, fill.opacity),
            opacity: fill.opacity !== undefined ? fill.opacity : 1
          };
        } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
          return {
            type: 'gradient-linear',
            stops: fill.gradientStops.map(stop => ({
              color: this.rgbaToHex(stop.color, stop.color?.opacity),
              position: stop.position
            })),
            angle: fill.gradientHandlePositions ? this.calculateGradientAngle(fill.gradientHandlePositions) : 90
          };
        } else if (fill.type === 'IMAGE') {
          return {
            type: 'image',
            scaleMode: fill.scaleMode,
            rotation: fill.rotation
          };
        }
        return fill;
      });
  }

  extractStrokes(node) {
    if (!node.strokes || node.strokes.length === 0) {
      return null;
    }

    return node.strokes
      .filter(stroke => stroke.visible !== false)
      .map(stroke => {
        if (stroke.type === 'SOLID' && stroke.color) {
          return {
            type: 'solid',
            color: this.rgbaToHex(stroke.color, stroke.opacity),
            weight: node.strokeWeight || 1,
            opacity: stroke.opacity !== undefined ? stroke.opacity : 1
          };
        }
        return stroke;
      });
  }

  extractEffects(node) {
    if (!node.effects || node.effects.length === 0) {
      return null;
    }

    return node.effects
      .filter(effect => effect.visible !== false)
      .map(effect => {
        if (effect.type === 'DROP_SHADOW') {
          return {
            type: 'drop-shadow',
            color: this.rgbaToHex(effect.color, effect.color?.opacity),
            offset: {
              x: effect.offset?.x || 0,
              y: effect.offset?.y || 0
            },
            radius: effect.radius || 0,
            spread: effect.spread || 0,
            opacity: effect.color?.opacity || 1
          };
        } else if (effect.type === 'INNER_SHADOW') {
          return {
            type: 'inner-shadow',
            color: this.rgbaToHex(effect.color, effect.color?.opacity),
            offset: {
              x: effect.offset?.x || 0,
              y: effect.offset?.y || 0
            },
            radius: effect.radius || 0,
            opacity: effect.color?.opacity || 1
          };
        } else if (effect.type === 'LAYER_BLUR') {
          return {
            type: 'blur',
            radius: effect.radius || 0
          };
        } else if (effect.type === 'BACKGROUND_BLUR') {
          return {
            type: 'background-blur',
            radius: effect.radius || 0
          };
        }
        return effect;
      });
  }

  extractTypography(node) {
    if (!node.style) {
      return null;
    }

    return {
      fontFamily: node.style.fontFamily || 'Inter',
      fontWeight: node.style.fontWeight || 400,
      fontSize: node.style.fontSize || 16,
      lineHeight: node.style.lineHeightPx || node.style.lineHeight || 1.5,
      letterSpacing: node.style.letterSpacing || 0,
      textAlignHorizontal: node.style.textAlignHorizontal || 'LEFT',
      textAlignVertical: node.style.textAlignVertical || 'TOP',
      textCase: node.style.textCase || 'ORIGINAL',
      textDecoration: node.style.textDecoration || 'NONE'
    };
  }

  extractBorderRadius(node) {
    if (!node.cornerRadius && node.cornerRadius !== 0) {
      return null;
    }
    return node.cornerRadius;
  }

  extractChildren(children) {
    if (!children || children.length === 0) {
      return [];
    }

    return children.map(child => ({
      name: child.name,
      type: child.type,
      width: child.absoluteBoundingBox?.width || child.width,
      height: child.absoluteBoundingBox?.height || child.height,
      x: child.absoluteBoundingBox?.x || 0,
      y: child.absoluteBoundingBox?.y || 0,
      fills: this.extractColors(child),
      strokes: this.extractStrokes(child),
      effects: this.extractEffects(child),
      typography: this.extractTypography(child),
      borderRadius: this.extractBorderRadius(child),
      children: child.children ? this.extractChildren(child.children) : []
    }));
  }

  rgbaToHex(color, opacity = 1) {
    if (!color) {
      return '#000000';
    }

    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);

    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    if (opacity < 1 && opacity > 0) {
      const alpha = Math.round(opacity * 255);
      return `${hex}${alpha.toString(16).padStart(2, '0')}`;
    }

    return hex;
  }

  calculateGradientAngle(handlePositions) {
    if (!handlePositions || handlePositions.length < 2) {
      return 90;
    }

    const p1 = handlePositions[0];
    const p2 = handlePositions[1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return Math.round(angle);
  }

  extractDesignTokens(figmaData) {
    const document = figmaData.document;
    const rawTokens = {
      colors: {},
      typography: {},
      spacing: {},
      effects: {},
      borderRadius: {}
    };

    // Traverse the entire document to extract tokens
    this.traverseForTokens(document, rawTokens);

    // Deduplicate and improve naming
    const tokens = this.processTokens(rawTokens);

    return tokens;
  }

  processTokens(rawTokens) {
    const tokens = {
      colors: this.deduplicateAndNameColors(rawTokens.colors),
      typography: this.deduplicateAndNameTypography(rawTokens.typography),
      spacing: this.deduplicateAndNameSpacing(rawTokens.spacing),
      effects: this.deduplicateAndNameEffects(rawTokens.effects),
      borderRadius: this.deduplicateAndNameBorderRadius(rawTokens.borderRadius)
    };

    return tokens;
  }

  deduplicateAndNameColors(colors) {
    // Group colors by hex value
    const colorGroups = {};
    Object.entries(colors).forEach(([name, value]) => {
      if (!colorGroups[value]) {
        colorGroups[value] = [];
      }
      colorGroups[value].push(name);
    });

    // Generate semantic names based on color properties
    const result = {};
    let colorIndex = 0;

    Object.entries(colorGroups).forEach(([hex, names]) => {
      // Try to extract semantic meaning from names
      const semanticName = this.inferColorSemanticName(names, hex);
      const tokenName = semanticName || `color-${colorIndex}`;
      result[tokenName] = hex;
      colorIndex++;
    });

    return result;
  }

  inferColorSemanticName(names, hex) {
    const lowerNames = names.map(n => n.toLowerCase());

    // Check for common color keywords
    if (lowerNames.some(n => n.includes('primary'))) return 'primary';
    if (lowerNames.some(n => n.includes('secondary'))) return 'secondary';
    if (lowerNames.some(n => n.includes('accent'))) return 'accent';
    if (lowerNames.some(n => n.includes('success') || n.includes('green'))) return 'success';
    if (lowerNames.some(n => n.includes('error') || n.includes('red'))) return 'error';
    if (lowerNames.some(n => n.includes('warning') || n.includes('yellow'))) return 'warning';
    if (lowerNames.some(n => n.includes('info') || n.includes('blue'))) return 'info';

    // Check for background/foreground
    if (lowerNames.some(n => n.includes('background') || n.includes('bg'))) {
      return this.isLightColor(hex) ? 'background-light' : 'background-dark';
    }
    if (lowerNames.some(n => n.includes('text') || n.includes('foreground'))) {
      return this.isLightColor(hex) ? 'text-light' : 'text-dark';
    }

    // Check for border colors
    if (lowerNames.some(n => n.includes('border') || n.includes('stroke'))) {
      return 'border';
    }

    // Infer from hex value
    return this.generateColorNameFromHex(hex);
  }

  generateColorNameFromHex(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness < 50) return 'gray-900';
    if (brightness < 100) return 'gray-800';
    if (brightness < 150) return 'gray-700';
    if (brightness < 200) return 'gray-600';
    if (brightness < 230) return 'gray-500';
    if (brightness < 245) return 'gray-400';
    if (brightness < 250) return 'gray-300';
    if (brightness < 253) return 'gray-200';
    return 'gray-100';
  }

  isLightColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  }

  deduplicateAndNameTypography(typography) {
    // Group by font family + weight combination
    const typeGroups = {};
    Object.entries(typography).forEach(([name, value]) => {
      const key = `${value.fontFamily}-${value.fontWeight}-${value.fontSize}`;
      if (!typeGroups[key]) {
        typeGroups[key] = [];
      }
      typeGroups[key].push({ name, value });
    });

    const result = {};
    let typeIndex = 0;

    Object.entries(typeGroups).forEach(([key, items]) => {
      const first = items[0].value;
      const semanticName = this.inferTypographySemanticName(first);
      const tokenName = semanticName || `font-${typeIndex}`;
      result[tokenName] = first;
      typeIndex++;
    });

    return result;
  }

  inferTypographySemanticName(typography) {
    const { fontSize, fontWeight, fontFamily } = typography;

    // Infer from size
    let size = '';
    if (fontSize <= 12) size = 'xs';
    else if (fontSize <= 14) size = 'sm';
    else if (fontSize <= 16) size = 'base';
    else if (fontSize <= 18) size = 'lg';
    else if (fontSize <= 20) size = 'xl';
    else if (fontSize <= 24) size = '2xl';
    else if (fontSize <= 30) size = '3xl';
    else size = '4xl';

    // Infer from weight
    let weight = '';
    if (fontWeight <= 400) weight = 'regular';
    else if (fontWeight <= 500) weight = 'medium';
    else if (fontWeight <= 600) weight = 'semibold';
    else weight = 'bold';

    // Infer from font family
    let family = 'body';
    if (fontFamily.toLowerCase().includes('heading') || fontSize > 20) {
      family = 'heading';
    }

    return `font-${family}-${weight}-${size}`;
  }

  deduplicateAndNameSpacing(spacing) {
    // Group by value
    const spacingGroups = {};
    Object.entries(spacing).forEach(([name, value]) => {
      const numericValue = parseInt(value);
      if (!spacingGroups[numericValue]) {
        spacingGroups[numericValue] = [];
      }
      spacingGroups[numericValue].push(name);
    });

    const result = {};
    const spacingScale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];

    Object.entries(spacingGroups).forEach(([value, names]) => {
      const numericValue = parseInt(value);
      const scaleIndex = spacingScale.indexOf(numericValue);

      if (scaleIndex !== -1) {
        result[`space-${scaleIndex}`] = `${value}px`;
      } else {
        // Custom spacing
        result[`space-custom-${value}`] = `${value}px`;
      }
    });

    return result;
  }

  deduplicateAndNameEffects(effects) {
    // Group by shadow value
    const effectGroups = {};
    Object.entries(effects).forEach(([name, value]) => {
      if (!effectGroups[value]) {
        effectGroups[value] = [];
      }
      effectGroups[value].push(name);
    });

    const result = {};
    let shadowIndex = 0;

    Object.entries(effectGroups).forEach(([value, names]) => {
      const semanticName = this.inferShadowSemanticName(names, value);
      const tokenName = semanticName || `shadow-${shadowIndex}`;
      result[tokenName] = value;
      shadowIndex++;
    });

    return result;
  }

  inferShadowSemanticName(names, value) {
    const lowerNames = names.map(n => n.toLowerCase());

    if (lowerNames.some(n => n.includes('small') || n.includes('sm'))) return 'shadow-sm';
    if (lowerNames.some(n => n.includes('medium') || n.includes('md'))) return 'shadow-md';
    if (lowerNames.some(n => n.includes('large') || n.includes('lg'))) return 'shadow-lg';
    if (lowerNames.some(n => n.includes('xl'))) return 'shadow-xl';
    if (lowerNames.some(n => n.includes('2xl'))) return 'shadow-2xl';

    // Infer from value
    const parts = value.split(' ');
    if (parts.length >= 3) {
      const blurRadius = parseInt(parts[2]);
      if (blurRadius <= 4) return 'shadow-sm';
      if (blurRadius <= 10) return 'shadow-md';
      if (blurRadius <= 20) return 'shadow-lg';
      return 'shadow-xl';
    }

    return 'shadow-md';
  }

  deduplicateAndNameBorderRadius(borderRadius) {
    // Group by value
    const radiusGroups = {};
    Object.entries(borderRadius).forEach(([name, value]) => {
      const numericValue = parseInt(value);
      if (!radiusGroups[numericValue]) {
        radiusGroups[numericValue] = [];
      }
      radiusGroups[numericValue].push(name);
    });

    const result = {};
    const radiusScale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64];

    Object.entries(radiusGroups).forEach(([value, names]) => {
      const numericValue = parseInt(value);
      const scaleIndex = radiusScale.indexOf(numericValue);

      if (scaleIndex !== -1) {
        result[`radius-${scaleIndex}`] = `${value}px`;
      } else {
        // Custom radius
        result[`radius-custom-${value}`] = `${value}px`;
      }
    });

    return result;
  }

  traverseForTokens(node, tokens) {
    // Extract colors from fills
    if (node.fills && node.fills.length > 0) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color && fill.visible !== false) {
          const color = this.rgbaToHex(fill.color, fill.opacity);
          const colorName = this.generateColorName(color, node.name);
          tokens.colors[colorName] = color;
        }
      });
    }

    // Extract colors from strokes
    if (node.strokes && node.strokes.length > 0) {
      node.strokes.forEach(stroke => {
        if (stroke.type === 'SOLID' && stroke.color && stroke.visible !== false) {
          const color = this.rgbaToHex(stroke.color, stroke.opacity);
          const colorName = this.generateColorName(color, node.name, 'stroke');
          tokens.colors[colorName] = color;
        }
      });
    }

    // Extract typography
    if (node.style && node.type === 'TEXT') {
      const fontName = this.generateFontName(node.style.fontFamily, node.style.fontWeight);
      if (!tokens.typography[fontName]) {
        tokens.typography[fontName] = {
          fontFamily: node.style.fontFamily,
          fontWeight: node.style.fontWeight,
          fontSize: node.style.fontSize,
          lineHeight: node.style.lineHeightPx || node.style.lineHeight,
          letterSpacing: node.style.letterSpacing
        };
      }
    }

    // Extract spacing from padding
    if (node.paddingLeft !== undefined) {
      tokens.spacing[`padding-${node.paddingLeft}`] = `${node.paddingLeft}px`;
    }
    if (node.paddingRight !== undefined) {
      tokens.spacing[`padding-${node.paddingRight}`] = `${node.paddingRight}px`;
    }
    if (node.paddingTop !== undefined) {
      tokens.spacing[`padding-${node.paddingTop}`] = `${node.paddingTop}px`;
    }
    if (node.paddingBottom !== undefined) {
      tokens.spacing[`padding-${node.paddingBottom}`] = `${node.paddingBottom}px`;
    }
    if (node.itemSpacing !== undefined) {
      tokens.spacing[`gap-${node.itemSpacing}`] = `${node.itemSpacing}px`;
    }

    // Extract border radius
    if (node.cornerRadius !== undefined && node.cornerRadius !== 0) {
      const radiusName = `radius-${node.cornerRadius}`;
      tokens.borderRadius[radiusName] = `${node.cornerRadius}px`;
    }

    // Extract effects (shadows)
    if (node.effects && node.effects.length > 0) {
      node.effects.forEach(effect => {
        if (effect.visible !== false) {
          if (effect.type === 'DROP_SHADOW') {
            const shadowName = this.generateShadowName(node.name);
            const shadow = `${effect.offset?.x || 0}px ${effect.offset?.y || 0}px ${effect.radius}px ${this.rgbaToHex(effect.color, effect.color?.opacity)}`;
            tokens.effects[shadowName] = shadow;
          }
        }
      });
    }

    // Recursively traverse children
    if (node.children) {
      node.children.forEach(child => this.traverseForTokens(child, tokens));
    }
  }

  generateColorName(color, nodeName, suffix = '') {
    // Try to extract a meaningful name from the node name
    const cleanName = nodeName.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanName) {
      return `${cleanName}-${suffix}`.toLowerCase().replace(/-$/, '');
    }
    return `color-${color.replace('#', '')}${suffix ? `-${suffix}` : ''}`;
  }

  generateFontName(fontFamily, fontWeight) {
    const cleanFont = fontFamily.replace(/\s+/g, '-');
    return `${cleanFont}-${fontWeight}`;
  }

  generateShadowName(nodeName) {
    const cleanName = nodeName.replace(/[^a-zA-Z0-9]/g, '');
    return cleanName ? `shadow-${cleanName.toLowerCase()}` : 'shadow';
  }
}

module.exports = FigmaClient;