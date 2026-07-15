import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute      from './components/RoleRoute';

// Keep these eager — needed immediately on first load
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Lazy-load everything else so their dependencies (e.g. Stripe in
// ArtworkDetailPage) only load when that route is actually visited
const BrowsePage           = lazy(() => import('./pages/BrowsePage'));
const SearchPage           = lazy(() => import('./pages/SearchPage'));
const ArtworkDetailPage    = lazy(() => import('./pages/ArtworkDetailPage'));
const UploadPage           = lazy(() => import('./pages/UploadPage'));
const PortfolioPage        = lazy(() => import('./pages/PortfolioPage'));
const InboxPage            = lazy(() => import('./pages/InboxPage'));
const ChatPage             = lazy(() => import('./pages/ChatPage'));
const SavedPage            = lazy(() => import('./pages/SavedPage'));
const PurchasedPage        = lazy(() => import('./pages/PurchasedPage'));
const CreatorAnalyticsPage = lazy(() => import('./pages/CreatorAnalyticsPage'));
const AdminDashboardPage   = lazy(() => import('./pages/AdminDashboardPage'));
const AdminAnalyticsPage   = lazy(() => import('./pages/AdminAnalyticsPage'));
const ProfilePage          = lazy(() => import('./pages/ProfilePage'));
const InterestsPage        = lazy(() => import('./pages/InterestsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

export default function App() {
  return (
      <Suspense fallback={<div>Loading...</div>}>
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
                  <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/inbox"         element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
                  <Route path="/chat/:roomId"  element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                  <Route path="/purchased"     element={<RoleRoute roles={['buyer']}><PurchasedPage /></RoleRoute>} />

                  {/* Creator only */}
                  <Route path="/upload"    element={<RoleRoute roles={['creator']}><UploadPage /></RoleRoute>} />
                  <Route path="/portfolio" element={<RoleRoute roles={['creator']}><PortfolioPage /></RoleRoute>} />
                  <Route path="/analytics" element={<RoleRoute roles={['creator']}><CreatorAnalyticsPage /></RoleRoute>} />

                  {/* Admin only */}
                  <Route path="/admin"            element={<RoleRoute roles={['admin']}><AdminDashboardPage /></RoleRoute>} />
                  <Route path="/admin/analytics"  element={<RoleRoute roles={['admin']}><AdminAnalyticsPage /></RoleRoute>} />

                  {/* Default */}
                  <Route path="/" element={<Navigate to="/browse" replace />} />

                  {/* Interests */}
                  <Route path="/interests" element={<ProtectedRoute><InterestsPage /></ProtectedRoute>} />

                  <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              </Routes>
      </Suspense>
  );
}