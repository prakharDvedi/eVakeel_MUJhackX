// test_api_key.js
// Simple script to test if your Gemini API key is valid
// Run with: node Backend/test_api_key.js

const config = require("./config");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function testApiKey() {
  console.log("🧪 Testing Gemini API Key...\n");

  // Try process.env first, then config
  const apiKey = process.env.GEMINI_API_KEY || config.gemini?.apiKey;

  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("❌ API key not set in .env or config.js");
    process.exit(1);
  }

  console.log(
    `✅ API key found: ${apiKey.substring(0, 10)}...${apiKey.substring(
      apiKey.length - 4
    )}`
  );
  console.log(`   Length: ${apiKey.length} characters`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("📡 Testing connection to Gemini...\n");

    const result = await model.generateContent(
      'Say "Hello, Gemini is working!"'
    );
    const response = result.response;
    const text = response.text();

    console.log("✅ SUCCESS! Your API key is valid and working!");
    console.log(`   Response: ${text}\n`);
    console.log("🎉 You can now use the chat feature!");
  } catch (error) {
    console.error("❌ ERROR: API key test failed!\n");
    console.error(`   Error details: ${error.message}`);

    if (error.message.includes("API key")) {
      console.error("❌ Your API key seems INVALID");
    }

    process.exit(1);
  }
}

testApiKey();
