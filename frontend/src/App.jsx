import React, { useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'

import BuilderPage from './pages/BuilderPage'
import ResumeSelectorPage from './pages/ResumeSelectorPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfilePage from './pages/ProfilePage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

function App() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we need to redirect from landing page
    const redirectPath = sessionStorage.getItem('redirectAfterLoad')
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLoad')
      navigate(redirectPath)
      return
    }

    // Redirect root to landing.html
    if (window.location.pathname === '/') {
      window.location.href = '/landing.html'
    }
  }, [navigate])
  const showNavbar = location.pathname !== '/builder'

  return (
    <AuthProvider>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<div>Redirecting...</div>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/resumes"
          element={
            <ProtectedRoute>
              <ResumeSelectorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/builder"
          element={
            <ProtectedRoute>
              <BuilderPage />
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
      </Routes>
    </AuthProvider>
  )
}

export default App
