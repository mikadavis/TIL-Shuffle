// Application State
let appState = {
    currentMode: 'entry', // 'entry' or 'game'
    entries: [],
    currentTILIndex: 0,
    shuffledIndices: [],
    revealedCount: 0,
    userRole: 'owner', // 'owner' or 'participant' - determined by URL params
    gameIdFromUrl: null // Game ID passed via URL for participants
};

console.log('[App] Application loaded');
console.log('[App] Initial state:', JSON.stringify(appState, null, 2));

/**
 * Parse URL parameters to determine user role and game ID
 * URL format: ?gameId=xxx&role=participant OR ?gameId=xxx (owner by default)
 */
function parseURLParameters() {
    console.log('[App] Parsing URL parameters...');
    const urlParams = new URLSearchParams(window.location.search);

    const gameId = urlParams.get('gameId');
    const role = urlParams.get('role');

    console.log('[App] URL gameId:', gameId);
    console.log('[App] URL role:', role);

    // If gameId is in URL, save it
    if (gameId && isValidGameID(gameId)) {
        appState.gameIdFromUrl = gameId;
        setGameID(gameId);
        console.log('[App] Game ID from URL saved:', gameId);
    }

    // Determine role - participant if explicitly set, otherwise owner
    if (role === 'participant') {
        appState.userRole = 'participant';
        console.log('[App] User role set to: PARTICIPANT (can only submit TILs)');
    } else {
        appState.userRole = 'owner';
        console.log('[App] User role set to: OWNER (full access)');
    }

    return {
        gameId: appState.gameIdFromUrl,
        role: appState.userRole
    };
}

/**
 * Generate a shareable URL for participants
 */
function generateParticipantURL(gameId) {
    // Handle file:// protocol (local development) vs http/https
    let baseUrl;
    if (window.location.protocol === 'file:') {
        // For local files, use the full file path
        baseUrl = window.location.href.split('?')[0];
    } else {
        baseUrl = window.location.origin + window.location.pathname;
    }
    const participantUrl = `${baseUrl}?gameId=${gameId}&role=participant`;
    console.log('[App] Generated participant URL:', participantUrl);
    return participantUrl;
}

// DOM Elements
let elements = {};

/**
 * Initialize the application
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[App] DOM Content Loaded - Starting initialization...');

    // Cache DOM elements
    cacheElements();

    // Check API key validation
    console.log('[App] Checking API key validation status...');
    if (!isAPIKeyValid()) {
        console.log('[App] API key invalid or missing - showing modal');
        showAPIKeyModal();
    } else {
        console.log('[App] API key valid - initializing application');
        initializeApp();
    }
});

/**
 * Cache all DOM elements for easy access
 */
function cacheElements() {
    console.log('[App] Caching DOM elements...');

    elements = {
        // Modal elements
        apiKeyModal: document.getElementById('apiKeyModal'),
        apiKeyInput: document.getElementById('apiKeyInput'),
        saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
        apiKeyError: document.getElementById('apiKeyError'),
        apiKeySuccess: document.getElementById('apiKeySuccess'),

        // Game ID modals
        createGameModal: document.getElementById('createGameModal'),
        displayGameId: document.getElementById('displayGameId'),
        displayParticipantLink: document.getElementById('displayParticipantLink'),
        copyGameIdBtn: document.getElementById('copyGameIdBtn'),
        copyParticipantLinkBtn: document.getElementById('copyParticipantLinkBtn'),
        closeCreateGameModal: document.getElementById('closeCreateGameModal'),

        joinGameModal: document.getElementById('joinGameModal'),
        joinGameIdInput: document.getElementById('joinGameIdInput'),
        joinGameBtn: document.getElementById('joinGameBtn'),
        joinGameError: document.getElementById('joinGameError'),
        joinGameSuccess: document.getElementById('joinGameSuccess'),
        closeJoinGameModal: document.getElementById('closeJoinGameModal'),

        // Main app elements
        appContainer: document.getElementById('appContainer'),
        loadingOverlay: document.getElementById('loadingOverlay'),

        // Game ID banner
        gameIdBanner: document.getElementById('gameIdBanner'),
        bannerGameId: document.getElementById('bannerGameId'),
        copyGameIdBannerBtn: document.getElementById('copyGameIdBannerBtn'),
        copyParticipantLinkBannerBtn: document.getElementById('copyParticipantLinkBannerBtn'),

        // Entry mode elements
        entryMode: document.getElementById('entryMode'),
        gameSelectionButtons: document.getElementById('gameSelectionButtons'),
        createNewGameBtn: document.getElementById('createNewGameBtn'),
        joinExistingGameBtn: document.getElementById('joinExistingGameBtn'),
        entryFormsContainer: document.getElementById('entryFormsContainer'),
        addEntryBtn: document.getElementById('addEntryBtn'),
        submitAllBtn: document.getElementById('submitAllBtn'),
        startGameBtn: document.getElementById('startGameBtn'),

        // Game mode elements
        gameMode: document.getElementById('gameMode'),
        progressText: document.getElementById('progressText'),
        tilCard: document.getElementById('tilCard'),
        tilText: document.getElementById('tilText'),
        answerSection: document.getElementById('answerSection'),
        answerName: document.getElementById('answerName'),
        revealBtn: document.getElementById('revealBtn'),
        nextTilBtn: document.getElementById('nextTilBtn'),
        backToEntryBtn: document.getElementById('backToEntryBtn'),
        newSessionBtn: document.getElementById('newSessionBtn')
    };

    console.log('[App] DOM elements cached successfully');
}

/**
 * Show API key validation modal
 */
function showAPIKeyModal() {
    console.log('[App] Displaying API key modal');
    elements.apiKeyModal.style.display = 'flex';
    elements.appContainer.style.display = 'none';

    // Add event listener to save button
    elements.saveApiKeyBtn.addEventListener('click', handleSaveAPIKey);
    console.log('[App] API key modal event listener attached');
}

/**
 * Handle API key save button click
 */
async function handleSaveAPIKey() {
    console.log('[App] Save API key button clicked');

    const apiKey = elements.apiKeyInput.value.trim();
    console.log('[App] API key input value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'empty');

    if (!apiKey) {
        console.log('[App] API key is empty - showing error');
        showError('Please enter an API key');
        return;
    }

    // Hide previous messages
    elements.apiKeyError.style.display = 'none';
    elements.apiKeySuccess.style.display = 'none';

    // Show loading state
    elements.saveApiKeyBtn.textContent = 'Validating...';
    elements.saveApiKeyBtn.disabled = true;
    console.log('[App] Starting API key validation...');

    try {
        const result = await validateAPIKey(apiKey);
        console.log('[App] Validation result:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('[App] API key validated successfully');
            showSuccess('Success! Your API key has been saved. Reloading...');

            // Reload page after 1.5 seconds
            setTimeout(() => {
                console.log('[App] Reloading page...');
                window.location.reload();
            }, 1500);
        } else {
            console.error('[App] API key validation failed:', result.error);
            showError(`Invalid API Key: ${result.error}. Please check your key and try again.`);
            elements.saveApiKeyBtn.textContent = 'Save';
            elements.saveApiKeyBtn.disabled = false;
        }
    } catch (error) {
        console.error('[App] API key validation error:', error);
        showError(`Error: ${error.message}. Please try again.`);
        elements.saveApiKeyBtn.textContent = 'Save';
        elements.saveApiKeyBtn.disabled = false;
    }
}

/**
 * Show error message in modal
 */
function showError(message) {
    console.log('[App] Showing error message:', message);
    elements.apiKeyError.textContent = message;
    elements.apiKeyError.style.display = 'block';
    elements.apiKeySuccess.style.display = 'none';
}

/**
 * Show success message in modal
 */
function showSuccess(message) {
    console.log('[App] Showing success message:', message);
    elements.apiKeySuccess.textContent = message;
    elements.apiKeySuccess.style.display = 'block';
    elements.apiKeyError.style.display = 'none';
}

/**
 * Initialize the main application
 */
function initializeApp() {
    console.log('[App] Initializing main application...');

    // Hide modal and show app
    elements.apiKeyModal.style.display = 'none';
    elements.appContainer.style.display = 'block';

    // Parse URL parameters first to determine role and game ID
    parseURLParameters();

    // Apply role-based UI
    applyRoleBasedUI();

    // Check if user is in an existing game (from URL or localStorage)
    const gameId = getGameID();
    if (gameId) {
        console.log('[App] Existing Game ID found:', gameId);
        showGameIdBanner(gameId);
        hideGameSelectionButtons();
    } else {
        console.log('[App] No existing Game ID - showing game selection buttons');
        // Participants should not see game selection buttons if no game ID
        if (appState.userRole === 'participant') {
            console.log('[App] Participant with no game ID - showing error message');
            showParticipantNoGameError();
            return;
        }
        showGameSelectionButtons();
    }

    // Add initial entry form
    addEntryForm();

    // Attach event listeners
    attachEventListeners();

    // Check if there are existing entries
    checkExistingEntries();

    console.log('[App] Application initialized successfully');
}

/**
 * Apply UI changes based on user role
 */
function applyRoleBasedUI() {
    console.log('[App] Applying role-based UI for role:', appState.userRole);

    if (appState.userRole === 'participant') {
        // Participants cannot start the game - hide start game button
        elements.startGameBtn.style.display = 'none';

        // Hide game selection buttons (they join via URL)
        elements.gameSelectionButtons.style.display = 'none';

        // Hide game mode controls that only owners should see
        elements.backToEntryBtn.style.display = 'none';
        elements.newSessionBtn.style.display = 'none';

        // Hide the "Share Link" button from participants (they don't need it)
        if (elements.copyParticipantLinkBannerBtn) {
            elements.copyParticipantLinkBannerBtn.style.display = 'none';
        }

        // Update the subtitle to indicate participant mode
        const subtitle = document.querySelector('.app-subtitle');
        if (subtitle) {
            subtitle.textContent = '📝 Add your TIL below and submit!';
        }

        console.log('[App] Participant UI applied - game controls hidden');
    } else {
        // Owner has full access - ensure all controls are visible
        console.log('[App] Owner UI applied - full access');
    }
}

/**
 * Show error message when participant accesses without a game ID
 */
function showParticipantNoGameError() {
    console.log('[App] Showing participant no game error');

    const entrySection = document.querySelector('.entry-section');
    if (entrySection) {
        entrySection.innerHTML = `
            <h2 class="section-title">⚠️ Game Not Found</h2>
            <p class="section-description">
                It looks like you're trying to join a game, but no Game ID was provided in the URL.
            </p>
            <p class="section-description">
                Please ask the game owner for a new link, or contact them to get the correct Game ID.
            </p>
            <div class="action-buttons" style="margin-top: 30px;">
                <button onclick="window.location.href = window.location.pathname" class="secondary-btn">
                    🏠 Go to Home (Owner Mode)
                </button>
            </div>
        `;
    }
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    console.log('[App] Attaching event listeners...');

    // Game ID modal buttons
    elements.createNewGameBtn.addEventListener('click', handleCreateNewGame);
    elements.joinExistingGameBtn.addEventListener('click', () => showJoinGameModal());
    elements.copyGameIdBtn.addEventListener('click', handleCopyGameId);
    elements.copyParticipantLinkBtn.addEventListener('click', handleCopyParticipantLink);
    elements.copyGameIdBannerBtn.addEventListener('click', handleCopyGameIdBanner);
    elements.copyParticipantLinkBannerBtn.addEventListener('click', handleCopyParticipantLinkBanner);
    elements.closeCreateGameModal.addEventListener('click', () => hideCreateGameModal());
    elements.joinGameBtn.addEventListener('click', handleJoinGame);
    elements.closeJoinGameModal.addEventListener('click', () => hideJoinGameModal());

    // Entry mode buttons
    elements.addEntryBtn.addEventListener('click', handleAddEntry);
    elements.submitAllBtn.addEventListener('click', handleSubmitAll);
    elements.startGameBtn.addEventListener('click', handleStartGame);

    // Game mode buttons
    elements.revealBtn.addEventListener('click', handleReveal);
    elements.nextTilBtn.addEventListener('click', handleNextTIL);
    elements.backToEntryBtn.addEventListener('click', handleBackToEntry);
    elements.newSessionBtn.addEventListener('click', handleNewSession);

    console.log('[App] Event listeners attached successfully');
}

/**
 * Check if there are existing entries in cloud storage
 */
async function checkExistingEntries() {
    console.log('[App] Checking for existing entries...');

    try {
        const result = await loadTILEntries();
        console.log('[App] Loaded entries:', JSON.stringify(result, null, 2));

        if (result.entries && result.entries.length > 0) {
            console.log('[App] Found', result.entries.length, 'existing entries');
            elements.startGameBtn.style.display = 'inline-block';
        } else {
            console.log('[App] No existing entries found');
            elements.startGameBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('[App] Error checking existing entries:', error);
    }
}

/**
 * Add a new entry form
 */
function addEntryForm() {
    console.log('[App] Adding new entry form');

    const formCount = elements.entryFormsContainer.children.length;
    console.log('[App] Current form count:', formCount);

    const formHTML = `
        <div class="entry-form" data-form-index="${formCount}">
            ${formCount > 0 ? '<button type="button" class="remove-entry-btn" onclick="removeEntryForm(this)">×</button>' : ''}
            <div class="form-group">
                <label for="til-${formCount}">What did you learn?</label>
                <textarea id="til-${formCount}" class="til-input" placeholder="Enter your Today I Learned..."></textarea>
            </div>
            <div class="form-group">
                <label for="name-${formCount}">Your Name</label>
                <input type="text" id="name-${formCount}" class="name-input" placeholder="Enter your name">
            </div>
        </div>
    `;

    elements.entryFormsContainer.insertAdjacentHTML('beforeend', formHTML);
    console.log('[App] Entry form added - total forms:', formCount + 1);
}

/**
 * Handle add entry button click
 */
function handleAddEntry() {
    console.log('[App] Add entry button clicked');
    addEntryForm();
}

/**
 * Remove an entry form
 */
function removeEntryForm(button) {
    console.log('[App] Remove entry button clicked');
    const form = button.closest('.entry-form');
    const formIndex = form.dataset.formIndex;
    console.log('[App] Removing form with index:', formIndex);
    form.remove();
    console.log('[App] Form removed - remaining forms:', elements.entryFormsContainer.children.length);
}

/**
 * Validate all entry forms
 */
function validateForms() {
    console.log('[App] Validating all entry forms...');

    const forms = elements.entryFormsContainer.querySelectorAll('.entry-form');
    const entries = [];
    let hasErrors = false;

    console.log('[App] Validating', forms.length, 'forms');

    forms.forEach((form, index) => {
        const tilInput = form.querySelector('.til-input');
        const nameInput = form.querySelector('.name-input');

        const til = tilInput.value.trim();
        const name = nameInput.value.trim();

        console.log(`[App] Form ${index + 1}:`, {
            til: til ? `${til.substring(0, 20)}...` : 'empty',
            name: name || 'empty'
        });

        // Reset styles
        tilInput.style.borderColor = '';
        nameInput.style.borderColor = '';

        // Validate TIL
        if (!til || til.length < 5) {
            console.log(`[App] Form ${index + 1}: TIL validation failed`);
            tilInput.style.borderColor = '#ff4757';
            hasErrors = true;
        }

        // Validate name
        if (!name || name.length < 2) {
            console.log(`[App] Form ${index + 1}: Name validation failed`);
            nameInput.style.borderColor = '#ff4757';
            hasErrors = true;
        }

        if (til && til.length >= 5 && name && name.length >= 2) {
            entries.push({ til, name });
        }
    });

    console.log('[App] Validation complete - Has errors:', hasErrors);
    console.log('[App] Valid entries:', entries.length);

    return { valid: !hasErrors, entries };
}

/**
 * Handle submit all button click
 */
async function handleSubmitAll() {
    console.log('[App] Submit all button clicked');

    // Prevent double submission
    if (elements.submitAllBtn.disabled) {
        console.log('[App] Submit already in progress - ignoring');
        return;
    }

    const validation = validateForms();

    if (!validation.valid) {
        console.log('[App] Validation failed - showing alert');
        alert('Please fill in all fields. TIL must be at least 5 characters and name at least 2 characters.');
        return;
    }

    console.log('[App] All forms valid - preparing to save');
    console.log('[App] Entries to save:', JSON.stringify(validation.entries, null, 2));

    // Disable submit button to prevent double submission
    elements.submitAllBtn.disabled = true;

    // Show loading overlay
    showLoading('Saving your TILs...');

    try {
        // Load existing entries with retry
        const existingData = await retryAPICall(() => loadTILEntries(), 3);
        const existingEntries = existingData.entries || [];
        console.log('[App] Existing entries count:', existingEntries.length);

        // Prepare new entries with IDs and timestamps
        const newEntries = validation.entries.map(entry => ({
            id: generateUUID(),
            til: entry.til,
            name: entry.name,
            isRevealed: false,
            timestamp: new Date().toISOString()
        }));

        console.log('[App] New entries with metadata:', JSON.stringify(newEntries, null, 2));

        // Combine with existing entries
        const allEntries = [...existingEntries, ...newEntries];
        console.log('[App] Total entries after merge:', allEntries.length);

        // Save to cloud storage with retry
        await retryAPICall(() => saveTILEntries(allEntries), 3);
        console.log('[App] Entries saved successfully');

        hideLoading();

        // Clear forms
        elements.entryFormsContainer.innerHTML = '';
        addEntryForm();
        console.log('[App] Forms cleared and reset');

        // Show success message
        alert(`Success! ${newEntries.length} TIL(s) saved. You can add more or start the game!`);

        // Show start game button
        elements.startGameBtn.style.display = 'inline-block';

        // Re-enable submit button
        elements.submitAllBtn.disabled = false;

    } catch (error) {
        console.error('[App] Error saving entries:', error);
        hideLoading();

        // Show user-friendly error with retry option
        const retry = confirm(`Error saving entries: ${error.message}\n\nWould you like to try again?`);
        if (retry) {
            console.log('[App] User chose to retry submission');
            // Re-enable and trigger submission again
            elements.submitAllBtn.disabled = false;
            handleSubmitAll();
        } else {
            console.log('[App] User cancelled retry');
            elements.submitAllBtn.disabled = false;
        }
    }
}

/**
 * Handle start game button click
 */
async function handleStartGame() {
    console.log('[App] Start game button clicked');

    showLoading('Loading TILs...');

    try {
        // Load entries from cloud storage with retry
        const result = await retryAPICall(() => loadTILEntries(), 3);
        console.log('[App] Loaded entries for game:', JSON.stringify(result, null, 2));

        if (!result.entries || result.entries.length === 0) {
            console.log('[App] No entries found');
            hideLoading();
            alert('No TILs found! Please add some TILs first.');
            return;
        }

        // Validate and sanitize entries
        const validEntries = validateTILData(result.entries);
        console.log('[App] Valid entries count:', validEntries.length);

        if (validEntries.length === 0) {
            console.log('[App] No valid entries after validation');
            hideLoading();
            alert('No valid TILs found! The data may be corrupted. Please add new TILs.');
            return;
        }

        // Handle case with only one TIL
        if (validEntries.length === 1) {
            console.log('[App] Only one TIL found - special handling');
            const proceed = confirm('There is only 1 TIL in the game. Would you like to proceed anyway?');
            if (!proceed) {
                console.log('[App] User cancelled single TIL game');
                hideLoading();
                return;
            }
        }

        // Check for duplicate names (optional warning)
        const duplicates = checkDuplicateNames(validEntries);
        if (duplicates.length > 0) {
            console.log('[App] Warning: duplicate names detected');
            alert(`Note: Multiple TILs found with the same name(s): ${duplicates.join(', ')}. The game will still work correctly.`);
        }

        // Update app state
        appState.entries = validEntries;
        appState.currentMode = 'game';
        appState.revealedCount = 0;

        // Shuffle entries
        shuffleEntries();

        // Switch to game mode
        switchToGameMode();

        // Display first TIL
        displayCurrentTIL();

        hideLoading();

    } catch (error) {
        console.error('[App] Error starting game:', error);
        hideLoading();

        // User-friendly error with retry option
        const retry = confirm(`Error loading TILs: ${error.message}\n\nWould you like to try again?`);
        if (retry) {
            console.log('[App] User chose to retry loading game');
            handleStartGame();
        }
    }
}

/**
 * Shuffle entries using Fisher-Yates algorithm
 */
function shuffleEntries() {
    console.log('[App] Shuffling entries...');

    const indices = appState.entries.map((_, index) => index);

    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    appState.shuffledIndices = indices;
    appState.currentTILIndex = 0;

    console.log('[App] Entries shuffled - order:', appState.shuffledIndices);
}

/**
 * Switch to game mode UI
 */
function switchToGameMode() {
    console.log('[App] Switching to game mode');

    elements.entryMode.style.display = 'none';
    elements.gameMode.style.display = 'block';

    console.log('[App] Game mode UI displayed');
}

/**
 * Switch back to entry mode UI
 */
function switchToEntryMode() {
    console.log('[App] Switching to entry mode');

    elements.gameMode.style.display = 'none';
    elements.entryMode.style.display = 'block';

    appState.currentMode = 'entry';

    console.log('[App] Entry mode UI displayed');
}

/**
 * Display current TIL
 */
function displayCurrentTIL() {
    console.log('[App] Displaying current TIL...');
    console.log('[App] Current index:', appState.currentTILIndex);
    console.log('[App] Total TILs:', appState.shuffledIndices.length);

    if (appState.currentTILIndex >= appState.shuffledIndices.length) {
        console.log('[App] All TILs have been shown');
        showGameComplete();
        return;
    }

    const entryIndex = appState.shuffledIndices[appState.currentTILIndex];
    const entry = appState.entries[entryIndex];

    console.log('[App] Displaying entry:', JSON.stringify(entry, null, 2));

    // Update progress
    const remaining = appState.shuffledIndices.length - appState.currentTILIndex;
    elements.progressText.textContent = `${remaining} of ${appState.shuffledIndices.length} TILs Remaining`;
    console.log('[App] Progress updated:', remaining, 'remaining');

    // Display TIL text
    elements.tilText.textContent = entry.til;

    // Hide answer section
    elements.answerSection.style.display = 'none';

    // Show reveal button, hide next button
    elements.revealBtn.style.display = 'inline-block';
    elements.nextTilBtn.style.display = 'none';

    console.log('[App] TIL displayed successfully');
}

/**
 * Handle reveal button click
 */
function handleReveal() {
    console.log('[App] Reveal button clicked');

    const entryIndex = appState.shuffledIndices[appState.currentTILIndex];
    const entry = appState.entries[entryIndex];

    console.log('[App] Revealing answer:', entry.name);

    // Display name
    elements.answerName.textContent = entry.name;
    elements.answerSection.style.display = 'block';

    // Hide reveal button, show next button
    elements.revealBtn.style.display = 'none';
    elements.nextTilBtn.style.display = 'inline-block';

    appState.revealedCount++;
    console.log('[App] Total revealed:', appState.revealedCount);
}

/**
 * Handle next TIL button click
 */
function handleNextTIL() {
    console.log('[App] Next TIL button clicked');

    appState.currentTILIndex++;
    console.log('[App] Moving to index:', appState.currentTILIndex);

    displayCurrentTIL();
}

/**
 * Show game complete message
 */
function showGameComplete() {
    console.log('[App] Game complete - all TILs shown');

    elements.progressText.textContent = '🎉 All TILs Complete! 🎉';
    elements.tilText.textContent = 'You\'ve seen all the TILs! Great job learning together!';
    elements.answerSection.style.display = 'none';
    elements.revealBtn.style.display = 'none';
    elements.nextTilBtn.style.display = 'none';

    console.log('[App] Game complete UI displayed');
}

/**
 * Handle back to entry button click
 */
function handleBackToEntry() {
    console.log('[App] Back to entry button clicked');
    switchToEntryMode();
    checkExistingEntries();
}

/**
 * Handle new session button click
 */
async function handleNewSession() {
    console.log('[App] New session button clicked');

    const confirmed = confirm('Are you sure you want to start a new session? This will clear all existing TILs and create a new game.');
    console.log('[App] User confirmation:', confirmed);

    if (!confirmed) {
        console.log('[App] User cancelled new session');
        return;
    }

    showLoading('Creating new session...');

    try {
        // Clear Game ID to start fresh
        clearGameID();
        console.log('[App] Game ID cleared');

        // Reset app state (including new role-based fields)
        appState = {
            currentMode: 'entry',
            entries: [],
            currentTILIndex: 0,
            shuffledIndices: [],
            revealedCount: 0,
            userRole: 'owner', // Reset to owner for new sessions
            gameIdFromUrl: null
        };
        console.log('[App] App state reset');

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        console.log('[App] URL parameters cleared');

        // Clear forms and switch to entry mode
        elements.entryFormsContainer.innerHTML = '';
        addEntryForm();
        switchToEntryMode();

        // Hide Game ID banner and show game selection buttons
        hideGameIdBanner();
        showGameSelectionButtons();

        // Reapply role-based UI (as owner)
        applyRoleBasedUI();

        hideLoading();

        alert('New session created! You can now create or join a game.');

        console.log('[App] New session started');

    } catch (error) {
        console.error('[App] Error clearing session:', error);
        hideLoading();
        alert(`Error clearing session: ${error.message}`);
    }
}

// ===========================================
// Game ID Management Functions
// ===========================================

/**
 * Show Game ID banner with the current game ID
 */
function showGameIdBanner(gameId) {
    console.log('[App] Showing Game ID banner:', gameId);
    elements.bannerGameId.textContent = gameId;
    elements.gameIdBanner.style.display = 'flex';
}

/**
 * Hide Game ID banner
 */
function hideGameIdBanner() {
    console.log('[App] Hiding Game ID banner');
    elements.gameIdBanner.style.display = 'none';
}

/**
 * Show game selection buttons
 */
function showGameSelectionButtons() {
    console.log('[App] Showing game selection buttons');
    elements.gameSelectionButtons.style.display = 'flex';
}

/**
 * Hide game selection buttons
 */
function hideGameSelectionButtons() {
    console.log('[App] Hiding game selection buttons');
    elements.gameSelectionButtons.style.display = 'none';
}

/**
 * Handle create new game button click
 */
async function handleCreateNewGame() {
    console.log('[App] Create new game button clicked');

    showLoading('Creating new game...');

    try {
        // Create an empty game file to get a Game ID
        const gameData = {
            gameId: 'new',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entries: []
        };

        console.log('[App] Creating game with data:', JSON.stringify(gameData, null, 2));

        const result = await uploadGameFile(gameData);
        const gameId = result.fileId;

        console.log('[App] Game created successfully with ID:', gameId);

        // Save Game ID
        setGameID(gameId);

        hideLoading();

        // Show the Game ID modal
        showCreateGameModal(gameId);

        // Update UI
        showGameIdBanner(gameId);
        hideGameSelectionButtons();

    } catch (error) {
        console.error('[App] Error creating new game:', error);
        hideLoading();
        alert(`Error creating game: ${error.message}`);
    }
}

/**
 * Show create game modal with the new Game ID
 */
function showCreateGameModal(gameId) {
    console.log('[App] Showing create game modal with Game ID:', gameId);

    // Set Game ID
    if (elements.displayGameId) {
        elements.displayGameId.value = gameId;
        console.log('[App] Game ID field set:', gameId);
    } else {
        console.error('[App] displayGameId element not found!');
    }

    // Generate and display the participant URL
    const participantUrl = generateParticipantURL(gameId);
    if (elements.displayParticipantLink) {
        elements.displayParticipantLink.value = participantUrl;
        console.log('[App] Participant URL field set:', participantUrl);
    } else {
        console.error('[App] displayParticipantLink element not found!');
    }

    elements.createGameModal.style.display = 'flex';
}

/**
 * Hide create game modal
 */
function hideCreateGameModal() {
    console.log('[App] Hiding create game modal');
    elements.createGameModal.style.display = 'none';
}

/**
 * Handle copy Game ID button click (from modal)
 */
async function handleCopyGameId() {
    console.log('[App] Copy Game ID button clicked');
    const gameId = elements.displayGameId.value;

    try {
        await navigator.clipboard.writeText(gameId);
        console.log('[App] Game ID copied to clipboard');

        // Visual feedback
        elements.copyGameIdBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            elements.copyGameIdBtn.textContent = '📋 Copy';
        }, 2000);
    } catch (error) {
        console.error('[App] Error copying to clipboard:', error);
        alert('Could not copy to clipboard. Please copy manually.');
    }
}

/**
 * Handle copy Game ID button click (from banner)
 */
async function handleCopyGameIdBanner() {
    console.log('[App] Copy Game ID banner button clicked');
    const gameId = getGameID();

    try {
        await navigator.clipboard.writeText(gameId);
        console.log('[App] Game ID copied to clipboard from banner');

        // Visual feedback
        elements.copyGameIdBannerBtn.textContent = '✓';
        setTimeout(() => {
            elements.copyGameIdBannerBtn.textContent = '📋';
        }, 2000);
    } catch (error) {
        console.error('[App] Error copying to clipboard:', error);
        alert('Could not copy to clipboard. Please copy manually: ' + gameId);
    }
}

/**
 * Handle copy Participant Link button click (from modal)
 */
async function handleCopyParticipantLink() {
    console.log('[App] Copy Participant Link button clicked');
    const participantUrl = elements.displayParticipantLink.value;
    console.log('[App] Participant URL to copy:', participantUrl);

    if (!participantUrl) {
        console.error('[App] No participant URL found in input field');
        alert('No URL to copy. Please try creating a new game.');
        return;
    }

    try {
        await navigator.clipboard.writeText(participantUrl);
        console.log('[App] Participant URL copied to clipboard');

        // Visual feedback
        elements.copyParticipantLinkBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            elements.copyParticipantLinkBtn.textContent = '📋 Copy Link';
        }, 2000);
    } catch (error) {
        console.error('[App] Error copying to clipboard:', error);
        // Select the text so user can manually copy
        elements.displayParticipantLink.select();
        elements.displayParticipantLink.setSelectionRange(0, 99999);
        alert('Please press Ctrl+C (or Cmd+C on Mac) to copy the selected link.\n\nNote: Automatic copy requires HTTPS.');
    }
}

/**
 * Handle copy Participant Link button click (from banner)
 */
async function handleCopyParticipantLinkBanner() {
    console.log('[App] Copy Participant Link banner button clicked');
    const gameId = getGameID();

    if (!gameId) {
        console.error('[App] No Game ID found');
        alert('No Game ID found. Please create or join a game first.');
        return;
    }

    const participantUrl = generateParticipantURL(gameId);
    console.log('[App] Participant URL to copy:', participantUrl);

    try {
        await navigator.clipboard.writeText(participantUrl);
        console.log('[App] Participant URL copied to clipboard from banner');

        // Visual feedback
        const originalText = elements.copyParticipantLinkBannerBtn.textContent;
        elements.copyParticipantLinkBannerBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            elements.copyParticipantLinkBannerBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('[App] Error copying to clipboard:', error);
        // Show a prompt with the URL so user can copy manually
        prompt('Copy this link to share with participants:', participantUrl);
    }
}

/**
 * Show join game modal
 */
function showJoinGameModal() {
    console.log('[App] Showing join game modal');
    elements.joinGameIdInput.value = '';
    elements.joinGameError.style.display = 'none';
    elements.joinGameSuccess.style.display = 'none';
    elements.joinGameModal.style.display = 'flex';
}

/**
 * Hide join game modal
 */
function hideJoinGameModal() {
    console.log('[App] Hiding join game modal');
    elements.joinGameModal.style.display = 'none';
}

/**
 * Handle join game button click
 */
async function handleJoinGame() {
    console.log('[App] Join game button clicked');

    const gameId = elements.joinGameIdInput.value.trim();
    console.log('[App] Attempting to join game with ID:', gameId);

    if (!gameId) {
        console.log('[App] Game ID is empty');
        showJoinGameError('Please enter a Game ID');
        return;
    }

    // Validate Game ID format
    if (!isValidGameID(gameId)) {
        console.log('[App] Invalid Game ID format');
        showJoinGameError('Invalid Game ID format. Game IDs should look like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
        return;
    }

    // Hide previous messages
    elements.joinGameError.style.display = 'none';
    elements.joinGameSuccess.style.display = 'none';

    // Show loading state
    elements.joinGameBtn.textContent = 'Joining...';
    elements.joinGameBtn.disabled = true;

    try {
        // Try to load the game to verify it exists
        const testResult = await downloadGameFile(gameId);
        console.log('[App] Game found successfully:', JSON.stringify(testResult, null, 2));

        // Save the Game ID
        setGameID(gameId);
        console.log('[App] Game ID saved');

        showJoinGameSuccess('Success! You have joined the game.');

        // Update UI after short delay
        setTimeout(() => {
            hideJoinGameModal();
            showGameIdBanner(gameId);
            hideGameSelectionButtons();
            checkExistingEntries();
        }, 1500);

    } catch (error) {
        console.error('[App] Error joining game:', error);

        let errorMessage = 'Error joining game: ' + error.message;
        if (error.message.includes('Game not found')) {
            errorMessage = 'Game not found. Please check the Game ID and try again. Note: Games expire after 30 days.';
        }

        showJoinGameError(errorMessage);
        elements.joinGameBtn.textContent = 'Join Game';
        elements.joinGameBtn.disabled = false;
    }
}

/**
 * Show error in join game modal
 */
function showJoinGameError(message) {
    console.log('[App] Showing join game error:', message);
    elements.joinGameError.textContent = message;
    elements.joinGameError.style.display = 'block';
    elements.joinGameSuccess.style.display = 'none';
}

/**
 * Show success in join game modal
 */
function showJoinGameSuccess(message) {
    console.log('[App] Showing join game success:', message);
    elements.joinGameSuccess.textContent = message;
    elements.joinGameSuccess.style.display = 'block';
    elements.joinGameError.style.display = 'none';
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
    console.log('[App] Showing loading overlay:', message);
    elements.loadingOverlay.querySelector('p').textContent = message;
    elements.loadingOverlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    console.log('[App] Hiding loading overlay');
    elements.loadingOverlay.style.display = 'none';
}

/**
 * Generate a UUID for entry IDs
 */
function generateUUID() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    console.log('[App] Generated UUID:', uuid);
    return uuid;
}

/**
 * Retry an API call with exponential backoff
 */
async function retryAPICall(apiFunction, maxRetries = 3, baseDelay = 1000) {
    console.log('[App] Retry wrapper called - max retries:', maxRetries);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[App] API call attempt ${attempt} of ${maxRetries}`);
            const result = await apiFunction();
            console.log(`[App] API call succeeded on attempt ${attempt}`);
            return result;
        } catch (error) {
            console.error(`[App] API call failed on attempt ${attempt}:`, error);

            if (attempt === maxRetries) {
                console.error('[App] Max retries reached - throwing error');
                throw error;
            }

            // Calculate exponential backoff delay
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`[App] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Validate and sanitize TIL data from cloud storage
 */
function validateTILData(entries) {
    console.log('[App] Validating TIL data structure...');

    if (!Array.isArray(entries)) {
        console.error('[App] Data validation failed: entries is not an array');
        return [];
    }

    const validEntries = entries.filter(entry => {
        // Check required fields
        const hasId = entry.id && typeof entry.id === 'string';
        const hasTil = entry.til && typeof entry.til === 'string' && entry.til.length >= 5;
        const hasName = entry.name && typeof entry.name === 'string' && entry.name.length >= 2;

        if (!hasId || !hasTil || !hasName) {
            console.log('[App] Invalid entry found and filtered out:', entry);
            return false;
        }

        return true;
    });

    console.log(`[App] Data validation complete - ${validEntries.length} of ${entries.length} entries are valid`);
    return validEntries;
}

/**
 * Check for duplicate names in entries
 */
function checkDuplicateNames(entries) {
    console.log('[App] Checking for duplicate names...');

    const nameCount = {};
    const duplicates = [];

    entries.forEach(entry => {
        const name = entry.name.trim().toLowerCase();
        nameCount[name] = (nameCount[name] || 0) + 1;
        if (nameCount[name] === 2) {
            duplicates.push(entry.name);
        }
    });

    if (duplicates.length > 0) {
        console.log('[App] Duplicate names found:', duplicates);
    } else {
        console.log('[App] No duplicate names found');
    }

    return duplicates;
}

/**
 * Handle browser back button
 */
window.addEventListener('popstate', (event) => {
    console.log('[App] Browser back button pressed');
    console.log('[App] Current state:', event.state);
    // Prevent navigation, stay in current mode
    event.preventDefault();
});

// Make removeEntryForm globally accessible
window.removeEntryForm = removeEntryForm;

console.log('[App] Application script loaded successfully');
