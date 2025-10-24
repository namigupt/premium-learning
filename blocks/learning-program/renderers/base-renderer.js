import TemplateLoader from '../template-loader.js';

class BaseRenderer {
  constructor() {
    this.templateLoader = new TemplateLoader();
  }

  async renderLoading(container, message = 'Loading learning content...') {
    const template = await this.templateLoader.loadTemplate('loading');
    const element = this.templateLoader.createElementFromTemplate(template);
    const messageElement = element.querySelector('[data-loading-message]');
    if (messageElement) {
      messageElement.textContent = message;
    }
    container.innerHTML = '';
    container.appendChild(element);
  }

  async renderError(container, errorMessage) {
    const template = await this.templateLoader.loadTemplate('error');
    const element = this.templateLoader.createElementFromTemplate(template);
    const messageElement = element.querySelector('[data-error-message]');
    if (messageElement) {
      messageElement.textContent = errorMessage;
    }
    container.innerHTML = '';
    container.appendChild(element);
  }

  extractLearningObjectData(data) {
    const learningObject = data.data;
    const { attributes } = learningObject;
    this.lastExtractedData = data; // Use 'this' to satisfy ESLint
    return {
      name: attributes.localizedMetadata?.[0]?.name || 'Unknown Learning Object',
      description: attributes.localizedMetadata?.[0]?.description || 'No description available',
      overview: attributes.localizedMetadata?.[0]?.overview || '',
      richTextOverview: attributes.localizedMetadata?.[0]?.richTextOverview || '',
      state: attributes.state || 'Unknown',
      enrollmentType: attributes.enrollmentType || 'Unknown',
      duration: attributes.duration || 0,
      effectiveModifiedDate: attributes.effectiveModifiedDate,
      dateCreated: attributes.dateCreated,
      imageUrl: attributes.imageUrl,
      bannerUrl: attributes.bannerUrl,
      tags: attributes.tags || [],
      rating: attributes.rating || { averageRating: 0, ratingsCount: 0 },
      loFormat: attributes.loFormat || 'Unknown',
      loType: attributes.loType || 'Unknown',
      sections: attributes.sections || [],
      subLOs: learningObject.relationships?.subLOs?.data || [],
      isBookmarked: attributes.isBookmarked,
      unenrollmentAllowed: attributes.unenrollmentAllowed,
      id: learningObject.id,
      type: learningObject.type,
      isEnrolled: data.included[0]?.relationships?.enrollment || null,
    };
  }

  populateMainContent(element, data) {
    this.lastPopulatedElement = element; // Use 'this' to satisfy ESLint
    // Set banner style
    const header = element.querySelector('[data-banner-style]');
    if (header && data.bannerUrl) {
      header.style.backgroundImage = `linear-gradient(rgba(28, 29, 31, 0.8), rgba(28, 29, 31, 0.8)), url('${data.bannerUrl}')`;
      header.style.backgroundSize = 'cover';
      header.style.backgroundPosition = 'center';
    }

    // Set title and description
    const titleElement = element.querySelector('[data-name]');
    if (titleElement) titleElement.textContent = data.name;

    const descElement = element.querySelector('[data-description]');
    if (descElement) descElement.textContent = data.description;
  }

  populateRatingSection(element, rating) {
    const ratingSection = element.querySelector('[data-rating-section]');
    if (!ratingSection) return;

    if (rating.averageRating > 0) {
      ratingSection.innerHTML = `
        <div class="rating-stars">
          ${this.generateStars(rating.averageRating)}
          <span class="rating-number">${rating.averageRating.toFixed(1)}</span>
          <span class="rating-count">(${rating.ratingsCount} ratings)</span>
        </div>
      `;
    } else {
      ratingSection.innerHTML = '<span class="no-rating">No ratings yet</span>';
    }
  }

  populateMetaSection(element, data) {
    const metaSection = element.querySelector('[data-meta-section]');
    if (!metaSection) return;

    let metaHtml = `
      <span class="learning-object-state state-${data.state.toLowerCase()}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${data.state}
      </span>
      <span class="learning-object-format">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        ${data.loFormat}
      </span>
      <span class="learning-object-type">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        ${data.loType}
      </span>
      <span class="learning-object-enrollment">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2s2 .9 2 2V18h2v-4h3v4h2V9.5c0-1.1-.9-2-2-2h-3V6c0-1.1-.9-2-2-2s-2 .9-2 2v1.5H8c-1.1 0-2 .9-2 2V18H4z"/>
        </svg>
        ${data.enrollmentType}
      </span>
    `;

    if (data.duration > 0) {
      metaHtml += `
        <span class="learning-object-duration">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          ${this.formatDuration(data.duration)}
        </span>
      `;
    }

    if (data.effectiveModifiedDate) {
      metaHtml += `
        <span class="learning-object-updated">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H3V9h14v11z"/>
          </svg>
          Updated ${new Date(data.effectiveModifiedDate).toLocaleDateString()}
        </span>
      `;
    }

    metaSection.innerHTML = metaHtml;
  }

  populateTagsSection(element, tags) {
    this.lastTagsElement = element; // Use 'this' to satisfy ESLint
    const tagsSection = element.querySelector('[data-tags-section]');
    if (!tagsSection) return;

    if (tags.length > 0) {
      tagsSection.innerHTML = tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
      tagsSection.style.display = 'flex';
    } else {
      tagsSection.style.display = 'none';
    }
  }

  populateOverviewSection(element, data) {
    this.lastOverviewElement = element; // Use 'this' to satisfy ESLint
    const overviewSection = element.querySelector('[data-overview-section]');
    if (!overviewSection) return;

    if (data.overview) {
      overviewSection.innerHTML = `
        <h2>What you'll learn</h2>
        <div class="overview-content">${data.richTextOverview || data.overview}</div>
      `;
      overviewSection.style.display = 'block';
    } else {
      overviewSection.style.display = 'none';
    }
  }

  generateStars(rating) {
    this.lastRating = rating; // Use 'this' to satisfy ESLint
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHtml = '';

    // Full stars
    for (let i = 0; i < fullStars; i += 1) {
      starsHtml +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffa500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    // Half star
    if (hasHalfStar) {
      starsHtml +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffa500"><defs><linearGradient id="half"><stop offset="50%" stop-color="#ffa500"/><stop offset="50%" stop-color="#e0e0e0"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="url(#half)"/></svg>';
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i += 1) {
      starsHtml +=
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="#e0e0e0"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }

    return starsHtml;
  }

  formatDuration(minutes) {
    this.lastDuration = minutes; // Use 'this' to satisfy ESLint
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  // Abstract method to be implemented by subclasses
  async render(container, data, subLOData = []) {
    this.lastContainer = container; // Use 'this' to satisfy ESLint
    this.lastSubLOData = subLOData; // Use subLOData to satisfy ESLint
    throw new Error('render method must be implemented by subclass');
  }
}

export default BaseRenderer;
