// File: frontend/src/pages/LegalAdvisorPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
// import { BotMessage } from '../components/BotMessage'; // <-- No longer needed
import { EmptyChatView } from '../components/EmptyChatView';

// --- ICONS & INDICATORS ---

// A simple send icon
const SendIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

// --- UPDATED: LoadingIndicator is now a spinner with your logo ---
const LoadingIndicator = () => (
  <motion.div
    className="flex justify-start p-4" // Aligns to the left like a bot message
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <motion.div
      className="w-8 h-8 p-1" // Container for the spinning logo
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1.5, 
        ease: "linear", 
        repeat: Infinity 
      }}
    >
      <img src="/img2.png" alt="Loading..." className="w-full h-full" />
    </motion.div>
  </motion.div>
);

// --- MAIN PAGE COMPONENT ---

function LegalAdvisorPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // --- NEW: Helper function to handle sending any query ---
  const sendQuery = (query) => {
    if (!query.trim()) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // --- FAKE BACKEND CALL ---
    setTimeout(() => {
      const botResponse = {
        sender: 'bot',
        text: "This is a simulated response. In a real app, this text would come from your Gen AI model after processing your input about: '" + userMessage.text + "'",
      };
      setIsLoading(false);
      setMessages((prev) => [...prev, botResponse]);
    }, 2500);
    // -------------------------
  };
  
  // --- UPDATED: handleSubmit now uses the helper ---
  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery(input);
    setInput('');
  };

  // --- NEW: Handler for clickable prompts ---
  const handlePromptClick = (prompt) => {
    setInput(prompt); // Set input for visual feedback (optional)
    sendQuery(prompt); // Send the query
    setInput(''); // Clear input after sending
  };

  const inputVariants = {
    idle: { width: '100%' },
    focused: { width: '100%' },
  };

  return (
    // Your layout: 'flex-grow items-center flex flex-col'
    <div className="flex-grow items-center flex flex-col">

      {/* 1. CHAT MESSAGE AREA */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar w-full max-w-4xl">
        {messages.length === 0 ? (
          // --- UPDATED: Pass the handler to EmptyChatView ---
          <EmptyChatView onPromptClick={handlePromptClick} />
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'user' ? (
                // --- UPDATED: Added motion.div for scale-in animation ---
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="bg-active text-white p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg shadow-soft break-words"
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </motion.div>
              ) : (
                // --- UPDATED: Replaced BotMessage with instant-display div ---
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-surface text-text p-3 rounded-lg max-w-xs sm:max-w-md md:max-w-lg shadow-soft break-words"
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </motion.div>
              )}
            </div>
          ))
        )}

        <AnimatePresence>
          {isLoading && <LoadingIndicator />}
        </AnimatePresence>
        
        <div ref={chatEndRef} />
      </div>

      {/* 2. INPUT AREA */}
      {/* Your layout: 'w-3/5' */}
      <div className="w-full max-w-2xl flex flex-col items-center p-4">
        <motion.form
          onSubmit={handleSubmit}
          className="flex items-center p-3 bg-surface rounded-xl border border-border shadow-soft w-full"
          variants={inputVariants}
          animate={isFocused ? 'focused' : 'idle'}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <TextareaAutosize
            minRows={1}
            maxRows={6}
            className="flex-grow bg-transparent text-text placeholder-subtext outline-none resize-none mx-2 custom-scrollbar"
            placeholder="Ask me any legal question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="bg-active text-white w-8 h-8 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </motion.form>
        <p className="text-xs text-subtext mt-2">
          Your input will be sent to our AI model for analysis. Please do not share sensitive personal information.
        </p>
      </div>
    </div>
  );
}

export default LegalAdvisorPage;