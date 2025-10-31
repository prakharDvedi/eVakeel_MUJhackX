// test_api_key.js
// Simple script to test if your OpenAI API key is valid
// Run with: node Backend/test_api_key.js

const config = require('./config');
const { OpenAI } = require('openai');

async function testApiKey() {
    console.log('🧪 Testing OpenAI API Key...\n');
    
    const apiKey = config.openai.apiKey;
    
    if (!apiKey || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
        console.error('❌ API key not set in config.js');
        process.exit(1);
    }
    
    console.log(`✅ API key found: ${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`   Length: ${apiKey.length} characters`);
    console.log(`   Format: ${apiKey.startsWith('sk-proj-') ? 'Project key (sk-proj-*)' : 'Standard key (sk-*)'}\n`);
    
    try {
        const client = new OpenAI({ apiKey: apiKey });
        
        console.log('📡 Testing connection to OpenAI...\n');
        
        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: 'Say "Hello, OpenAI is working!"' }
            ],
            max_tokens: 20
        });
        
        const result = response.choices[0].message.content;
        
        console.log('✅ SUCCESS! Your API key is valid and working!');
        console.log(`   Response: ${result}\n`);
        console.log('🎉 You can now use the chat feature!');
        
    } catch (error) {
        console.error('❌ ERROR: API key test failed!\n');
        
        if (error.status === 401 || error.message.includes('Incorrect API key') || error.message.includes('Invalid API key')) {
            console.error('❌ Your API key is INVALID or INCORRECT');
            console.error('   Please check:');
            console.error('   1. The API key in Backend/config.js');
            console.error('   2. Get a new key from: https://platform.openai.com/account/api-keys');
            console.error('   3. Make sure you copied the ENTIRE key (no spaces, no missing characters)');
            console.error(`\n   Error details: ${error.message}`);
        } else if (error.status === 429) {
            console.error('❌ Rate limit exceeded');
            console.error('   Please wait a moment and try again');
        } else {
            console.error(`❌ Unexpected error: ${error.message}`);
            console.error(`   Status: ${error.status || 'N/A'}`);
        }
        
        process.exit(1);
    }
}

testApiKey();

