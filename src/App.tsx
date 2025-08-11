import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ConsultantsPage } from './pages/ConsultantsPage';
import { ConsultantDetailPage } from './pages/ConsultantDetailPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/consultants" element={<ConsultantsPage />} />
        <Route path="/consultants/:id" element={<ConsultantDetailPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
