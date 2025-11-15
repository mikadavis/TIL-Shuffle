# TIL Shuffle - Game Show Edition

A vibrant, interactive application that gamifies the "Today I Learned" (TIL) sharing experience. Team members anonymously submit their weekly learnings, which are then revealed one by one in an exciting guessing game format.

## 🎯 Purpose

TIL Shuffle enables teams to:
- Share weekly learnings anonymously
- Create an engaging game show experience
- Foster knowledge sharing in a fun, interactive way
- Encourage team participation through gamification

## ✨ Features

### Entry Mode
- **Dynamic Form System**: Add unlimited TIL entries with a single click
- **Form Validation**: Ensures quality entries (minimum character requirements)
- **Cloud Storage**: All entries are saved securely to the cloud
- **Additive Entries**: Continue adding TILs across multiple sessions
- **Visual Feedback**: Real-time validation with clear error indicators

### Game Mode
- **Random Shuffling**: Fair randomization using Fisher-Yates algorithm
- **Progressive Reveal**: Show TIL first, then reveal the author on demand
- **Progress Tracking**: Visual counter showing remaining TILs
- **No Repeats**: Ensures each TIL is shown only once per game
- **Session Management**: Easy reset for new games

## 🎨 Design Philosophy

The application combines two distinct aesthetics:

### Game Show Feel
- Bold, vibrant color schemes with neon accents
- Large, attention-grabbing typography
- Dramatic reveal animations
- Progress indicators with visual feedback
- High-energy button styles and interactions

### Metaverse Edge
- Glassmorphism effects (frosted glass UI elements)
- Subtle 3D transforms on hover
- Gradient borders with glow effects
- Smooth, modern animations
- Card-based layouts with depth

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: Structured Memories API (Cloud JSON Storage)
- **Analytics**: Google Analytics (G-Q98010P7LZ)
- **API**: Meta's Wearables APE Platform
- **Browser**: Optimized for latest Chrome on MacBook

## 📋 Setup Instructions

### First-Time Setup

1. **Open the Application**: Launch `index.html` in Google Chrome
2. **API Key Setup Modal**: On first launch, you'll see a setup modal
3. **Get Your API Key**:
   - Visit: https://wearables-ape.io/consent (first time only - sign consent form)
   - Go to: https://wearables-ape.io/settings/api-keys
   - Click "New API Key" and copy the generated key
4. **Save Your Key**: Paste into the modal and click "Save"
5. **Automatic Validation**: The app will validate your key and reload

### Starting a Session

1. **Add TILs**:
   - Enter what you learned in the text area
   - Enter your name
   - Click "➕ Add Another TIL" for multiple entries
   - Click "🚀 Submit All TILs" when done

2. **Start the Game**:
   - Click "🎮 Start Game" button
   - TILs will be shuffled randomly
   - Click "🎭 Reveal Answer" to show who said it
   - Click "➡️ Next TIL" to continue

3. **Manage Sessions**:
   - "📝 Add More TILs" - Return to entry mode
   - "🔄 New Session" - Clear all data and start fresh

## 🔐 API Integration

### Storage Key
The application uses the cloud storage key: `til-shuffle-entries`

### API Endpoints
- **Base URL**: `https://api.wearables-ape.io`
- **Validation**: `POST /models/v1/chat/completions`
- **Storage**: `PUT/GET /structured-memories/til-shuffle-entries`

### Data Model
```javascript
{
  entries: [
    {
      id: "uuid",
      til: "string",
      name: "string",
      isRevealed: boolean,
      timestamp: "ISO-date"
    }
  ]
}
```

## 🎮 User Flows

### Primary Flow: Add and Play
1. User enters TIL and name
2. User clicks submit (or adds more entries)
3. System saves to cloud storage
4. User starts game
5. System shuffles and displays TILs
6. User reveals answers and progresses through all TILs

### Secondary Flow: Add More
1. During active game, user wants to add more TILs
2. User clicks "Add More TILs"
3. System returns to entry mode (preserves existing entries)
4. User adds new TILs and submits
5. User can restart game with all entries

### Session Reset Flow
1. User wants to start completely fresh
2. User clicks "New Session"
3. System confirms action
4. System clears all cloud data
5. User starts with blank slate

## 🐛 Debugging

The application includes comprehensive console logging for all operations:
- `[App]` - Application logic and state
- `[API]` - API calls and responses
- `[Analytics]` - Google Analytics events

Open Chrome DevTools (F12) to view detailed logs for:
- Application initialization
- API key validation
- Form operations
- Game state management
- API requests/responses
- Error conditions

## 📱 Responsive Design

The application is fully responsive with breakpoints for:
- Desktop (1200px+): Full-width card layout
- Tablet (768px-1199px): Adjusted spacing and fonts
- Mobile (< 768px): Stacked layout, touch-optimized buttons

## 🔒 Security & Privacy

- **Internal Use Only**: Designed for Meta internal deployment
- **Secure Storage**: Data tied to individual API keys
- **No Public Exposure**: Runs on secure laptops or GitHub Enterprise
- **24-Hour Validation**: API keys revalidated daily for security

## 📝 File Structure

```
til-shuffle/
├── index.html          # Main application file
├── styles.css          # All styling (game show + metaverse aesthetic)
├── app.js             # Core application logic
├── api.js             # API interaction layer
├── tasks.md           # Development task tracker
├── README.md          # This file
└── rules/
    └── rules.md       # Development rules and guidelines
```

## 🎯 Key Features Implementation

### Dynamic Form Management
- JavaScript-powered form multiplication
- Individual form removal (except first)
- Real-time validation feedback
- Persistent form state during session

### Fisher-Yates Shuffle
```javascript
for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
}
```

### Cloud Persistence
- Automatic save to Structured Memories API
- Merge new entries with existing ones
- Session-based data management
- Error handling with user feedback

## 🚀 Deployment

### Local Development
1. Clone or download the project
2. Open `index.html` in Chrome
3. Complete API key setup
4. Start using the application

### GitHub Pages (Internal)
1. Push to GitHub Enterprise repository
2. Enable GitHub Pages on main branch
3. Access via internal GitHub Pages URL
4. Secure by company network access only

## 🔄 Version History

### Version 1.0 - Initial Release
- Complete entry mode with dynamic forms
- Full game mode with reveal mechanics
- API key validation flow
- Cloud storage integration
- Game show + metaverse styling
- Comprehensive console logging
- Mobile responsive design

## 📄 License

Internal Meta use only. Not for public distribution.

---

## Original Prompt

Application Title: TIL Shuffle

Purpose of the application: This app will enable individual users to the write in a 'thing they learned' for the week,. The app will then hide the identity of the person who entered and randomly show one for the rest of the group to guess. it should enable as many indiviuals to enter thier TIL as needed

Look and feel of the application: Clean, with a game show feel and metaverse edge.

Known UI Elements Required:
1. there should be text entry boxes for TIL and one for name, there should be a pls button to make another set of text entry boxes appeaer. there should be a single submit button at the end.

User Flows:
1. a user will enter thier TIL and their name then hit submit

User inputs and actions to take on these inputs:
1. the user will type in text to both text boxes

Machine used to run this app: I'm using a Macbook and Google Chrome, both updated to the latest version

Follow the rules defined in the rules.md file included in this folder and if you cannot find the rules.md file, you MUST stop working, do not genrate code, and inform the user that they need to follow the instructions posted on the pinned post of Vibe Coding Workplace Group at fburl.com/vibe-code

---

Protohub fullscreen deployment: true
