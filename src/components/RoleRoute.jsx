import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';
export default function RoleRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    // Check role using is_creator / is_buyer flags
    const hasRole =
        (roles.includes('creator') && user.is_creator) ||
        (roles.includes('buyer')   && user.is_buyer)   ||
        (roles.includes('admin')   && user.is_staff);

    if (!hasRole) return <Navigate to="/browse" replace />;
    return children;
}