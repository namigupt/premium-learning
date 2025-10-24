/**
 * Handles enrollment in learning programs
 */

/**
 * Shows a success message after enrollment
 */
function showEnrollmentSuccess() {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'enrollment-message success';
  messageContainer.innerHTML = `
    <div class="enrollment-message-content">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>Successfully enrolled in program!</span>
    </div>
    <button class="close-message" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  document.body.appendChild(messageContainer);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(messageContainer)) {
      messageContainer.remove();
    }
  }, 5000);
}

/**
 * Shows a success message after unenrollment
 */
function showUnenrollmentSuccess() {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'enrollment-message success';
  messageContainer.innerHTML = `
    <div class="enrollment-message-content">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      <span>Successfully unenrolled from program!</span>
    </div>
    <button class="close-message" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  document.body.appendChild(messageContainer);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(messageContainer)) {
      messageContainer.remove();
    }
  }, 5000);
}

/**
 * Shows an error message if enrollment fails
 * @param {string} errorMessage - The error message to display
 */
function showEnrollmentError(errorMessage) {
  const messageContainer = document.createElement('div');
  messageContainer.className = 'enrollment-message error';
  messageContainer.innerHTML = `
    <div class="enrollment-message-content">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
      <span>${errorMessage || 'Failed to enroll in program'}</span>
    </div>
    <button class="close-message" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
      </svg>
    </button>
  `;

  document.body.appendChild(messageContainer);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(messageContainer)) {
      messageContainer.remove();
    }
  }, 5000);
}

/**
 * Enrolls the current user in a learning program
 * @param {string} programId - The ID of the learning program to enroll in
 * @param {string} instanceId - The instance ID of the learning program (optional)
 * @param {boolean} allowMultiEnrollment - Whether to allow multiple enrollments (default: false)
 * @returns {Promise<Object>} - The enrollment response
 */
export async function enrollInProgram(programId, instanceId = null, allowMultiEnrollment = false) {
  try {
    // Get access token from session storage
    const accessToken = sessionStorage.getItem('alm_access_token');
    if (!accessToken) {
      throw new Error('Authentication required to enroll in program');
    }

    // If instanceId is not provided, use programId as instanceId (common pattern)
    const loInstanceId = instanceId || programId;

    // Prepare the enrollment URL
    const enrollmentUrl = 'https://learningmanager.adobe.com/primeapi/v2/enrollments';

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      loId: `learningProgram:${programId}`,
      loInstanceId: `learningProgram:${loInstanceId}`,
      allowMultiEnrollment: allowMultiEnrollment.toString(),
    });

    // Make the POST request to enroll
    const response = await fetch(`${enrollmentUrl}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'enrollment',
        },
      }),
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to enroll: ${errorData.errors?.[0]?.title || response.statusText}`);
    }

    const enrollmentData = await response.json();

    // Show success message
    showEnrollmentSuccess();

    // Reload the page to show updated enrollment status
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return enrollmentData;
  } catch (error) {
    // Log error to service in production
    // console.error('Enrollment error:', error);
    showEnrollmentError(error.message);
    throw error;
  }
}

/**
 * Unenrolls the current user from a learning program
 * @param {string} programId - The ID of the learning program to unenroll from
 * @param {string} enrollmentId - The enrollment ID to delete
 * @returns {Promise<boolean>} - Whether the unenrollment was successful
 */
export async function unenrollFromProgram(programId, enrollmentId) {
  try {
    // Get access token from session storage
    const accessToken = sessionStorage.getItem('alm_access_token');
    if (!accessToken) {
      throw new Error('Authentication required to unenroll from program');
    }

    // Prepare the unenrollment URL
    const unenrollmentUrl = `https://learningmanager.adobe.com/primeapi/v2/enrollments/${enrollmentId}`;

    // Make the DELETE request to unenroll
    const response = await fetch(unenrollmentUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to unenroll: ${errorData.errors?.[0]?.title || response.statusText}`);
    }

    // Show success message
    showUnenrollmentSuccess();

    // Reload the page to show updated enrollment status
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return true;
  } catch (error) {
    // Log error to service in production
    // console.error('Unenrollment error:', error);
    showEnrollmentError(error.message);
    throw error;
  }
}

/**
 * Gets the enrollment ID for a learning program
 * @param {string} programId - The ID of the learning program
 * @param {Object} programData - Optional program data from API response
 * @returns {Promise<string|null>} - The enrollment ID or null if not enrolled
 */
export async function getEnrollmentId(programId, programData = null) {
  try {
    // If program data is provided, try to extract enrollment ID from it first
    if (programData) {
      // Check for enrollment in the main data relationships
      if (programData.data?.relationships?.enrollment?.data?.id) {
        return programData.data.relationships.enrollment.data.id;
      }

      // Check in included data
      if (programData.included) {
        // Look for enrollment in included data
        const enrollment = programData.included.find(
          (item) =>
            item.type === 'learningObjectInstanceEnrollment' &&
            item.relationships?.learningObject?.data?.id === `learningProgram:${programId}`
        );
        if (enrollment) {
          return enrollment.id;
        }
      }
    }

    // If no enrollment found in provided data or no data provided, fetch from API
    const accessToken = sessionStorage.getItem('alm_access_token');
    if (!accessToken) {
      throw new Error('Authentication required to get enrollment ID');
    }

    // Prepare the enrollment URL
    const enrollmentUrl = `https://learningmanager.adobe.com/primeapi/v2/users/self/enrollments?filter.loIds=learningProgram:${programId}`;

    // Make the GET request to get enrollments
    const response = await fetch(enrollmentUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
      },
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to get enrollment ID: ${errorData.errors?.[0]?.title || response.statusText}`
      );
    }

    const enrollmentData = await response.json();

    // Check if there are any enrollments
    if (enrollmentData.data && enrollmentData.data.length > 0) {
      return enrollmentData.data[0].id;
    }

    return null;
  } catch (error) {
    // Log error to service in production
    // console.error('Error getting enrollment ID:', error);
    return null;
  }
}

// Add to window object for onclick handlers
if (typeof window !== 'undefined') {
  window.enrollInProgram = enrollInProgram;
  window.unenrollFromProgram = unenrollFromProgram;
  window.getEnrollmentId = getEnrollmentId;
}
