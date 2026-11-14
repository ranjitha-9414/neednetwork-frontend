
import { Routes, Route, Navigate } from 'react-router-dom'

import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SearchSection from './components/SearchSection'
import FeaturedResources from './components/FeaturedResources'
import HowItWorks from './components/HowItWorks'
import ImpactSection from './components/ImpactSection'
import Footer from './components/Footer'

import Marketplace from './pages/Marketplace'
import ResourceDetails from './pages/ResourceDetails'
import RequestAssistance from './pages/RequestAssistance'
import OfferResource from './pages/OfferResource'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminActivityLog from './pages/AdminActivityLog'
import MyRequests from './pages/MyRequests'
import MyResources from './pages/MyResources'
import BorrowingHistory from './pages/BorrowingHistory'
import ResendVerification from './pages/ResendVerification'
import EditResource from './pages/EditResource'

import OwnerDashboard from './pages/OwnerDashboard'

import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Home page
function Home() {
  return (
    <>
      <Hero />
      <SearchSection />
      <FeaturedResources />
      <HowItWorks />
      <ImpactSection />
    </>
  )
}

// Protect pages that require login
function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('token')
  const storedUser = sessionStorage.getItem('user')

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />
  }

  try {
    JSON.parse(storedUser)
  } catch {
    return <Navigate to="/login" replace />
  }

  return children
}

// Protect pages based on user role
function RoleProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem('token')
  const storedUser = sessionStorage.getItem('user')

  if (!token || !storedUser) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = JSON.parse(storedUser)

    if (!allowedRoles.includes(user.role?.toUpperCase())) {
      return <Navigate to="/dashboard" replace />
    }

    return children
  } catch {
    return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/resources" element={<Marketplace />} />
        <Route path="/resources/:id" element={<ResourceDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Email verification */}
        <Route
          path="/verify-email"
          element={<VerifyEmail />}
        />

        <Route
          path="/resend-verification"
          element={<ResendVerification />}
        />

        {/* Password reset */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/request-assistance"
          element={
            <ProtectedRoute>
              <RequestAssistance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/offer-resource"
          element={
            <ProtectedRoute>
              <OfferResource />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-requests"
          element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-resources"
          element={
            <ProtectedRoute>
              <MyResources />
            </ProtectedRoute>
          }
        />

        <Route
          path="/edit-resource/:id"
          element={
            <ProtectedRoute>
              <EditResource />
            </ProtectedRoute>
          }
        />

        <Route
          path="/borrowing-history"
          element={
            <ProtectedRoute>
              <BorrowingHistory />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/admin/activity-log"
          element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminActivityLog />
            </RoleProtectedRoute>
          }
        />

        {/* Owner dashboard */}
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

      <Footer />
    </>
  )
}

export default App
