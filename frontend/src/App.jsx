// File: frontend/src/App.jsx

// --- IMPORTS ---
import React from 'react';
import { motion } from 'framer-motion';
import './App.css';    // As requested
import './index.css';  // As requested

// --- THEMATIC ICONS ---
// This is the generic placeholder icon for the *cards*
const IconPlaceholder = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
  </svg>
);

// --- ANIMATION VARIANTS (for cards) ---
const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
};

const cardItemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 },
  },
};


// --- APP COMPONENT ---
function App() {
  return (
    // Main container is 'relative' to hold the background
    <div className="bg-secondary text-text min-h-screen flex flex-col font-sans overflow-x-hidden relative">

      {/* ========== ANIMATED BACKGROUND IMAGE ========== */}
      <motion.div
        initial={{ opacity: 0 }} // Start invisible
        animate={{
          opacity: 1,             // Fade in
          y: [0, -20, 0],       // Float up and down
          scale: [1, 1.03, 1]   // Pulse scale up and down
        }}
        transition={{
          // Opacity fades in once at the start
          opacity: { duration: 1.5, delay: 0.5, ease: "easeOut" },
          
          // Y (float) and Scale (pulse) loop forever
          y: {
            duration: 12,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          },
          scale: {
            duration: 12,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut"
          }
        }}
        className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <img
          src="/img2.png" // Your image from the /public folder
          alt="Background watermark"
          className="w-2/3 md:w-1/2 h-auto opacity-5 object-contain"
        />
      </motion.div>
      
      {/* All page content is wrapped in a z-10 container to sit on top */}
      <div className="relative z-10 flex flex-col min-h-screen">
      
        {/* ========== NAVBAR ========== */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-surface/80 border-b border-border sticky top-0 backdrop-blur-sm"
        >
          <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
            <img 
              src="/logo.png" // Make sure your logo is in /public/logo.svg
              alt="eVakeel Logo" 
              className="h-8 w-auto" 
            />
            <div className="flex items-center space-x-6">
              <a href="#" className="font-medium text-subtext hover:text-text transition-colors">About</a>
              <a href="#" className="font-medium text-subtext hover:text-text transition-colors">Features</a>
              <a 
                href="#" 
                className="bg-active text-white font-medium px-5 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity"
              >
                Login
              </a>
            </div>
          </nav>
        </motion.header>

        {/* ========== MAIN CONTENT ========== */}
        <main className="flex-grow flex flex-col items-center justify-center text-center px-6">
          
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-extrabold mb-4 text-text"
          >
            Your AI-Powered Legal Companion
          </motion.h2>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="text-subtext max-w-2xl mb-10 text-lg"
          >
            Simplifying law, one query at a time. Get instant guidance, analyze documents, and understand your rights.
          </motion.p>
          
          {/* Action Boxes (back to the simple version) */}
          <motion.div 
            className="flex flex-col md:flex-row gap-8"
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Box 1: Legal Advisor */}
            <motion.div 
              variants={cardItemVariants}
              className="bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                         shadow-soft hover:border-active/70 transition-all duration-300 
                         transform hover:-translate-y-1"
            >
              <IconPlaceholder className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2 text-text">Legal Advisor</h3>
              <p className="text-subtext text-sm">Chat with our AI for instant answers to your legal questions.</p>
            </motion.div>

            {/* Box 2: Document Parser */}
            <motion.div 
              variants={cardItemVariants}
              className="bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                         shadow-soft hover:border-active/70 transition-all duration-300 
                         transform hover:-translate-y-1"
            >
              <IconPlaceholder className="w-12 h-12 mb-4 text-primary" />
              <h3 className="text-2xl font-semibold mb-2 text-text">Document Parser</h3>
              <p className="text-subtext text-sm">Upload a contract or agreement to get a simplified summary.</p>
            </motion.div>
          </motion.div>
        </main>

        {/* ========== FOOTER ========== */}
        <footer className="bg-surface border-t border-border mt-16">
          <div className="container mx-auto px-6 py-8 text-center text-subtext text-xs">
            <p className="font-semibold text-error mb-2 text-sm">DISCLAIMER</p>
            <p className="max-w-3xl mx-auto">
              eVakeel is an AI-powered informational tool and does not provide certified legal advice...
            </p>
            <p className="mt-6 text-sm">&copy; 2025 eVakeel Team. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;