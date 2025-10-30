// File: frontend/src/pages/HomePage.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Import Link
import { IconPlaceholder } from '../components/Layout.jsx'; // Import the icon

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

function HomePage() {
  return (
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
      
      {/* Action Boxes now use <Link> */}
      <motion.div 
        className="flex flex-col md:flex-row gap-8"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Box 1: Legal Advisor */}
        <motion.div variants={cardItemVariants}>
          <Link 
            to="/advisor"
            className="bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                       shadow-soft hover:border-active/70 transition-all duration-300 
                       transform hover:-translate-y-1 block"
          >
            <IconPlaceholder className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-2xl font-semibold mb-2 text-text">Legal Advisor</h3>
            <p className="text-subtext text-sm">Chat with our AI for instant answers to your legal questions.</p>
          </Link>
        </motion.div>

        {/* Box 2: Document Parser */}
        <motion.div variants={cardItemVariants}>
          <Link 
            to="/parser"
            className="bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                       shadow-soft hover:border-active/70 transition-all duration-300 
                       transform hover:-translate-y-1 block"
          >
            <IconPlaceholder className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-2xl font-semibold mb-2 text-text">Document Parser</h3>
            <p className="text-subtext text-sm">Upload a contract or agreement to get a simplified summary.</p>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}

export default HomePage;