# Learning Program Block

This block fetches and displays learning program data from the Adobe Learning Manager API.

## Features

- Fetches learning program details from Adobe Learning Manager API
- Displays program information in a structured card layout
- Requires OAuth authentication (uses stored access token)
- Shows loading states and error handling
- Responsive design for mobile and desktop
- Raw API response viewer for debugging
- Action buttons for enrollment and details (placeholder functionality)

## Usage

The block can get the program ID from three sources (in order of priority):

1. **URL Path** (highest priority)
2. **Block Configuration** (medium priority)
3. **Default Value** (lowest priority)

### URL-Based Program ID (Recommended)

The block automatically extracts the program ID from the URL path:

**Supported URL patterns:**

- `/cohort/learningProgram:155841` (primary pattern)
- `/cohort/155841` (numeric ID only)
- `/learning-program/learningProgram:155841`
- `/program/learningProgram:123456`
- `/learningProgram:155841`
- `/learning-program/155841` (numeric ID only)
- `/program/123456` (numeric ID only)
- `?programId=155841` (URL parameter)
- `?id=learningProgram:155841` (URL parameter)

### Block Configuration

```html
<div class="learning-program">
  <div>
    <div>Program ID</div>
    <div>learningProgram:155841</div>
  </div>
</div>
```

### Default Usage (No Configuration)

```html
<div class="learning-program">
  <!-- Uses default program ID: learningProgram:155841 -->
</div>
```

## Configuration Options

| Parameter  | Description                                          | Default                | Required |
| ---------- | ---------------------------------------------------- | ---------------------- | -------- |
| Program ID | The learning program ID to fetch (overridden by URL) | learningProgram:155841 | No       |

## Priority Order

1. **URL Path/Parameters**: Program ID extracted from current URL
2. **Block Configuration**: Program ID specified in block content
3. **Default**: learningProgram:155841

## Prerequisites

1. **OAuth Authentication**: Users must authenticate using the OAuth block first
2. **Access Token**: The block uses the access token stored in `sessionStorage.getItem('alm_access_token')`
3. **API Permissions**: The access token must have appropriate permissions to read learning objects

## API Endpoint

The block calls:

```
GET https://learningmanager.adobe.com/primeapi/v2/learningObjects/{programId}
```

With headers:

- `Authorization: Bearer {access_token}`
- `Accept: application/vnd.api+json`
- `Content-Type: application/json`

## Displayed Information

The block displays:

### Program Header

- Program title
- Program image (if available)
- Program state (Active, Draft, Retired)
- Enrollment type
- Duration (formatted)

### Program Content

- Description
- Overview (if available)
- Program details grid with:
  - Program ID
  - Type
  - Enrollment Type
  - State
  - Last Modified date

### Action Buttons

- Enroll in Program (placeholder)
- View Details (placeholder)

### API Information

- API endpoint used
- Response timestamp
- Raw API response viewer (collapsible)

## Error Handling

The block handles various error scenarios:

- **No Authentication**: Shows error with link to authenticate
- **401 Unauthorized**: Authentication failed, re-authentication needed
- **403 Forbidden**: Access denied, permission issues
- **404 Not Found**: Learning program not found
- **Other API Errors**: Generic error with status code

## Styling

The block includes comprehensive CSS with:

- Card-based layout
- Gradient header
- Responsive design
- Loading animations
- Error states
- Mobile-optimized layout

## Integration with OAuth Block

This block works seamlessly with the OAuth block:

1. User authenticates via OAuth block
2. Access token is stored in session storage
3. Learning Program block automatically uses the stored token
4. If no token is found, user is directed to authenticate

## Example Implementation

```html
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="blocks/learning-program/learning-program.css" />
  </head>
  <body>
    <!-- First, authenticate -->
    <div class="oauth">
      <div>
        <div>Client ID</div>
        <div>your-client-id</div>
      </div>
      <!-- ... other OAuth config -->
    </div>

    <!-- Then, display learning program -->
    <div class="learning-program">
      <div>
        <div>Program ID</div>
        <div>learningProgram:155841</div>
      </div>
    </div>

    <script type="module" src="scripts/scripts.js"></script>
  </body>
</html>
```

## Development Notes

- The block uses modern JavaScript features (async/await, optional chaining)
- Error handling is comprehensive with user-friendly messages
- The raw API response viewer helps with debugging
- Action buttons are placeholders and can be extended with actual functionality
- The block is fully responsive and accessible

## Future Enhancements

Potential improvements:

- Implement actual enrollment functionality
- Add support for multiple program IDs
- Include related courses/modules
- Add progress tracking
- Implement caching for better performance
- Add more detailed error logging
