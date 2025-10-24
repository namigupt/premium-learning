import RendererFactory from './renderer-factory.js';

function getLearningObjectIdFromUrl() {
  // Extract learning object ID from URL path
  // Supports patterns like:
  // /cohort/learningProgram:155841
  // /cohort/course:14267563
  // /learning-program/learningProgram:155841
  // /course/course:14267563
  // /certification/certification:123456
  // /learningProgram:155841
  // /course:14267563
  const path = window.location.pathname;

  // Look for learning object patterns in the URL (primary pattern)
  const loMatch = path.match(/(learningProgram|course|certification|jobAid):(\d+)/);
  if (loMatch) {
    return `${loMatch[1]}:${loMatch[2]}`;
  }

  // Look for cohort pattern with numeric ID: /cohort/123456
  const cohortNumericMatch = path.match(/\/cohort\/(\d+)$/);
  if (cohortNumericMatch) {
    return `learningProgram:${cohortNumericMatch[1]}`;
  }

  // Look for just the numeric ID at the end of the path
  const numericMatch = path.match(/\/(\d+)$/);
  if (numericMatch) {
    return `learningProgram:${numericMatch[1]}`;
  }

  // Check URL parameters as fallback
  const urlParams = new URLSearchParams(window.location.search);
  const objectParam =
    urlParams.get('programId') || urlParams.get('courseId') || urlParams.get('id');
  if (objectParam) {
    // If it's just a number, prepend learningProgram: (default)
    if (/^\d+$/.test(objectParam)) {
      return `learningProgram:${objectParam}`;
    }
    // If it already has the prefix, return as is
    if (objectParam.match(/(learningProgram|course|certification|jobAid):/)) {
      return objectParam;
    }
  }

  return null; // No learning object ID found in URL
}

/**
 * Shows a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of message (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
  const messageContainer = document.createElement('div');
  messageContainer.className = `learning-program-notification ${type}`;
  messageContainer.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
    </div>
    <button class="close-notification" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  document.body.appendChild(messageContainer);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (document.body.contains(messageContainer)) {
      messageContainer.remove();
    }
  }, 3000);
}

let renderer;

function setupGlobalFunctions() {
  // Learning Program functions - using the actual implementation from enroll.js
  // window.enrollInProgram is already defined in enroll.js and exported to the window object

  // Course functions
  window.enrollInCourse = function handleCourseEnrollment(courseId) {
    // In a real implementation, this would trigger course enrollment
    showNotification(
      `🎓 Enrollment initiated for course: ${courseId}. This would redirect to the course enrollment process.`,
      'info'
    );
  };

  // Certification functions
  window.enrollInCertification = function handleCertificationEnrollment(certificationId) {
    // In a real implementation, this would trigger certification enrollment
    showNotification(
      `⭐ Certification enrollment initiated: ${certificationId}. This would redirect to the certification process.`,
      'info'
    );
  };

  // Job Aid functions
  window.accessJobAid = function handleJobAidAccess(jobAidId) {
    // In a real implementation, this would open the job aid
    showNotification(
      `📄 Accessing job aid: ${jobAidId}. This would open the job aid document.`,
      'info'
    );
  };

  // Module functions
  window.startModule = function handleModuleStart(moduleId) {
    // In a real implementation, this would start the module
    showNotification(
      `▶️ Starting module: ${moduleId}. This would launch the module content.`,
      'info'
    );
  };

  // Requirement functions
  window.viewRequirement = function handleRequirementView(requirementId) {
    // In a real implementation, this would show requirement details
    showNotification(
      `📋 Viewing requirement: ${requirementId}. This would show requirement details.`,
      'info'
    );
  };

  // Common functions
  window.toggleWishlist = function handleWishlistToggle(objectId, isCurrentlyBookmarked) {
    // In a real implementation, this would call the bookmark API
    const action = isCurrentlyBookmarked ? 'removed from' : 'added to';
    showNotification(`❤️ Learning object ${action} wishlist: ${objectId}`, 'success');

    // Update button text (in real implementation, this would be handled by re-rendering after API call)
    const button = document.querySelector(`[onclick*="toggleWishlist('${objectId}'"]`);
    if (button) {
      button.textContent = isCurrentlyBookmarked ? 'Add to Wishlist' : 'Remove from Wishlist';
      button.classList.toggle('bookmarked');
    }
  };

  window.toggleBookmark = function handleBookmarkToggle(objectId, isCurrentlyBookmarked) {
    // In a real implementation, this would call the bookmark API
    const action = isCurrentlyBookmarked ? 'removed from' : 'added to';
    showNotification(`🔖 Learning object ${action} bookmarks: ${objectId}`, 'success');

    // Update button state (in real implementation, this would be handled by re-rendering after API call)
    const button = document.querySelector(`[onclick*="toggleBookmark('${objectId}'"]`);
    if (button) {
      const newBookmarkedState = !isCurrentlyBookmarked;
      button.classList.toggle('bookmarked');
      button.title = newBookmarkedState ? 'Remove from bookmarks' : 'Add to bookmarks';
      button.setAttribute(
        'aria-label',
        newBookmarkedState ? 'Remove from bookmarks' : 'Add to bookmarks'
      );

      // Update the onclick attribute for next click
      button.setAttribute('onclick', `toggleBookmark('${objectId}', ${newBookmarkedState})`);
    }
  };

  window.viewCourseDetails = function handleCourseDetailsView(courseId) {
    // In a real implementation, this would navigate to the course details page
    showNotification(
      `📚 Viewing course details for: ${courseId}. This would navigate to the individual course page.`,
      'info'
    );
  };

  window.viewCourse = function handleCourseView(courseId) {
    // In a real implementation, this would navigate to the course page
    showNotification(
      `📚 Viewing course: ${courseId}. This would navigate to the course page.`,
      'info'
    );
  };
}

function setupSliderFunctionality() {
  function updateSliderButtons(sectionIndex) {
    const slider = document.getElementById(`slider-${sectionIndex}`);
    if (!slider) return;

    const prevBtn = slider.parentElement.querySelector('.prev-btn');
    const nextBtn = slider.parentElement.querySelector('.next-btn');

    if (prevBtn && nextBtn) {
      // Check if at the beginning
      prevBtn.disabled = slider.scrollLeft <= 0;

      // Check if at the end
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      nextBtn.disabled = slider.scrollLeft >= maxScroll - 1; // -1 for rounding errors
    }
  }

  // Slider functionality
  window.switchSection = function handleSectionSwitch(sectionIndex) {
    // Hide all section slides
    document.querySelectorAll('.section-slide').forEach((slide) => {
      slide.classList.remove('active');
    });

    // Remove active class from all tabs
    document.querySelectorAll('.section-tab').forEach((tab) => {
      tab.classList.remove('active');
    });

    // Show selected section slide
    const targetSlide = document.querySelector(`[data-section="${sectionIndex}"]`);
    if (targetSlide) {
      targetSlide.classList.add('active');
    }

    // Activate selected tab
    const targetTab = document.querySelector(`.section-tab[data-section="${sectionIndex}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    // Reset slider position for the new section
    const slider = document.getElementById(`slider-${sectionIndex}`);
    if (slider) {
      slider.scrollLeft = 0;
      updateSliderButtons(sectionIndex);
    }
  };

  window.slideLeft = function handleSlideLeft(sectionIndex) {
    const slider = document.getElementById(`slider-${sectionIndex}`);
    if (slider) {
      const slideWidth = slider.querySelector('.course-slide').offsetWidth + 16; // 16px gap
      slider.scrollBy({ left: -slideWidth, behavior: 'smooth' });
      setTimeout(() => updateSliderButtons(sectionIndex), 300);
    }
  };

  window.slideRight = function handleSlideRight(sectionIndex) {
    const slider = document.getElementById(`slider-${sectionIndex}`);
    if (slider) {
      const slideWidth = slider.querySelector('.course-slide').offsetWidth + 16; // 16px gap
      slider.scrollBy({ left: slideWidth, behavior: 'smooth' });
      setTimeout(() => updateSliderButtons(sectionIndex), 300);
    }
  };

  // Initialize slider buttons on load
  setTimeout(() => {
    document.querySelectorAll('.courses-slider').forEach((slider, index) => {
      updateSliderButtons(index);

      // Add scroll event listener to update buttons
      slider.addEventListener('scroll', () => {
        updateSliderButtons(index);
      });
    });
  }, 100);
}

async function fetchLearningProgram(apiUrl, container) {
  try {
    // Check if we have an access token from OAuth
    const accessToken = sessionStorage.getItem('alm_access_token');

    if (!accessToken) {
      // Create a temporary renderer for error display
      const tempRenderer = RendererFactory.createRenderer({
        data: { attributes: { loType: 'unknown' } },
      });
      await tempRenderer.renderError(
        container,
        'Authentication required. Please authenticate first using the OAuth block.'
      );
      return;
    }

    // Show initial loading state
    const tempRenderer = RendererFactory.createRenderer({
      data: { attributes: { loType: 'unknown' } },
    });
    await tempRenderer.renderLoading(container, 'Loading...');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please re-authenticate.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Check your permissions.');
      } else if (response.status === 404) {
        throw new Error('Learning object not found.');
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Create the appropriate renderer based on loType
    renderer = RendererFactory.createRenderer(data);

    // Fetch subLO data if available
    const subLOs = data.data.relationships?.subLOs?.data || [];
    const subLOData = [];

    if (subLOs.length > 0) {
      // Update loading message to show we're fetching course details
      await renderer.renderLoading(container, 'Loading...');

      // Fetch all subLOs in parallel using Promise.allSettled
      const subLOPromises = subLOs.map(async (subLO) => {
        try {
          const subLOResponse = await fetch(
            `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${subLO.id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/vnd.api+json',
                'Content-Type': 'application/json',
              },
            }
          );

          if (subLOResponse.ok) {
            const subLOJson = await subLOResponse.json();
            return subLOJson.data;
          }
          return null;
        } catch (subLOError) {
          // Return null for failed requests instead of using console.warn
          return null;
        }
      });

      const subLOResults = await Promise.allSettled(subLOPromises);

      // Filter out failed requests and null results
      subLOResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value !== null) {
          subLOData.push(result.value);
        }
      });
    }

    await renderer.render(container, data, subLOData);

    // Setup global functions after rendering
    setupGlobalFunctions();
    setupSliderFunctionality();
  } catch (error) {
    // Log error to service in production
    // console.error('Error fetching learning object:', error);
    const errorRenderer = RendererFactory.createRenderer({
      data: { attributes: { loType: 'unknown' } },
    });
    await errorRenderer.renderError(container, error.message);
  }
}

export default function decorate(block) {
  // Get configuration from block content
  const config = {};
  const rows = block.querySelectorAll(':scope > div');

  rows.forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '_');
      const value = cells[1].textContent.trim();
      config[key] = value;
    }
  });

  // Clear the block content
  block.innerHTML = '';

  // Create the learning program container
  const container = document.createElement('div');
  container.className = 'learning-program-container';

  // Get the learning object ID from URL path or config or use default
  const objectId = getLearningObjectIdFromUrl();
  const apiUrl = `https://learningmanager.adobe.com/primeapi/v2/learningObjects/${objectId}?include=instances.enrollment.loResourceGrades,enrollment.loInstance.loResources.resources,prerequisiteLOs,subLOs.prerequisiteLOs.enrollment,subLOs.subLOs.prerequisiteLOs.enrollment,authors,subLOs.enrollment.loResourceGrades, subLOs.subLOs.enrollment.loResourceGrades, subLOs.subLOs.instances.loResources.resources.room, subLOs.instances.loResources.resources.room,instances.loResources.resources,supplementaryLOs.instances.loResources.resources,supplementaryResources,subLOs.supplementaryResources,subLOs.enrollment,instances.badge,skills.skillLevel.badge,skills.skillLevel.skill,instances.loResources.resources.room,subLOs.enrollment.loInstance.loResources.resources,prerequisiteLOs.enrollment,subLOs.supplementaryLOs.instances.loResources.resources,enrollment.loResourceGrades&useCache=true&filter.ignoreEnhancedLP=false&enforcedFields[learningObject]=products,roles,extensionOverrides,effectivenessData&enforcedFields[sessionRecordingInfo]=transcriptUrl&enforcedFields[resource]=isExternalUrl`;

  // Fetch learning object data
  fetchLearningProgram(apiUrl, container);

  block.appendChild(container);
}
