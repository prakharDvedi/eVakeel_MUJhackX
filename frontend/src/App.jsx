// File: frontend/src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import LegalAdvisorPage from './pages/LegalAdvisorPage.jsx';
import DocumentParserPage from './pages/DocumentParserPage.jsx';
import LegalScorePage from './pages/LegalScorePage.jsx'; // 1. Import the new page
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

        {/* 2. Add the new route for the score page */}
        <Route path="score" element={<LegalScorePage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="about" element={<AboutPage />} />

        {/* You can add other routes here later (e.g., login, about) */}

      </Route>
    </Routes>
  );
}

export default App;