import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing/Landing";

import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import ForgotPassword from "./pages/Auth/ForgotPassword";

import Dashboard from "./pages/Dashboard/Dashboard";
import Account from "./pages/Account/Account";
import Builder from "./pages/Builder/Builder";

import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>

      {/* Public Routes */}

      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* Protected Routes */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/builder"
        element={
          <ProtectedRoute>
            <Builder />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute>
            <Account />
          </ProtectedRoute>
        }
      />

      {/* Unknown Routes */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}
