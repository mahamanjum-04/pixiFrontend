import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext.jsx';
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
        </div>
    );

    return user ? children : <Navigate to="/login" replace />;
}