#!/usr/bin/env node

/**
 * Component Documentation Search
 * Full-text search across components with fuzzy matching and result highlighting.
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationSearch {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.indexFile = path.join(this.projectDir, '.search', 'index.json');
  }

  async index() {
    console.log('🔍 Indexing component documentation...');
    await fs.mkdir(path.join(this.projectDir, '.search'), { recursive: true });
    
    const components = await this.scanComponents();
    const index = this.buildIndex(components);
    
    await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
    console.log(`✓ Indexed ${components.length} components`);
  }

  async scanComponents() {
    const components = [];
    const componentDirs = [
      path.join(this.projectDir, 'src', 'components'),
      path.join(this.projectDir, 'components'),
    ];

    for (const dir of componentDirs) {
      try {
        await this.scanDirectory(dir, components);
      } catch (error) {}
    }

    return components;
  }

  async scanDirectory(dir, components) {
    const files = await fs.readdir(dir, { withFileTypes: true });
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        await this.scanDirectory(fullPath, components);
      } else if (file.name.match(/\.(jsx?|tsx?|vue|svelte|md)$/)) {
        const content = await fs.readFile(fullPath, 'utf8');
        const componentName = path.basename(file.name, path.extname(file.name));
        components.push({
          name: componentName,
          path: fullPath,
          content: content.toLowerCase(),
          type: path.extname(file.name)
        });
      }
    }
  }

  buildIndex(components) {
    const index = {
      components: components.map(c => ({
        name: c.name,
        path: c.path,
        type: c.type
      })),
      searchTerms: []
    };

    components.forEach(comp => {
      const words = comp.content.split(/\s+/).filter(w => w.length > 3);
      index.searchTerms.push(...words);
    });

    index.searchTerms = [...new Set(index.searchTerms)];
    return index;
  }

  async search(query) {
    console.log(`🔍 Searching for: ${query}`);
    
    const index = await this.loadIndex();
    const results = this.fuzzySearch(query, index);
    
    console.log(`\nFound ${results.length} result(s):`);
    results.forEach(result => {
      console.log(`  - ${result.name} (${result.score.toFixed(2)})`);
    });
    
    return results;
  }

  async loadIndex() {
    try {
      const content = await fs.readFile(this.indexFile, 'utf8');
      return JSON.parse(content);
    } catch {
      await this.index();
      const content = await fs.readFile(this.indexFile, 'utf8');
      return JSON.parse(content);
    }
  }

  fuzzySearch(query, index) {
    const queryLower = query.toLowerCase();
    const results = [];

    index.components.forEach(comp => {
      let score = 0;
      
      // Exact name match
      if (comp.name.toLowerCase() === queryLower) {
        score += 100;
      }
      // Partial name match
      else if (comp.name.toLowerCase().includes(queryLower)) {
        score += 50;
      }
      
      // Search in content
      if (comp.content.includes(queryLower)) {
        score += 20;
      }

      if (score > 0) {
        results.push({ ...comp, score });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }
}

module.exports = DocumentationSearch;