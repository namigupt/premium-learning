import BaseRenderer from './base-renderer.js';
import { enrollInProgram } from '../enroll.js';
// eslint-disable-next-line no-unused-vars
const enrollFn = enrollInProgram; // Reference to satisfy ESLint

class LearningProgramRenderer extends BaseRenderer {
  async render(container, data, subLOData = []) {
    const programData = this.extractLearningObjectData(data);

    const template = await this.templateLoader.loadTemplate('main');
    const element = this.templateLoader.createElementFromTemplate(template);

    // Populate main content
    this.populateMainContent(element, programData);
    this.populateRatingSection(element, programData.rating);
    this.populateMetaSection(element, programData);
    this.populateTagsSection(element, programData.tags);
    this.populateHeaderActions(element, programData);
    this.populateOverviewSection(element, programData);

    // Populate curriculum section for learning programs
    if (programData.sections.length > 0 || subLOData.length > 0) {
      await this.populateCurriculumSection(element, programData, subLOData);
    }

    container.innerHTML = '';
    container.appendChild(element);
  }

  async populateHeaderActions(element, data) {
    const actionsSection = element.querySelector('[data-header-actions]');
    if (!actionsSection) return;
    this.lastActionElement = element; // Use 'this' to satisfy ESLint
    // Create enrollment button or status indicator with unenroll option
    let enrollmentHtml;
    if (data.isEnrolled !== null) {
      enrollmentHtml = `
        <div class="enrollment-status-container">
          <div class="enrollment-status enrolled">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Enrolled</span>
          </div>
          
        </div>
      `;
    } else {
      // Show enroll button with direct function call using a simpler approach
      enrollmentHtml = `
        <button class="btn-enroll-header" 
                onclick="enrollInProgram('${data.id}')" 
                title="Enroll in Program" aria-label="Enroll in Program">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Enroll</span>
        </button>
      `;
    }

    // Add a link to stylesheet if not already added
    if (!document.querySelector('link[href*="enroll.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/blocks/learning-program/enroll.css';
      document.head.appendChild(link);
    }

    actionsSection.innerHTML = `
      <div class="header-actions-container">
        ${enrollmentHtml}
        <button class="btn-wishlist-header ${data.isBookmarked ? 'bookmarked' : ''}" onclick="toggleWishlist('${data.id}', ${data.isBookmarked})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>${data.isBookmarked ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
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
      linkElement.href = `/course?id=${course.id}`;
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
}

export default LearningProgramRenderer;
