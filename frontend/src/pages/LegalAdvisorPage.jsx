// File: frontend/src/pages/LegalAdvisorPage.jsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BotMessage } from '../components/BotMessage'; // We will create this
import { EmptyChatView } from '../components/EmptyChatView'; // We will create this

// A simple send icon
const SendIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

// A simple loading bubble
const LoadingIndicator = () => (
  <motion.div
    className="flex space-x-1 p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.span 
      className="w-2 h-2 bg-subtext rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.span 
      className="w-2 h-2 bg-subtext rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.8, delay: 0.1, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.span 
      className="w-2 h-2 bg-subtext rounded-full"
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 0.8, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
    />
  </motion.div>
);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // --- FAKE BACKEND CALL ---
    // This simulates your model thinking, then sending a response
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

  const inputVariants = {
    idle: { width: '80%' },
    focused: { width: '90%' },
  };

  return (
    <div className="flex-grow flex flex-col h-[85vh] max-h-[85vh]">
      {/* 1. CHAT MESSAGE AREA */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <EmptyChatView />
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'user' ? (
                <div className="bg-active text-white p-3 rounded-lg max-w-lg shadow-soft">
                  {msg.text}
                </div>
              ) : (
                <BotMessage text={msg.text} />
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
      <div className="w-full flex flex-col items-center p-4">
        <motion.form
          onSubmit={handleSubmit}
          className="flex items-center p-3 bg-surface rounded-xl border border-border shadow-soft"
          variants={inputVariants}
          animate={isFocused ? 'focused' : 'idle'}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <textarea
            rows="1"
            className="flex-grow bg-transparent text-text placeholder-subtext outline-none resize-none mx-2"
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