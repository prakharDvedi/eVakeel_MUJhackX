// File: frontend/src/pages/DocumentParserPage.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- SVG ICONS ---
const UploadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5a4 4 0 01-4 4H7z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11V3m0 8l-3-3m3 3l3-3"></path>
  </svg>
);

const PdfIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.363 2c-1.658 0-3.001 1.343-3.001 3.001v2.12h-2.12c-1.018 0-1.842.825-1.842 1.842v10.074c0 1.018.825 1.842 1.842 1.842h12.118c1.018 0 1.842-.825 1.842-1.842v-10.074c0-1.018-.825-1.842-1.842-1.842h-2.12v-2.12c0-1.658-1.343-3.001-3-3.001h-2.241zm0 1.91h2.241c.599 0 1.091.492 1.091 1.091v2.12h-4.422v-2.12c0-.599.492-1.091 1.091-1.091z" />
  </svg>
);

const ImageIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const CloseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
  </svg>
);

// --- NEW: Loading Indicator ---
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


// --- MAIN PAGE COMPONENT ---

function DocumentParserPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // NEW state
  const [results, setResults] = useState(null);     // NEW state

  const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];

  const handleFile = (file) => {
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file);
      setResults(null); // Clear previous results
    } else if (file) {
      alert("Invalid file type. Please upload a PDF or an image.");
      setSelectedFile(null);
    }
  };

  // --- Event Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    setIsLoading(true); // Set loading state
    setResults(null);
    
    // --- FAKE BACKEND CALL ---
    setTimeout(() => {
      setIsLoading(false);
      setResults(
        `Here is the AI-generated summary for '${selectedFile.name}':\n
        - **Document Type:** Rental Agreement\n
        - **Key Clauses:** The security deposit is set at two months' rent. The notice period for termination is 30 days.\n
        - **Warning:** Clause 4.b regarding late fees appears to be non-standard and heavily favors the landlord. Please review this with a legal professional.`
      );
    }, 3000); // Simulate 3-second analysis
    // -------------------------
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-start text-text p-6 pt-16">
      
      {/* --- Page Title --- */}
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="text-4xl font-bold mb-4"
      >
        Document Parser
      </motion.h1>
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        className="text-lg text-subtext mb-8 max-w-lg text-center"
      >
        Upload your legal document (PDF or image). The AI will analyze the text and provide a simplified summary.
      </motion.p>

      {/* --- Main Uploader Area --- */}
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {!selectedFile ? (
            
            // --- Dropzone ---
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-64 bg-surface border-2 border-dashed rounded-xl transition-colors
                          ${isDragOver ? 'border-active' : 'border-border'}`}
            >
              <input
                type="file"
                id="fileUpload"
                className="hidden"
                onChange={handleFileChange}
                accept="application/pdf,image/*"
              />
              <UploadIcon className={`w-16 h-16 transition-colors ${isDragOver ? 'text-active' : 'text-primary'}`} />
              <p className="text-subtext mt-4">Drag & drop your file here, or</p>
              <label 
                htmlFor="fileUpload"
                className="mt-2 bg-active text-white font-medium px-5 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity cursor-pointer"
              >
                Browse Files
              </label>
            </motion.div>

          ) : (
            
            // --- File Preview Card ---
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-surface border border-border rounded-xl p-6 flex items-center justify-between shadow-soft"
            >
              <div className="flex items-center gap-4">
                {selectedFile.type === 'application/pdf' ? (
                  <PdfIcon className="w-10 h-10 text-error" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-active" />
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-text font-medium truncate">{selectedFile.name}</span>
                  <span className="text-subtext text-sm">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-subtext hover:text-error transition-colors p-1 rounded-full flex-shrink-0 ml-4"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </motion.div>
            
          )}
        </AnimatePresence>

        {/* --- Submit Button or Loading State --- */}
        {/* This section only shows if a file is selected AND we don't have results yet */}
        {selectedFile && !results && (
          <div className="w-full mt-6">
            {isLoading ? (
              <motion.div 
                className="flex justify-center items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <LoadingIndicator />
                <p className="text-subtext ml-2">Analyzing document...</p>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                onClick={handleSubmit}
                disabled={!selectedFile}
                className="w-full bg-active text-white font-semibold py-3 rounded-lg text-base 
                           hover:opacity-90 transition-opacity
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analyze Document
              </motion.button>
            )}
          </div>
        )}

        {/* --- NEW: Results Card --- */}
        <AnimatePresence>
          {results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full bg-surface border border-border rounded-xl p-6 mt-8 shadow-soft"
            >
              <h3 className="text-2xl font-semibold text-text mb-3 text-left">AI Analysis</h3>
              <p className="text-subtext text-left whitespace-pre-line">{results}</p>
              <button
                onClick={() => { setSelectedFile(null); setResults(null); }}
                className="w-full bg-active/20 text-active font-semibold py-3 rounded-lg mt-6 text-base hover:bg-active/40 transition-colors"
              >
                Analyze Another Document
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default DocumentParserPage;