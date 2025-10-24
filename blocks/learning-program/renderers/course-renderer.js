import BaseRenderer from './base-renderer.js';

class CourseRenderer extends BaseRenderer {
  async render(container, data) {
    const courseData = this.extractLearningObjectData(data);

    const template = await this.templateLoader.loadTemplate('main');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate main content
    this.populateMainContent(element, courseData);
    this.populateRatingSection(element, courseData.rating);
    this.populateMetaSection(element, courseData);
    this.populateTagsSection(element, courseData.tags);
    this.populateOverviewSection(element, courseData);

    // For courses, fetch and show related learning objects (modules/lessons)
    await this.fetchAndPopulateCourseContent(element, courseData);

    container.innerHTML = '';
    container.appendChild(element);
  }

  async fetchAndPopulateCourseContent(element, courseData) {
    const curriculumSection = element.querySelector('[data-curriculum-section]');
    if (!curriculumSection) return;

    try {
      // Show loading state for course content
      curriculumSection.innerHTML =
        '<h2>Course Content</h2><div class="loading-modules">Loading course content...</div>';

      // First, fetch the detailed course data with modules
      const accessToken = sessionStorage.getItem('alm_access_token');
      if (!accessToken) {
        curriculumSection.innerHTML =
          '<h2>Course Content</h2><div class="error-modules">Authentication required to load course content.</div>';
        return;
      }

      // Fetch detailed course data with includes
      const detailedCourseUrl = `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${courseData.id}?include=instances.loResources.resources`;
      const detailedResponse = await fetch(detailedCourseUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      });

      if (!detailedResponse.ok) {
        throw new Error(
          `Failed to fetch detailed course content: ${detailedResponse.status} ${detailedResponse.statusText}`
        );
      }

      const detailedData = await detailedResponse.json();

      // Extract course modules from the detailed response
      const courseModules = this.extractCourseModules(detailedData);

      // Also fetch related courses for recommendations
      const relatedLOsUrl = `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${courseData.id}/relatedLOs`;
      const relatedResponse = await fetch(relatedLOsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/json',
        },
      });

      let relatedLOs = [];
      if (relatedResponse.ok) {
        const relatedData = await relatedResponse.json();
        relatedLOs = relatedData.data || [];
      }

      // Render both course modules and recommendations
      await this.renderCourseContentAndRecommendations(
        curriculumSection,
        courseModules,
        relatedLOs
      );
    } catch (error) {
      // Log error and show user-friendly message
      curriculumSection.innerHTML =
        '<h2>Course Content</h2><div class="error-modules">Failed to load course content. Please try again later.</div>';
    }
  }

  static extractCourseModules(detailedData) {
    const modules = [];
    const included = detailedData.included || [];

    // Find learning object resources
    const loResources = included.filter((item) => item.type === 'learningObjectResource');
    const resources = included.filter((item) => item.type === 'resource');

    loResources.forEach((loResource) => {
      const resourceIds = loResource.relationships?.resources?.data || [];
      resourceIds.forEach((resourceRef) => {
        const resource = resources.find((r) => r.id === resourceRef.id);
        if (resource) {
          modules.push({
            id: loResource.id,
            name: loResource.attributes.localizedMetadata?.[0]?.name || 'Untitled Module',
            duration:
              resource.attributes.desiredDuration || resource.attributes.authorDesiredDuration || 0,
            contentType: resource.attributes.contentType || 'Content',
            resourceType: loResource.attributes.resourceType || 'Elearning',
            hasQuiz: resource.attributes.hasQuiz || false,
            resource,
          });
        }
      });
    });

    return modules;
  }

  async renderCourseContentAndRecommendations(container, courseModules, relatedLOs) {
    let content = '';

    // Render course modules if available
    if (courseModules.length > 0) {
      content += `
        <div class="course-modules-section">
          <div class="module-section">
            <div class="module-section-header">
              <h3>Course Modules</h3>
              <span class="module-count">${courseModules.length} modules</span>
            </div>
            <div class="module-list">
              ${courseModules.map((module) => this.renderCourseModule(module)).join('')}
            </div>
          </div>
        </div>
      `;
    }

    // Add recommendations block if related courses are available
    if (relatedLOs.length > 0) {
      content += `
        <div class="recommendations-block-wrapper" data-block="recommendations">
          <div data-course-id="${courseModules.length > 0 && courseModules[0].id ? courseModules[0].id : ''}"></div>
        </div>
      `;
    }

    if (!content) {
      content = '<div class="no-modules">No course content available.</div>';
    }

    container.innerHTML = content;
  }

  renderCourseModule(module) {
    const duration = module.duration > 0 ? `${module.duration / 60} min` : 'Duration not specified';
    const contentTypeIcon = this.getContentTypeIcon(module.contentType);

    return `
      <div class="module-item">
        <div class="module-icon">
          ${contentTypeIcon}
        </div>
        <div class="module-info">
          <h4 class="module-title">${module.name}</h4>
          <div class="module-meta">
            <span class="module-duration">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              ${duration}
            </span>
            <span class="module-type">${module.contentType}</span>
            <span class="module-resource-type">${module.resourceType}</span>
            ${module.hasQuiz ? '<span class="module-quiz-badge">Quiz</span>' : ''}
          </div>
        </div>
        <div class="module-actions">
          <button class="btn-module-start" onclick="startModule('${module.id}')">
            Start Module
          </button>
        </div>
      </div>
    `;
  }

  static getContentTypeIcon(contentType) {
    switch (contentType?.toUpperCase()) {
      case 'VIDEO':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
      case 'DOCUMENT':
      case 'PDF':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        `;
      case 'QUIZ':
      case 'ASSESSMENT':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,21H5V3H13V9H19V21Z"/>
          </svg>
        `;
      case 'INTERACTIVE':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
          </svg>
        `;
      default:
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        `;
    }
  }

  async populateModulesSection(element, data, subLOData) {
    const curriculumSection = element.querySelector('[data-curriculum-section]');
    if (!curriculumSection) return;

    curriculumSection.innerHTML = '<h2>Course Modules</h2>';

    if (data.sections.length > 0) {
      await this.renderModuleSections(curriculumSection, data.sections, subLOData);
    } else if (subLOData.length > 0) {
      await this.renderSimpleModules(curriculumSection, subLOData);
    }
  }

  async renderModuleSections(container, sections, subLOData) {
    const modulesHtml = sections
      .map((section, index) => {
        const sectionModules = subLOData.filter(
          (module) => section.loIds && section.loIds.includes(module.id)
        );

        return `
        <div class="module-section">
          <div class="module-section-header">
            <h3>Module ${index + 1}: ${section.name || `Section ${index + 1}`}</h3>
            <span class="module-count">${sectionModules.length} lessons</span>
            ${section.mandatory ? '<span class="mandatory-badge">Required</span>' : ''}
          </div>
          <div class="module-list">
            ${sectionModules.map((module) => this.renderModuleItem(module)).join('')}
          </div>
        </div>
      `;
      })
      .join('');

    container.innerHTML += `<div class="course-modules">${modulesHtml}</div>`;
  }

  static async renderSimpleModules(container, subLOData) {
    // Create a recommendations block wrapper
    container.innerHTML += `
      <div class="recommendations-block-wrapper" data-block="recommendations">
        <div data-course-id="${subLOData.length > 0 && subLOData[0].id ? subLOData[0].id : ''}"></div>
      </div>
    `;
  }

  // Method removed as it's now in the recommendations block

  renderModuleItem(module) {
    const moduleAttrs = module.attributes;
    const moduleName = moduleAttrs.localizedMetadata?.[0]?.name || 'Unknown Course';
    const moduleOverview =
      moduleAttrs.localizedMetadata?.[0]?.overview || 'No description available';
    const moduleDuration = moduleAttrs.duration || 0;
    const moduleState = moduleAttrs.state || 'Unknown';
    const moduleType = moduleAttrs.loType || 'course';
    const moduleFormat = moduleAttrs.loFormat || 'Self Paced';
    const moduleImage = moduleAttrs.imageUrl;

    return `
      <div class="module-item">
        <div class="module-image">
          ${
            moduleImage
              ? `<img src="${moduleImage}" alt="${moduleName}" class="course-thumbnail" />`
              : `<div class="course-thumbnail-placeholder">
              ${this.getModuleIcon(moduleType)}
            </div>`
          }
        </div>
        <div class="module-info">
          <h4 class="module-title">${moduleName}</h4>
          <p class="module-description">${moduleOverview}</p>
          <div class="module-meta">
            <span class="module-duration">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
              </svg>
              ${moduleDuration > 0 ? this.formatDuration(moduleDuration) : 'Duration not specified'}
            </span>
            <span class="module-format">${moduleFormat}</span>
            <span class="module-state state-${moduleState.toLowerCase()}">${moduleState}</span>
          </div>
        </div>
        <div class="module-actions">
          <button class="btn-module-start" onclick="startModule('${module.id}')">
            View Course
          </button>
        </div>
      </div>
    `;
  }

  // Method removed as it's now in the recommendations block

  static getModuleIcon(moduleType) {
    switch (moduleType.toLowerCase()) {
      case 'video':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        `;
      case 'document':
      case 'pdf':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
        `;
      case 'quiz':
      case 'assessment':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,21H5V3H13V9H19V21Z"/>
          </svg>
        `;
      case 'interactive':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
          </svg>
        `;
      default:
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
        `;
    }
  }
}

export default CourseRenderer;
