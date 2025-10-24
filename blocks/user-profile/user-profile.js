function showAuthenticationRequired(container) {
  container.innerHTML = `
    <div class="auth-required">
      <div class="auth-icon">🔐</div>
      <h3>Authentication Required</h3>
      <p>Please authenticate with Adobe Learning Manager first to view your profile.</p>
      <button class="auth-redirect-btn" onclick="window.location.href='#oauth'">
        Go to Authentication
      </button>
    </div>
  `;
}

function showError(container, errorMessage) {
  container.innerHTML = `
    <div class="profile-error">
      <div class="error-icon">❌</div>
      <h3>Error Loading Profile</h3>
      <p>${errorMessage}</p>
      <button class="retry-btn" onclick="window.location.reload()">
        🔄 Try Again
      </button>
    </div>
  `;
}

function displayUserProfile(userData, container) {
  const user = userData.data;
  const { attributes } = user;

  container.innerHTML = `
    <div class="user-profile-card">
      <div class="profile-header">
        <div class="profile-avatar">
          <img src="${attributes.avatarUrl}" alt="${attributes.name}" class="avatar-image" />
        </div>
        <div class="profile-info">
          <h2 class="profile-name">${attributes.name}</h2>
          <p class="profile-email">${attributes.email}</p>
        </div>
      </div>
      
      <div class="profile-stats">
        <div class="stat-card points-earned">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-value">${attributes.pointsEarned}</div>
            <div class="stat-label">Points Earned</div>
          </div>
        </div>
        
        <div class="stat-card points-redeemed">
          <div class="stat-icon">💎</div>
          <div class="stat-content">
            <div class="stat-value">${attributes.pointsRedeemed}</div>
            <div class="stat-label">Points Redeemed</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function fetchUserProfile(accessToken, container) {
  try {
    const response = await fetch('https://learningmanager.adobe.com/primeapi/v2/user', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication expired. Please login again.');
      }
      throw new Error(`Failed to fetch user profile: ${response.status}`);
    }

    const userData = await response.json();

    // Store user ID in session storage
    if (userData.data && userData.data.id) {
      sessionStorage.setItem('alm_user_id', userData.data.id);
    }

    displayUserProfile(userData, container);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    showError(container, error.message);
  }
}

export default function decorate(block) {
  // Clear the block content
  block.innerHTML = '';

  // Create user profile container
  const profileContainer = document.createElement('div');
  profileContainer.className = 'user-profile-container';

  // Add loading state
  profileContainer.innerHTML = `
    <div class="user-profile-loading">
      <div class="profile-spinner"></div>
      <p>Loading user profile...</p>
    </div>
  `;

  block.appendChild(profileContainer);

  // Check if user is authenticated
  const accessToken = sessionStorage.getItem('alm_access_token');

  if (!accessToken) {
    showAuthenticationRequired(profileContainer);
    return;
  }

  // Fetch user profile data
  fetchUserProfile(accessToken, profileContainer);
}
