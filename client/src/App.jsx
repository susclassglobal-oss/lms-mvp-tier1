import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Login from './pages/Login'
import ProgressTracker from './pages/ProgressTracker'
import TestKnowledge from './pages/TestKnowledge'
import StudentProfile from './pages/StudentProfile'
import CodingWorkbench from './pages/CodingWorkbench'  
import VideoLearning from './pages/VideoLearning'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import CoursePlayer from './pages/CoursePlayer'

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher-dashboard" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute allowedRole="student">
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/courses" element={<ProtectedRoute allowedRole="student"><Courses /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute allowedRole="student"><ProgressTracker /></ProtectedRoute>} />
      <Route path="/test" element={<ProtectedRoute allowedRole="student"><TestKnowledge /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRole="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/courses/code" element={<ProtectedRoute allowedRole="student"><CodingWorkbench /></ProtectedRoute>} />
      <Route 
        path="/learning/:moduleId" 
        element={
          <ProtectedRoute allowedRole="student">
            <CoursePlayer />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/courses/video" element={<ProtectedRoute allowedRole="student"><VideoLearning /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App;