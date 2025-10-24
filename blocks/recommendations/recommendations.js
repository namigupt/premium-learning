/**
 * Recommendations block for displaying course recommendations.
 */

/**
 * Format duration in minutes to a readable format
 * @param {number} duration - Duration in minutes
 * @returns {string} Formatted duration string
 */
function formatDuration(duration) {
  if (!duration || duration <= 0) {
    return 'Duration not specified';
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }

  return `${minutes}m`;
}

/**
 * Get an icon for a module type
 * @param {string} moduleType - The type of module
 * @returns {string} SVG icon markup
 */
function getModuleIcon(moduleType) {
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

/**
 * Renders a recommendation card for a course
 * @param {Object} course - The course data
 * @returns {string} HTML for the recommendation card
 */
function renderRecommendationCard(course) {
  const courseAttrs = course.attributes;
  const courseName = courseAttrs.localizedMetadata?.[0]?.name || 'Unknown Course';
  const courseOverview = courseAttrs.localizedMetadata?.[0]?.overview || 'No description available';
  const courseDuration = courseAttrs.duration || 0;
  const courseFormat = courseAttrs.loFormat || 'Self Paced';
  const courseImage = courseAttrs.imageUrl;

  // Format duration if available
  const formattedDuration = formatDuration(courseDuration);

  return `
    <div class="recommendation-card">
      <div class="recommendation-image">
        ${
          courseImage
            ? `<img src="${courseImage}" alt="${courseName}" class="recommendation-thumbnail" />`
            : `<div class="recommendation-thumbnail-placeholder">
            ${getModuleIcon('course')}
          </div>`
        }
      </div>
      <div class="recommendation-content">
        <h4 class="recommendation-title">${courseName}</h4>
        <p class="recommendation-description">${courseOverview}</p>
        <div class="recommendation-meta">
          <span class="recommendation-duration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
              <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
            ${formattedDuration}
          </span>
          <span class="recommendation-format">${courseFormat}</span>
        </div>
        <a href="/course?id=${course.id}" class="btn-recommendation-view" style="color: white;">
          View Course
        </a>
      </div>
    </div>
  `;
}

/**
 * Update carousel buttons state based on scroll position
 */
function updateRecommendationsButtons() {
  const slider = document.getElementById('recommendations-slider');
  const prevBtn = document.getElementById('recommendations-prev-btn');
  const nextBtn = document.getElementById('recommendations-next-btn');

  if (!slider || !prevBtn || !nextBtn) return;

  // Check if at the beginning
  prevBtn.disabled = slider.scrollLeft <= 0;

  // Check if at the end
  const maxScroll = slider.scrollWidth - slider.clientWidth;
  nextBtn.disabled = slider.scrollLeft >= maxScroll - 1; // -1 for rounding errors
}

/**
 * Setup carousel functionality
 */
function setupCarousel() {
  setTimeout(() => {
    const prevBtn = document.getElementById('recommendations-prev-btn');
    const nextBtn = document.getElementById('recommendations-next-btn');
    const slider = document.getElementById('recommendations-slider');

    if (prevBtn && nextBtn && slider) {
      prevBtn.addEventListener('click', () => {
        const cardWidth = slider.querySelector('.recommendation-card').offsetWidth + 24;
        slider.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        setTimeout(() => updateRecommendationsButtons(), 300);
      });

      nextBtn.addEventListener('click', () => {
        const cardWidth = slider.querySelector('.recommendation-card').offsetWidth + 24;
        slider.scrollBy({ left: cardWidth, behavior: 'smooth' });
        setTimeout(() => updateRecommendationsButtons(), 300);
      });

      slider.addEventListener('scroll', () => {
        updateRecommendationsButtons();
      });

      updateRecommendationsButtons();
    }
  }, 100);
}

/**
 * Fetch related courses for a given course ID
 * @param {string} courseId - The ID of the course to fetch recommendations for
 * @returns {Promise<Array>} Array of related course objects
 */
async function fetchRelatedCourses(courseId) {
  try {
    const accessToken = sessionStorage.getItem('alm_access_token');
    if (!accessToken) {
      // Authentication required to load recommendations
      return [];
    }

    const relatedLOsUrl = `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${courseId}/relatedLOs`;
    const relatedResponse = await fetch(relatedLOsUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    if (!relatedResponse.ok) {
      throw new Error(
        `Failed to fetch related courses: ${relatedResponse.status} ${relatedResponse.statusText}`
      );
    }

    const relatedData = await relatedResponse.json();
    return relatedData.data || [];
  } catch (error) {
    // Error fetching related courses
    return [];
  }
}

/**
 * Render recommendations carousel
 * @param {Array} relatedLOs - Array of related learning objects
 * @returns {string} HTML for the recommendations carousel
 */
function renderRecommendationsCarousel(relatedLOs) {
  if (!relatedLOs || relatedLOs.length === 0) {
    return '';
  }

  return `
    <div class="recommendations-carousel">
      <div class="recommendations-header">
        <h3>Recommended Courses</h3>
        <span class="recommendations-count">${relatedLOs.length} courses</span>
      </div>
      <div class="carousel-wrapper">
        <button class="carousel-btn prev-btn" id="recommendations-prev-btn" disabled>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <div class="recommendations-slider" id="recommendations-slider">
          ${relatedLOs.map((course) => renderRecommendationCard(course)).join('')}
        </div>
        <button class="carousel-btn next-btn" id="recommendations-next-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}

/**
 * Decorate the recommendations block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  // Get course ID from data attribute or URL parameter
  const courseIdElement = block.querySelector('[data-course-id]');
  const courseId = courseIdElement
    ? courseIdElement.dataset.courseId
    : new URLSearchParams(window.location.search).get('id');

  if (!courseId) {
    block.innerHTML = '<div class="recommendations-error">Course ID not provided</div>';
    return;
  }

  // Show loading state
  block.innerHTML = '<div class="recommendations-loading">Loading recommendations...</div>';

  try {
    // Fetch related courses
    const relatedCourses = await fetchRelatedCourses(courseId);

    if (relatedCourses.length === 0) {
      block.innerHTML = '<div class="recommendations-empty">No recommendations available</div>';
      return;
    }

    // Render recommendations carousel
    block.innerHTML = renderRecommendationsCarousel(relatedCourses);

    // Setup carousel functionality
    setupCarousel();
  } catch (error) {
    // Error rendering recommendations
    block.innerHTML = '<div class="recommendations-error">Failed to load recommendations</div>';
  }
}
