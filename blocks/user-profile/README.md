# User Profile Block

The User Profile block fetches and displays user profile information from Adobe Learning Manager using the authenticated user's access token.

## Features

- **User Information Display**: Shows user name, email, and avatar image
- **Points System**: Displays points earned and points redeemed
- **Authentication Check**: Automatically checks for valid access token
- **Error Handling**: Graceful error handling with retry options
- **Responsive Design**: Mobile-friendly layout
- **Session Storage**: Stores user ID in session storage for other components

## API Integration

This block integrates with the Adobe Learning Manager API:

- **Endpoint**: `https://learningmanager.adobe.com/primeapi/v2/user`
- **Method**: GET
- **Authentication**: Bearer token (from session storage)
- **Headers**:
  - `Authorization: Bearer {access_token}`
  - `Accept: application/vnd.api+json`
  - `Content-Type: application/vnd.api+json`

## Usage

### In Google Docs (Content-driven approach)

Create a table with the heading "User Profile":

```
User Profile
```

The block will automatically load when the page is accessed, provided the user is authenticated.

### Direct HTML Usage

```html
<div class="user-profile">
  <div>
    <div>User Profile</div>
  </div>
</div>
```

## Data Displayed

### Profile Header

- User avatar image
- Full name
- Email address

### Points Statistics

- **Points Earned**: Total points accumulated
- **Points Redeemed**: Points used/spent

## States

### Loading State

Shows a spinner and loading message while fetching data.

### Authentication Required

Displays when no access token is found in session storage, with a button to redirect to authentication.

### Success State

Shows the complete user profile with all information and statistics.

### Error State

Displays error message with retry option when API call fails.

## Session Storage

The block stores the following data in session storage:

- `alm_user_id`: User's unique identifier from Adobe Learning Manager

## Dependencies

- Requires valid `alm_access_token` in session storage (set by OAuth block)
- Uses Adobe Learning Manager API v2
- Responsive CSS grid and flexbox layouts

## Error Handling

- **401 Unauthorized**: Shows authentication expired message
- **Network Errors**: Shows generic error with retry option
- **Invalid Response**: Handles malformed API responses gracefully

## Styling

The block includes comprehensive CSS with:

- Modern card-based design
- Gradient header background
- Hover effects on statistics cards
- Mobile-responsive breakpoints
- Loading animations
- Status-specific color coding

## Browser Compatibility

- Modern browsers with ES6+ support
- Fetch API support required
- CSS Grid and Flexbox support required

## Security Considerations

- Access token is retrieved from session storage (not localStorage for security)
- API calls are made directly to Adobe Learning Manager (CORS must be configured)
- User ID is stored in session storage for use by other components

## Example API Response

```json
{
  "data": {
    "id": "29763360",
    "type": "user",
    "attributes": {
      "avatarUrl": "https://cpcontents.adobe.com/public/images/default_user_avatar.svg",
      "email": "user@example.com",
      "name": "John Doe",
      "pointsEarned": 250,
      "pointsRedeemed": 50,
      "profile": "learner",
      "roles": ["Learner", "Admin"],
      "state": "ACTIVE",
      "lastLoginDate": "2025-09-10T03:30:43.000Z",
      "gamificationEnabled": true,
      "userType": "Internal"
    }
  }
}
```
