# TIL Shuffle - Option 2 Implementation Tasks

## Overview
Implementing shared file-based team game with Game ID system to enable true multi-user collaboration.

---

## Phase 1: API Layer - File-Based Storage
- [ ] Create `uploadGameFile()` function to upload TIL data as JSON file
- [ ] Create `downloadGameFile()` function to retrieve TIL data using file_id
- [ ] Update `saveTILEntries()` to use file upload instead of structured memories
- [ ] Update `loadTILEntries()` to use file download instead of structured memories
- [ ] Add error handling for file operations (upload/download failures)
- [ ] Test API functions with sample data

## Phase 2: Game ID Management System
- [ ] Create `setGameID()` function to store game ID in localStorage
- [ ] Create `getGameID()` function to retrieve game ID from localStorage
- [ ] Create `clearGameID()` function to remove game ID
- [ ] Add validation for Game ID format (UUID)
- [ ] Test Game ID storage/retrieval

## Phase 3: UI - Game Creation/Joining Flow
- [ ] Add "Create New Game" button to entry mode
- [ ] Add "Join Existing Game" button to entry mode
- [ ] Create modal for Game ID input (joining existing game)
- [ ] Create modal for Game ID display (after creating new game)
- [ ] Add Game ID display in header/footer (always visible when in a game)
- [ ] Style new UI components to match game show aesthetic
- [ ] Test UI flows (create/join)

## Phase 4: Application Logic Updates
- [ ] Update app initialization to check for existing Game ID
- [ ] Modify `handleSubmitAll()` to:
  - Load existing data from file
  - Merge new entries with existing entries
  - Upload merged data back to file
- [ ] Modify `handleStartGame()` to load from file using Game ID
- [ ] Add "Share Game ID" functionality (copy to clipboard)
- [ ] Update "New Session" to create new game with new Game ID
- [ ] Test full flow: Create → Add TILs → Join from another browser → Add more TILs → Play

## Phase 5: User Experience Enhancements
- [ ] Add loading states for all file operations
- [ ] Add success/error messages for game creation/joining
- [ ] Add warning about 30-day file expiration
- [ ] Add "Copy Game ID" button with visual feedback
- [ ] Add Game ID validation with helpful error messages
- [ ] Add confirmation dialogs for critical actions
- [ ] Test UX flows and edge cases

## Phase 6: Error Handling & Edge Cases
- [ ] Handle expired file (404) - prompt to create new game
- [ ] Handle invalid Game ID - show clear error message
- [ ] Handle network errors with retry logic
- [ ] Handle concurrent writes (file conflicts)
- [ ] Add data validation for loaded file content
- [ ] Test all error scenarios

## Phase 7: Documentation & Deployment
- [ ] Update README.md with new Game ID workflow
- [ ] Update 409_ERROR_FIX.md to document Option 2 implementation
- [ ] Create user guide for creating/joining games
- [ ] Add inline help text in UI
- [ ] Update all console.log statements for new flow
- [ ] Final testing across multiple browsers/devices
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Test deployed version

---

## Implementation Notes

### File Storage Structure
```json
{
  "gameId": "uuid-string",
  "createdAt": "ISO timestamp",
  "lastUpdated": "ISO timestamp",
  "expiresAt": "ISO timestamp (30 days from creation)",
  "entries": [
    {
      "id": "uuid",
      "til": "Today I learned...",
      "name": "Alice",
      "isRevealed": false,
      "timestamp": "ISO timestamp"
    }
  ]
}
```

### LocalStorage Keys
- `game-id`: Current game ID (file_id from upload)
- `ape-api-key`: API key (existing)
- `ape-api-key-last-validated`: API key validation timestamp (existing)

### User Flow
1. **First User (Game Creator):**
   - Opens app → API key setup
   - Clicks "Create New Game"
   - Gets Game ID (displayed in modal)
   - Copies Game ID and shares with team
   - Adds TILs → Submits
   - Starts game

2. **Additional Users (Game Joiners):**
   - Opens app → API key setup
   - Clicks "Join Existing Game"
   - Enters Game ID shared by creator
   - Adds their TILs → Submits
   - When everyone is ready, anyone can start the game

3. **Playing the Game:**
   - Any team member can click "Start Game"
   - All TILs from all contributors are shuffled
   - Team plays together guessing who said what

---

## Success Criteria
- [ ] Multiple users can contribute to the same game
- [ ] All TILs are visible to all players
- [ ] Game ID can be easily shared (copy/paste)
- [ ] Clear error messages for all edge cases
- [ ] 30-day expiration is communicated to users
- [ ] Works across different browsers/devices
- [ ] No 409 errors
- [ ] True team collaboration experience

---

**Status:** Phase 1 - In Progress
**Last Updated:** 2025-11-17
