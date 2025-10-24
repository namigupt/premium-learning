// Helper functions
function showLoading(container, message) {
  container.innerHTML = `
    <div class="community-loading">
      <div class="loading-spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

function showError(container, message) {
  container.innerHTML = `
    <div class="community-error">
      <div class="error-icon">⚠️</div>
      <h3>Error</h3>
      <p>${message}</p>
    </div>
  `;
}

// Helper function to show success messages
function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;

  // Insert at the top of the community container
  const container = document.querySelector('.community-container');
  container.insertBefore(successDiv, container.firstChild);

  // Remove after 3 seconds
  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

// Function for updating toolbar state
function updateToolbarState(toolbar) {
  const buttons = toolbar.querySelectorAll('.toolbar-btn');
  buttons.forEach((button) => {
    const command = button.getAttribute('data-command');
    if (command && command !== 'createLink') {
      if (document.queryCommandState(command)) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    }
  });
}

// Initialize rich text editor functionality
function initializeRichTextEditor(formElement) {
  const toolbar = formElement.querySelector('.rich-text-toolbar');
  const editor = formElement.querySelector('.rich-text-editor');

  // Handle placeholder behavior
  editor.addEventListener('focus', function handleFocus() {
    if (this.innerHTML === '') {
      this.innerHTML = '';
    }
  });

  editor.addEventListener('blur', function handleBlur() {
    if (this.innerHTML === '' || this.innerHTML === '<br>') {
      this.innerHTML = '';
    }
  });

  // Handle toolbar button clicks
  toolbar.addEventListener('click', (e) => {
    if (e.target.classList.contains('toolbar-btn')) {
      e.preventDefault();
      const command = e.target.getAttribute('data-command');

      if (command === 'createLink') {
        // Replace prompt with a custom UI in a real implementation
        const url = window.prompt('Enter the URL:');
        if (url) {
          document.execCommand(command, false, url);
        }
      } else {
        document.execCommand(command, false, null);
      }

      // Keep focus on editor
      editor.focus();
    }
  });

  // Handle keyboard shortcuts
  editor.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold', false, null);
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic', false, null);
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline', false, null);
          break;
        default:
          // No action for other keys
          break;
      }
    }
  });

  // Update toolbar button states based on current selection
  editor.addEventListener('mouseup', () => updateToolbarState(toolbar));
  editor.addEventListener('keyup', () => updateToolbarState(toolbar));
}

// Function for clearing post form
function clearPostForm() {
  const editor = document.getElementById('new-post-content');
  editor.innerHTML = '';
  editor.focus();
}

function createPostElement(post) {
  const postDiv = document.createElement('div');
  postDiv.className = 'community-post';
  postDiv.setAttribute('data-post-id', post.id);

  const attributes = post.attributes || {};
  const author = attributes.createdBy || 'Anonymous';
  // Use richText if available, fallback to text, then default message
  const content = attributes.richText || attributes.text || 'No content';
  const dateCreated = attributes.dateCreated
    ? new Date(attributes.dateCreated).toLocaleDateString()
    : 'Unknown date';
  const upVotes = attributes.upVote || 0;
  const downVotes = attributes.downVote || 0;

  postDiv.innerHTML = `
    <div class="post-header">
      <div class="post-author">
        <div class="author-avatar">
          <span>${author.charAt(0).toUpperCase()}</span>
        </div>
        <div class="author-info">
          <span class="author-name">${author}</span>
          <span class="post-date">${dateCreated}</span>
        </div>
      </div>
    </div>
    
    <div class="post-content">
      ${content}
    </div>
    
    <div class="post-actions">
      <div class="vote-buttons">
        <button class="vote-btn upvote-btn" onclick="votePost('${post.id}', 'upvote')" title="Upvote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 14l5-5 5 5"></path>
          </svg>
          <span class="vote-count">${upVotes}</span>
        </button>
        
        <button class="vote-btn downvote-btn" onclick="votePost('${post.id}', 'downvote')" title="Downvote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 10l-5 5-5-5"></path>
          </svg>
          <span class="vote-count">${downVotes}</span>
        </button>
      </div>
      
      <div class="post-meta">
        <span class="post-id">Post ID: ${post.id}</span>
      </div>
    </div>
  `;

  return postDiv;
}

// Function for submitting new posts
async function submitNewPost(boardId) {
  const editor = document.getElementById('new-post-content');
  const submitBtn = document.getElementById('post-submit-btn');
  const content = editor.innerHTML.trim();

  if (!content || content === '<br>' || content === '') {
    // Replace with custom UI notification
    showError(editor.parentElement, 'Please enter some content for your post.');
    return;
  }

  try {
    // Get access token
    const accessToken = sessionStorage.getItem('alm_access_token');
    if (!accessToken) {
      // Replace with custom UI notification
      showError(editor.parentElement, 'Authentication required. Please authenticate first.');
      return;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    // Create post data - use the rich text content directly
    const postData = {
      data: {
        type: 'post',
        attributes: {
          postingType: 'DEFAULT',
          richText: content,
          state: 'ACTIVE',
        },
        relationships: {
          parent: {
            data: {
              id: boardId,
              type: 'board',
            },
          },
        },
      },
    };

    // Make POST request
    const response = await fetch(
      `https://learningmanager.adobe.com/primeapi/v2/boards/${boardId}/posts`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json;charset=UTF-8',
        },
        body: JSON.stringify(postData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }

    const newPost = await response.json();

    // Clear the form
    editor.innerHTML = '';

    // Add the new post to the top of the posts container
    const postsContainer = document.getElementById('community-posts-container');

    // Remove "no posts" message if it exists
    const noPosts = postsContainer.querySelector('.no-posts');
    if (noPosts) {
      noPosts.remove();
    }

    // Create and prepend the new post element
    const newPostElement = createPostElement(newPost.data);
    newPostElement.classList.add('new-post-highlight');
    postsContainer.insertBefore(newPostElement, postsContainer.firstChild);

    // Update post count in header
    const postCountElement = document.querySelector('.post-count');
    if (postCountElement) {
      const currentCount = parseInt(postCountElement.textContent.match(/\d+/)[0], 10) || 0;
      postCountElement.textContent = `${currentCount + 1} posts`;
    }

    // Show success message
    showSuccessMessage('Post created successfully!');

    // Remove highlight after animation
    setTimeout(() => {
      newPostElement.classList.remove('new-post-highlight');
    }, 3000);
  } catch (error) {
    // Replace console.error with logging service in production
    // console.error('Error creating post:', error);
    showError(editor.parentElement, `Failed to create post: ${error.message}`);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Message';
  }
}

function displayCommunity(container, objectId, boardId, posts) {
  container.innerHTML = '';

  // Create community header
  const header = document.createElement('div');
  header.className = 'community-header';
  header.innerHTML = `
    <h2>Community Discussion</h2>
    <p>Join the conversation about ${objectId}</p>
    <div class="community-stats">
      <span class="post-count">${posts.length} posts</span>
      <span class="board-id">Board ID: ${boardId}</span>
    </div>
  `;

  // Create new post form
  const newPostForm = document.createElement('div');
  newPostForm.className = 'new-post-form';
  newPostForm.innerHTML = `
    <div class="form-header">
      <h3>Share your thoughts</h3>
    </div>
    <div class="form-content">
      <div class="rich-text-toolbar">
        <button type="button" class="toolbar-btn" data-command="bold" title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" class="toolbar-btn" data-command="italic" title="Italic">
          <em>I</em>
        </button>
        <button type="button" class="toolbar-btn" data-command="underline" title="Underline">
          <u>U</u>
        </button>
        <div class="toolbar-separator"></div>
        <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
          • List
        </button>
        <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
          1. List
        </button>
        <div class="toolbar-separator"></div>
        <button type="button" class="toolbar-btn" data-command="createLink" title="Insert Link">
          🔗 Link
        </button>
      </div>
      <div 
        id="new-post-content" 
        class="rich-text-editor"
        contenteditable="true"
        data-placeholder="What would you like to discuss about this course?"
      ></div>
      <div class="form-actions">
        <button id="post-submit-btn" class="btn-post-submit">
          Post Message
        </button>
        <button id="post-cancel-btn" class="btn-post-cancel">
          Clear
        </button>
      </div>
    </div>
  `;

  // Initialize rich text editor
  initializeRichTextEditor(newPostForm);

  // Add event listeners after creating the form
  const submitBtn = newPostForm.querySelector('#post-submit-btn');
  const cancelBtn = newPostForm.querySelector('#post-cancel-btn');

  submitBtn.addEventListener('click', () => submitNewPost(boardId));
  cancelBtn.addEventListener('click', () => clearPostForm());

  // Create posts container
  const postsContainer = document.createElement('div');
  postsContainer.className = 'community-posts';
  postsContainer.id = 'community-posts-container';

  if (posts.length === 0) {
    postsContainer.innerHTML = `
      <div class="no-posts">
        <h3>No posts yet</h3>
        <p>Be the first to start a discussion!</p>
      </div>
    `;
  } else {
    posts.forEach((post) => {
      const postElement = createPostElement(post);
      postsContainer.appendChild(postElement);
    });
  }

  container.appendChild(header);
  container.appendChild(newPostForm);
  container.appendChild(postsContainer);
}

async function getBoardPosts(boardId, accessToken) {
  const postsUrl = `https://learningmanager.adobe.com/primeapi/v2/boards/${boardId}/posts?page[offset]=0&page[limit]=10&sort=-dateCreated`;

  const response = await fetch(postsUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

async function findBoardId(objectId, accessToken) {
  const searchUrl = `https://learningmanager.adobe.com/primeapi/v2/social/search?page[limit]=10&query=${objectId}&autoCompleteMode=true&filter.socialTypes=board&sort=relevance&restrictedScopeWrite=false`;

  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search for board: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.data && data.data.length > 0) {
    return data.data[0].id;
  }

  return null;
}

async function initializeCommunity(container, objectId) {
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
    showLoading(container, 'Loading community...');

    // Step 1: Find board ID for the current course
    const boardId = await findBoardId(objectId, accessToken);

    if (!boardId) {
      showError(container, `No community board found for ${objectId}`);
      return;
    }

    // Step 2: Get posts from the board
    const posts = await getBoardPosts(boardId, accessToken);

    // Step 3: Display the community
    displayCommunity(container, objectId, boardId, posts);
  } catch (error) {
    // Replace console.error with logging service in production
    // console.error('Error initializing community:', error);
    showError(container, error.message);
  }
}

function getLearningObjectIdFromUrl() {
  // Extract learning object ID from URL path
  const path = window.location.pathname;

  // Look for learning object patterns in the URL
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
    if (/^\d+$/.test(objectParam)) {
      return `learningProgram:${objectParam}`;
    }
    if (objectParam.match(/(learningProgram|course|certification|jobAid):/)) {
      return objectParam;
    }
  }

  return null;
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

  // Create the community container
  const container = document.createElement('div');
  container.className = 'community-container';

  // Get the learning object ID from URL
  const objectId = getLearningObjectIdFromUrl();

  if (!objectId) {
    showError(container, 'No learning object ID found in URL');
    block.appendChild(container);
    return;
  }

  // Initialize community
  initializeCommunity(container, objectId);
  block.appendChild(container);
}

// Global function for voting
window.votePost = function votePost(postId, voteType) {
  // In a real implementation, this would call the voting API
  const action = voteType === 'upvote' ? 'upvoted' : 'downvoted';
  // Replace with custom UI notification
  showSuccessMessage(`Post ${action}! This would call the voting API to record your vote.`);

  // Update the vote count in the UI (mock implementation)
  const postElement = document.querySelector(`[data-post-id="${postId}"]`);
  if (postElement) {
    const voteBtn = postElement.querySelector(`.${voteType}-btn`);
    const countSpan = voteBtn.querySelector('.vote-count');
    const currentCount = parseInt(countSpan.textContent, 10) || 0;
    countSpan.textContent = currentCount + 1;

    // Add visual feedback
    voteBtn.classList.add('voted');
    setTimeout(() => voteBtn.classList.remove('voted'), 300);
  }
};
