import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';
import { createCarousel } from '../carousel/carousel.js';
import { fetchLearningPrograms } from '../../scripts/utils/api.js';

// Exclude entries if enrollment deadline + 1 day has passed today's date
function isEnrollmentExpired(enrollmentDeadline) {
  if (!enrollmentDeadline) {
    return false;
  }
  const deadlineDate = new Date(enrollmentDeadline);
  const deadlinePlusOneDay = new Date(deadlineDate.getTime() + 24 * 60 * 60 * 1000); // Add 1 day in milliseconds
  const currentDate = new Date();
  return currentDate > deadlinePlusOneDay;
}

function shouldExcludeCourse(course, included) {
  const instances = course.relationships?.instances?.data || [];
  return instances.some((inst) => {
    const instanceId = inst.id;
    const includedInstance = included.find(
      (i) => i.id === instanceId && i.type === 'learningObjectInstance'
    );

    const enrollmentDeadline = includedInstance?.attributes?.enrollmentDeadline;
    if (enrollmentDeadline && isEnrollmentExpired(enrollmentDeadline)) {
      return true;
    }

    // If no deadline, check if there's an enrollment object for this instance
    // course.relationships.enrollment may directly reference the enrollment
    const courseEnrollmentId = course.relationships?.enrollment?.data?.id;
    if (courseEnrollmentId) {
      const enrollmentObj = included.find(
        (i) => i.id === courseEnrollmentId && i.type === 'learningObjectInstanceEnrollment'
      );
      if (enrollmentObj) {
        const loInstanceId = enrollmentObj.relationships?.loInstance?.data?.id;
        // If the enrollment references this instance (or has no loInstance specified), treat as enrolled
        if (!loInstanceId || loInstanceId === instanceId) return true;
      }
    }

    return false;
  });
}

// Generate star rating HTML with single star filled based on rating percentage
function generateStarRating(rating) {
  const num = Number(rating) || 0;
  const clamped = Math.max(0, Math.min(5, num));
  const percentage = ((clamped / 5) * 100).toFixed(2);
  return `<span class="star-rating" style="--fill-percentage: ${percentage}%" aria-label="Rating: ${clamped} out of 5" title="${clamped} / 5"></span>`;
}

function renderCourseCard(course) {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'course-card-content';
  const attrs = course.attributes || {};
  const metadata = (attrs.localizedMetadata && attrs.localizedMetadata[0]) || {};
  const title = metadata.name;
  const provider = metadata.overview;
  const { imageUrl } = attrs;
  const tags = attrs.tags || [];
  const durationHours = Number(attrs.duration || 0) / 60;
  const enrollmentType = attrs.enrollmentType || '';
  const rating = (attrs.rating && attrs.rating.averageRating) || 0;
  const isBookmarked = !!attrs.isBookmarked;

  // TODO - Generate course link using the pattern /premium/en/home/cohort/<id>
  const courseId = course.id || '';
  const courseLink = courseId ? `/premium/en/home/cohort/${courseId}` : null;

  const cardContent = `
    <div class="course-card-header">
        <div class="icons">
          <span class="icon icon-bookmark ${isBookmarked ? 'bookmarked' : ''}"></span>
          <span class="icon icon-copy-link"></span>
        </div>
        <div class="badges">
            ${tags.length ? tags.map((tag) => `<span class="badge">${tag}</span>`).join('') : ''}
        </div>
    </div>
    <div class="course-card-image">
      <img src="${imageUrl}" alt="${title}" loading="lazy">
    </div>
    <div class="course-card-body">
        <p class="provider">${provider}</p>
        <h3 class="course-title">${title}</h3>       
        <div class="course-details">
            <span class="duration">${Math.floor(durationHours)} hours</span>
            <ul><li class="level">${enrollmentType}</li></ul>
            <ul><li class="rating">${rating} ${generateStarRating(rating)}</ul>
        </div>
    </div>
  `;

  if (courseLink) {
    cardDiv.innerHTML = `<a href="${courseLink}" class="course-card-link">${cardContent}</a>`;
  } else {
    cardDiv.innerHTML = cardContent;
  }
  decorateIcons(cardDiv);

  // Optimize images
  const img = cardDiv.querySelector('img');
  if (img) {
    const optimizedPicture = createOptimizedPicture(img.src, img.alt, false, [{ width: '300' }]);
    img.replaceWith(optimizedPicture);
  }

  // Add copy link functionality
  const copyLinkIcon = cardDiv.querySelector('.icon-copy-link');
  if (copyLinkIcon && courseLink) {
    copyLinkIcon.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const fullUrl = window.location.origin + courseLink;
      await navigator.clipboard.writeText(fullUrl);
    });
  }

  // TODO - Add bookmark link functionality
  const bookmarkIcon = cardDiv.querySelector('.icon-bookmark');
  if (bookmarkIcon) {
    bookmarkIcon.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  return cardDiv;
}

// Extract learning program IDs from the block content
function extractLearningProgramIds(block) {
  const paragraphs = Array.from(block.querySelectorAll('p'));
  return paragraphs
    .map((p) => p.textContent.trim())
    .filter((text) => text.startsWith('learningProgram:'))
    .map((text) => text.split(':')[1])
    .filter((id) => id)
    .map((id) => `learningProgram:${id}`);
}

export default async function decorate(block) {
  try {
    const learningProgramIds = extractLearningProgramIds(block);
    const api = await fetchLearningPrograms(learningProgramIds);
    block.innerHTML = '';

    // Filter out courses where any related instance's enrollment deadline + 1 day has passed
    // or where an enrollment object exists for that instance (user already enrolled).
    const included = api.included || [];
    const filteredCourses = (api.data || []).filter(
      (course) => !shouldExcludeCourse(course, included)
    );

    // Create carousel items from filtered API data array
    const carouselItems = filteredCourses.map((course) => {
      const item = document.createElement('div');
      item.appendChild(renderCourseCard(course));
      return item;
    });

    carouselItems.map((item) => block.appendChild(item));

    const carouselConfig = {};
    await createCarousel(block, null, carouselConfig);
  } catch (error) {
    block.innerHTML = '<p>Error loading suggested cohorts</p>';
  }
}
