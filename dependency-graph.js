#!/usr/bin/env node

/**
 * Component Dependencies Graph
 * Generates visual dependency graphs with circular dependency detection and impact analysis.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DependencyGraph {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.outputFormat = options.output || 'svg';
    this.outputPath = options.outputPath || path.join(this.projectDir, 'dependency-graph');
  }

  async generate() {
    console.log('🔗 Generating Component Dependencies Graph...');
    console.log(`📁 Directory: ${this.projectDir}`);
    console.log(`📊 Format: ${this.outputFormat}`);
    console.log('');

    await this.createOutputDirectory();
    
    // Scan for components
    const components = await this.scanComponents();
    console.log(`✓ Found ${components.length} components`);
    
    // Build dependency graph
    const graph = this.buildDependencyGraph(components);
    console.log(`✓ Built dependency graph with ${Object.keys(graph).length} nodes`);
    
    // Detect circular dependencies
    const circularDeps = this.detectCircularDependencies(graph);
    if (circularDeps.length > 0) {
      console.log(`⚠️  Found ${circularDeps.length} circular dependencies`);
      circularDeps.forEach(cycle => {
        console.log(`   - ${cycle.join(' → ')}`);
      });
    } else {
      console.log('✓ No circular dependencies detected');
    }
    
    // Generate visualization
    await this.generateVisualization(graph, circularDeps);
    
    // Generate impact analysis
    const impactAnalysis = this.generateImpactAnalysis(graph);
    await this.saveImpactAnalysis(impactAnalysis);
    
    console.log(`\n✅ Dependency graph generated successfully!`);
    console.log(`📊 Output: ${this.outputPath}.${this.outputFormat}`);
    console.log(`📋 Impact analysis: ${this.outputPath}-impact.json`);
  }

  async createOutputDirectory() {
    await fs.mkdir(path.join(this.outputPath, '..'), { recursive: true });
  }

  async scanComponents() {
    const components = [];
    const componentDirs = [
      path.join(this.projectDir, 'src', 'components'),
      path.join(this.projectDir, 'components'),
      path.join(this.projectDir, 'app', 'components'),
    ];

    for (const dir of componentDirs) {
      try {
        await this.scanDirectory(dir, components);
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    return components;
  }

  async scanDirectory(dir, components) {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        await this.scanDirectory(fullPath, components);
      } else if (file.name.match(/\.(jsx?|tsx?|vue|svelte)$/)) {
        const componentName = path.basename(file.name, path.extname(file.name));
        const content = await fs.readFile(fullPath, 'utf8');
        
        components.push({
          name: componentName,
          path: fullPath,
          content,
          imports: this.extractImports(content)
        });
      }
    }
  }

  extractImports(content) {
    const imports = [];
    
    // Match import statements
    const importPatterns = [
      /import\s+.*?\s+from\s+['"](@\/.*?|\.\/.*?)['"]/g,
      /import\s*\(\s*['"](@\/.*?|\.\/.*?)['"]\s*\)/g,
      /require\s*\(\s*['"](@\/.*?|\.\/.*?)['"]\s*\)/g,
    ];

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const importPath = match[1];
        
        // Filter out node_modules and external packages
        if (importPath.startsWith('@/') || importPath.startsWith('./')) {
          imports.push(importPath);
        }
      }
    }

    return [...new Set(imports)];
  }

  buildDependencyGraph(components) {
    const graph = {};
    const componentMap = new Map();

    // Create nodes
    components.forEach(comp => {
      graph[comp.name] = {
        name: comp.name,
        path: comp.path,
        dependencies: [],
        dependents: []
      };
      componentMap.set(comp.path, comp.name);
    });

    // Create edges
    components.forEach(comp => {
      comp.imports.forEach(importPath => {
        // Resolve import to component name
        const depName = this.resolveImportToComponent(importPath, componentMap, comp.path);
        
        if (depName && depName !== comp.name && graph[depName]) {
          graph[comp.name].dependencies.push(depName);
          graph[depName].dependents.push(comp.name);
        }
      });
    });

    return graph;
  }

  resolveImportToComponent(importPath, componentMap, currentPath) {
    // Try to resolve relative imports
    if (importPath.startsWith('./')) {
      const resolvedPath = path.resolve(path.dirname(currentPath), importPath);
      
      // Try different extensions
      const extensions = ['.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte', '/index.jsx', '/index.tsx', '/index.js', '/index.ts'];
      
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (componentMap.has(fullPath)) {
          return componentMap.get(fullPath);
        }
      }
    }
    
    // Try to resolve @/ imports
    if (importPath.startsWith('@/')) {
      const relativePath = importPath.replace('@/', '');
      const resolvedPath = path.join(this.projectDir, 'src', relativePath);
      
      if (componentMap.has(resolvedPath)) {
        return componentMap.get(resolvedPath);
      }
    }

    return null;
  }

  detectCircularDependencies(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (node, path) => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        cycles.push(path.slice(cycleStart));
        return;
      }

      if (visited.has(node)) {
        return;
      }

      visited.add(node);
      recursionStack.add(node);

      if (graph[node]) {
        graph[node].dependencies.forEach(dep => {
          dfs(dep, [...path, dep]);
        });
      }

      recursionStack.delete(node);
    };

    Object.keys(graph).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, [node]);
      }
    });

    return cycles;
  }

  async generateVisualization(graph, circularDeps) {
    const dotContent = this.generateDotFormat(graph, circularDeps);
    
    switch (this.outputFormat) {
      case 'svg':
        await this.generateSVG(dotContent);
        break;
      case 'png':
        await this.generatePNG(dotContent);
        break;
      case 'json':
        await this.generateJSON(graph);
        break;
      default:
        await this.generateSVG(dotContent);
    }
  }

  generateDotFormat(graph, circularDeps) {
    let dot = 'digraph ComponentDependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n';
    dot += '  splines=ortho;\n\n';

    // Add nodes
    Object.entries(graph).forEach(([name, data]) => {
      const isCircular = circularDeps.some(cycle => cycle.includes(name));
      const color = isCircular ? 'red' : 'lightblue';
      const penwidth = data.dependencies.length > 5 ? '2' : '1';
      
      dot += `  "${name}" [fillcolor="${color}", penwidth="${penwidth}"];\n`;
    });

    dot += '\n';

    // Add edges
    Object.entries(graph).forEach(([name, data]) => {
      data.dependencies.forEach(dep => {
        const isCircular = circularDeps.some(cycle => {
          const idx = cycle.indexOf(name);
          const nextIdx = (idx + 1) % cycle.length;
          return cycle[nextIdx] === dep;
        });
        
        const color = isCircular ? 'red' : 'gray';
        const style = isCircular ? 'dashed' : 'solid';
        
        dot += `  "${name}" -> "${dep}" [color="${color}", style="${style}"];\n`;
      });
    });

    dot += '}\n';
    return dot;
  }

  async generateSVG(dotContent) {
    const dotFile = path.join(this.outputPath, 'graph.dot');
    const svgFile = `${this.outputPath}.svg`;

    await fs.writeFile(dotFile, dotContent);

    try {
      execSync(`dot -Tsvg ${dotFile} -o ${svgFile}`);
      console.log(`✓ SVG generated: ${svgFile}`);
    } catch (error) {
      console.log('⚠️  Graphviz not found. Generating simple SVG...');
      await this.generateSimpleSVG(dotContent, svgFile);
    }

    // Clean up dot file
    await fs.unlink(dotFile).catch(() => {});
  }

  async generateSimpleSVG(dotContent, svgFile) {
    const graph = this.parseDot(dotContent);
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">\n`;
    svg += `<style>\n`;
    svg += `  .node { fill: lightblue; stroke: #333; stroke-width: 2px; }\n`;
    svg += `  .node-circular { fill: #ffcccc; stroke: red; }\n`;
    svg += `  .edge { stroke: #999; stroke-width: 2px; }\n`;
    svg += `  .edge-circular { stroke: red; stroke-dasharray: 5,5; }\n`;
    svg += `  .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }\n`;
    svg += `</style>\n`;
    
    // Simple layout - arrange nodes in a grid
    const nodes = Object.keys(graph);
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeWidth = 120;
    const nodeHeight = 40;
    const gap = 40;
    
    const positions = {};
    nodes.forEach((node, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      positions[node] = {
        x: col * (nodeWidth + gap) + 100,
        y: row * (nodeHeight + gap) + 50
      };
    });

    // Draw edges
    Object.entries(graph).forEach(([from, data]) => {
      data.dependencies.forEach(to => {
        if (positions[from] && positions[to]) {
          const isCircular = data.circularDeps?.some(cycle => 
            cycle.includes(from) && cycle.includes(to)
          );
          const fromPos = positions[from];
          const toPos = positions[to];
          
          svg += `<line x1="${fromPos.x + nodeWidth/2}" y1="${fromPos.y + nodeHeight/2}" `;
          svg += `x2="${toPos.x + nodeWidth/2}" y2="${toPos.y + nodeHeight/2}" `;
          svg += `class="edge ${isCircular ? 'edge-circular' : ''}" />\n`;
        }
      });
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = positions[node];
      const isCircular = graph[node].isCircular;
      
      svg += `<rect x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" `;
      svg += `rx="5" class="node ${isCircular ? 'node-circular' : ''}" />\n`;
      svg += `<text x="${pos.x + nodeWidth/2}" y="${pos.y + nodeHeight/2 + 4}" class="label">${node}</text>\n`;
    });

    svg += '</svg>';
    
    await fs.writeFile(svgFile, svg);
    console.log(`✓ Simple SVG generated: ${svgFile}`);
  }

  parseDot(dotContent) {
    // Simple DOT parser for the basic format we generate
    const graph = {};
    const lines = dotContent.split('\n');
    
    lines.forEach(line => {
      const arrowMatch = line.match(/"([^"]+)"\s*->\s*"([^"]+)"/);
      if (arrowMatch) {
        const [from, to] = arrowMatch.slice(1);
        if (!graph[from]) graph[from] = { dependencies: [] };
        graph[from].dependencies.push(to);
      }
    });

    return graph;
  }

  async generatePNG(dotContent) {
    const dotFile = path.join(this.outputPath, 'graph.dot');
    const pngFile = `${this.outputPath}.png`;

    await fs.writeFile(dotFile, dotContent);

    try {
      execSync(`dot -Tpng ${dotFile} -o ${pngFile}`);
      console.log(`✓ PNG generated: ${pngFile}`);
    } catch (error) {
      console.log('⚠️  Graphviz not found. Cannot generate PNG.');
    }

    await fs.unlink(dotFile).catch(() => {});
  }

  async generateJSON(graph) {
    const jsonFile = `${this.outputPath}.json`;
    await fs.writeFile(jsonFile, JSON.stringify(graph, null, 2));
    console.log(`✓ JSON generated: ${jsonFile}`);
  }

  generateImpactAnalysis(graph) {
    const analysis = {
      components: {},
      metrics: {
        totalComponents: Object.keys(graph).length,
        totalDependencies: Object.values(graph).reduce((sum, comp) => sum + comp.dependencies.length, 0),
        avgDependencies: 0,
        mostDepended: [],
        leastDepended: [],
        isolated: []
      }
    };

    // Calculate metrics per component
    Object.entries(graph).forEach(([name, data]) => {
      analysis.components[name] = {
        dependencies: data.dependencies,
        dependents: data.dependents,
        dependencyCount: data.dependencies.length,
        dependentCount: data.dependents.length,
        impactScore: data.dependents.length * (data.dependencies.length + 1)
      };
    });

    // Calculate averages
    const totalDeps = Object.values(analysis.components).reduce((sum, comp) => sum + comp.dependencyCount, 0);
    analysis.metrics.avgDependencies = (totalDeps / Object.keys(graph).length).toFixed(2);

    // Find most and least depended
    const sortedByDependents = Object.entries(analysis.components)
      .sort((a, b) => b[1].dependentCount - a[1].dependentCount);

    analysis.metrics.mostDepended = sortedByDependents.slice(0, 5).map(([name, data]) => ({
      name,
      count: data.dependentCount
    }));

    analysis.metrics.leastDepended = sortedByDependents.slice(-5).reverse().map(([name, data]) => ({
      name,
      count: data.dependentCount
    }));

    // Find isolated components
    analysis.metrics.isolated = Object.entries(analysis.components)
      .filter(([name, data]) => data.dependentCount === 0 && data.dependencyCount === 0)
      .map(([name]) => name);

    // Find critical components (high impact)
    analysis.metrics.critical = Object.entries(analysis.components)
      .filter(([name, data]) => data.impactScore > 10)
      .sort((a, b) => b[1].impactScore - a[1].impactScore)
      .map(([name, data]) => ({
        name,
        impactScore: data.impactScore,
        dependents: data.dependentCount
      }));

    return analysis;
  }

  async saveImpactAnalysis(analysis) {
    const jsonFile = `${this.outputPath}-impact.json`;
    await fs.writeFile(jsonFile, JSON.stringify(analysis, null, 2));
  }
}

module.exports = DependencyGraph;