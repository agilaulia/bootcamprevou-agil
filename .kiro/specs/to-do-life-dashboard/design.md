# Design Document

## Overview

The To-Do List Life Dashboard is a single-page web application built with vanilla JavaScript, HTML5, and CSS3. The architecture follows a modular component-based design pattern without requiring a framework, emphasizing separation of concerns and maintainability.

## Architecture

The system follows a modular component-based architecture with clear separation between presentation, logic, and data persistence layers.

### Core Principles

1. **Client-Side Only**: No backend server required; all functionality runs in the browser
2. **Local Storage Persistence**: Browser's Local Storage API provides data persistence
3. **Modular Components**: Each feature area is encapsulated in its own module
4. **Event-Driven Updates**: Components communicate through custom events and observer patterns
5. **Progressive Enhancement**: Core functionality works without JavaScript enhancements

## Components and Interfaces

### Component Diagram

```
┌─────────────────────────────────────────────────┐
│           Dashboard (Main Container)            │
├─────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐  │
│  │      Time & Date Display Module          │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │      Greeting Module                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌─────────────────────────┐│
│  │ Focus Timer  │  │   Task Manager          ││
│  │   Module     │  │   Module                ││
│  └──────────────┘  └─────────────────────────┘│
│  ┌──────────────────────────────────────────┐  │
│  │      Quick Links Module                  │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │   Settings Panel & Theme Switcher        │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────┐
│     Storage Service (LocalStorage Wrapper)      │
└─────────────────────────────────────────────────┘
```

## Module Descriptions

### 1. Storage Service

**Purpose**: Centralized interface for Local Storage operations with type safety and error handling.

**Responsibilities**:
- Abstract Local Storage API with consistent get/set interface
- Handle JSON serialization/deserialization
- Provide default values for missing data
- Catch and handle storage quota errors

**Interface**:
```javascript
class StorageService {
  get(key, defaultValue)
  set(key, value)
  remove(key)
  clear()
}
```

**Storage Keys**:
- `tasks`: JSON array of task objects
- `quickLinks`: JSON array of link objects
- `userName`: String for custom greeting name
- `timerDuration`: Number for custom timer duration (in minutes)
- `theme`: String ('light' or 'dark')

## Data Models

**Task Object**:
```javascript
{
  id: string,          // UUID v4
  text: string,
  completed: boolean,
  createdAt: number    // Unix timestamp
}
```

**Link Object**:
```javascript
{
  id: string,          // UUID v4
  name: string,
  url: string
}
```

### 2. Time & Date Display Module

**Purpose**: Display current time and date with real-time updates.

**Responsibilities**:
- Format current time in 12-hour format with AM/PM
- Format current date with day of week, month name, and day number
- Update display every second via setInterval
- Handle time zone conversions automatically

**Key Functions**:
```javascript
formatTime(date)      // Returns "HH:MM:SS AM/PM"
formatDate(date)      // Returns "DayName, MonthName Day"
updateDisplay()       // Updates DOM with current time/date
startClock()          // Initializes interval for updates
```

**Implementation Details**:
- Use `setInterval` with 1000ms delay for updates
- Use `Date.toLocaleTimeString()` and `Date.toLocaleDateString()` with options for formatting
- Store interval ID for cleanup on unmount

### 3. Greeting Module

**Purpose**: Display personalized time-based greeting message.

**Responsibilities**:
- Determine appropriate greeting based on current hour
- Display custom user name when available
- Update greeting when time period changes

**Greeting Logic**:
```javascript
getGreeting(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning"
  if (hour >= 12 && hour < 17) return "Good Afternoon"
  if (hour >= 17 && hour < 21) return "Good Evening"
  return "Good Night"  // 21-4
}

getGreetingMessage(hour, userName) {
  const greeting = getGreeting(hour)
  return userName ? `${greeting}, ${userName}` : greeting
}
```

**Update Strategy**:
- Check hour every minute (not every second to reduce overhead)
- Re-render only when hour changes to new greeting period
- Listen for custom events from Settings Panel for name updates

### 4. Focus Timer Module

**Purpose**: Pomodoro-style countdown timer for focus sessions.

**Responsibilities**:
- Display remaining time in MM:SS format
- Provide start, stop, and reset controls
- Use custom or default duration (25 minutes)
- Stop automatically when reaching zero

**State Management**:
```javascript
{
  duration: number,        // Total duration in seconds
  remaining: number,       // Remaining time in seconds
  isRunning: boolean,
  intervalId: number | null
}
```

**Key Functions**:
```javascript
formatTime(seconds)      // Converts seconds to "MM:SS"
start()                  // Begins countdown
stop()                   // Pauses countdown
reset()                  // Returns to initial duration
tick()                   // Decrements remaining by 1 second
```

**Implementation Details**:
- Store duration in minutes in Local Storage, convert to seconds for timer logic
- Use `setInterval` with 1000ms for countdown
- Clear interval when stopped or reaching zero
- Prevent negative time values

### 5. Task Manager Module

**Purpose**: Full CRUD operations for to-do list items.

**Responsibilities**:
- Create new tasks with unique IDs
- Display task list with completion status
- Edit existing task text
- Toggle task completion status
- Delete tasks
- Persist all changes to Local Storage immediately

**State Management**:
```javascript
{
  tasks: Array<Task>,
  editingTaskId: string | null
}
```

**Key Functions**:
```javascript
addTask(text)                    // Creates and saves new task
updateTask(id, updates)          // Updates task properties
deleteTask(id)                   // Removes task
toggleComplete(id)               // Flips completed boolean
renderTasks()                    // Updates DOM with current tasks
saveToStorage()                  // Persists tasks to Local Storage
loadFromStorage()                // Retrieves tasks from Local Storage
```

**UI Interactions**:
- Enter key or Add button triggers task creation
- Double-click task text enables edit mode
- Checkbox toggles completion with strikethrough styling
- Delete button shows confirmation for safety
- Empty/whitespace-only tasks are rejected

**Validation**:
- Task text must be non-empty after trimming
- Maximum task text length: 500 characters

### 6. Quick Links Module

**Purpose**: Manage shortcuts to favorite websites.

**Responsibilities**:
- Create link items with name and URL
- Display links as clickable buttons
- Open links in new tabs with proper URL formatting
- Delete links
- Persist all changes to Local Storage

**State Management**:
```javascript
{
  links: Array<Link>
}
```

**Key Functions**:
```javascript
addLink(name, url)              // Creates and saves new link
deleteLink(id)                  // Removes link
normalizeUrl(url)               // Ensures URL has protocol
openLink(url)                   // Opens URL in new tab
renderLinks()                   // Updates DOM with current links
saveToStorage()                 // Persists links to Local Storage
loadFromStorage()               // Retrieves links from Local Storage
```

**URL Normalization**:
```javascript
normalizeUrl(url) {
  // Check if URL starts with http:// or https://
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`
  }
  return url
}
```

**Validation**:
- Link name must be non-empty
- URL must be non-empty
- Maximum name length: 50 characters
- Maximum URL length: 2000 characters

### 7. Settings Panel Module

**Purpose**: Configuration interface for user preferences.

**Responsibilities**:
- Accept custom user name input
- Accept custom timer duration input
- Save preferences to Local Storage
- Notify other modules of configuration changes

**Key Functions**:
```javascript
saveUserName(name)              // Stores name, triggers greeting update
saveTimerDuration(minutes)      // Stores duration, triggers timer update
```

**Validation**:
- Timer duration: 1-120 minutes (integer values only)
- User name: 1-50 characters

**Events**:
- Dispatch custom events when settings change:
  - `userName:changed` with new name
  - `timerDuration:changed` with new duration

### 8. Theme Switcher Module

**Purpose**: Toggle between light and dark color schemes.

**Responsibilities**:
- Apply theme CSS class to document root
- Persist theme preference to Local Storage
- Load saved theme on initialization

**Implementation**:
```javascript
{
  currentTheme: 'light' | 'dark'
}

toggleTheme() {
  const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', newTheme)
  this.currentTheme = newTheme
  storage.set('theme', newTheme)
}

loadTheme() {
  const savedTheme = storage.get('theme', 'light')
  document.documentElement.setAttribute('data-theme', savedTheme)
  this.currentTheme = savedTheme
}
```

**CSS Variables**:
```css
:root[data-theme="light"] {
  --bg-color: #ffffff;
  --text-color: #333333;
  --accent-color: #007bff;
  /* ... other variables */
}

:root[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --accent-color: #4a9eff;
  /* ... other variables */
}
```

## File Structure

```
to-do-life-dashboard/
├── index.html
├── css/
│   └── styles.css
└── js/
    └── app.js
```

**index.html**:
- Semantic HTML5 structure
- Minimal inline styles (none preferred)
- Script tag at end of body for app.js
- Meta tags for responsive design

**css/styles.css**:
- CSS custom properties for theming
- Mobile-first responsive design
- Flexbox/Grid for layout
- Smooth transitions for theme switching

**js/app.js**:
- All JavaScript in single file with module pattern
- IIFE (Immediately Invoked Function Expression) for scope isolation
- Clear module sections with comments
- Event listeners set up on DOMContentLoaded

## Data Flow

### Initialization Flow

1. **DOM Ready**: `DOMContentLoaded` event fires
2. **Load Theme**: Theme Switcher loads and applies saved theme
3. **Load Storage**: Storage Service retrieves all persisted data
4. **Initialize Modules**: Each module initializes with saved data
   - Time Display starts clock
   - Greeting Module displays greeting with saved name
   - Focus Timer loads custom duration or defaults to 25 minutes
   - Task Manager renders saved tasks
   - Quick Links renders saved links
5. **Bind Event Listeners**: All UI interactions wired up

### User Interaction Flow

**Example: Adding a Task**

1. User types task text in input field
2. User presses Enter or clicks Add button
3. Task Manager validates input (non-empty after trim)
4. If valid:
   - Generate unique ID (UUID v4)
   - Create task object with text, completed=false, timestamp
   - Add to tasks array in state
   - Save entire tasks array to Local Storage
   - Re-render task list in DOM
   - Clear input field
5. If invalid:
   - Show validation message (brief, non-intrusive)
   - Keep input field focused

**Example: Toggling Theme**

1. User clicks theme toggle button
2. Theme Switcher determines new theme (opposite of current)
3. Update `data-theme` attribute on document root
4. Save new theme to Local Storage
5. CSS variables automatically update styling via cascade

## Error Handling

### Local Storage Errors

**Quota Exceeded**:
```javascript
try {
  localStorage.setItem(key, value)
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    // Show user-friendly message
    // Suggest clearing old data
    console.error('Storage quota exceeded')
  }
}
```

**Storage Unavailable** (private browsing):
- Detect availability on initialization
- Fall back to in-memory storage (session-only)
- Notify user data won't persist

### Data Corruption

**Invalid JSON**:
```javascript
try {
  const data = JSON.parse(localStorage.getItem(key))
  return data
} catch (e) {
  console.error('Failed to parse stored data:', e)
  return defaultValue
}
```

**Schema Validation**:
- Validate loaded data structure matches expected schema
- If invalid, use default empty state
- Log warning for debugging

## Performance Considerations

### Rendering Optimization

- **Batch DOM Updates**: Update DOM once per operation, not per item
- **Event Delegation**: Use single listener on parent for repeated elements (task items, links)
- **Debouncing**: Debounce storage writes for rapid successive changes (e.g., timer duration input)

### Memory Management

- **Clear Intervals**: Always clear `setInterval` when components unmount or pause
- **Remove Listeners**: Clean up event listeners when no longer needed
- **Limit List Sizes**: Consider pagination or virtualization for >100 tasks/links

### Storage Efficiency

- **Compress Data**: Store minimal data (no redundant fields)
- **Batch Writes**: Write to Local Storage after operation completes, not during
- **Size Limits**: Monitor storage usage, warn at 80% capacity

## Browser Compatibility

### Target Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required APIs

- Local Storage API (universally supported)
- ES6+ features:
  - Template literals
  - Arrow functions
  - Destructuring
  - Spread operator
  - Array methods (map, filter, find)
- DOM APIs:
  - `querySelector`, `querySelectorAll`
  - `classList` API
  - `dataset` API
  - `CustomEvent`

### Polyfills

Not required for target browsers, but optional for older browser support:
- UUID generation: Use simple alternative or polyfill
- `Date.toLocaleTimeString`: Native support sufficient

## Security Considerations

### Input Validation

- **XSS Prevention**: Sanitize all user input before rendering
  - Use `textContent` instead of `innerHTML` for user-generated text
  - If HTML needed, use DOMPurify library
- **URL Validation**: Validate URLs before opening to prevent `javascript:` protocol
- **Length Limits**: Enforce maximum lengths to prevent storage abuse

### Data Privacy

- **Local-Only Storage**: No data transmitted to external servers
- **No Sensitive Data**: Avoid storing passwords or sensitive information
- **Clear Data Option**: Provide way to clear all stored data

## Accessibility

### Keyboard Navigation

- **Tab Order**: Logical tab order through all interactive elements
- **Enter Key**: Submit forms with Enter key
- **Escape Key**: Cancel edit mode, close modals
- **Arrow Keys**: Navigate between tasks/links (optional enhancement)

### Screen Reader Support

- **Semantic HTML**: Use proper heading hierarchy, lists, buttons
- **ARIA Labels**: Add descriptive labels for icon-only buttons
  - `aria-label="Start timer"`
  - `aria-label="Delete task"`
- **ARIA Live Regions**: Announce dynamic updates
  - Timer reaching zero
  - Task added/deleted
  - Theme changed

### Visual Accessibility

- **Color Contrast**: WCAG AA compliance (4.5:1 for normal text)
- **Focus Indicators**: Visible focus styles for keyboard navigation
- **Text Size**: Minimum 16px base font size
- **Scalability**: Support browser zoom up to 200%

## Testing Strategy

### Unit Tests

Focus on specific examples and edge cases:

1. **Time Formatting**:
   - Test noon/midnight edge cases (12:00 PM vs 12:00 AM)
   - Test single-digit hours and minutes

2. **Greeting Logic**:
   - Test boundary hours (4:59 AM, 5:00 AM, 11:59 AM, 12:00 PM, etc.)
   - Test each greeting period with sample hours

3. **Timer State**:
   - Test initial state is 25 minutes
   - Test timer with custom duration loaded from storage
   - Test timer stops at zero

4. **Validation**:
   - Test empty task rejection
   - Test whitespace-only task rejection
   - Test URL without protocol gets normalized

5. **Storage Defaults**:
   - Test each module uses correct default when no storage data
   - Test theme defaults to light mode

### Property-Based Tests

Test universal properties across all inputs (minimum 100 iterations each):

1. **Time Formatting Properties**
2. **Date Formatting Properties**
3. **Greeting with Name Property**
4. **Timer Operations Properties**
5. **Storage Round-Trip Properties**
6. **Task CRUD Properties**
7. **Link CRUD Properties**
8. **URL Normalization Property**
9. **Theme Toggle Property**

(See Correctness Properties section below for detailed property specifications)

### Integration Tests

1. **LocalStorage Integration**:
   - Test data persists across page reloads
   - Test storage quota exceeded handling

2. **UI Interactions**:
   - Test form submissions update DOM
   - Test button clicks trigger correct actions
   - Test edit mode enables/disables correctly

3. **Timer Behavior**:
   - Test timer decrements every second
   - Test start/stop/reset buttons work correctly

4. **Performance**:
   - Test page load time < 1 second
   - Test interaction response time < 100ms

### Manual Testing

1. **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge
2. **Responsive Design**: Test on mobile, tablet, desktop viewports
3. **Accessibility**: Test with screen reader and keyboard-only navigation
4. **Theme Switching**: Verify visual appearance in both themes

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time Format Validity

**For any** valid Date object, the `formatTime` function SHALL produce a string matching the pattern `HH:MM:SS AM|PM` where HH is 01-12, MM and SS are 00-59, and meridiem is either AM or PM.

**Validates: Requirements 1.1**

### Property 2: Date Format Validity

**For any** valid Date object, the `formatDate` function SHALL produce a string containing a day name (Monday-Sunday), a month name (January-December), and a day number (1-31).

**Validates: Requirements 1.2**

### Property 3: Greeting with Name Concatenation

**For any** non-empty username string and any valid hour (0-23), the `getGreetingMessage` function SHALL return a string that contains both the appropriate time-based greeting and the username.

**Validates: Requirements 2.5**

### Property 4: Timer Display Format

**For any** non-negative integer representing seconds (0 to 86400), the `formatTime` function SHALL produce a string in MM:SS format where MM is 00-99 and SS is 00-59.

**Validates: Requirements 4.2**

### Property 5: Timer Reset Restores Initial State

**For any** initial timer duration and any current remaining time value, calling `reset()` SHALL restore the remaining time to equal the initial duration.

**Validates: Requirements 4.5**

### Property 6: User Name Storage Round-Trip

**For any** non-empty string (1-50 characters), saving the string as userName to Local Storage and then immediately retrieving it SHALL return an equivalent string value.

**Validates: Requirements 3.2**

### Property 7: Timer Duration Storage Round-Trip

**For any** positive integer duration value (1-120 minutes), saving the value as timerDuration to Local Storage and then immediately retrieving it SHALL return an equivalent numeric value.

**Validates: Requirements 5.2**

### Property 8: Task Array Storage Round-Trip

**For any** array of valid Task objects, serializing the array to Local Storage and then immediately deserializing it SHALL produce an array with the same length and equivalent task objects in the same order.

**Validates: Requirements 6.3**

### Property 9: Adding Task Increases List Length

**For any** existing task array and any valid (non-empty after trimming) task text string, adding a new task SHALL result in the task array length increasing by exactly 1.

**Validates: Requirements 6.2**

### Property 10: Deleting Task Decreases List Length

**For any** non-empty task array and any valid task index within the array bounds, deleting the task at that index SHALL result in the task array length decreasing by exactly 1.

**Validates: Requirements 9.2**

### Property 11: Task Text Update Preserves Identity

**For any** existing task and any new non-empty text string, updating the task's text property SHALL change only the text field while preserving the task's id, completed status, and createdAt timestamp.

**Validates: Requirements 7.3**

### Property 12: Task Completion Toggle Flips Boolean

**For any** existing task, toggling its completion status SHALL change the completed field from true to false or from false to true, representing a boolean negation operation.

**Validates: Requirements 8.2, 8.5**

### Property 13: Link Array Storage Round-Trip

**For any** array of valid Link objects, serializing the array to Local Storage and then immediately deserializing it SHALL produce an array with the same length and equivalent link objects in the same order.

**Validates: Requirements 10.3**

### Property 14: Adding Link Increases List Length

**For any** existing link array and any valid link with non-empty name and url, adding the link SHALL result in the link array length increasing by exactly 1.

**Validates: Requirements 10.2**

### Property 15: Deleting Link Decreases List Length

**For any** non-empty link array and any valid link index within the array bounds, deleting the link at that index SHALL result in the link array length decreasing by exactly 1.

**Validates: Requirements 12.2**

### Property 16: URL Protocol Normalization

**For any** URL string that does not begin with `http://` or `https://`, the `normalizeUrl` function SHALL prepend `https://` to the string, ensuring the result begins with a valid protocol prefix.

**Validates: Requirements 11.2, 11.3**

### Property 17: Theme Preference Storage Round-Trip

**For any** theme value ('light' or 'dark'), saving the value as theme to Local Storage and then immediately retrieving it SHALL return an equivalent string value.

**Validates: Requirements 13.3**

### Property 18: Theme Toggle Switches State

**For any** current theme state ('light' or 'dark'), calling `toggleTheme()` SHALL change the theme to the opposite value—from 'light' to 'dark' or from 'dark' to 'light'.

**Validates: Requirements 13.2**

## Implementation Notes

### Development Workflow

1. **Setup**: Create file structure (index.html, css/styles.css, js/app.js)
2. **Storage Service**: Implement and test storage abstraction first
3. **Static Modules**: Build time/date display and greeting (no user input)
4. **Timer**: Implement focus timer with controls
5. **Task Manager**: Implement full CRUD for tasks
6. **Quick Links**: Implement link management
7. **Settings**: Add configuration panel
8. **Theme**: Implement theme switcher
9. **Polish**: Refine styling, accessibility, performance

### Code Organization Pattern

```javascript
// app.js structure
(function() {
  'use strict';
  
  // Storage Service
  const StorageService = { /* ... */ };
  
  // Time Display Module
  const TimeDisplay = { /* ... */ };
  
  // Greeting Module
  const GreetingModule = { /* ... */ };
  
  // Focus Timer Module
  const FocusTimer = { /* ... */ };
  
  // Task Manager Module
  const TaskManager = { /* ... */ };
  
  // Quick Links Module
  const QuickLinks = { /* ... */ };
  
  // Settings Panel Module
  const SettingsPanel = { /* ... */ };
  
  // Theme Switcher Module
  const ThemeSwitcher = { /* ... */ };
  
  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    ThemeSwitcher.init();
    TimeDisplay.init();
    GreetingModule.init();
    FocusTimer.init();
    TaskManager.init();
    QuickLinks.init();
    SettingsPanel.init();
  });
})();
```

### Naming Conventions

- **Functions**: camelCase (e.g., `formatTime`, `addTask`)
- **Classes/Modules**: PascalCase (e.g., `StorageService`, `TaskManager`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_DURATION`, `STORAGE_KEYS`)
- **Private Functions**: Prefix with underscore (e.g., `_validateInput`)
- **DOM Elements**: Prefix with $ (e.g., `$taskInput`, `$timerDisplay`)

### CSS Conventions

- **BEM Methodology**: Block-Element-Modifier pattern
  - `.task-item` (block)
  - `.task-item__text` (element)
  - `.task-item--completed` (modifier)
- **Utility Classes**: Single-purpose classes for common patterns
  - `.flex-center`, `.text-large`, `.mb-2` (margin-bottom: 2rem)

## Future Enhancements

Potential features for future iterations (not in current scope):

1. **Task Categories/Tags**: Organize tasks by category or project
2. **Task Priorities**: High/medium/low priority indicators
3. **Task Due Dates**: Add deadlines and sorting by due date
4. **Notifications**: Browser notifications when timer completes
5. **Statistics Dashboard**: Track completed tasks, focus time
6. **Data Export**: Export tasks/links as JSON or CSV
7. **Cloud Sync**: Optional sync across devices (requires backend)
8. **Collaborative Features**: Share tasks/links with others
9. **Mobile App**: Native mobile version with offline support
10. **Voice Commands**: Voice input for hands-free task addition

## Conclusion

This design provides a comprehensive architecture for a feature-rich productivity dashboard that remains simple and maintainable. The modular structure allows for easy testing, future enhancements, and modifications without cascading changes throughout the codebase.

The focus on vanilla JavaScript ensures minimal dependencies, fast load times, and long-term stability. The use of Local Storage provides instant data persistence without complexity of backend infrastructure.

The correctness properties defined in this document provide a formal specification for validating the system's behavior through property-based testing, ensuring robustness across a wide range of inputs and edge cases.
