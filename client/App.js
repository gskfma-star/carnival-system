import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
// import StudentDashboard from './components/StudentDashboard';
// import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* The other routes are temporarily removed */}
      </Routes>
    </Router>
  );
}

export default App;