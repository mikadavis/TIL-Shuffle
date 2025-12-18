// Application State
let appState = {
    currentMode: 'entry', // 'entry' or 'game'
    entries: [],
    currentTILIndex: 0,
    shuffledIndices: [],
    revealedCount: 0,
    userRole: 'owner', // 'owner' or 'participant' - determined by URL params
    gameIdFromUrl: null, // Game ID passed via URL for participants
    gameMode: null, // 'game' if participant is viewing game mode
    // Polling state
    pollingInterval: null,
    pollingRate: 2500, // Poll every 2.5 seconds
    lastGameStateTimestamp: null,
    isPolling: false
};

console.log('[App] Application loaded');
console.log('[App] Initial state:', JSON.stringify(appState, null, 2));

/**
 * Parse URL parameters to determine user role and game ID
 * URL format: ?gameId=xxx&role=participant OR ?gameId=xxx (owner by default)
 * Also handles: ?gameId=xxx&role=participant&mode=game (participant viewing game)
 */
function parseURLParameters() {
    console.log('[App] Parsing URL parameters...');
    const urlParams = new URLSearchParams(window.location.search);

    const gameId = urlParams.get('gameId');
    const role = urlParams.get('role');
    const mode = urlParams.get('mode');

    console.log('[App] URL gameId:', gameId);
    console.log('[App] URL role:', role);
    console.log('[App] URL mode:', mode);

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

    // Check if participant is joining game mode
    if (mode === 'game') {
        appState.gameMode = 'game';
        console.log('[App] Game mode set: participant will view game and vote');
    }

    return {
        gameId: appState.gameIdFromUrl,
        role: appState.userRole,
        mode: appState.gameMode
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
        shareGameLinkBtn: document.getElementById('shareGameLinkBtn'),
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

    // Attach event listeners first (needed for all paths)
    attachEventListeners();

    // Check if user is in an existing game (from URL or localStorage)
    const gameId = getGameID();

    // PHASE 5: Check if participant is joining in game mode
    if (appState.gameMode === 'game' && appState.userRole === 'participant' && gameId) {
        console.log('[App] Participant joining in GAME MODE - starting polling');
        showGameIdBanner(gameId);
        hideGameSelectionButtons();
        // Start polling for game state immediately
        startPolling();
        // Show waiting message until game state is received
        showWaitingForGameStart();
        console.log('[App] Participant game mode initialized');
        return;
    }

    if (gameId) {
        console.log('[App] Existing Game ID found:', gameId);
        showGameIdBanner(gameId);
        hideGameSelectionButtons();
        showEntryForm();
        // Add initial entry form only when we have a game
        addEntryForm();
        // Check if there are existing entries
        checkExistingEntries();
    } else {
        console.log('[App] No existing Game ID');

        // Participants should not see game selection buttons if no game ID
        if (appState.userRole === 'participant') {
            console.log('[App] Participant with no game ID - showing error message');
            showParticipantNoGameError();
            return;
        }

        // For owners: Show game selection page ONLY (no entry form)
        console.log('[App] Owner without game - showing game selection page');
        showGameSelectionPage();
        // DO NOT add entry form here - it will be added after game creation
    }

    console.log('[App] Application initialized successfully');
}

/**
 * Show the game selection page (for owners who haven't created/joined a game yet)
 */
function showGameSelectionPage() {
    console.log('[App] Showing game selection page');

    // Clear any existing entry forms
    elements.entryFormsContainer.innerHTML = '';

    // Hide entry form elements completely
    elements.entryFormsContainer.style.display = 'none';
    elements.addEntryBtn.style.display = 'none';
    elements.submitAllBtn.style.display = 'none';
    elements.startGameBtn.style.display = 'none';

    // Show game selection buttons prominently
    showGameSelectionButtons();

    // Update subtitle
    const subtitle = document.querySelector('.app-subtitle');
    if (subtitle) {
        subtitle.textContent = '🎮 Create a new game or join an existing one to get started!';
    }

    // Update section description
    const sectionDesc = document.querySelector('.section-description');
    if (sectionDesc) {
        sectionDesc.textContent = 'Choose an option below to begin your TIL Shuffle experience.';
    }
}

/**
 * Show the entry form (after a game has been created/joined)
 */
function showEntryForm() {
    console.log('[App] Showing entry form');

    // Show entry form elements
    elements.entryFormsContainer.style.display = 'block';
    elements.addEntryBtn.style.display = 'block';
    elements.submitAllBtn.style.display = 'inline-block';

    // Hide start game button initially (will show after entries exist)
    elements.startGameBtn.style.display = 'none';

    // Restore subtitle
    const subtitle = document.querySelector('.app-subtitle');
    if (subtitle && appState.userRole === 'owner') {
        subtitle.textContent = '"I learn something new every day. And forget five other things forever."';
    }

    // Restore section description
    const sectionDesc = document.querySelector('.section-description');
    if (sectionDesc) {
        sectionDesc.textContent = 'Enter what you learned this week. The more the merrier!';
    }
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
    elements.shareGameLinkBtn.addEventListener('click', handleShareGameLink);
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
 * Now uses conflict-free architecture - each participant saves to their own record
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

    // Prepare new entries with IDs and timestamps
    const newEntries = validation.entries.map(entry => ({
        id: generateUUID(),
        til: entry.til,
        name: entry.name,
        isRevealed: false,
        timestamp: new Date().toISOString()
    }));

    console.log('[App] New entries with metadata:', JSON.stringify(newEntries, null, 2));

    try {
        // Save using the conflict-free architecture
        // Each participant saves to their OWN record (no conflicts!)
        await saveTILEntries(newEntries);
        console.log('[App] Entries saved successfully using conflict-free architecture');

        hideLoading();

        // Clear forms
        elements.entryFormsContainer.innerHTML = '';
        addEntryForm();
        console.log('[App] Forms cleared and reset');

        // Show success message
        alert(`Success! ${newEntries.length} TIL(s) saved. You can add more or start the game!`);

        // Show start game button (only for owners)
        if (appState.userRole === 'owner') {
            elements.startGameBtn.style.display = 'inline-block';
        }

        // Re-enable submit button
        elements.submitAllBtn.disabled = false;

    } catch (error) {
        console.error('[App] Error saving entries:', error);
        hideLoading();

        // Show user-friendly error with retry option
        const retry = confirm(`Error saving entries: ${error.message}\n\nWould you like to try again?`);
        if (retry) {
            console.log('[App] User chose to retry submission');
            elements.submitAllBtn.disabled = false;
            handleSubmitAll();
        } else {
            console.log('[App] User cancelled retry');
            elements.submitAllBtn.disabled = false;
        }
    }
}

/**
 * Save entries with atomic merge strategy and POST-SAVE VERIFICATION
 * This function:
 * 1. Fetches the LATEST entries right before saving
 * 2. Merges new entries with existing ones
 * 3. Saves the merged result
 * 4. VERIFIES the save by checking if our entries exist
 * 5. RETRIES if verification fails (another user overwrote our save)
 */
async function saveEntriesWithMerge(newEntries, maxRetries = 5) {
    console.log('[App] Starting atomic save with merge and verification...');
    console.log('[App] New entries to add:', newEntries.length);

    // Get the IDs of our new entries for verification
    const newEntryIds = newEntries.map(e => e.id);
    console.log('[App] New entry IDs to verify:', newEntryIds);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[App] Save attempt ${attempt} of ${maxRetries}`);

        try {
            // Step 1: Fetch the LATEST entries right before saving
            console.log('[App] Step 1: Fetching latest entries...');
            const latestData = await loadTILEntries();
            const existingEntries = latestData.entries || [];
            console.log('[App] Latest existing entries count:', existingEntries.length);

            // Step 2: Merge - combine existing entries with new entries
            // Use a Map to deduplicate by ID
            const entriesMap = new Map();

            // Add existing entries first
            existingEntries.forEach(entry => {
                if (entry.id) {
                    entriesMap.set(entry.id, entry);
                }
            });

            // Add new entries (these have unique IDs, so they won't overwrite existing)
            newEntries.forEach(entry => {
                entriesMap.set(entry.id, entry);
            });

            const mergedEntries = Array.from(entriesMap.values());
            console.log('[App] Merged entries count:', mergedEntries.length);

            // Step 3: Save the merged entries
            console.log('[App] Step 2: Saving merged entries...');
            await saveTILEntries(mergedEntries);
            console.log('[App] Save completed, now verifying...');

            // Step 4: VERIFY - Read back and check if our entries exist
            console.log('[App] Step 3: Verifying save...');

            // Small delay before verification to allow for propagation
            await new Promise(resolve => setTimeout(resolve, 200));

            const verifyData = await loadTILEntries();
            const savedEntries = verifyData.entries || [];
            const savedEntryIds = new Set(savedEntries.map(e => e.id));

            // Check if ALL our new entries are in the saved data
            const allEntriesSaved = newEntryIds.every(id => savedEntryIds.has(id));
            const savedCount = newEntryIds.filter(id => savedEntryIds.has(id)).length;

            console.log(`[App] Verification: ${savedCount}/${newEntryIds.length} entries confirmed saved`);

            if (allEntriesSaved) {
                console.log('[App] ✓ All entries verified! Save successful.');
                return { success: true, entriesCount: savedEntries.length };
            } else {
                // Some entries are missing - another user likely overwrote our save
                const missingIds = newEntryIds.filter(id => !savedEntryIds.has(id));
                console.warn(`[App] ⚠ Verification failed! Missing entries: ${missingIds.length}`);
                console.warn('[App] Missing IDs:', missingIds);

                if (attempt === maxRetries) {
                    console.error('[App] Max retries reached - some entries may be lost');
                    throw new Error(`Failed to save all entries after ${maxRetries} attempts. ${missingIds.length} entries may be lost.`);
                }

                // Retry with exponential backoff
                const delay = 500 * Math.pow(2, attempt - 1) + Math.random() * 500;
                console.log(`[App] Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                // Loop continues to retry
            }

        } catch (error) {
            console.error(`[App] Save attempt ${attempt} failed with error:`, error);

            if (attempt === maxRetries) {
                console.error('[App] All save attempts failed - throwing error');
                throw error;
            }

            // Wait before retrying
            const delay = 500 * Math.pow(2, attempt - 1);
            console.log(`[App] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
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

        // Get participant names for voting
        const participantNames = [...new Set(validEntries.map(entry => entry.name))];
        appState.participantNames = participantNames;
        console.log('[App] Participant names for voting:', participantNames);

        // Switch to game mode
        switchToGameMode();

        // Display first TIL
        displayCurrentTIL();

        // PHASE 4: Publish initial game state for participants
        await publishGameState('voting');

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
async function handleReveal() {
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

    // PHASE 4: Aggregate votes and display tally for owner
    const gameId = getGameID();
    if (gameId) {
        try {
            const { voteTally, totalVotes, voters } = await aggregateVotes(gameId, appState.currentTILIndex);
            console.log('[App] Vote results:', voteTally, 'Total votes:', totalVotes);

            // Display vote tally for owner
            displayVoteTallyOnReveal(voteTally, totalVotes, entry.name);

        } catch (error) {
            console.error('[App] Error aggregating votes:', error);
        }
    }

    // PHASE 4: Publish revealed game state for participants
    await publishGameState('revealed', entry.name);
}

/**
 * Handle next TIL button click
 */
async function handleNextTIL() {
    console.log('[App] Next TIL button clicked');

    appState.currentTILIndex++;
    console.log('[App] Moving to index:', appState.currentTILIndex);

    // Check if game is complete
    if (appState.currentTILIndex >= appState.shuffledIndices.length) {
        console.log('[App] All TILs have been shown - ending game');
        showGameComplete();
        // PHASE 4: Publish ended game state
        await publishGameState('ended');
        return;
    }

    // Display the next TIL
    displayCurrentTIL();

    // PHASE 4: Publish new game state for the next TIL (voting phase)
    await publishGameState('voting');
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
 * Hide create game modal and show entry form
 */
function hideCreateGameModal() {
    console.log('[App] Hiding create game modal');
    elements.createGameModal.style.display = 'none';

    // Show the entry form now that a game has been created
    showEntryForm();

    // Add entry form if none exist
    if (elements.entryFormsContainer.children.length === 0) {
        addEntryForm();
    }
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
            showEntryForm();
            // Add entry form if none exist
            if (elements.entryFormsContainer.children.length === 0) {
                addEntryForm();
            }
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

// ===========================================
// Polling System for Real-Time Game Sync
// ===========================================

/**
 * Start polling for game state updates
 * Called when participant joins a game in game mode
 */
function startPolling() {
    if (appState.isPolling) {
        console.log('[App] Polling already active');
        return;
    }

    console.log('[App] Starting game state polling...');
    console.log('[App] Poll interval:', appState.pollingRate, 'ms');

    appState.isPolling = true;

    // Initial poll immediately
    pollGameState();

    // Set up interval for continuous polling
    appState.pollingInterval = setInterval(() => {
        pollGameState();
    }, appState.pollingRate);

    console.log('[App] Polling started');
}

/**
 * Stop polling for game state updates
 */
function stopPolling() {
    if (!appState.isPolling) {
        console.log('[App] Polling not active');
        return;
    }

    console.log('[App] Stopping game state polling...');

    if (appState.pollingInterval) {
        clearInterval(appState.pollingInterval);
        appState.pollingInterval = null;
    }

    appState.isPolling = false;
    appState.lastGameStateTimestamp = null;

    console.log('[App] Polling stopped');
}

/**
 * Poll for game state updates
 * Checks if game state has changed and updates UI accordingly
 */
async function pollGameState() {
    const gameId = getGameID();
    if (!gameId) {
        console.log('[App] No game ID - stopping poll');
        stopPolling();
        return;
    }

    try {
        const result = await loadGameState(gameId);

        if (result.notFound) {
            console.log('[App] Game state not found - game may not have started yet');
            return;
        }

        const gameState = result.gameState;

        // Check if state has changed since last poll
        if (appState.lastGameStateTimestamp === gameState.updatedAt) {
            // No change, skip update
            return;
        }

        console.log('[App] Game state changed - updating UI');
        console.log('[App] New state:', JSON.stringify(gameState, null, 2));

        // Update timestamp to track changes
        appState.lastGameStateTimestamp = gameState.updatedAt;

        // Handle the game state update
        await handleGameStateUpdate(gameState);

    } catch (error) {
        console.error('[App] Error polling game state:', error);
        // Don't stop polling on error - just try again next interval
    }
}

/**
 * Handle game state update from polling
 * Updates UI to reflect current game state for participants
 */
async function handleGameStateUpdate(gameState) {
    console.log('[App] Handling game state update...');
    console.log('[App] Phase:', gameState.phase);
    console.log('[App] Current TIL Index:', gameState.currentTILIndex);

    // Store game state in app state for reference
    appState.gameState = gameState;

    // Check game phase
    if (gameState.phase === 'waiting' || gameState.phase === GAME_PHASES?.WAITING) {
        console.log('[App] Game is waiting - not started yet');
        showWaitingForGameStart();
        return;
    }

    if (gameState.phase === 'ended' || gameState.phase === GAME_PHASES?.ENDED) {
        console.log('[App] Game has ended');
        showGameComplete();
        stopPolling();
        return;
    }

    // Game is active (voting or revealed phase)
    // Switch to game mode if not already there
    if (appState.currentMode !== 'game') {
        console.log('[App] Switching to game mode for participant');
        appState.currentMode = 'game';
        appState.entries = []; // Will be populated from game state
        switchToGameMode();
    }

    // Update the display with current TIL
    displayParticipantTIL(gameState);

    // Handle phase-specific UI
    if (gameState.phase === 'voting' || gameState.phase === GAME_PHASES?.VOTING) {
        console.log('[App] Voting phase - showing voting UI');
        showVotingUI(gameState);
    } else if (gameState.phase === 'revealed' || gameState.phase === GAME_PHASES?.REVEALED) {
        console.log('[App] Revealed phase - showing answer');
        showRevealedUI(gameState);
    }
}

/**
 * Show waiting for game start message
 */
function showWaitingForGameStart() {
    console.log('[App] Showing waiting for game start');

    // Switch to game mode UI but show waiting message
    if (appState.currentMode !== 'game') {
        switchToGameMode();
        appState.currentMode = 'game';
    }

    elements.progressText.textContent = '⏳ Waiting for game to start...';
    elements.tilText.textContent = 'The game owner hasn\'t started the game yet. Hang tight!';
    elements.answerSection.style.display = 'none';
    elements.revealBtn.style.display = 'none';
    elements.nextTilBtn.style.display = 'none';

    // Hide voting section if it exists
    const votingSection = document.getElementById('votingSection');
    if (votingSection) {
        votingSection.style.display = 'none';
    }
}

/**
 * Display current TIL for participant (from game state)
 */
function displayParticipantTIL(gameState) {
    console.log('[App] Displaying TIL for participant');

    // Update progress
    const current = gameState.currentTILIndex + 1;
    const total = gameState.totalTILs;
    elements.progressText.textContent = `TIL ${current} of ${total}`;

    // Display TIL text
    elements.tilText.textContent = gameState.currentTILText || 'Loading TIL...';
}

/**
 * Show voting UI for participants
 */
function showVotingUI(gameState) {
    console.log('[App] Showing voting UI');

    // Hide answer section during voting
    elements.answerSection.style.display = 'none';

    // Hide owner controls for participants
    if (appState.userRole === 'participant') {
        elements.revealBtn.style.display = 'none';
        elements.nextTilBtn.style.display = 'none';
    }

    // Show or create voting section
    let votingSection = document.getElementById('votingSection');
    if (!votingSection) {
        votingSection = createVotingSection();
    }

    votingSection.style.display = 'block';

    // Update voting options with participant names
    updateVotingOptions(gameState.participantNames || []);

    // Check if user has already voted for this TIL
    checkExistingVote(gameState.currentTILIndex);
}

/**
 * Show revealed UI (after answer is shown)
 */
function showRevealedUI(gameState) {
    console.log('[App] Showing revealed UI');

    // Show the answer
    elements.answerName.textContent = gameState.revealedName || 'Unknown';
    elements.answerSection.style.display = 'block';

    // Hide voting section
    const votingSection = document.getElementById('votingSection');
    if (votingSection) {
        votingSection.style.display = 'none';
    }

    // Hide controls for participants (owner controls the game flow)
    if (appState.userRole === 'participant') {
        elements.revealBtn.style.display = 'none';
        elements.nextTilBtn.style.display = 'none';
    }
}

/**
 * Create voting section element
 */
function createVotingSection() {
    console.log('[App] Creating voting section');

    const votingSection = document.createElement('div');
    votingSection.id = 'votingSection';
    votingSection.className = 'voting-section';
    votingSection.innerHTML = `
        <h4 class="voting-title">🗳️ Who said this?</h4>
        <div id="votingOptions" class="voting-options">
            <!-- Voting buttons will be added here -->
        </div>
        <div id="voteTally" class="vote-tally" style="display: none;">
            <h5>Current Votes:</h5>
            <div id="voteTallyContent"></div>
        </div>
        <div id="voteStatus" class="vote-status"></div>
    `;

    // Insert after TIL card
    elements.tilCard.insertAdjacentElement('afterend', votingSection);

    return votingSection;
}

/**
 * Update voting options with participant names
 */
function updateVotingOptions(names) {
    console.log('[App] Updating voting options with names:', names);

    const votingOptions = document.getElementById('votingOptions');
    if (!votingOptions) return;

    votingOptions.innerHTML = '';

    names.forEach(name => {
        const button = document.createElement('button');
        button.className = 'vote-btn';
        button.textContent = name;
        button.onclick = () => handleVote(name);
        votingOptions.appendChild(button);
    });
}

/**
 * Check if user has already voted for current TIL
 */
async function checkExistingVote(tilIndex) {
    console.log('[App] Checking existing vote for TIL index:', tilIndex);

    const gameId = getGameID();
    if (!gameId) return;

    try {
        const vote = await getMyVote(gameId, tilIndex);

        if (vote) {
            console.log('[App] User already voted for:', vote.votedForName);
            markVoteSelected(vote.votedForName);
            showVoteStatus(`You voted for: ${vote.votedForName}`);
        } else {
            console.log('[App] No existing vote');
            clearVoteSelection();
            showVoteStatus('Cast your vote!');
        }
    } catch (error) {
        console.error('[App] Error checking existing vote:', error);
    }
}

/**
 * Handle vote button click
 */
async function handleVote(votedForName) {
    console.log('[App] Vote clicked for:', votedForName);

    const gameId = getGameID();
    if (!gameId) {
        console.error('[App] No game ID for voting');
        return;
    }

    const gameState = appState.gameState;
    if (!gameState) {
        console.error('[App] No game state for voting');
        return;
    }

    // Disable voting buttons while saving
    disableVotingButtons();
    showVoteStatus('Saving vote...');

    try {
        await saveVote(gameId, gameState.currentTILIndex, votedForName);
        console.log('[App] Vote saved successfully');

        markVoteSelected(votedForName);
        showVoteStatus(`✓ You voted for: ${votedForName}`);

        // Refresh vote tally
        await refreshVoteTally();

    } catch (error) {
        console.error('[App] Error saving vote:', error);
        showVoteStatus('Error saving vote. Try again.');
        enableVotingButtons();
    }
}

/**
 * Mark a vote button as selected
 */
function markVoteSelected(name) {
    const votingOptions = document.getElementById('votingOptions');
    if (!votingOptions) return;

    const buttons = votingOptions.querySelectorAll('.vote-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === name) {
            btn.classList.add('selected');
        }
    });

    enableVotingButtons();
}

/**
 * Clear vote selection
 */
function clearVoteSelection() {
    const votingOptions = document.getElementById('votingOptions');
    if (!votingOptions) return;

    const buttons = votingOptions.querySelectorAll('.vote-btn');
    buttons.forEach(btn => {
        btn.classList.remove('selected');
    });
}

/**
 * Disable voting buttons
 */
function disableVotingButtons() {
    const votingOptions = document.getElementById('votingOptions');
    if (!votingOptions) return;

    const buttons = votingOptions.querySelectorAll('.vote-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
    });
}

/**
 * Enable voting buttons
 */
function enableVotingButtons() {
    const votingOptions = document.getElementById('votingOptions');
    if (!votingOptions) return;

    const buttons = votingOptions.querySelectorAll('.vote-btn');
    buttons.forEach(btn => {
        btn.disabled = false;
    });
}

/**
 * Show vote status message
 */
function showVoteStatus(message) {
    const voteStatus = document.getElementById('voteStatus');
    if (voteStatus) {
        voteStatus.textContent = message;
    }
}

/**
 * Refresh vote tally display
 */
async function refreshVoteTally() {
    console.log('[App] Refreshing vote tally');

    const gameId = getGameID();
    const gameState = appState.gameState;
    if (!gameId || !gameState) return;

    try {
        const { voteTally, totalVotes } = await aggregateVotes(gameId, gameState.currentTILIndex);
        displayVoteTally(voteTally, totalVotes);
    } catch (error) {
        console.error('[App] Error refreshing vote tally:', error);
    }
}

/**
 * Display vote tally
 */
function displayVoteTally(voteTally, totalVotes) {
    console.log('[App] Displaying vote tally:', voteTally, 'Total:', totalVotes);

    const voteTallyDiv = document.getElementById('voteTally');
    const voteTallyContent = document.getElementById('voteTallyContent');

    if (!voteTallyDiv || !voteTallyContent) return;

    if (totalVotes === 0) {
        voteTallyDiv.style.display = 'none';
        return;
    }

    voteTallyDiv.style.display = 'block';

    // Sort by vote count
    const sortedVotes = Object.entries(voteTally)
        .sort((a, b) => b[1] - a[1]);

    voteTallyContent.innerHTML = sortedVotes
        .map(([name, count]) => `
            <div class="tally-item">
                <span class="tally-name">${name}</span>
                <span class="tally-count">${count} vote${count !== 1 ? 's' : ''}</span>
            </div>
        `)
        .join('');
}

/**
 * Generate game URL for participants to join the game view
 */
function generateGameViewURL(gameId) {
    let baseUrl;
    if (window.location.protocol === 'file:') {
        baseUrl = window.location.href.split('?')[0];
    } else {
        baseUrl = window.location.origin + window.location.pathname;
    }
    const gameViewUrl = `${baseUrl}?gameId=${gameId}&role=participant&mode=game`;
    console.log('[App] Generated game view URL:', gameViewUrl);
    return gameViewUrl;
}

// ===========================================
// Phase 4: Owner Game State Publishing
// ===========================================

/**
 * Publish game state for participants to sync via polling
 * Called by owner when starting game, revealing answer, or moving to next TIL
 * @param {string} phase - The game phase: 'voting', 'revealed', 'ended'
 * @param {string} revealedName - The name to show when phase is 'revealed' (optional)
 */
async function publishGameState(phase, revealedName = null) {
    console.log('[App] Publishing game state...');
    console.log('[App] Phase:', phase);
    console.log('[App] Revealed name:', revealedName);

    const gameId = getGameID();
    if (!gameId) {
        console.error('[App] No game ID - cannot publish game state');
        return;
    }

    // Only owners should publish game state
    if (appState.userRole !== 'owner') {
        console.log('[App] Not owner - skipping game state publish');
        return;
    }

    try {
        // Get current TIL info
        let currentTILText = '';
        let currentTILIndex = appState.currentTILIndex;

        if (phase !== 'ended' && appState.shuffledIndices.length > 0) {
            const entryIndex = appState.shuffledIndices[currentTILIndex];
            const entry = appState.entries[entryIndex];
            currentTILText = entry?.til || '';
        }

        const gameState = {
            currentTILIndex: currentTILIndex,
            totalTILs: appState.entries.length,
            shuffledIndices: appState.shuffledIndices,
            phase: phase,
            participantNames: appState.participantNames || [],
            currentTILText: currentTILText,
            revealedName: revealedName
        };

        console.log('[App] Game state to publish:', JSON.stringify(gameState, null, 2));

        await saveGameState(gameId, gameState);
        console.log('[App] Game state published successfully');

        // Also update local app state for owner's reference
        appState.gameState = gameState;

    } catch (error) {
        console.error('[App] Error publishing game state:', error);
    }
}

/**
 * Display vote tally on reveal (for owner)
 * Shows who voted for whom and highlights correct guesses
 */
function displayVoteTallyOnReveal(voteTally, totalVotes, correctName) {
    console.log('[App] Displaying vote tally on reveal');
    console.log('[App] Correct answer:', correctName);
    console.log('[App] Vote tally:', voteTally);
    console.log('[App] Total votes:', totalVotes);

    // Find or create the vote results section in game mode
    let voteResultsSection = document.getElementById('voteResultsSection');

    if (!voteResultsSection) {
        voteResultsSection = document.createElement('div');
        voteResultsSection.id = 'voteResultsSection';
        voteResultsSection.className = 'voting-section';

        // Insert after the answer section
        elements.answerSection.insertAdjacentElement('afterend', voteResultsSection);
    }

    // Calculate how many got it right
    const correctVotes = voteTally[correctName] || 0;
    const wrongVotes = totalVotes - correctVotes;

    // Sort votes by count (highest first)
    const sortedVotes = Object.entries(voteTally)
        .sort((a, b) => b[1] - a[1]);

    // Build the results HTML
    let resultsHTML = `
        <h4 class="voting-title">📊 Vote Results</h4>
        <div class="vote-summary">
            <span class="correct-count">✓ ${correctVotes} correct</span>
            <span class="wrong-count">✗ ${wrongVotes} wrong</span>
            <span class="total-count">(${totalVotes} total votes)</span>
        </div>
        <div class="vote-results-list">
    `;

    if (sortedVotes.length === 0) {
        resultsHTML += '<p class="no-votes">No votes were cast for this TIL.</p>';
    } else {
        sortedVotes.forEach(([name, count]) => {
            const isCorrect = name === correctName;
            const resultClass = isCorrect ? 'correct' : 'wrong';
            const icon = isCorrect ? '✓' : '✗';

            resultsHTML += `
                <div class="vote-result-item ${resultClass}">
                    <span class="result-icon">${icon}</span>
                    <span class="result-name">${name}</span>
                    <span class="result-count">${count} vote${count !== 1 ? 's' : ''}</span>
                </div>
            `;
        });
    }

    resultsHTML += '</div>';

    voteResultsSection.innerHTML = resultsHTML;
    voteResultsSection.style.display = 'block';

    console.log('[App] Vote results displayed');
}

/**
 * Hide vote results section (called when moving to next TIL)
 */
function hideVoteResults() {
    const voteResultsSection = document.getElementById('voteResultsSection');
    if (voteResultsSection) {
        voteResultsSection.style.display = 'none';
    }
}

/**
 * Handle Share Game Link button click (from game mode)
 * Copies the game view URL so participants can join and vote
 */
async function handleShareGameLink() {
    console.log('[App] Share Game Link button clicked');

    const gameId = getGameID();
    if (!gameId) {
        console.error('[App] No game ID found');
        alert('No Game ID found. Please create or join a game first.');
        return;
    }

    // Generate the game view URL for participants
    const gameViewUrl = generateGameViewURL(gameId);
    console.log('[App] Game view URL to share:', gameViewUrl);

    try {
        await navigator.clipboard.writeText(gameViewUrl);
        console.log('[App] Game view URL copied to clipboard');

        // Visual feedback
        const originalText = elements.shareGameLinkBtn.textContent;
        elements.shareGameLinkBtn.textContent = '✓ Link Copied!';
        setTimeout(() => {
            elements.shareGameLinkBtn.textContent = originalText;
        }, 2500);
    } catch (error) {
        console.error('[App] Error copying to clipboard:', error);
        // Show a prompt with the URL so user can copy manually
        prompt('Copy this link to share with participants so they can vote:', gameViewUrl);
    }
}

// ===========================================
// localStorage Cleanup Helpers
// ===========================================

/**
 * Clear game-related localStorage (keeps API key)
 * Can be called from console: clearGameData()
 */
function clearGameData() {
    console.log('[App] Clearing game data from localStorage...');
    localStorage.removeItem('game-id');
    sessionStorage.removeItem('til-session-id');
    console.log('[App] Game data cleared. Refreshing page...');
    window.location.href = window.location.pathname; // Remove URL params and reload
}

/**
 * Clear ALL localStorage for this app (including API key)
 * Can be called from console: clearAllData()
 */
function clearAllData() {
    console.log('[App] Clearing ALL app data from localStorage...');
    localStorage.removeItem('game-id');
    localStorage.removeItem('ape-api-key');
    localStorage.removeItem('ape-api-key-last-validated');
    sessionStorage.removeItem('til-session-id');
    console.log('[App] All data cleared. Refreshing page...');
    window.location.href = window.location.pathname; // Remove URL params and reload
}

/**
 * Show what's currently stored in localStorage
 * Can be called from console: showStoredData()
 */
function showStoredData() {
    console.log('[App] === Current localStorage Contents ===');
    console.log('[App] game-id:', localStorage.getItem('game-id') || '(not set)');
    console.log('[App] ape-api-key:', localStorage.getItem('ape-api-key') ? '(set - hidden for security)' : '(not set)');
    console.log('[App] ape-api-key-last-validated:', localStorage.getItem('ape-api-key-last-validated') || '(not set)');
    console.log('[App] til-session-id (session):', sessionStorage.getItem('til-session-id') || '(not set)');
    console.log('[App] ========================================');

    return {
        gameId: localStorage.getItem('game-id'),
        hasApiKey: !!localStorage.getItem('ape-api-key'),
        apiKeyValidated: localStorage.getItem('ape-api-key-last-validated'),
        sessionId: sessionStorage.getItem('til-session-id')
    };
}

// Expose cleanup helpers globally for console access
window.clearGameData = clearGameData;
window.clearAllData = clearAllData;
window.showStoredData = showStoredData;

console.log('[App] Application script loaded successfully');
console.log('[App] 💡 Tip: Use these console commands for debugging:');
console.log('[App]   - showStoredData()  : View current localStorage');
console.log('[App]   - clearGameData()   : Clear game ID only (keeps API key)');
console.log('[App]   - clearAllData()    : Clear everything (requires re-entering API key)');
