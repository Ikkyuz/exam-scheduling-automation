import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';

// Page Components
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import NotFoundPage from './pages/NotFoundPage';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseGroups from './pages/admin/AdminCourseGroups';
import AdminRooms from './pages/admin/AdminRooms';
import AdminInstructors from './pages/admin/AdminInstructors';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminProctorPairs from './pages/admin/AdminProctorPairs';
import AdminScheduling from './pages/admin/AdminScheduling';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminClasses from './pages/admin/AdminClasses';
import AdminConstraints from './pages/admin/AdminConstraints';
import AdminUsers from './pages/admin/AdminUsers';
import AdminExamSchedulePage from './pages/admin/AdminExamSchedulePage';
import AdminProctoringSchedulePage from './pages/admin/AdminProctoringSchedulePage';
import UserExamSchedulePage from './pages/user/UserExamSchedulePage';
import UserProctoringSchedulePage from './pages/user/UserProctoringSchedulePage';

// Route Protection Components
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';

// A component to redirect users based on their role
const RoleBasedRedirect = () => {
    const { user } = useAuth();

    if (user?.role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
    } else if (user?.role === 'USER') {
        return <Navigate to="/user/dashboard" replace />;
    } else {
        return <Navigate to="/" replace />;
    }
};

const AnimatedRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicOnlyRoute />}>
                <Route path="/" element={<LoginPage />} />
            </Route>

            {/* Generic authenticated redirect */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<RoleBasedRedirect />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="courseGroups" element={<AdminCourseGroups />} />
                    <Route path="rooms" element={<AdminRooms />} />
                    <Route path="instructors" element={<AdminInstructors />} />
                    <Route path="enrollments" element={<AdminEnrollments />} />
                    {/* <Route path="proctor-pairs" element={<AdminProctorPairs />} /> */}
                    <Route path="departments" element={<AdminDepartments />} />
                    <Route path="classes" element={<AdminClasses />} />
                    <Route path="constraints" element={<AdminConstraints />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="scheduling" element={<AdminScheduling />} />
                    {/* <Route path="exam-schedule" element={<AdminExamSchedulePage />} />
                    <Route path="proctoring-schedule" element={<AdminProctoringSchedulePage />} /> */}
                </Route>
            </Route>

            {/* User Routes */}
            <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
                <Route path="/user" element={<UserLayout />}>
                    <Route path="dashboard" element={<UserDashboard />} />
                    {/* <Route path="exam-schedule" element={<UserExamSchedulePage />} />
                    <Route path="proctoring-schedule" element={<UserProctoringSchedulePage />} /> */}
                </Route>
            </Route>

            {/* 404 Not Found Route */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 font-sans antialiased text-gray-900">
      <BrowserRouter>
        <AuthProvider>
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#363636',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  padding: '16px',
                  fontWeight: 500,
                },
                success: {
                  style: {
                    background: '#ecfdf5', // Green-50
                    color: '#065f46', // Green-800
                    border: '1px solid #a7f3d0', // Green-200
                  },
                  iconTheme: {
                    primary: '#10b981', // Emerald-500
                    secondary: '#fff',
                  },
                },
                error: {
                  style: {
                    background: '#fff1f2', // Rose-50
                    color: '#9f1239', // Rose-800
                    border: '1px solid #fecdd3', // Rose-200
                  },
                  iconTheme: {
                    primary: '#f43f5e', // Rose-500
                    secondary: '#fff',
                  },
                },
              }}
            />
            <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
