// API Configuration
const API_BASE_URL = 'https://api.wearables-ape.io';

// Storage key prefix for Structured Memories API
// Game data is stored under: til-shuffle-game-<gameId>
const STORAGE_KEY_PREFIX = 'til-shuffle-game-';

console.log('[API] API module loaded');
console.log('[API] API Base URL:', API_BASE_URL);
console.log('[API] Storage Key Prefix:', STORAGE_KEY_PREFIX);

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
 * Changed from 24 hours to 7 days to reduce friction for users
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

    // If we have an API key but no timestamp, assume it's valid
    // (it will fail on first API call if invalid, which is fine)
    if (!lastValidated) {
        console.log('[API] No validation timestamp found, but API key exists - assuming valid');
        // Set a timestamp now to prevent future issues
        localStorage.setItem('ape-api-key-last-validated', new Date().toISOString());
        return true;
    }

    const lastValidatedTime = new Date(lastValidated).getTime();
    const currentTime = new Date().getTime();
    const daysSinceValidation = (currentTime - lastValidatedTime) / (1000 * 60 * 60 * 24);

    console.log('[API] Days since last validation:', daysSinceValidation.toFixed(2));

    // Extended to 7 days instead of 24 hours
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
    console.log('[API] Test endpoint: POST', `${API_BASE_URL}/models/v1/chat/completions`);

    try {
        const payload = {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 5
        };

        console.log('[API] Validation request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${API_BASE_URL}/models/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('[API] Validation response status:', response.status);
        console.log('[API] Validation response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Validation failed - Response:', errorText);
            throw new Error(`API validation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[API] Validation successful - Response:', JSON.stringify(data, null, 2));

        // Save API key and timestamp
        localStorage.setItem('ape-api-key', apiKey);
        const timestamp = new Date().toISOString();
        localStorage.setItem('ape-api-key-last-validated', timestamp);
        console.log('[API] API key saved to localStorage');
        console.log('[API] Validation timestamp saved:', timestamp);

        return { success: true };
    } catch (error) {
        console.error('[API] Validation error:', error);
        // Clear invalid credentials
        localStorage.removeItem('ape-api-key');
        localStorage.removeItem('ape-api-key-last-validated');
        console.log('[API] Cleared invalid API key from localStorage');
        return { success: false, error: error.message };
    }
}

// ===========================================
// Structured Memories API Functions
// These support in-place updates (PUT) unlike the Files API
// ===========================================

/**
 * Generate a unique Game ID (UUID)
 * This is generated locally, not from the API
 */
function generateGameID() {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    console.log('[API] Generated new Game ID (UUID):', uuid);
    return uuid;
}

/**
 * Get the Structured Memories record ID for a game
 */
function getRecordID(gameId) {
    const recordId = `${STORAGE_KEY_PREFIX}${gameId}`;
    console.log('[API] Record ID for game:', recordId);
    return recordId;
}

/**
 * Save game data to Structured Memories API (supports in-place updates)
 * PUT request updates the existing record instead of creating a new one
 */
async function saveToStructuredMemories(gameId, gameData) {
    console.log('[API] Saving to Structured Memories...');
    console.log('[API] Game ID:', gameId);
    console.log('[API] Game data:', JSON.stringify(gameData, null, 2));

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot save - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const recordId = getRecordID(gameId);
    const endpoint = `${API_BASE_URL}/structured-memories/${recordId}`;
    console.log('[API] PUT endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gameData)
        });

        console.log('[API] Save response status:', response.status);
        console.log('[API] Save response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Save failed - Response:', errorText);
            throw new Error(`Failed to save game data: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[API] Save successful - Response:', JSON.stringify(data, null, 2));

        return { success: true, data };
    } catch (error) {
        console.error('[API] Save error:', error);
        throw error;
    }
}

/**
 * Load game data from Structured Memories API
 */
async function loadFromStructuredMemories(gameId) {
    console.log('[API] Loading from Structured Memories...');
    console.log('[API] Game ID:', gameId);

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot load - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const recordId = getRecordID(gameId);
    const endpoint = `${API_BASE_URL}/structured-memories/${recordId}`;
    console.log('[API] GET endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('[API] Load response status:', response.status);
        console.log('[API] Load response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 404) {
                console.log('[API] Game not found (404) - returning empty data');
                return { success: true, gameData: null, notFound: true };
            }
            const errorText = await response.text();
            console.error('[API] Load failed - Response:', errorText);
            throw new Error(`Failed to load game data: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[API] Load successful - Response:', JSON.stringify(data, null, 2));

        // Structured Memories returns data in a 'value' field
        const gameData = data.value || data;
        console.log('[API] Extracted game data:', JSON.stringify(gameData, null, 2));

        return { success: true, gameData };
    } catch (error) {
        console.error('[API] Load error:', error);
        throw error;
    }
}

// ===========================================
// High-Level Game Functions
// ===========================================

/**
 * Create a new game with a locally-generated Game ID
 * Uses Structured Memories for storage
 */
async function uploadGameFile(gameData) {
    console.log('[API] Creating new game...');

    // Generate a local UUID for the game ID
    const gameId = generateGameID();

    // Update game data with the new ID
    const updatedGameData = {
        ...gameData,
        gameId: gameId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    console.log('[API] Game data with ID:', JSON.stringify(updatedGameData, null, 2));

    // Save to Structured Memories
    await saveToStructuredMemories(gameId, updatedGameData);

    console.log('[API] Game created successfully with ID:', gameId);
    return { success: true, fileId: gameId, data: updatedGameData };
}

/**
 * Download game file from cloud storage using Game ID
 * Now uses Structured Memories API
 */
async function downloadGameFile(gameId) {
    console.log('[API] Downloading game file...');
    console.log('[API] Game ID:', gameId);

    const result = await loadFromStructuredMemories(gameId);

    if (result.notFound || !result.gameData) {
        throw new Error('Game not found. It may have expired or the Game ID is incorrect.');
    }

    return { success: true, gameData: result.gameData };
}

/**
 * Save TIL entries to cloud storage
 * Uses Structured Memories API which supports in-place updates (PUT)
 * This prevents race conditions when multiple users submit simultaneously
 */
async function saveTILEntries(entries) {
    console.log('[API] Saving TIL entries...');
    console.log('[API] Number of entries to save:', entries.length);

    const gameId = getGameID();

    if (!gameId) {
        console.error('[API] No Game ID found - cannot save entries');
        throw new Error('No game found. Please create or join a game first.');
    }

    console.log('[API] Game ID:', gameId);

    // Load existing game data to preserve metadata
    let gameData;
    try {
        const existingResult = await loadFromStructuredMemories(gameId);

        if (existingResult.gameData) {
            console.log('[API] Existing game metadata loaded:', {
                createdAt: existingResult.gameData.createdAt,
                expiresAt: existingResult.gameData.expiresAt
            });

            // Preserve all metadata, update entries and lastUpdated
            gameData = {
                ...existingResult.gameData,
                lastUpdated: new Date().toISOString(),
                entries: entries
            };
        } else {
            console.log('[API] No existing game data found - creating new structure');
            gameData = {
                gameId: gameId,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                entries: entries
            };
        }
    } catch (error) {
        console.error('[API] Error loading existing game data:', error);
        console.log('[API] Creating new game data structure');
        gameData = {
            gameId: gameId,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entries: entries
        };
    }

    console.log('[API] Game data to save:', JSON.stringify(gameData, null, 2));

    // Save using Structured Memories (PUT updates in place - no new file created!)
    await saveToStructuredMemories(gameId, gameData);

    console.log('[API] Entries saved successfully to game:', gameId);
    return { success: true, gameId: gameId };
}

/**
 * Load TIL entries from cloud storage
 */
async function loadTILEntries() {
    console.log('[API] Loading TIL entries...');

    const gameId = getGameID();

    if (!gameId) {
        console.log('[API] No Game ID found - returning empty entries');
        return { entries: [] };
    }

    console.log('[API] Loading game with ID:', gameId);

    try {
        const result = await loadFromStructuredMemories(gameId);

        if (result.notFound || !result.gameData) {
            console.log('[API] Game not found - returning empty entries');
            return { entries: [] };
        }

        const entries = result.gameData.entries || [];

        console.log('[API] Loaded entries count:', entries.length);
        console.log('[API] Game created at:', result.gameData.createdAt);
        console.log('[API] Game last updated:', result.gameData.lastUpdated);
        console.log('[API] Game expires at:', result.gameData.expiresAt);

        return {
            entries,
            gameData: result.gameData
        };
    } catch (error) {
        console.error('[API] Load entries error:', error);

        // If game not found, clear the invalid Game ID
        if (error.message.includes('Game not found')) {
            console.log('[API] Clearing invalid Game ID');
            clearGameID();
        }

        throw error;
    }
}

/**
 * Clear all TIL entries from cloud storage
 */
async function clearTILEntries() {
    console.log('[API] Clearing all TIL entries from cloud storage...');

    try {
        await saveTILEntries([]);
        console.log('[API] Successfully cleared all entries');
        return { success: true };
    } catch (error) {
        console.error('[API] Clear error:', error);
        throw error;
    }
}

// ===========================================
// Game ID Management Functions
// ===========================================

/**
 * Set Game ID in localStorage
 */
function setGameID(gameId) {
    console.log('[API] Saving Game ID to localStorage:', gameId);
    localStorage.setItem('game-id', gameId);
}

/**
 * Get Game ID from localStorage
 */
function getGameID() {
    const gameId = localStorage.getItem('game-id');
    console.log('[API] Retrieved Game ID from localStorage:', gameId || 'No Game ID found');
    return gameId;
}

/**
 * Clear Game ID from localStorage
 */
function clearGameID() {
    console.log('[API] Clearing Game ID from localStorage');
    localStorage.removeItem('game-id');
}

/**
 * Validate Game ID format (should be a UUID)
 */
function isValidGameID(gameId) {
    if (!gameId || typeof gameId !== 'string') {
        return false;
    }
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Also accept format with file extension: UUID.extension (legacy support)
    const uuidWithExtRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]+$/i;
    return uuidRegex.test(gameId) || uuidWithExtRegex.test(gameId);
}
