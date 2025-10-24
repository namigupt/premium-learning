// Template loader utility for learning program block
class TemplateLoader {
  constructor(basePath = '/blocks/learning-program/templates/') {
    this.basePath = basePath;
    this.cache = new Map();
  }

  async loadTemplate(templateName) {
    if (this.cache.has(templateName)) {
      return this.cache.get(templateName);
    }

    try {
      const response = await fetch(`${this.basePath}${templateName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${templateName}`);
      }
      const template = await response.text();
      this.cache.set(templateName, template);
      return template;
    } catch (error) {
      // Log error silently and return empty string
      return '';
    }
  }

  // Helper method to replace data attributes with actual content
  static populateTemplate(template, data) {
    let populatedTemplate = template;

    Object.keys(data).forEach((key) => {
      const placeholder = `data-${key}`;
      const value = data[key] || '';

      // Replace data attributes in element attributes
      populatedTemplate = populatedTemplate.replace(
        new RegExp(`${placeholder}(?=\\s|>|$)`, 'g'),
        value
      );

      // Replace data attributes as content placeholders
      populatedTemplate = populatedTemplate.replace(
        new RegExp(`<[^>]*${placeholder}[^>]*></[^>]*>`, 'g'),
        value
      );
    });

    return populatedTemplate;
  }

  // Create DOM element from template string
  static createElementFromTemplate(template) {
    const div = document.createElement('div');
    div.innerHTML = template.trim();
    return div.firstChild;
  }
}

export default TemplateLoader;
