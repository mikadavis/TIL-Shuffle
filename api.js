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
 * Save TIL entries to cloud storage
 */
async function saveTILEntries(entries) {
    console.log('[API] Saving TIL entries to cloud storage...');
    console.log('[API] Number of entries to save:', entries.length);
    console.log('[API] Entries data:', JSON.stringify(entries, null, 2));

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot save - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const endpoint = `${API_BASE_URL}/structured-memories/${STORAGE_KEY}`;
    console.log('[API] PUT endpoint:', endpoint);

    // Prepare payload - entries data wrapped in an object
    const payload = { entries };
    console.log('[API] Full payload being sent:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        console.log('[API] Save response status:', response.status);
        console.log('[API] Save response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Save failed - Response:', errorText);
            console.error('[API] Status code:', response.status);
            
            if (response.status === 409) {
                console.error('[API] 409 Conflict Error - This may indicate a concurrent write issue');
                throw new Error('Data conflict detected. Please try again.');
            }
            
            throw new Error(`Failed to save entries: ${response.status} - ${errorText}`);
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
 * Load TIL entries from cloud storage
 */
async function loadTILEntries() {
    console.log('[API] Loading TIL entries from cloud storage...');

    const apiKey = getAPIKey();
    if (!apiKey) {
        console.error('[API] Cannot load - No API key found');
        throw new Error('No API key found. Please refresh the page.');
    }

    const endpoint = `${API_BASE_URL}/structured-memories/${STORAGE_KEY}`;
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
                console.log('[API] No entries found (404) - returning empty array');
                return { entries: [] };
            }
            const errorText = await response.text();
            console.error('[API] Load failed - Response:', errorText);
            throw new Error(`Failed to load entries: ${response.status}`);
        }

        const data = await response.json();
        console.log('[API] Load successful - Response:', JSON.stringify(data, null, 2));

        // Extract entries from the value property
        const entries = data.value?.entries || [];
        console.log('[API] Extracted entries count:', entries.length);

        return { entries };
    } catch (error) {
        console.error('[API] Load error:', error);
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
