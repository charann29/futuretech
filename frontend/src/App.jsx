import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import BuilderPage from './pages/BuilderPage'
import ResumeSelectorPage from './pages/ResumeSelectorPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
      </Routes>
    </AuthProvider>
  )
}

export default App
