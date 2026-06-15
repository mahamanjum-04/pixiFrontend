import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute      from './components/RoleRoute';

import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import BrowsePage           from './pages/BrowsePage';
import SearchPage           from './pages/SearchPage';
import ArtworkDetailPage    from './pages/ArtworkDetailPage';
import UploadPage           from './pages/UploadPage';
import PortfolioPage        from './pages/PortfolioPage';
import InboxPage            from './pages/InboxPage';
import ChatPage             from './pages/ChatPage';
import SavedPage            from './pages/SavedPage';
import PurchasedPage        from './pages/PurchasedPage';
import CreatorAnalyticsPage from './pages/CreatorAnalyticsPage';
import AdminDashboardPage   from './pages/AdminDashboardPage';
import AdminAnalyticsPage   from './pages/AdminAnalyticsPage';
import ProfilePage          from './pages/ProfilePage';

import InterestsPage from './pages/InterestsPage';

export default function App() {
  return (
      <Routes>

          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Any logged-in user */}
          <Route path="/browse"        element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
          <Route path="/search"        element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/artworks/:id"  element={<ProtectedRoute><ArtworkDetailPage /></ProtectedRoute>} />
          <Route path="/saved"         element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/inbox"         element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/chat/:roomId"  element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/purchased"     element={<ProtectedRoute><PurchasedPage /></ProtectedRoute>} />

          {/* Creator only */}
          <Route path="/upload"    element={<RoleRoute roles={['creator']}><UploadPage /></RoleRoute>} />
          <Route path="/portfolio" element={<RoleRoute roles={['creator']}><PortfolioPage /></RoleRoute>} />
          <Route path="/analytics" element={<RoleRoute roles={['creator']}><CreatorAnalyticsPage /></RoleRoute>} />

          {/* Admin only */}
          <Route path="/admin"            element={<RoleRoute roles={['admin']}><AdminDashboardPage /></RoleRoute>} />
          <Route path="/admin/analytics"  element={<RoleRoute roles={['admin']}><AdminAnalyticsPage /></RoleRoute>} />

          {/* Default */}
          <Route path="/" element={<Navigate to="/browse" replace />} />

          {/* Chat */}
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/chat/:id" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* interests */}
          <Route path="/interests" element={<ProtectedRoute><InterestsPage /></ProtectedRoute>} />

      </Routes>
  );
}