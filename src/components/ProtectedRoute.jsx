import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
    );

    return user ? children : <Navigate to="/login" replace />;
}