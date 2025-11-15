# TIL Shuffle - Development Tasks

## Phase 1: Foundation & Setup ✅ COMPLETED

### Project Structure
- [x] Create base HTML file (index.html)
- [x] Create CSS file (styles.css) for all styling
- [x] Create main application logic file (app.js)
- [x] Create API interaction layer file (api.js)
- [x] Create README.md with "Original Prompt" section
- [x] Add "Protohub fullscreen deployment: true" to README.md

### API Key Management
- [x] Implement localStorage check for `ape-api-key` on page load
- [x] Implement localStorage check for `ape-api-key-last-validated` timestamp
- [x] Create API key validation modal/popup UI
- [x] Style popup with clean, game show + metaverse aesthetic
- [x] Implement consent form link and step-by-step instructions in popup
- [x] Create plain text input field for API key entry
- [x] Implement "Save" button with event listener
- [x] Implement API validation test call (POST to chat/completions with test message)
- [x] Handle successful validation: save key + timestamp to localStorage
- [x] Handle validation failure: display error message, keep popup open
- [x] Implement automatic page reload after successful validation
- [x] Add comprehensive console.log statements for all validation steps

### Google Analytics Integration
- [x] Add Google Analytics script with Tag ID: G-Q98010P7LZ
- [x] Test analytics is loading correctly
- [x] Add console.log for analytics initialization

## Phase 2: Entry Mode - Data Collection ✅ COMPLETED

### Dynamic Form Structure
- [x] Create HTML structure for initial TIL entry form
- [x] Add first text input field for TIL with label
- [x] Add first text input field for Name with label
- [x] Create Plus (+) button to add more entry pairs
- [x] Style Plus button with game show aesthetic
- [x] Implement JavaScript function to dynamically add new TIL/Name pairs
- [x] Create Remove (×) button for each pair (except first one)
- [x] Implement JavaScript function to remove entry pairs
- [x] Ensure form maintains proper layout as pairs are added/removed
- [x] Add console.log statements for add/remove operations

### Form Validation
- [x] Implement validation to ensure TIL field is not empty
- [x] Implement validation to ensure Name field is not empty
- [x] Implement minimum character requirements (e.g., 5 chars for TIL, 2 for Name)
- [x] Display validation error messages to user
- [x] Add visual indicators for invalid fields (red borders, etc.)
- [x] Add console.log for validation checks

### Submit Functionality
- [x] Create single "Submit All" button at bottom of form
- [x] Style Submit button with prominent game show aesthetic
- [x] Implement submit button click handler
- [x] Validate all entry pairs before submission
- [x] Generate unique IDs for each TIL entry
- [x] Add timestamp to each entry
- [x] Structure data according to data model (array of objects)
- [x] Add console.log for submission process and data structure

### Cloud Storage Integration
- [x] Define storage key using naming convention: `til-shuffle-entries`
- [x] Implement PUT request to Structured Memories API
- [x] Include Authorization header with API key from localStorage
- [x] Handle successful storage response
- [x] Handle storage error responses
- [x] Display success message to user after successful submission
- [x] Add comprehensive console.log for API call (endpoint, payload, response)
- [x] Clear form after successful submission or offer to add more

## Phase 3: Game Mode - Display & Interaction ✅ COMPLETED

### Mode Switching
- [x] Create "Start Game" button in Entry Mode
- [x] Style "Start Game" button with game show aesthetic
- [x] Implement function to switch from Entry Mode to Game Mode
- [x] Hide Entry Mode UI when switching to Game Mode
- [x] Show Game Mode UI when switching from Entry Mode
- [x] Add console.log for mode switching

### Load TIL Data
- [x] Implement GET request to Structured Memories API on Game Mode start
- [x] Retrieve stored TIL entries from cloud storage
- [x] Parse and validate retrieved data
- [x] Handle case where no entries exist (show message)
- [x] Handle API errors gracefully
- [x] Add comprehensive console.log for data loading

### Randomization Logic
- [x] Implement Fisher-Yates shuffle algorithm for randomization
- [x] Create array to track displayed TILs
- [x] Create function to get next random unrevealed TIL
- [x] Ensure no repeats until all TILs are revealed
- [x] Add console.log for randomization operations

### Game Display UI
- [x] Create card-based layout for displaying TIL
- [x] Display current TIL text in large, readable font
- [x] Hide name initially
- [x] Create "Reveal Answer" button
- [x] Style "Reveal Answer" button with game show aesthetic
- [x] Implement reveal animation/transition when button is clicked
- [x] Display name after reveal with animation
- [x] Create "Next TIL" button
- [x] Style "Next TIL" button
- [x] Implement "Next TIL" functionality to show next random entry
- [x] Add console.log for display and reveal operations

### Progress Tracking
- [x] Display counter showing remaining TILs (e.g., "5 of 12 remaining")
- [x] Update counter as TILs are revealed
- [x] Display message when all TILs have been shown
- [x] Add console.log for progress tracking

### Session Management
- [x] Create "New Session" button
- [x] Style "New Session" button
- [x] Implement function to clear all data from cloud storage
- [x] Implement function to reset application to Entry Mode
- [x] Add confirmation dialog before clearing data
- [x] Create "Back to Entry" button to add more TILs
- [x] Implement function to return to Entry Mode without clearing data
- [x] Add console.log for session management actions

## Phase 4: Styling & Visual Polish ✅ COMPLETED

### Color Scheme & Theme
- [x] Define color palette (vibrant, neon accents, gradients)
- [x] Apply gradient backgrounds
- [x] Add glassmorphism effects to cards and containers
- [x] Implement glowing borders and neon effects
- [x] Set up CSS custom properties for theme colors

### Typography
- [x] Import bold, readable game show-style fonts (e.g., Google Fonts)
- [x] Apply large, attention-grabbing headings
- [x] Set readable body text sizes
- [x] Ensure proper text contrast for accessibility

### Animations & Transitions
- [x] Create smooth fade-in animations for UI elements
- [x] Add reveal animation for answer display
- [x] Implement button hover effects with scale/glow
- [x] Add loading spinner animation for API calls
- [x] Create page transition effects between modes
- [x] Add confetti or celebration effect when answer is revealed
- [x] Implement smooth scroll animations where appropriate

### Game Show Aesthetic
- [x] Add spotlight/focus effects on active elements
- [x] Create bold visual hierarchy
- [x] Add score/progress bars with vibrant colors
- [x] Implement dramatic reveal effects
- [x] Add visual feedback for all interactions

### Metaverse Edge Styling
- [x] Apply frosted glass UI elements
- [x] Add subtle 3D transforms on hover
- [x] Create depth with shadows and layering
- [x] Add gradient borders with animation
- [x] Implement modern card-based layouts with depth

### Responsive Design
- [x] Test layout on various screen sizes
- [x] Adjust font sizes for mobile devices
- [x] Ensure buttons are touch-friendly (minimum 44px)
- [x] Stack elements vertically on small screens
- [x] Test on Chrome browser specifically
- [x] Ensure proper spacing and padding on all devices

## Phase 5: Error Handling & Edge Cases ✅ COMPLETED

### API Error Handling
- [x] Handle network errors for all API calls
- [x] Display user-friendly error messages
- [x] Add retry functionality for failed API calls (exponential backoff)
- [x] Handle rate limiting (1 call per second per model)
- [x] Add console.log for all error conditions

### Data Validation
- [x] Handle corrupted or invalid data from cloud storage
- [x] Implement fallback for missing data fields
- [x] Validate data structure before processing
- [x] Add console.log for validation issues

### User Experience Edge Cases
- [x] Handle case where only one TIL is submitted
- [x] Handle case where duplicate names are entered (optional warning)
- [x] Handle browser back button gracefully
- [x] Prevent double-submission of forms
- [x] Add loading states for all async operations
- [x] Add console.log for UX edge cases

## Phase 6: Testing & Documentation ✅ COMPLETED

### Cross-Browser Testing
- [x] Test all functionality in latest Chrome on MacBook
- [x] Test API key validation flow
- [x] Test Entry Mode form (add/remove/submit)
- [x] Test Game Mode (display/reveal/next)
- [x] Test session management (new/reset)
- [x] Test all animations and transitions
- [x] Verify all console.log statements are working

### Documentation
- [x] Complete README.md with full application description
- [x] Add setup instructions to README.md
- [x] Document API integrations in README.md
- [x] Include complete original prompt in README.md
- [x] Add usage instructions for Entry and Game modes
- [x] Document the storage key: `til-shuffle-entries`
- [x] Add troubleshooting section
- [x] Ensure "Protohub fullscreen deployment: true" is at bottom of README.md

### Final Code Review
- [x] Review all code for console.log coverage
- [x] Ensure all rules.md requirements are met
- [x] Verify Google Analytics is tracking
- [x] Test complete user flow from start to finish
- [x] Verify all styling matches game show + metaverse aesthetic
- [x] Check for any hardcoded values that should be configurable
- [x] Final browser console check for any errors

## Phase 7: Optional Enhancements (If Requested)

- [ ] Add timer for guessing phase
- [ ] Implement scoring system for correct guesses
- [ ] Create multiple game sessions management
- [ ] Add export results functionality
- [ ] Implement sound effects for reveals
- [ ] Create leaderboard feature

---

## Notes
- Storage Key: `til-shuffle-entries`
- API Endpoint: `https://api.wearables-ape.io`
- Tag ID: G-Q98010P7LZ
- Model: gpt-4o-mini for API validation
- Browser: Latest Chrome on MacBook
