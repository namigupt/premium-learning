# Current Enrollments Block

The Current Enrollments block displays a user's active course enrollments from Adobe Learning Manager in a responsive card-based layout.

## Features

- **Authentication Integration**: Uses OAuth tokens from the OAuth block
- **Real-time Data**: Fetches current enrollment data via Adobe Learning Manager API
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Progress Tracking**: Shows completion progress for each enrollment
- **Status Indicators**: Visual badges for enrollment states (Enrolled, In Progress, Completed)
- **Interactive Cards**: Hover effects and action buttons for each course
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Smooth loading animations while fetching data

## Usage

### Basic Implementation

Add the block to your page content:

```
Current Enrollments
```

### With Configuration (Optional)

You can add configuration options:

```
Current Enrollments
| Setting | Value |
| max_items | 10 |
| show_completed | true |
```

## API Integration

The block uses the Adobe Learning Manager API endpoint:

- **Endpoint**: `POST /primeapi/v2/learningObjects/query`
- **Authentication**: Bearer token from OAuth block
- **Filters**:
  - Learning states: enrolled, completed, started
  - Learning object types: learningProgram
  - Enhanced LP: false

## Data Display

Each enrollment card shows:

### Course Information

- Course title and description
- Course thumbnail image
- Duration and tags
- Enrollment and deadline dates

### Progress Tracking

- Visual progress bar
- Percentage completion
- Status badge (Enrolled/In Progress/Completed)

### Actions

- **Continue Learning**: Navigate to course content
- **View Details**: Open course details page

## States

### Loading State

- Animated spinner
- Loading message
- Appears while fetching data

### Error State

- Error icon and message
- Retry button
- Handles authentication and API errors

### Empty State

- Friendly message when no enrollments found
- Encourages exploration of learning catalog

### Success State

- Grid layout of enrollment cards
- Header with enrollment count
- Responsive card design

## Styling

The block uses CSS custom properties from the main stylesheet:

- `--link-color`: Primary action color
- `--text-color`: Main text color
- `--dark-color`: Secondary text color
- `--light-color`: Background accents

### Responsive Breakpoints

- **Desktop**: Multi-column grid (350px minimum card width)
- **Tablet**: 768px and below - single column
- **Mobile**: 480px and below - optimized spacing

## Dependencies

### Required

- **OAuth Block**: Must be implemented and authenticated first
- **Adobe Learning Manager API**: Valid API access and permissions

### Optional

- Custom configuration parameters
- Additional styling overrides

## Error Handling

The block handles various error scenarios:

1. **No Authentication**: Prompts user to authenticate via OAuth block
2. **API Errors**: Shows specific error messages with retry options
3. **Network Issues**: Graceful degradation with error states
4. **No Data**: Friendly empty state message

## Browser Support

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support
- Fetch API support

## Customization

### CSS Variables

Override these variables to customize appearance:

```css
.current-enrollments-container {
  --card-border-radius: 12px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --progress-height: 8px;
}
```

### JavaScript Hooks

Global functions available for customization:

- `window.continueLearning(enrollmentId)`
- `window.viewCourseDetails(enrollmentId)`

## Performance

- **Lazy Loading**: Images loaded with `loading="lazy"`
- **Efficient Rendering**: Minimal DOM manipulation
- **Responsive Images**: Optimized for different screen sizes
- **Animation Optimization**: CSS transforms for smooth interactions

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and structure
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Appropriate ARIA labels and descriptions
- **Color Contrast**: Meets WCAG guidelines for text readability

## Security

- **Token Handling**: Uses sessionStorage for OAuth tokens
- **API Security**: All requests include proper authentication headers
- **XSS Prevention**: Proper content sanitization and escaping

## Future Enhancements

Potential improvements:

- Filtering and sorting options
- Search functionality
- Bulk actions for multiple enrollments
- Integration with calendar for deadlines
- Offline support with caching
- Push notifications for deadlines
