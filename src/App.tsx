import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ConsultantsPage } from './pages/ConsultantsPage';
import { ConsultantDetailPage } from './pages/ConsultantDetailPage';
import { HistoryPage } from './pages/HistoryPage';
import { useAuth } from './contexts/AuthContext';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/consultants"
          element={(
            <PrivateRoute>
              <ConsultantsPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/consultants/:id"
          element={(
            <PrivateRoute>
              <ConsultantDetailPage />
            </PrivateRoute>
          )}
        />
        <Route
          path="/history"
          element={(
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          )}
        />
      </Routes>
    </Router>
  );
}

export default App;
