// File: frontend/src/components/EmptyChatView.jsx

import React from 'react';
import { motion } from 'framer-motion';

export const EmptyChatView = () => {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img 
        src="/logo.png" // Using your logo
        alt="eVakeel Logo" 
        className="w-16 h-16 mb-4" 
      />
      <h1 className="text-4xl font-bold text-text mb-2">Hi, I'm eVakeel</h1>
      <p className="text-lg text-subtext">How can I help with your legal questions today?</p>
      
      {/* Example Prompts */}
      <div className="flex gap-4 mt-8">
        <div className="bg-surface p-4 rounded-lg border border-border w-48 text-left">
          <p className="text-sm text-text font-medium">What are my rights if I'm stopped by the police?</p>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-border w-48 text-left">
          <p className="text-sm text-text font-medium">Explain this clause in my rent agreement...</p>
        </div>
      </div>
    </motion.div>
  );
};