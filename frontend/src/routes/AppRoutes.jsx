import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import UIKit from '../pages/UIKit'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ui-kit" element={<UIKit />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}