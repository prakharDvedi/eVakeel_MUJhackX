// File: frontend/src/components/BotMessage.jsx

import React from 'react';
import { motion } from 'framer-motion';

// Animation variants for the container (to stagger children)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02, // Time between each word appearing
    },
  },
};

// Animation variants for each word
const wordVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  },
};

export const BotMessage = ({ text }) => {
  const words = text.split(' ');

  return (
    <motion.div
      className="bg-surface text-text p-3 rounded-lg max-w-lg shadow-soft"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-[4px]" // Add space between words
          variants={wordVariants}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};