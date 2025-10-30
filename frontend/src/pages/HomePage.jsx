// File: frontend/src/pages/HomePage.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// 1. Import the new icon
import { FaGavel, FaFileAlt, FaShieldAlt } from 'react-icons/fa';

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
        className="text-4xl md:text-5xl font-extrabold mb-4 text-gradient-primary pb-3"
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

      {/* Action Boxes */}
      <motion.div
        className="flex flex-col md:flex-row gap-8"
        variants={cardContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Box 1: Legal Advisor */}
        <motion.div
          variants={cardItemVariants}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            to="/advisor"
            className="group card-shine bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                       shadow-soft transition-all duration-300 transform block"
          >
            <FaGavel className="w-12 h-12 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-2xl font-semibold mb-2 text-text transition-colors duration-300 group-hover:text-active">Legal Advisor</h3>
            <p className="text-subtext text-sm transition-colors duration-300 group-hover:text-text/80">Chat with our AI for instant answers to your legal questions.</p>
          </Link>
        </motion.div>

        {/* Box 2: Document Parser */}
        <motion.div
          variants={cardItemVariants}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            to="/parser"
            className="group card-shine bg-surface border border-border rounded-xl p-8 w-80 h-64 flex flex-col items-center justify-center cursor-pointer 
                       shadow-soft transition-all duration-300 transform block"
          >
            <FaFileAlt className="w-12 h-12 mb-4 text-primary transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-2xl font-semibold mb-2 text-text transition-colors duration-300 group-hover:text-active">Document Parser</h3>
            <p className="text-subtext text-sm transition-colors duration-300 group-hover:text-text/80">Upload a contract or agreement to get a simplified summary.</p>
          </Link>
        </motion.div>
      </motion.div>

      {/* 2. NEW: Legal Score Button */}
      <motion.div
        className="mt-10" // Increased margin-top
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }} // Delayed to animate after cards
      >
        <Link
          to="/score"
          className="group flex items-center gap-3 bg-active/20 text-active font-semibold py-3 px-6 rounded-lg 
                     hover:bg-active/40 hover:text-white transition-all duration-300 shadow-soft"
        >
          <FaShieldAlt className="transition-transform duration-300 group-hover:scale-110" />
          <span>Check Your Legal Score</span>
        </Link>
      </motion.div>

    </main>
  );
}

export default HomePage;