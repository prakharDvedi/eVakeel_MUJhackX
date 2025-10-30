// File: frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import LegalAdvisorPage from './pages/LegalAdvisorPage.jsx';
import DocumentParserPage from './pages/DocumentParserPage.jsx';
import './App.css';
import './index.css';

function App() {
  return (
    <Routes>
      {/* All pages will show the Navbar and Footer */}
      <Route path="/" element={<Layout />}>
        
        {/* The main landing page */}
        <Route index element={<HomePage />} /> 
        
        {/* The two new pages */}
        <Route path="advisor" element={<LegalAdvisorPage />} />
        <Route path="parser" element={<DocumentParserPage />} />

        {/* You can add other routes here later (e.g., login, about) */}
        {/* <Route path="login" element={<LoginPage />} /> */}
        {/* <Route path="about" element={<AboutPage />} /> */}
        
      </Route>
    </Routes>
  );
}

export default App;