# eVakeel - AI-Powered Legal Companion
https://github.com/prakharDvedi/eVakeel_MUJhackX

**eVakeel** is an intelligent legal advisory platform designed to make legal information accessible to every Indian citizen. Built with cutting-edge AI technology, it provides instant legal guidance, document analysis, and compliance tracking in a user-friendly interface.

![eVakeel](https://img.shields.io/badge/AI-Powered%20Legal%20Platform-blue) ![React](https://img.shields.io/badge/React-19.1.1-61DAFB) ![Fastify](https://img.shields.io/badge/Fastify-5.6.0-000000) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991)

<img width="1919" height="981" alt="image" src="https://github.com/user-attachments/assets/15c06e99-39b8-44f8-aaa9-38fb7b0273ed" />

## 🌟 Features

### 1. **AI Legal Advisor**
- Interactive chat interface powered by GPT-4o-mini
- Get instant answers to legal questions
- Context-aware responses based on Indian law
- Step-by-step guidance for legal procedures
- Supports PDF document context in conversations

### 2. **Document Analysis & Parser**
- Upload legal documents, contracts, or agreements
- Automated text extraction from PDF and images
- AI-powered analysis with simplified summaries
- Risk assessment and warning highlights
- Support for PDF, PNG, JPEG, and WebP formats

### 3. **Legal Health Score**
- 12-point legal compliance checklist for Indian citizens
- Interactive step-by-step guidance
- Progress tracking with visual indicators
- Priority-based task recommendations
- Covers essential documents (Aadhaar, PAN, Voter ID, etc.)

### 4. **Additional Features**
- Real-time WebSocket chat support
- Responsive mobile-first design
- Markdown formatting support in responses
- Session management for chat history
- Secure document upload and processing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher) or **yarn**
- **OpenAI API Key** - Get yours from [OpenAI Platform](https://platform.openai.com/account/api-keys)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd eVakeel_MUJhackX
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Configure OpenAI API Key
# Edit Backend/config.js and add your OpenAI API key:
# const rawApiKey = 'your-api-key-here';
```

Alternatively, you can use environment variables:

```bash
# Create .env file in Backend directory
echo "OPENAI_API_KEY=your-api-key-here" > Backend/.env
echo "PORT=5050" >> Backend/.env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Configure API URL (optional)
# Create .env file if needed:
echo "VITE_API_URL=http://localhost:5050" > frontend/.env
```

### 4. Run the Application

#### Start Backend Server

```bash
cd Backend
npm start
```

The backend server will start on `http://localhost:5050` by default.

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port shown in terminal).

## 📁 Project Structure

```
eVakeel_MUJhackX/
│
├── Backend/                    # Fastify backend server
│   ├── config.js              # Configuration (OpenAI API key)
│   ├── server.js              # Main server entry point
│   ├── package.json           # Backend dependencies
│   │
│   ├── routes/               # API route handlers
│   │   ├── chat.js           # Chat API endpoints
│   │   ├── chat_ws.js        # WebSocket chat handler
│   │   ├── documents.js     # Document upload/analysis
│   │   ├── session.js        # Session management
│   │   └── ...
│   │
│   ├── services/             # Business logic services
│   │   ├── aiProxy.js       # OpenAI API integration
│   │   ├── docProcessor.js # Document processing
│   │   ├── llmClient.js    # LLM client wrapper
│   │   └── ragService.js   # RAG (Retrieval Augmented Generation)
│   │
│   ├── plugins/              # Fastify plugins
│   │   ├── auth.js          # Authentication
│   │   ├── firebase.js     # Firebase integration
│   │   └── websockets.js   # WebSocket setup
│   │
│   └── utils/                # Utility functions
│       └── logger.js        # Logging utilities
│
└── frontend/                  # React frontend application
    ├── src/
    │   ├── pages/           # Page components
    │   │   ├── HomePage.jsx
    │   │   ├── LegalAdvisorPage.jsx
    │   │   ├── DocumentParserPage.jsx
    │   │   ├── LegalScorePage.jsx
    │   │   ├── FeaturesPage.jsx
    │   │   ├── AboutPage.jsx
    │   │   └── PricingPage.jsx
    │   │
    │   ├── components/      # Reusable components
    │   │   ├── Layout.jsx
    │   │   ├── EmptyChatView.jsx
    │   │   └── BotMessage.jsx
    │   │
    │   ├── services/        # API service layer
    │   │   └── api.js
    │   │
    │   ├── utils/           # Utility functions
    │   │   └── markdown.js  # Markdown parser
    │   │
    │   ├── App.jsx          # Main app component
    │   └── main.jsx         # Entry point
    │
    ├── public/              # Static assets
    ├── package.json         # Frontend dependencies
    └── vite.config.js       # Vite configuration
```

## 🛠️ Technology Stack

### Frontend
- **React 19.1.1** - UI library
- **Vite 7.1.7** - Build tool and dev server
- **React Router DOM 7.9.5** - Routing
- **Framer Motion 12.23.24** - Animations
- **Tailwind CSS 4.1.16** - Styling
- **React Icons** - Icon library

### Backend
- **Fastify 5.6.0** - Fast web framework
- **OpenAI SDK 4.73.1** - AI integration
- **WebSocket** - Real-time communication
- **PDF-Parse 1.1.1** - PDF text extraction
- **Firebase Admin** - Authentication (optional)
- **JWT** - Token-based auth

## 🔧 Configuration

### Backend Configuration

Edit `Backend/config.js`:

```javascript
const config = {
    openai: {
        apiKey: 'your-openai-api-key-here',
        model: 'gpt-4o-mini', // or 'gpt-4', 'gpt-3.5-turbo', etc.
    },
};
```

### Frontend Configuration

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5050
```

## 📡 API Endpoints

### Chat API
- `POST /api/chat` - Send chat message
- `WebSocket /ws/chat` - Real-time chat stream

### Document API
- `POST /documents/analyze` - Analyze uploaded document
- `POST /documents/upload` - Upload document

### Session API
- `GET /sessions/:id` - Get session details
- `POST /sessions` - Create new session

### Health Check
- `GET /health` - Server health status

## 🎨 Key Features Implementation

### AI Legal Advisor
The chat interface uses OpenAI's GPT-4o-mini model with a custom system prompt that:
- Acts as a legal advisor
- Provides concise, actionable legal steps
- Includes risk assessment (1-10 scale)
- Supports document context in conversations
- Converts markdown to formatted HTML for display

### Document Analysis
- Supports PDF and image formats (PNG, JPEG, WebP)
- Extracts text using `pdf-parse` library
- Analyzes documents with AI for:
  - Key points identification
  - Risk assessment
  - Red flags detection
  - Legal classification

### Legal Health Score
Interactive checklist covering:
1. Aadhaar Card
2. PAN Card
3. Aadhaar-PAN Linking
4. Voter ID
5. Bank Account KYC
6. DigiLocker Setup
7. Property Tax
8. Income Tax Filing
9. And more...

## 🧪 Testing

### Test Backend API Key

```bash
cd Backend
node test_api_key.js
```

### Test Chat Endpoint

```bash
# Use the test_chat.json file with curl or Postman
cd Backend
# Modify test_chat.json with your test message
```

## 🚢 Deployment

### Backend Deployment

1. Set environment variables:
   ```bash
   export OPENAI_API_KEY=your-key
   export PORT=5050
   ```

2. Install production dependencies:
   ```bash
   cd Backend
   npm install --production
   ```

3. Start server:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build for production:
   ```bash
   cd frontend
   npm run build
   ```

2. The `dist/` folder contains production-ready files.

3. Deploy to your preferred hosting service (Vercel, Netlify, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of the MUJhackX hackathon. Please check the license file for details.

## 👥 Authors

- eVakeel Team - 026  ONE SHOT 
- MUJhackX 2024

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Contact the development team

## 🔮 Future Enhancements

- [ ] Multi-language support (Hindi, regional languages)
- [ ] User authentication and profile management
- [ ] Document history and saved conversations
- [ ] Legal case tracking
- [ ] Integration with government portals
- [ ] Mobile app version
- [ ] Voice input support
- [ ] Enhanced RAG with legal document database

---

**Note**: This application is designed for informational purposes and does not replace professional legal advice. Always consult with a qualified lawyer for serious legal matters.

