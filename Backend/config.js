// config.js
// Configuration file for API keys and settings
// This file is gitignored - keep your secrets safe!

// OpenAI Configuration
// IMPORTANT: Replace the API key below with your actual OpenAI API key
// Get your API key from: https://platform.openai.com/account/api-keys
const rawApiKey = 'YOUR_OPENAI_API_KEY_HERE'; // Replace with your actual OpenAI API key

// Trim whitespace and validate format
const apiKey = rawApiKey.trim();

// Validate API key format
if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    console.warn('[config] WARNING: OPENAI_API_KEY not set in config.js');
    console.warn('[config] AI features will not work. Please set your API key in Backend/config.js');
} else if (!apiKey.startsWith('sk-')) {
    console.error('[config] ERROR: Invalid API key format!');
    console.error('[config] OpenAI API keys should start with "sk-" or "sk-proj-"');
    console.error('[config] Current key starts with:', apiKey.substring(0, 7));
} else if (apiKey.length < 20) {
    console.error('[config] ERROR: API key is too short!');
    console.error('[config] OpenAI API keys are typically 50+ characters long');
} else {
    console.log('[config] OpenAI API key loaded successfully');
    console.log('[config] API key format:', apiKey.startsWith('sk-proj-') ? 'Project key (sk-proj-*)' : 'Standard key (sk-*)');
    console.log('[config] API key length:', apiKey.length);
}

const config = {
    openai: {
        apiKey: apiKey, // Trimmed and validated API key
        model: 'gpt-4o-mini', // Default model
    },
    // Add other configurations here as needed
};

module.exports = config;

