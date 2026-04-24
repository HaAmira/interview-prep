import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import Feedback from './pages/Feedback';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/interview/:id" 
          element={
            <PrivateRoute>
              <InterviewRoom />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/feedback/:id" 
          element={
            <PrivateRoute>
              <Feedback />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
