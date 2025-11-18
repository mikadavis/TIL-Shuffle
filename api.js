// API Configuration
const API_BASE_URL = 'https://api.wearables-ape.io';
const STORAGE_KEY = 'til-shuffle-entries';

console.log('[API] API module loaded');
console.log('[API] API Base URL:', API_BASE_URL);
console.log('[API] Storage Key:', STORAGE_KEY);

/**
 * Get API key from localStorage
 */
function getAPIKey() {
    const apiKey = localStorage.getItem('ape-api-key');
    console.log('[API] Retrieved API key from localStorage:', apiKey ? 'Key exists' : 'No key found');
    return apiKey;
}

/**
 * Check if API key exists and was validated recently (within 24 hours)
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
        console.log('[API] No validation timestamp found - validation required');
        return false;
    }

    const lastValidatedTime = new Date(lastValidated).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceValidation = (currentTime - lastValidatedTime) / (1000 * 60 * 60);

    console.log('[API] Hours since last validation:', hoursSinceValidation.toFixed(2));

    if (hoursSinceValidation >= 24) {
        console.log('[API] API key validation expired (>24 hours) - validation required');
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

/**
 * Upload game file to cloud storage and return file_id (Game ID)
 */
async function uploadGameFile(gameData) {
    console.log('[API] Uploading game file to cloud storage...');
    console.log('[API] Game data:', JSON.stringify(gameData, null, 2));

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot upload - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const endpoint = `${API_BASE_URL}/files/`;
    console.log('[API] POST endpoint:', endpoint);

    try {
        // Create a JSON blob from the game data
        const jsonBlob = new Blob([JSON.stringify(gameData, null, 2)], { type: 'application/json' });

        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('file', jsonBlob, 'til-shuffle-game.json');

        console.log('[API] Uploading JSON file with FormData');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            },
            body: formData
        });

        console.log('[API] Upload response status:', response.status);
        console.log('[API] Upload response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Upload failed - Response:', errorText);
            throw new Error(`Failed to upload game file: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[API] Upload successful - Response:', JSON.stringify(data, null, 2));

        const fileId = data.file_id;
        console.log('[API] Game ID (file_id):', fileId);

        return { success: true, fileId, data };
    } catch (error) {
        console.error('[API] Upload error:', error);
        throw error;
    }
}

/**
 * Download game file from cloud storage using Game ID (file_id)
 */
async function downloadGameFile(gameId) {
    console.log('[API] Downloading game file from cloud storage...');
    console.log('[API] Game ID (file_id):', gameId);

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot download - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const endpoint = `${API_BASE_URL}/files/${gameId}?file_type=default`;
    console.log('[API] GET endpoint:', endpoint);

    try {
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'accept': 'application/json'
            }
        });

        console.log('[API] Download response status:', response.status);
        console.log('[API] Download response ok:', response.ok);

        if (!response.ok) {
            if (response.status === 404) {
                console.error('[API] Game file not found (404) - may be expired');
                throw new Error('Game not found. It may have expired (files last 30 days).');
            }
            const errorText = await response.text();
            console.error('[API] Download failed - Response:', errorText);
            throw new Error(`Failed to download game file: ${response.status} - ${errorText}`);
        }

        // Get the file as a blob
        const blob = await response.blob();
        console.log('[API] Downloaded blob size:', blob.size, 'bytes');

        // Convert blob to text and parse JSON
        const text = await blob.text();
        console.log('[API] Downloaded file content:', text);

        const gameData = JSON.parse(text);
        console.log('[API] Parsed game data:', JSON.stringify(gameData, null, 2));

        return { success: true, gameData };
    } catch (error) {
        console.error('[API] Download error:', error);
        throw error;
    }
}

/**
 * Save TIL entries to cloud storage using file-based approach
 * This uploads the game data as a file and returns the Game ID
 */
async function saveTILEntries(entries) {
    console.log('[API] Saving TIL entries using file-based storage...');
    console.log('[API] Number of entries to save:', entries.length);

    const gameId = getGameID();
    let gameData;

    if (gameId) {
        console.log('[API] Existing game - loading current metadata to preserve...');
        try {
            // Load existing game data to preserve metadata
            const existingResult = await downloadGameFile(gameId);
            const existingGameData = existingResult.gameData;

            console.log('[API] Existing game metadata loaded:', {
                createdAt: existingGameData.createdAt,
                expiresAt: existingGameData.expiresAt
            });

            // Preserve all metadata, update entries and lastUpdated
            gameData = {
                gameId: gameId,
                createdAt: existingGameData.createdAt,
                lastUpdated: new Date().toISOString(),
                expiresAt: existingGameData.expiresAt,
                entries: entries
            };
        } catch (error) {
            console.error('[API] Error loading existing game data:', error);
            console.log('[API] Creating new game data structure');
            // If we can't load existing data, create new structure
            gameData = {
                gameId: gameId,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                entries: entries
            };
        }
    } else {
        console.log('[API] New game - creating fresh metadata');
        // New game - create fresh metadata
        gameData = {
            gameId: 'new',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entries: entries
        };
    }

    console.log('[API] Game data to save:', JSON.stringify(gameData, null, 2));

    try {
        const result = await uploadGameFile(gameData);

        // CRITICAL: Always update Game ID since file upload creates a new file_id
        // This ensures we always point to the latest version of the game file
        if (result.fileId) {
            setGameID(result.fileId);
            console.log('[API] Game ID updated to latest file_id:', result.fileId);
        }

        return { success: true, fileId: result.fileId, data: result.data };
    } catch (error) {
        console.error('[API] Save entries error:', error);
        throw error;
    }
}

/**
 * Load TIL entries from cloud storage using file-based approach
 */
async function loadTILEntries() {
    console.log('[API] Loading TIL entries using file-based storage...');

    const gameId = getGameID();

    if (!gameId) {
        console.log('[API] No Game ID found - returning empty entries');
        return { entries: [] };
    }

    console.log('[API] Loading game with ID:', gameId);

    try {
        const result = await downloadGameFile(gameId);
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

        // If game not found (404), clear the invalid Game ID
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
    // Also accept format with file extension: UUID.extension
    const uuidWithExtRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z]+$/i;
    return uuidRegex.test(gameId) || uuidWithExtRegex.test(gameId);
}
