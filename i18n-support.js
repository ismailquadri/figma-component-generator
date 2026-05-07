#!/usr/bin/env node

/**
 * i18n Support
 * Multi-language component generation with auto-locale Storybook stories.
 */

const fs = require('fs').promises;
const path = require('path');

class I18nSupport {
  constructor(options = {}) {
    this.projectDir = options.directory || process.cwd();
    this.i18nDir = path.join(this.projectDir, '.i18n');
    this.locales = options.locales || ['en', 'es', 'fr', 'de'];
  }

  async init() {
    console.log('🌍 Initializing i18n Support...');
    await fs.mkdir(this.i18nDir, { recursive: true });
    await this.createLocales();
    console.log('✅ i18n Support initialized!');
  }

  async createLocales() {
    const translations = {
      en: { welcome: 'Welcome', submit: 'Submit', cancel: 'Cancel' },
      es: { welcome: 'Bienvenido', submit: 'Enviar', cancel: 'Cancelar' },
      fr: { welcome: 'Bienvenue', submit: 'Soumettre', cancel: 'Annuler' },
      de: { welcome: 'Willkommen', submit: 'Einreichen', cancel: 'Abbrechen' }
    };

    for (const locale of this.locales) {
      await fs.writeFile(
        path.join(this.i18nDir, `${locale}.json`),
        JSON.stringify(translations[locale], null, 2)
      );
    }
  }

  async generateLocaleStories(componentName) {
    console.log(`🌍 Generating locale stories for ${componentName}`);
    const storyContent = this.generateStoryTemplate(componentName);
    const storyPath = path.join(this.projectDir, 'src', 'stories', `${componentName}.i18n.stories.jsx`);
    await fs.mkdir(path.dirname(storyPath), { recursive: true });
    await fs.writeFile(storyPath, storyContent);
    console.log('✅ Locale stories generated');
  }

  generateStoryTemplate(componentName) {
    return `import ${componentName} from '../components/${componentName}';

export default {
  title: 'Components/${componentName}/I18n',
  component: ${componentName},
};

const Template = (args) => <${componentName} {...args} />;

export const English = Template.bind({});
English.args = { locale: 'en' };

export const Spanish = Template.bind({});
Spanish.args = { locale: 'es' };

export const French = Template.bind({});
French.args = { locale: 'fr' };

export const German = Template.bind({});
German.args = { locale: 'de' };
`;
  }
}

module.exports = I18nSupport;