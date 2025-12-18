// API Configuration
const API_BASE_URL = 'https://api.wearables-ape.io';

// Storage key prefixes for Structured Memories API
// Main game record stores metadata + list of participant session IDs
// Each participant has their own separate record for their entries (NO CONFLICTS!)
const GAME_RECORD_PREFIX = 'til-shuffle-game-';
const PARTICIPANT_RECORD_PREFIX = 'til-shuffle-participant-';

console.log('[API] API module loaded');
console.log('[API] API Base URL:', API_BASE_URL);
console.log('[API] Game Record Prefix:', GAME_RECORD_PREFIX);
console.log('[API] Participant Record Prefix:', PARTICIPANT_RECORD_PREFIX);

/**
 * Get API key from localStorage
 */
function getAPIKey() {
    const apiKey = localStorage.getItem('ape-api-key');
    console.log('[API] Retrieved API key from localStorage:', apiKey ? 'Key exists' : 'No key found');
    return apiKey;
}

/**
 * Check if API key exists and was validated recently (within 7 days)
 */
function isAPIKeyValid() {
    console.log('[API] Checking API key validation status...');
    const apiKey = getAPIKey();
    const lastValidated = localStorage.getItem('ape-api-key-last-validated');

    console.log('[API] API key exists:', !!apiKey);
    console.log('[API] Last validated timestamp:', lastValidated);

    if (!apiKey) {
        console.log('[API] No API key found - validation required');
        return false;
    }

    if (!lastValidated) {
        console.log('[API] No validation timestamp found, but API key exists - assuming valid');
        localStorage.setItem('ape-api-key-last-validated', new Date().toISOString());
        return true;
    }

    const lastValidatedTime = new Date(lastValidated).getTime();
    const currentTime = new Date().getTime();
    const daysSinceValidation = (currentTime - lastValidatedTime) / (1000 * 60 * 60 * 24);

    console.log('[API] Days since last validation:', daysSinceValidation.toFixed(2));

    if (daysSinceValidation >= 7) {
        console.log('[API] API key validation expired (>7 days) - validation required');
        return false;
    }

    console.log('[API] API key is valid');
    return true;
}

/**
 * Validate API key with a test call to the API
 */
async function validateAPIKey(apiKey) {
    console.log('[API] Starting API key validation...');

    try {
        const payload = {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
        };

        const response = await fetch(`${API_BASE_URL}/models/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('[API] Validation response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Validation failed - Response:', errorText);
            throw new Error(`API validation failed: ${response.status}`);
        }

        localStorage.setItem('ape-api-key', apiKey);
        localStorage.setItem('ape-api-key-last-validated', new Date().toISOString());
        console.log('[API] API key saved to localStorage');

        return { success: true };
    } catch (error) {
        console.error('[API] Validation error:', error);
        localStorage.removeItem('ape-api-key');
        localStorage.removeItem('ape-api-key-last-validated');
        return { success: false, error: error.message };
    }
}

// ===========================================
// Session ID Management
// Each browser/tab gets a unique session ID for their entries
// ===========================================

/**
 * Get or create a session ID for this participant
 * Session ID is used to create a unique record for their entries
 */
function getSessionID() {
    let sessionId = sessionStorage.getItem('til-session-id');
    if (!sessionId) {
        sessionId = generateUUID();
        sessionStorage.setItem('til-session-id', sessionId);
        console.log('[API] Created new session ID:', sessionId);
    } else {
        console.log('[API] Retrieved existing session ID:', sessionId);
    }
    return sessionId;
}

/**
 * Generate a unique UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Generate a unique Game ID
 */
function generateGameID() {
    const uuid = generateUUID();
    console.log('[API] Generated new Game ID:', uuid);
    return uuid;
}

// ===========================================
// Core Structured Memories API Functions
// ===========================================

/**
 * Save data to a Structured Memories record
 */
async function saveToRecord(recordId, data) {
    console.log('[API] Saving to record:', recordId);

    const apiKey = getAPIKey();
    if (!apiKey) {
        throw new Error('No API key found. Please refresh the page.');
    }

    const response = await fetch(`${API_BASE_URL}/structured-memories/${recordId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Save failed:', errorText);
        throw new Error(`Failed to save: ${response.status}`);
    }

    console.log('[API] Save successful');
    return await response.json();
}

/**
 * Load data from a Structured Memories record
 */
async function loadFromRecord(recordId) {
    console.log('[API] Loading from record:', recordId);

    const apiKey = getAPIKey();
    if (!apiKey) {
        throw new Error('No API key found. Please refresh the page.');
    }

    const response = await fetch(`${API_BASE_URL}/structured-memories/${recordId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            console.log('[API] Record not found (404)');
            return { notFound: true, data: null };
        }
        const errorText = await response.text();
        console.error('[API] Load failed:', errorText);
        throw new Error(`Failed to load: ${response.status}`);
    }

    const result = await response.json();
    const data = result.value || result;
    console.log('[API] Load successful');
    return { notFound: false, data };
}

// ===========================================
// Conflict-Free Architecture
// - Game record: stores metadata + registered participant session IDs
// - Participant records: each participant has their own record (NO CONFLICTS!)
// ===========================================

/**
 * Create a new game
 */
async function uploadGameFile(_gameData) {
    console.log('[API] Creating new game...');

    const gameId = generateGameID();
    const recordId = `${GAME_RECORD_PREFIX}${gameId}`;

    const data = {
        gameId: gameId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        registeredParticipants: [] // List of session IDs
    };

    await saveToRecord(recordId, data);
    console.log('[API] Game created with ID:', gameId);

    return { success: true, fileId: gameId, data };
}

/**
 * Download/verify a game exists
 */
async function downloadGameFile(gameId) {
    console.log('[API] Downloading game:', gameId);

    const recordId = `${GAME_RECORD_PREFIX}${gameId}`;
    const result = await loadFromRecord(recordId);

    if (result.notFound) {
        throw new Error('Game not found. It may have expired or the Game ID is incorrect.');
    }

    return { success: true, gameData: result.data };
}

/**
 * Save participant's entries to their own record (NO CONFLICTS POSSIBLE!)
 * Then register their session ID with the game
 */
async function saveTILEntries(entries) {
    console.log('[API] Saving TIL entries using conflict-free architecture...');
    console.log('[API] Number of entries:', entries.length);

    const gameId = getGameID();
    if (!gameId) {
        throw new Error('No game found. Please create or join a game first.');
    }

    const sessionId = getSessionID();
    console.log('[API] Session ID:', sessionId);
    console.log('[API] Game ID:', gameId);

    // Step 1: Save entries to participant's OWN record (NO CONFLICT POSSIBLE!)
    const participantRecordId = `${PARTICIPANT_RECORD_PREFIX}${gameId}-${sessionId}`;
    const participantData = {
        sessionId: sessionId,
        gameId: gameId,
        updatedAt: new Date().toISOString(),
        entries: entries
    };

    console.log('[API] Step 1: Saving to participant record:', participantRecordId);
    await saveToRecord(participantRecordId, participantData);
    console.log('[API] Participant entries saved successfully!');

    // Step 2: Register session ID with the game (retry until verified)
    console.log('[API] Step 2: Registering session ID with game...');
    await registerParticipantWithRetry(gameId, sessionId);

    console.log('[API] All done! Entries saved and participant registered.');
    return { success: true, gameId };
}

/**
 * Register a participant's session ID with the game record
 * Uses retry + verification to handle race conditions
 */
async function registerParticipantWithRetry(gameId, sessionId, maxRetries = 5) {
    const gameRecordId = `${GAME_RECORD_PREFIX}${gameId}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`[API] Registration attempt ${attempt} of ${maxRetries}`);

        try {
            // Load current game data
            const result = await loadFromRecord(gameRecordId);
            if (result.notFound) {
                throw new Error('Game not found');
            }

            const gameData = result.data;
            const participants = gameData.registeredParticipants || [];

            // Check if already registered
            if (participants.includes(sessionId)) {
                console.log('[API] Session already registered');
                return;
            }

            // Add our session ID
            const updatedParticipants = [...participants, sessionId];
            gameData.registeredParticipants = updatedParticipants;
            gameData.lastUpdated = new Date().toISOString();

            // Save updated game data
            await saveToRecord(gameRecordId, gameData);

            // Verify registration
            await new Promise(resolve => setTimeout(resolve, 200));
            const verifyResult = await loadFromRecord(gameRecordId);
            const verifiedParticipants = verifyResult.data?.registeredParticipants || [];

            if (verifiedParticipants.includes(sessionId)) {
                console.log('[API] Registration verified!');
                return;
            } else {
                console.warn('[API] Registration not verified, retrying...');
                if (attempt < maxRetries) {
                    const delay = 500 * Math.pow(2, attempt - 1) + Math.random() * 500;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        } catch (error) {
            console.error(`[API] Registration attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) {
                // Even if registration fails, the entries are still saved!
                console.warn('[API] Registration failed but entries are saved in participant record');
                return;
            }
            const delay = 500 * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Load all TIL entries by aggregating all participant records
 */
async function loadTILEntries() {
    console.log('[API] Loading TIL entries (aggregating all participants)...');

    const gameId = getGameID();
    if (!gameId) {
        console.log('[API] No Game ID found');
        return { entries: [] };
    }

    try {
        // Step 1: Load game record to get list of registered participants
        const gameRecordId = `${GAME_RECORD_PREFIX}${gameId}`;
        const gameResult = await loadFromRecord(gameRecordId);

        if (gameResult.notFound) {
            console.log('[API] Game not found');
            return { entries: [] };
        }

        const gameData = gameResult.data;
        const participantSessionIds = gameData.registeredParticipants || [];
        console.log('[API] Registered participants:', participantSessionIds.length);

        // Step 2: Load each participant's entries
        const allEntries = [];

        for (const sessionId of participantSessionIds) {
            const participantRecordId = `${PARTICIPANT_RECORD_PREFIX}${gameId}-${sessionId}`;
            console.log('[API] Loading participant:', sessionId);

            try {
                const participantResult = await loadFromRecord(participantRecordId);
                if (!participantResult.notFound && participantResult.data?.entries) {
                    allEntries.push(...participantResult.data.entries);
                    console.log('[API] Loaded', participantResult.data.entries.length, 'entries from', sessionId);
                }
            } catch (error) {
                console.warn('[API] Failed to load participant', sessionId, error);
            }
        }

        console.log('[API] Total entries loaded:', allEntries.length);
        return { entries: allEntries, gameData };

    } catch (error) {
        console.error('[API] Error loading entries:', error);
        throw error;
    }
}

/**
 * Clear TIL entries (for new session)
 */
async function clearTILEntries() {
    console.log('[API] Clearing TIL entries...');

    const gameId = getGameID();
    if (!gameId) {
        return { success: true };
    }

    const sessionId = getSessionID();
    const participantRecordId = `${PARTICIPANT_RECORD_PREFIX}${gameId}-${sessionId}`;

    try {
        await saveToRecord(participantRecordId, {
            sessionId: sessionId,
            gameId: gameId,
            updatedAt: new Date().toISOString(),
            entries: []
        });
        console.log('[API] Entries cleared');
        return { success: true };
    } catch (error) {
        console.error('[API] Error clearing entries:', error);
        throw error;
    }
}

// ===========================================
// Game ID Management Functions
// ===========================================

function setGameID(gameId) {
    console.log('[API] Saving Game ID:', gameId);
    localStorage.setItem('game-id', gameId);
}

function getGameID() {
    const gameId = localStorage.getItem('game-id');
    console.log('[API] Retrieved Game ID:', gameId || 'None');
    return gameId;
}

function clearGameID() {
    console.log('[API] Clearing Game ID');
    localStorage.removeItem('game-id');
    sessionStorage.removeItem('til-session-id'); // Also clear session
}

function isValidGameID(gameId) {
    if (!gameId || typeof gameId !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(gameId);
}
