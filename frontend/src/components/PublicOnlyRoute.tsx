import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicOnlyRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                    <p className="text-xl font-semibold text-gray-700">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/dashboard" /> : <Outlet />;
};

export default PublicOnlyRoute;
