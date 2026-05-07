#!/usr/bin/env node

/**
 * Figma Component Properties Auto-Mapping
 * Auto-detects Figma component properties and maps them to React props with TypeScript interfaces.
 */

const fs = require('fs').promises;
const path = require('path');

class FigmaPropsMapper {
  constructor(figmaClient, options = {}) {
    this.figmaClient = figmaClient;
    this.outputDir = options.outputDir || './src/components';
    this.generateTypescript = options.typescript !== false;
    this.includeValidation = options.validation !== false;
  }

  async mapComponentProps(fileId, componentId) {
    console.log('🎯 Mapping Figma Component Properties...');
    console.log(`File ID: ${fileId}`);
    console.log(`Component ID: ${componentId}`);
    console.log('');

    // Fetch component data
    const componentData = await this.figmaClient.getComponent(fileId, componentId);
    
    // Extract properties
    const properties = this.extractProperties(componentData);
    
    // Generate TypeScript interface
    const typescriptInterface = this.generateTypeScriptInterface(componentData.name, properties);
    
    // Generate React component with props
    const componentCode = this.generateComponentWithProps(componentData, properties);
    
    // Generate validation schema
    const validationSchema = this.includeValidation ? this.generateValidationSchema(properties) : null;
    
    // Generate documentation
    const documentation = this.generateDocumentation(componentData.name, properties);
    
    const result = {
      componentName: componentData.name,
      properties,
      typescriptInterface,
      componentCode,
      validationSchema,
      documentation
    };
    
    // Save to files
    await this.saveResult(componentData.name, result);
    
    console.log('✅ Properties mapped successfully!');
    console.log(`\n📝 Found ${properties.length} properties:`);
    properties.forEach(prop => {
      console.log(`   - ${prop.name}: ${prop.type}${prop.default ? ` (default: ${prop.default})` : ''}`);
    });
    
    return result;
  }

  extractProperties(componentData) {
    const properties = [];
    
    // Extract component set properties (variants)
    if (componentData.componentSetId) {
      const variantProperties = this.extractVariantProperties(componentData);
      properties.push(...variantProperties);
    }
    
    // Extract instance properties
    const instanceProperties = this.extractInstanceProperties(componentData);
    properties.push(...instanceProperties);
    
    // Extract text properties
    const textProperties = this.extractTextProperties(componentData);
    properties.push(...textProperties);
    
    // Extract boolean properties
    const booleanProperties = this.extractBooleanProperties(componentData);
    properties.push(...booleanProperties);
    
    // Extract color properties
    const colorProperties = this.extractColorProperties(componentData);
    properties.push(...colorProperties);
    
    return properties;
  }

  extractVariantProperties(componentData) {
    const properties = [];
    
    // Figma component sets have variant properties
    if (componentData.componentPropertyDefinitions) {
      Object.entries(componentData.componentPropertyDefinitions).forEach(([name, definition]) => {
        const prop = {
          name: this.toCamelCase(name),
          figmaName: name,
          type: this.mapFigmaTypeToReact(definition.type),
          defaultValue: definition.defaultValue,
          options: definition.variantOptions || [],
          description: '',
          required: false,
          source: 'variant'
        };
        
        properties.push(prop);
      });
    }
    
    return properties;
  }

  extractInstanceProperties(componentData) {
    const properties = [];
    
    // Look for instance swap properties
    if (componentData.children) {
      componentData.children.forEach(child => {
        if (child.componentPropertyDefinitions) {
          Object.entries(child.componentPropertyDefinitions).forEach(([name, definition]) => {
            if (definition.type === 'INSTANCE_SWAP') {
              const prop = {
                name: this.toCamelCase(name),
                figmaName: name,
                type: 'ReactNode',
                defaultValue: definition.defaultValue,
                options: [],
                description: 'Instance swap property',
                required: false,
                source: 'instance'
              };
              
              properties.push(prop);
            }
          });
        }
      });
    }
    
    return properties;
  }

  extractTextProperties(componentData) {
    const properties = [];
    
    // Extract text content as properties
    const extractText = (node) => {
      if (node.type === 'TEXT' && node.characters) {
        const propName = this.suggestTextPropertyName(node.name);
        const prop = {
          name: propName,
          figmaName: node.name,
          type: 'string',
          defaultValue: node.characters,
          options: [],
          description: `Text content for ${node.name}`,
          required: true,
          source: 'text'
        };
        
        properties.push(prop);
      }
      
      if (node.children) {
        node.children.forEach(extractText);
      }
    };
    
    extractText(componentData);
    return properties;
  }

  extractBooleanProperties(componentData) {
    const properties = [];
    
    // Extract boolean toggles (visibility, etc.)
    if (componentData.componentPropertyDefinitions) {
      Object.entries(componentData.componentPropertyDefinitions).forEach(([name, definition]) => {
        if (definition.type === 'BOOLEAN') {
          const prop = {
            name: this.toCamelCase(name),
            figmaName: name,
            type: 'boolean',
            defaultValue: definition.defaultValue || false,
            options: [],
            description: '',
            required: false,
            source: 'boolean'
          };
          
          properties.push(prop);
        }
      });
    }
    
    return properties;
  }

  extractColorProperties(componentData) {
    const properties = [];
    
    // Extract color fills as properties
    if (componentData.componentPropertyDefinitions) {
      Object.entries(componentData.componentPropertyDefinitions).forEach(([name, definition]) => {
        if (definition.type === 'COLOR') {
          const prop = {
            name: this.toCamelCase(name),
            figmaName: name,
            type: 'string',
            defaultValue: definition.defaultValue,
            options: [],
            description: 'Color property',
            required: false,
            source: 'color'
          };
          
          properties.push(prop);
        }
      });
    }
    
    return properties;
  }

  mapFigmaTypeToReact(figmaType) {
    const typeMap = {
      'TEXT': 'string',
      'BOOLEAN': 'boolean',
      'INSTANCE_SWAP': 'ReactNode',
      'COLOR': 'string',
      'VARIANT': 'string',
      'NUMBER': 'number'
    };
    
    return typeMap[figmaType] || 'any';
  }

  toCamelCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/^(.)/, c => c.toLowerCase());
  }

  suggestTextPropertyName(nodeName) {
    // Suggest a prop name based on the layer name
    const suggestions = {
      'title': 'title',
      'label': 'label',
      'text': 'text',
      'description': 'description',
      'heading': 'heading',
      'caption': 'caption',
      'subtitle': 'subtitle'
    };
    
    const lowerName = nodeName.toLowerCase();
    
    for (const [key, value] of Object.entries(suggestions)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    return this.toCamelCase(nodeName) || 'text';
  }

  generateTypeScriptInterface(componentName, properties) {
    let interfaceCode = `export interface ${componentName}Props {\n`;
    
    properties.forEach(prop => {
      const optional = !prop.required ? '?' : '';
      const comment = prop.description ? `  /** ${prop.description} */\n` : '';
      
      interfaceCode += comment;
      
      if (prop.options.length > 0) {
        // Generate enum type
        const enumName = `${componentName}${this.capitalize(prop.name)}`;
        interfaceCode += `  ${prop.name}${optional}: ${enumName};\n`;
      } else {
        interfaceCode += `  ${prop.name}${optional}: ${prop.type};\n`;
      }
    });
    
    interfaceCode += `}\n`;
    
    // Add enums if needed
    properties.forEach(prop => {
      if (prop.options.length > 0) {
        const enumName = `${componentName}${this.capitalize(prop.name)}`;
        interfaceCode += `\nexport type ${enumName} =\n`;
        prop.options.forEach((option, index) => {
          const comma = index < prop.options.length - 1 ? ' |' : ';';
          interfaceCode += `  | '${option}'${comma}\n`;
        });
      }
    });
    
    return interfaceCode;
  }

  generateComponentWithProps(componentData, properties) {
    const componentName = componentData.name;
    const propsInterface = `${componentName}Props`;
    
    let componentCode = `import React from 'react';\n`;
    
    if (this.generateTypescript) {
      componentCode += `import { ${propsInterface} } from './${componentName}.types';\n\n`;
    }
    
    componentCode += `export const ${componentName}: React.FC${this.generateTypescript ? `<${propsInterface}>` : ''} = (${this.generateTypescript ? '{' : 'props'}${properties.map(p => p.name).join(', ')}${this.generateTypescript ? '}' : ''}) => {\n`;
    componentCode += `  return (\n`;
    componentCode += `    <div className="${componentName.toLowerCase()}">\n`;
    componentCode += `      {/* Component implementation */}\n`;
    componentCode += `      <div>${componentName}</div>\n`;
    componentCode += `    </div>\n`;
    componentCode += `  );\n`;
    componentCode += `};\n`;
    
    componentCode += `\n`;
    componentCode += `${componentName}.defaultProps = {\n`;
    properties.filter(p => p.defaultValue !== undefined).forEach(prop => {
      const defaultValue = typeof prop.defaultValue === 'string' ? `'${prop.defaultValue}'` : prop.defaultValue;
      componentCode += `  ${prop.name}: ${defaultValue},\n`;
    });
    componentCode += `};\n`;
    
    return componentCode;
  }

  generateValidationSchema(properties) {
    // Generate a simple validation schema (could be Zod, Yup, etc.)
    let schema = `const ${componentName}Schema = {\n`;
    
    properties.forEach(prop => {
      schema += `  ${prop.name}: {\n`;
      schema += `    type: '${prop.type}',\n`;
      schema += `    required: ${prop.required},\n`;
      
      if (prop.options.length > 0) {
        schema += `    enum: ${JSON.stringify(prop.options)},\n`;
      }
      
      if (prop.defaultValue !== undefined) {
        schema += `    default: ${typeof prop.defaultValue === 'string' ? `'${prop.defaultValue}'` : prop.defaultValue},\n`;
      }
      
      schema += `  },\n`;
    });
    
    schema += `};\n`;
    
    return schema;
  }

  generateDocumentation(componentName, properties) {
    let docs = `# ${componentName}\n\n`;
    docs += `## Props\n\n`;
    docs += `| Prop | Type | Default | Required | Description |\n`;
    docs += `|------|------|---------|----------|-------------|\n`;
    
    properties.forEach(prop => {
      const defaultVal = prop.defaultValue !== undefined ? `\`${prop.defaultValue}\`` : '-';
      const required = prop.required ? 'Yes' : 'No';
      docs += `| ${prop.name} | \`${prop.type}\` | ${defaultVal} | ${required} | ${prop.description} |\n`;
    });
    
    docs += `\n## Usage\n\n`;
    docs += `\`\`\`tsx\n`;
    docs += `import { ${componentName} } from './${componentName}';\n\n`;
    docs += `<${componentName}\n`;
    properties.filter(p => p.required).forEach(prop => {
      docs += `  ${prop.name}="..."\n`;
    });
    docs += `/>\n`;
    docs += `\`\`\`\n`;
    
    return docs;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async saveResult(componentName, result) {
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Save TypeScript types
    if (this.generateTypescript && result.typescriptInterface) {
      const typesFile = path.join(this.outputDir, `${componentName}.types.ts`);
      await fs.writeFile(typesFile, result.typescriptInterface);
      console.log(`✓ Types saved: ${typesFile}`);
    }
    
    // Save component
    if (result.componentCode) {
      const componentFile = path.join(this.outputDir, `${componentName}.tsx`);
      await fs.writeFile(componentFile, result.componentCode);
      console.log(`✓ Component saved: ${componentFile}`);
    }
    
    // Save validation schema
    if (result.validationSchema) {
      const schemaFile = path.join(this.outputDir, `${componentName}.schema.ts`);
      await fs.writeFile(schemaFile, result.validationSchema);
      console.log(`✓ Schema saved: ${schemaFile}`);
    }
    
    // Save documentation
    if (result.documentation) {
      const docsFile = path.join(this.outputDir, `${componentName}.md`);
      await fs.writeFile(docsFile, result.documentation);
      console.log(`✓ Documentation saved: ${docsFile}`);
    }
  }

  async mapAllComponents(fileId) {
    console.log('🎯 Mapping All Components in File...');
    console.log(`File ID: ${fileId}`);
    console.log('');

    // Fetch file data
    const fileData = await this.figmaClient.getFile(fileId);
    
    // Find all components
    const components = this.findComponents(fileData);
    
    console.log(`Found ${components.length} components\n`);
    
    const results = [];
    
    for (const component of components) {
      try {
        const result = await this.mapComponentProps(fileId, component.id);
        results.push(result);
      } catch (error) {
        console.error(`Error mapping ${component.name}:`, error.message);
      }
    }
    
    // Generate summary
    const summary = this.generateMappingSummary(results);
    const summaryFile = path.join(this.outputDir, 'props-mapping-summary.md');
    await fs.writeFile(summaryFile, summary);
    console.log(`\n✓ Summary saved: ${summaryFile}`);
    
    return results;
  }

  findComponents(node) {
    const components = [];
    
    const traverse = (node) => {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        components.push({
          id: node.id,
          name: node.name,
          type: node.type
        });
      }
      
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    traverse(node);
    return components;
  }

  generateMappingSummary(results) {
    let summary = `# Component Properties Mapping Summary\n\n`;
    summary += `Generated: ${new Date().toISOString()}\n\n`;
    summary += `## Mapped Components (${results.length})\n\n`;
    
    results.forEach(result => {
      summary += `### ${result.componentName}\n`;
      summary += `- Properties: ${result.properties.length}\n`;
      summary += `- Variants: ${result.properties.filter(p => p.source === 'variant').length}\n`;
      summary += `- Text Props: ${result.properties.filter(p => p.source === 'text').length}\n`;
      summary += `- Boolean Props: ${result.properties.filter(p => p.source === 'boolean').length}\n`;
      summary += `- Instance Props: ${result.properties.filter(p => p.source === 'instance').length}\n`;
      summary += `\n`;
    });
    
    return summary;
  }
}

module.exports = FigmaPropsMapper;