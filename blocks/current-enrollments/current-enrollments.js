// Helper functions
function showLoading(container) {
  container.innerHTML = `
    <div class="enrollments-loading">
      <div class="loading-spinner"></div>
      <h2>Loading Your Current Enrollments...</h2>
      <p>Fetching your learning progress from Adobe Learning Manager</p>
    </div>
  `;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="enrollments-error">
      <div class="error-icon">⚠️</div>
      <h2>Unable to Load Enrollments</h2>
      <p>${message}</p>
      <button onclick="window.location.reload()" class="retry-btn">Try Again</button>
    </div>
  `;
}

function formatDuration(minutes) {
  if (!minutes) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function createProgressBar(progress) {
  return `
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <span class="progress-text">${progress}% Complete</span>
    </div>
  `;
}

function getStatusBadge(state, progress) {
  const badges = {
    ENROLLED: '<span class="status-badge enrolled">Enrolled</span>',
    STARTED: `<span class="status-badge started">In Progress (${progress}%)</span>`,
    COMPLETED: '<span class="status-badge completed">Completed</span>',
  };

  return badges[state] || `<span class="status-badge unknown">${state}</span>`;
}

function createEnrollmentCard(enrollment, included) {
  const { attributes } = enrollment;
  const { relationships } = enrollment;

  // Find enrollment data
  const enrollmentData = included.find(
    (item) =>
      item.type === 'learningObjectInstanceEnrollment' &&
      item.id === relationships.enrollment?.data?.id
  );

  // Find instance data
  const instanceData = included.find(
    (item) =>
      item.type === 'learningObjectInstance' &&
      item.id === enrollmentData?.relationships?.loInstance?.data?.id
  );

  // Extract enrollment information
  const enrollmentState = enrollmentData?.attributes?.state || 'UNKNOWN';
  const progressPercent = enrollmentData?.attributes?.progressPercent || 0;
  const dateEnrolled = enrollmentData?.attributes?.dateEnrolled;
  const completionDeadline =
    enrollmentData?.attributes?.completionDeadline || instanceData?.attributes?.completionDeadline;
  const dateStarted = enrollmentData?.attributes?.dateStarted;

  // Create card element
  const card = document.createElement('div');
  card.className = `enrollment-card ${enrollmentState.toLowerCase()}`;

  // Format dates
  const enrolledDate = dateEnrolled ? new Date(dateEnrolled).toLocaleDateString() : 'N/A';
  const deadline = completionDeadline
    ? new Date(completionDeadline).toLocaleDateString()
    : 'No deadline';
  const startedDate = dateStarted ? new Date(dateStarted).toLocaleDateString() : null;

  // Get localized metadata
  const localizedData = attributes.localizedMetadata?.[0] || {};
  const name = localizedData.name || 'Untitled Course';
  const description = localizedData.description || 'No description available';

  // Create status badge
  const statusBadge = getStatusBadge(enrollmentState, progressPercent);

  // Create progress bar
  const progressBar = createProgressBar(progressPercent);

  // Determine button text based on enrollment state
  let buttonText;
  if (enrollmentState === 'STARTED') {
    buttonText = 'Continue Learning';
  } else if (enrollmentState === 'COMPLETED') {
    buttonText = 'Review Course';
  } else {
    buttonText = 'Start Learning';
  }

  card.innerHTML = `
    <div class="card-header">
      ${attributes.imageUrl ? `<img src="${attributes.imageUrl}" alt="${name}" class="course-image" loading="lazy">` : '<div class="course-image-placeholder">📚</div>'}
      <div class="card-status">
        ${statusBadge}
      </div>
    </div>
    
    <div class="card-content">
      <h3 class="course-title">${name}</h3>
      <p class="course-description">${description}</p>
      
      <div class="course-meta">
        <div class="meta-item">
          <span class="meta-label">Enrolled:</span>
          <span class="meta-value">${enrolledDate}</span>
        </div>
        ${
          startedDate
            ? `
          <div class="meta-item">
            <span class="meta-label">Started:</span>
            <span class="meta-value">${startedDate}</span>
          </div>
        `
            : ''
        }
        <div class="meta-item">
          <span class="meta-label">Deadline:</span>
          <span class="meta-value">${deadline}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Duration:</span>
          <span class="meta-value">${formatDuration(attributes.duration)}</span>
        </div>
      </div>

      ${progressBar}

      <div class="course-tags">
        ${(attributes.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('')}
      </div>
    </div>

    <div class="card-actions">
      <a href="/course?id=${enrollment.id}" class="btn-primary">
        ${buttonText}
      </a>
    </div>
  `;

  return card;
}

function renderEnrollments(container, data) {
  const enrollments = data.data || [];
  const included = data.included || [];

  if (enrollments.length === 0) {
    container.innerHTML = `
      <div class="enrollments-empty">
        <div class="empty-icon">📚</div>
        <h2>No Current Enrollments</h2>
        <p>You don't have any active course enrollments at the moment.</p>
        <p>Explore our learning catalog to find courses that interest you!</p>
      </div>
    `;
    return;
  }

  // Create header
  const header = document.createElement('div');
  header.className = 'enrollments-header';
  header.innerHTML = `
    <h1>My Current Enrollments</h1>
    <p class="enrollment-count">${enrollments.length} active enrollment${enrollments.length !== 1 ? 's' : ''}</p>
  `;

  // Create enrollments grid
  const grid = document.createElement('div');
  grid.className = 'enrollments-grid';

  enrollments.forEach((enrollment) => {
    const enrollmentCard = createEnrollmentCard(enrollment, included);
    grid.appendChild(enrollmentCard);
  });

  container.innerHTML = '';
  container.appendChild(header);
  container.appendChild(grid);
}

async function fetchCurrentEnrollments(container) {
  try {
    // Check if we have an access token from OAuth
    const accessToken = sessionStorage.getItem('alm_access_token');

    if (!accessToken) {
      showError(
        container,
        'Authentication required. Please authenticate first using the OAuth block.'
      );
      return;
    }

    // Show loading state
    showLoading(container);

    // API endpoint for current enrollments
    const apiUrl = 'https://learningmanager.adobe.com/primeapi/v2/learningObjects/query';

    // Request parameters
    const params = new URLSearchParams({
      page: '',
      sort: 'dueDate',
      include:
        'instances.loResources.resources,enrollment.loResourceGrades,skills.skillLevel.skill',
    });

    // Request body for filtering enrollments
    const requestBody = {
      'filter.learnerState': ['enrolled', 'completed', 'started'],
      'filter.loTypes': ['learningProgram'],
      'filter.ignoreEnhancedLP': false,
    };

    const response = await fetch(`${apiUrl}?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please re-authenticate.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Check your permissions.');
      } else {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();

    // Render the enrollments
    renderEnrollments(container, data);
  } catch (error) {
    // Replace console.error with logging service in production
    // console.error('Error fetching current enrollments:', error);
    showError(container, error.message);
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

  // Create the current enrollments container
  const container = document.createElement('div');
  container.className = 'current-enrollments-container';

  // Fetch current enrollments
  fetchCurrentEnrollments(container);

  block.appendChild(container);
}
