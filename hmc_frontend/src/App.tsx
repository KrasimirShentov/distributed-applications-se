// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import CompanyList from './components/CompanyList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import CompanyDetail from './components/CompanyDetail';
import DepartmentDetail from './components/DepartmentDetail';
import EmployeeDetail from './components/EmployeeDetails';
import TrainingList from './components/TrainingList';

const App: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn && (window.location.pathname.startsWith('/companies') || window.location.pathname.startsWith('/trainings'))) {
      navigate('/login');
    }
    if (isLoggedIn && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
        navigate('/companies'); // Or to a dashboard, etc.
    }
  }, [isLoggedIn, navigate]);


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-links">
          <Link to="/">Home</Link>
          {isLoggedIn && (
            <>
              <Link to="/companies">Companies</Link>
              <Link to="/trainings">Trainings</Link>
            </>
          )}
        </div>
        <div className="navbar-buttons">
          {isLoggedIn ? (
            <button onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <div className="login-register-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </div>
          )}
        </div>
      </nav>

      <div className="container">
        <Routes>
          <Route path="/" element={<WelcomeHome />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Protected Routes Group */}
          {/* Companies List */}
          <Route path="/companies" element={
            <ProtectedRoute>
              <CompanyList />
            </ProtectedRoute>
          } />

          {/* Company Detail (includes its departments by default) */}
          <Route path="/companies/:companyId" element={
            <ProtectedRoute>
              <CompanyDetail />
            </ProtectedRoute>
          } />

          {/* NEW ROUTE: Company Departments Page - also uses CompanyDetail but will render differently */}
          <Route path="/companies/:companyId/departments" element={
            <ProtectedRoute>
              <CompanyDetail />
            </ProtectedRoute>
          } />

          {/* Department Detail (includes its employees and their training) */}
          <Route path="/companies/:companyId/departments/:departmentId" element={
            <ProtectedRoute>
              <DepartmentDetail />
            </ProtectedRoute>
          } />

          {/* Employee Detail (displays employee's training) */}
          <Route path="/companies/:companyId/departments/:departmentId/employees/:employeeId" element={
            <ProtectedRoute>
              <EmployeeDetail />
            </ProtectedRoute>
          } />

          {/* Protected Route for Trainings */}
          <Route path="/trainings" element={
            <ProtectedRoute>
              <TrainingList />
            </ProtectedRoute>
          } />

          {/* Fallback for undefined routes */}
          <Route path="*" element={<p className="error-text">Page Not Found</p>} />
        </Routes>
      </div>
    </>
  );
};

// Helper component for the welcome message
const WelcomeHome: React.FC = () => {
  return (
    <div className="welcome-section">
      <h2>Empower Your Business Management</h2>
      <p>
        Welcome to your comprehensive solution for robust company and department management.
        Our powerful API allows you to efficiently organize your organizational structure,
        streamline project assignments, and gain real-time insights into employee status and productivity.
        From resource allocation to performance tracking, this platform is designed to
        centralize your operational needs and drive efficiency.
      </p>
      <p>Please log in or register to get started!</p>
    </div>
  );
};

export default App;