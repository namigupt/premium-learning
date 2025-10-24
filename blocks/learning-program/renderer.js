import TemplateLoader from './template-loader.js';

class LearningProgramRenderer {
  constructor() {
    this.templateLoader = new TemplateLoader();
  }

  async renderLoading(container, message = 'Loading learning program...') {
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

  async renderLearningProgram(container, data, subLOData = []) {
    const learningObject = data.data;
    const { attributes } = learningObject;

    // Extract comprehensive information from the API response
    const programData = {
      name: attributes.localizedMetadata?.[0]?.name || 'Unknown Program',
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
      sections: attributes.sections || [],
      subLOs: learningObject.relationships?.subLOs?.data || [],
      isBookmarked: attributes.isBookmarked,
      unenrollmentAllowed: attributes.unenrollmentAllowed,
      id: learningObject.id,
    };

    const template = await this.templateLoader.loadTemplate('main');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate main content
    this.populateMainContent(element, programData);
    this.populateRatingSection(element, programData.rating);
    this.populateMetaSection(element, programData);
    this.populateTagsSection(element, programData.tags);
    this.populateHeaderActions(element, programData);
    this.populateOverviewSection(element, programData);

    // Populate curriculum section
    if (programData.sections.length > 0 || subLOData.length > 0) {
      await this.populateCurriculumSection(element, programData, subLOData);
    }

    container.innerHTML = '';
    container.appendChild(element);
  }

  static populateMainContent(element, data) {
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
      <span class="learning-program-state state-${data.state.toLowerCase()}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${data.state}
      </span>
      <span class="learning-program-format">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        ${data.loFormat}
      </span>
      <span class="learning-program-enrollment">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-7.5c0-1.1.9-2 2-2s2 .9 2 2V18h2v-4h3v4h2V9.5c0-1.1-.9-2-2-2h-3V6c0-1.1-.9-2-2-2s-2 .9-2 2v1.5H8c-1.1 0-2 .9-2 2V18H4z"/>
        </svg>
        ${data.enrollmentType}
      </span>
    `;

    if (data.duration > 0) {
      metaHtml += `
        <span class="learning-program-duration">
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
        <span class="learning-program-updated">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H3V9h14v11z"/>
          </svg>
          Updated ${new Date(data.effectiveModifiedDate).toLocaleDateString()}
        </span>
      `;
    }

    metaSection.innerHTML = metaHtml;
  }

  static populateTagsSection(element, tags) {
    const tagsSection = element.querySelector('[data-tags-section]');
    if (!tagsSection) return;

    if (tags.length > 0) {
      tagsSection.innerHTML = tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
      tagsSection.style.display = 'flex';
    } else {
      tagsSection.style.display = 'none';
    }
  }

  static populateHeaderActions(element, data) {
    const actionsSection = element.querySelector('[data-header-actions]');
    if (!actionsSection) return;

    actionsSection.innerHTML = `
      <div class="header-actions-container">
        <button class="btn-enroll-header" onclick="enrollInProgram('${data.id}')" 
                title="Enroll Now" aria-label="Enroll Now">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <path d="M16 8v8H8V8h8m2-2H6v12h12V6z" opacity="0.3"/>
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

  static populateBookmarkSection(element, data) {
    const bookmarkSection = element.querySelector('[data-bookmark-section]');
    if (!bookmarkSection) return;

    bookmarkSection.innerHTML = `
      <button class="btn-bookmark ${data.isBookmarked ? 'bookmarked' : ''}" 
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
    `;
  }

  static populatePreviewActions(element, data) {
    const actionsSection = element.querySelector('[data-preview-actions]');
    if (!actionsSection) return;

    actionsSection.innerHTML = `
      <button class="btn-enroll" onclick="enrollInProgram('${data.id}')">
        Enroll Now
      </button>
      <button class="btn-wishlist ${data.isBookmarked ? 'bookmarked' : ''}" onclick="toggleWishlist('${data.id}', ${data.isBookmarked})">
        ${data.isBookmarked ? 'Remove from Wishlist' : 'Add to Wishlist'}
      </button>
    `;
  }

  populatePreviewFeatures(element, data) {
    const featuresSection = element.querySelector('[data-preview-features]');
    if (!featuresSection) return;

    let featuresHtml = '';
    if (data.duration > 0) {
      featuresHtml += `<li>${this.formatDuration(data.duration)} total length</li>`;
    }
    if (data.sections.length > 0) {
      featuresHtml += `<li>${data.sections.length} section${data.sections.length > 1 ? 's' : ''}</li>`;
    }
    if (data.subLOs.length > 0) {
      featuresHtml += `<li>${data.subLOs.length} course${data.subLOs.length > 1 ? 's' : ''}</li>`;
    }
    if (data.unenrollmentAllowed) {
      featuresHtml += '<li>Unenrollment allowed</li>';
    }

    featuresSection.innerHTML = featuresHtml;
  }

  static populateOverviewSection(element, data) {
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

  async populateCurriculumSection(element, data, subLOData) {
    const curriculumSection = element.querySelector('[data-curriculum-section]');
    if (!curriculumSection) return;

    curriculumSection.innerHTML = '<h2>Courses in the Program</h2>';

    if (data.sections.length > 0) {
      await this.renderSectionedCourses(curriculumSection, data.sections, subLOData);
    } else if (subLOData.length > 0) {
      await this.renderSimpleCourses(curriculumSection, subLOData);
    }
  }

  async renderSectionedCourses(container, sections, subLOData) {
    const sliderTemplate = await this.templateLoader.loadTemplate('course-slider');
    const sliderElement = this.templateLoader.createElementFromTemplate(sliderTemplate);

    // Populate section tabs
    const tabsContainer = sliderElement.querySelector('[data-section-tabs]');
    if (tabsContainer) {
      tabsContainer.innerHTML = sections
        .map(
          (section, index) => `
        <button class="section-tab ${index === 0 ? 'active' : ''}" 
                onclick="switchSection(${index})" 
                data-section="${index}">
          <span class="tab-title">Section ${index + 1}</span>
          <span class="tab-info">${section.mandatoryLOCount || section.loIds?.length || 0} courses</span>
          ${section.mandatory ? '<span class="tab-badge">Mandatory</span>' : ''}
        </button>
      `
        )
        .join('');
    }

    // Populate course slider
    const sliderContainer = sliderElement.querySelector('[data-course-slider]');
    if (sliderContainer) {
      const slidesHtml = await Promise.all(
        sections.map(async (section, sectionIndex) => {
          const sectionCourses = subLOData.filter(
            (course) => section.loIds && section.loIds.includes(course.id)
          );

          if (sectionCourses.length > 0) {
            const coursesHtml = await Promise.all(
              sectionCourses.map((course) => this.renderCourseCard(course))
            );

            return `
            <div class="section-slide ${sectionIndex === 0 ? 'active' : ''}" data-section="${sectionIndex}">
              <div class="slider-wrapper">
                <button class="slider-btn prev-btn" onclick="slideLeft(${sectionIndex})" disabled>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                  </svg>
                </button>
                <div class="courses-slider" id="slider-${sectionIndex}">
                  ${coursesHtml.join('')}
                </div>
                <button class="slider-btn next-btn" onclick="slideRight(${sectionIndex})">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
          }
          return `
            <div class="section-slide ${sectionIndex === 0 ? 'active' : ''}" data-section="${sectionIndex}">
              <div class="no-courses">
                <p>No courses available in this section</p>
              </div>
            </div>
          `;
        })
      );

      sliderContainer.innerHTML = slidesHtml.join('');
    }

    container.appendChild(sliderElement);
  }

  async renderSimpleCourses(container, subLOData) {
    const sliderTemplate = await this.templateLoader.loadTemplate('course-slider');
    const sliderElement = this.templateLoader.createElementFromTemplate(sliderTemplate);

    // Hide section tabs for simple courses
    const tabsContainer = sliderElement.querySelector('[data-section-tabs]');
    if (tabsContainer) {
      tabsContainer.style.display = 'none';
    }

    // Populate course slider
    const sliderContainer = sliderElement.querySelector('[data-course-slider]');
    if (sliderContainer) {
      const coursesHtml = await Promise.all(
        subLOData.map((course) => this.renderCourseCard(course))
      );

      sliderContainer.innerHTML = `
        <div class="section-slide active" data-section="0">
          <div class="slider-wrapper">
            <button class="slider-btn prev-btn" onclick="slideLeft(0)" disabled>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <div class="courses-slider" id="slider-0">
              ${coursesHtml.join('')}
            </div>
            <button class="slider-btn next-btn" onclick="slideRight(0)">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }

    container.appendChild(sliderElement);
  }

  async renderCourseCard(course) {
    const courseAttrs = course.attributes;
    const courseName = courseAttrs.localizedMetadata?.[0]?.name || 'Unknown Course';
    const courseDescription =
      courseAttrs.localizedMetadata?.[0]?.description || 'No description available';
    const courseDuration = courseAttrs.duration || 0;
    const courseState = courseAttrs.state || 'Unknown';
    const courseRating = courseAttrs.rating || { averageRating: 0, ratingsCount: 0 };
    const courseTags = courseAttrs.tags || [];
    const courseImageUrl = courseAttrs.imageUrl;

    const template = await this.templateLoader.loadTemplate('course-card');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate course image
    const imageContainer = element.querySelector('[data-course-image]');
    if (imageContainer) {
      if (courseImageUrl) {
        imageContainer.innerHTML = `<img src="${courseImageUrl}" alt="${courseName}" class="course-image" />`;
      } else {
        imageContainer.innerHTML = `
          <div class="course-image-placeholder">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#a435f0">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
        `;
      }
    }

    // Populate course name
    const nameElement = element.querySelector('[data-course-name]');
    if (nameElement) nameElement.textContent = courseName;

    // Populate course description
    const descElement = element.querySelector('[data-course-description]');
    if (descElement) descElement.textContent = courseDescription;

    // Populate course meta
    const metaElement = element.querySelector('[data-course-meta]');
    if (metaElement) {
      metaElement.innerHTML = `
        <span class="course-duration">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
            <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          ${courseDuration > 0 ? this.formatDuration(courseDuration) : 'Duration not specified'}
        </span>
        <span class="course-state state-${courseState.toLowerCase()}">
          ${courseState}
        </span>
      `;
    }

    // Populate course link
    const linkElement = element.querySelector('[data-course-link]');
    if (linkElement) {
      linkElement.href = `/cohort?id=${course.id}`;
    }

    // Populate course rating
    const ratingElement = element.querySelector('[data-course-rating]');
    if (ratingElement) {
      if (courseRating.averageRating > 0) {
        ratingElement.innerHTML = `
          ${this.generateStars(courseRating.averageRating)}
          <span class="rating-number">${courseRating.averageRating.toFixed(1)}</span>
          <span class="rating-count">(${courseRating.ratingsCount})</span>
        `;
        ratingElement.style.display = 'flex';
      } else {
        ratingElement.style.display = 'none';
      }
    }

    // Populate course tags
    const tagsElement = element.querySelector('[data-course-tags]');
    if (tagsElement) {
      if (courseTags.length > 0) {
        const tagsHtml = courseTags
          .slice(0, 2)
          .map((tag) => `<span class="course-tag">${tag}</span>`)
          .join('');
        const moreTag =
          courseTags.length > 2
            ? `<span class="course-tag-more">+${courseTags.length - 2}</span>`
            : '';
        tagsElement.innerHTML = tagsHtml + moreTag;
        tagsElement.style.display = 'flex';
      } else {
        tagsElement.style.display = 'none';
      }
    }

    return element.outerHTML;
  }

  static generateStars(rating) {
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

  static formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}

export default LearningProgramRenderer;
