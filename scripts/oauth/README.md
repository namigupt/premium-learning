# OAuth Script

This script provides OAuth 2.0 authentication with Adobe Learning Manager. It handles the complete OAuth flow including authorization code exchange for access tokens.

## Features

- OAuth 2.0 Authorization Code flow
- Automatic redirect to Adobe Learning Manager OAuth endpoint
- Token exchange and storage in session storage
- Error handling and user feedback
- Responsive design
- Clean session management

## Usage

To use this script in your EDS page, create a table with the OAuth configuration:

```
| OAuth |  |
|---|---|
| Client ID | your-client-id-here |
| Client Secret | your-client-secret-here |
| Redirect URI | https://your-domain.com/oauth-page |
| Scope | learner:read |
```

### Configuration Parameters

| Parameter     | Required | Description                                     | Default          |
| ------------- | -------- | ----------------------------------------------- | ---------------- |
| Client ID     | Yes      | Your Adobe Learning Manager OAuth client ID     | -                |
| Client Secret | Yes      | Your Adobe Learning Manager OAuth client secret | -                |
| Redirect URI  | No       | The redirect URI registered with your OAuth app | Current page URL |
| Scope         | No       | OAuth scope for permissions                     | `learner:read`   |



## OAuth Flow

1. **Initial Load**: User sees a login button
2. **Authorization**: Clicking the button redirects to Adobe Learning Manager OAuth
3. **Callback**: User is redirected back with authorization code
4. **Token Exchange**: Block automatically exchanges code for access token
5. **Success**: Access token is stored in session storage and displayed

## Token Storage

The block stores tokens in the browser's session storage:

- `alm_access_token`: The access token for API calls
- `alm_refresh_token`: The refresh token (if provided)

## API Integration

After successful authentication, you can use the stored access token for Adobe Learning Manager API calls:

```javascript
const accessToken = sessionStorage.getItem('alm_access_token');

// Example API call
fetch('https://learningmanager.adobe.com/primeapi/v2/learningObjects', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.api+json',
  },
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## Security Considerations

- Client secrets are exposed in the frontend code - consider using a backend proxy for production
- Tokens are stored in session storage and cleared when the session ends
- Always use HTTPS for OAuth redirects
- Validate redirect URIs in your Adobe Learning Manager OAuth app configuration

## Error Handling

The block handles various error scenarios:

- Missing client ID
- OAuth authorization errors
- Token exchange failures
- Network connectivity issues

## Styling

The block uses CSS custom properties for theming:

- `--body-font-family`: Font family for text
- `--heading-color`: Color for headings
- `--text-color`: Color for body text

## Browser Support

- Modern browsers with ES6+ support
- Fetch API support
- Session Storage support
