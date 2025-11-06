// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SkeletonLoader from './components/SkeletonLoader';

// Import pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import MedicineManagement from './pages/MedicineManagement';
import HealthTracking from './pages/HealthTracking';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import CaregiverDashboard from './pages/CaregiverDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Skeletal from './pages/Skeletal';
import PatientDetailsPage from './pages/PatientDetailsPage';
import Requests from './pages/Requests';
import ProfilePage from './pages/ProfilePage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SkeletonLoader />;
  }

  return user ? children : <Navigate to="/login" />;
};

// Role-based Route Component
const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {user && <Navbar />}

        <main className={user ? "pt-16" : ""}>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
            />
            <Route
              path="/signup"
              element={user ? <Navigate to="/dashboard" /> : <SignupPage />}
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  {user?.role === 'Caregiver' ? (
                    <CaregiverDashboard />
                  ) : user?.role === 'Doctor' ? (
                    <DoctorDashboard />
                  ) : (
                    <Dashboard />
                  )}
                </ProtectedRoute>
              }
            />

            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <Requests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/medicines"
              element={
                <ProtectedRoute>
                  <MedicineManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/:patientId"
              element={
                <ProtectedRoute>
                  <PatientDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/health"
              element={
                <ProtectedRoute>
                  <HealthTracking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />

            {/* Role-specific routes */}
            <Route
              path="/caregiver-dashboard"
              element={
                <RoleBasedRoute allowedRoles={['Caregiver']}>
                  <CaregiverDashboard />
                </RoleBasedRoute>
              }
            />

            <Route
              path="/doctor-dashboard"
              element={
                <RoleBasedRoute allowedRoles={['Doctor']}>
                  <DoctorDashboard />
                </RoleBasedRoute>
              }
            />

            {/* Static Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/skeletal" element={<Skeletal />} />

            {/* Default Route */}
            <Route
              path="/"
              element={
                user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </main>

        {user && <Footer />}
      </div>
    </Router>
  );
}

export default App;
