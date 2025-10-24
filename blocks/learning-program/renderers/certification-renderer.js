import BaseRenderer from './base-renderer.js';

class CertificationRenderer extends BaseRenderer {
  async render(container, data, subLOData = []) {
    const certificationData = this.extractLearningObjectData(data);

    const template = await this.templateLoader.loadTemplate('main');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate main content
    this.populateMainContent(element, certificationData);
    this.populateRatingSection(element, certificationData.rating);
    this.populateMetaSection(element, certificationData);
    this.populateTagsSection(element, certificationData.tags);
    this.populateHeaderActions(element, certificationData);
    this.populateOverviewSection(element, certificationData);

    // For certifications, show requirements and prerequisites
    if (certificationData.sections.length > 0 || subLOData.length > 0) {
      await this.populateRequirementsSection(element, certificationData, subLOData);
    }

    container.innerHTML = '';
    container.appendChild(element);
  }

  static populateHeaderActions(element, data) {
    const actionsSection = element.querySelector('[data-header-actions]');
    if (!actionsSection) return;

    actionsSection.innerHTML = `
      <div class="header-actions-container">
        <button class="btn-enroll-header" onclick="enrollInCertification('${data.id}')" 
                title="Start Certification" aria-label="Start Certification">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L13.09,8.26L22,9L17,14L18.18,22.74L12,19.77L5.82,22.74L7,14L2,9L10.91,8.26L12,2Z"/>
          </svg>
        </button>
        <button class="btn-wishlist-header ${data.isBookmarked ? 'bookmarked' : ''}" onclick="toggleWishlist('${data.id}', ${data.isBookmarked})">
          ${data.isBookmarked ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </button>
        <button class="btn-bookmark-header ${data.isBookmarked ? 'bookmarked' : ''}" 
                onclick="toggleBookmark('${data.id}', ${data.isBookmarked})"
                title="${data.isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}"
                aria-label="${data.isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}">
          ${
            data.isBookmarked
              ? `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
          `
              : `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          `
          }
        </button>
      </div>
    `;
  }

  async populateRequirementsSection(element, data, subLOData) {
    const curriculumSection = element.querySelector('[data-curriculum-section]');
    if (!curriculumSection) return;

    curriculumSection.innerHTML = '<h2>Certification Requirements</h2>';

    if (data.sections.length > 0) {
      await this.renderRequirementSections(curriculumSection, data.sections, subLOData);
    } else if (subLOData.length > 0) {
      await this.renderSimpleRequirements(curriculumSection, subLOData);
    }
  }

  async renderRequirementSections(container, sections, subLOData) {
    const requirementsHtml = sections
      .map((section, index) => {
        const sectionRequirements = subLOData.filter(
          (requirement) => section.loIds && section.loIds.includes(requirement.id)
        );

        return `
        <div class="requirement-section">
          <div class="requirement-section-header">
            <h3>${section.name || `Requirement Group ${index + 1}`}</h3>
            <div class="requirement-meta">
              <span class="requirement-count">${sectionRequirements.length} requirements</span>
              ${section.mandatory ? '<span class="mandatory-badge">Mandatory</span>' : '<span class="optional-badge">Optional</span>'}
            </div>
          </div>
          <div class="requirement-list">
            ${sectionRequirements.map((requirement) => this.renderRequirementItem(requirement)).join('')}
          </div>
        </div>
      `;
      })
      .join('');

    container.innerHTML += `<div class="certification-requirements">${requirementsHtml}</div>`;
  }

  async renderSimpleRequirements(container, subLOData) {
    const requirementsHtml = subLOData
      .map((requirement) => this.renderRequirementItem(requirement))
      .join('');

    container.innerHTML += `
      <div class="certification-requirements">
        <div class="requirement-section">
          <div class="requirement-section-header">
            <h3>Prerequisites</h3>
            <span class="requirement-count">${subLOData.length} requirements</span>
          </div>
          <div class="requirement-list">
            ${requirementsHtml}
          </div>
        </div>
      </div>
    `;
  }

  renderRequirementItem(requirement) {
    const requirementAttrs = requirement.attributes;
    const requirementName = requirementAttrs.localizedMetadata?.[0]?.name || 'Unknown Requirement';
    const requirementDuration = requirementAttrs.duration || 0;
    const requirementState = requirementAttrs.state || 'Unknown';
    const requirementType = requirementAttrs.loType || 'Unknown';

    return `
      <div class="requirement-item">
        <div class="requirement-status">
          ${this.getRequirementStatusIcon(requirementState)}
        </div>
        <div class="requirement-icon">
          ${this.getRequirementIcon(requirementType)}
        </div>
        <div class="requirement-info">
          <h4 class="requirement-title">${requirementName}</h4>
          <div class="requirement-meta">
            <span class="requirement-type">${requirementType}</span>
            ${
              requirementDuration > 0
                ? `
              <span class="requirement-duration">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
                ${this.formatDuration(requirementDuration)}
              </span>
            `
                : ''
            }
            <span class="requirement-state state-${requirementState.toLowerCase()}">${requirementState}</span>
          </div>
        </div>
        <div class="requirement-actions">
          <button class="btn-requirement-view" onclick="viewRequirement('${requirement.id}')">
            View
          </button>
        </div>
      </div>
    `;
  }

  static getRequirementStatusIcon(state) {
    switch (state.toLowerCase()) {
      case 'completed':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#4caf50">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        `;
      case 'in_progress':
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff9800">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6Z"/>
          </svg>
        `;
      default:
        return `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#9e9e9e">
            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z"/>
          </svg>
        `;
    }
  }

  static getRequirementIcon(requirementType) {
    switch (requirementType.toLowerCase()) {
      case 'course':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/>
          </svg>
        `;
      case 'assessment':
      case 'exam':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1H5C3.89,1 3,1.89 3,3V21A2,2 0 0,0 5,23H19A2,2 0 0,0 21,21V9M19,21H5V3H13V9H19V21Z"/>
          </svg>
        `;
      case 'project':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19Z"/>
          </svg>
        `;
      case 'experience':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,6C20.58,6 21.05,6.2 21.42,6.59C21.8,7 22,7.45 22,8V19C22,19.55 21.8,20 21.42,20.41C21.05,20.8 20.58,21 20,21H4C3.42,21 2.95,20.8 2.58,20.41C2.2,20 2,19.55 2,19V8C2,7.45 2.2,7 2.58,6.59C2.95,6.2 3.42,6 4,6H8V4C8,3.42 8.2,2.95 8.58,2.58C8.95,2.2 9.42,2 10,2H14C14.58,2 15.05,2.2 15.42,2.58C15.8,2.95 16,3.42 16,4V6H20M4,8V19H20V8H4M10,4V6H14V4H10Z"/>
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

export default CertificationRenderer;
