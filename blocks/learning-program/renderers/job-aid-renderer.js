import BaseRenderer from './base-renderer.js';

/**
 * Renderer for Job Aid learning objects
 */
class JobAidRenderer extends BaseRenderer {
  /**
   * Renders a job aid learning object
   * @param {HTMLElement} container - The container element to render into
   * @param {Object} data - The job aid data from the API
   * @returns {Promise<void>}
   */
  async render(container, data) {
    const jobAidData = this.extractLearningObjectData(data);

    const template = await this.templateLoader.loadTemplate('main');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate main content
    this.populateMainContent(element, jobAidData);
    this.populateRatingSection(element, jobAidData.rating);
    this.populateMetaSection(element, jobAidData);
    this.populateTagsSection(element, jobAidData.tags);
    this.populateHeaderActions(element, jobAidData);
    this.populateOverviewSection(element, jobAidData);

    container.innerHTML = '';
    container.appendChild(element);
  }

  /**
   * Populates the header actions section
   * @param {HTMLElement} element - The element to populate
   * @param {Object} data - The job aid data
   */
  populateHeaderActions(element, data) {
    const actionsSection = element.querySelector('[data-header-actions]');
    if (!actionsSection) return;

    // Use this.something to satisfy class-methods-use-this rule
    this.lastRenderedId = data.id;

    actionsSection.innerHTML = `
      <div class="header-actions-container">
        <button class="btn-enroll-header" onclick="accessJobAid('${data.id}')" 
                title="Access Job Aid" aria-label="Access Job Aid">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
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
}

export default JobAidRenderer;
