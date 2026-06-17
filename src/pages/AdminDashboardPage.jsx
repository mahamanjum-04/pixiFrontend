import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import api from '../services/api.js';

export default function AdminDashboardPage() {
    const [users, setUsers]       = useState([]);
    const [reports, setReports]   = useState([]);
    const [tab, setTab]           = useState('reports');
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchAll = async () => {
            try {
                const [usersRes, reportsRes] = await Promise.all([
                    api.get('/api/admin/users/'),
                    api.get('/api/admin/reports/'),
                ]);
                if (!cancelled) {
                    setUsers(usersRes.data);
                    setReports(reportsRes.data);
                }
            } catch {
                if (!cancelled) setError('Failed to load dashboard data.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAll();
        return () => { cancelled = true; };
    }, []);

    const handleBan = async (id) => {
        if (!confirm('Ban this user?')) return;
        try {
            await api.patch(`/api/admin/users/${id}/ban/`);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: true } : u));
        } catch { alert('Failed to ban user.'); }
    };

    const handleUnban = async (id) => {
        try {
            await api.patch(`/api/admin/users/${id}/unban/`);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: false } : u));
        } catch { alert('Failed to unban user.'); }
    };

    const handleRemoveContent = async (id) => {
        if (!confirm('Remove this content?')) return;
        try {
            await api.delete(`/api/admin/content/${id}/`);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch { alert('Failed to remove content.'); }
    };

    const handleResolve = async (id) => {
        try {
            await api.patch(`/api/admin/reports/${id}/resolve/`, { action: 'dismiss' });
            setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
        } catch { alert('Failed to resolve report.'); }
    };

    const pending  = reports.filter(r => r.status === 'pending');
    const resolved = reports.filter(r => r.status === 'resolved');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Admin dashboard</h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'reports', label: `Reports (${pending.length})` },
                        { key: 'users',   label: `Users (${users.length})`     },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                ${tab === t.key
                                ? 'bg-[#9440dd] text-white'
                                : 'bg-gray-100 dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">{error}</div>
                )}

                {/* REPORTS TAB */}
                {!loading && !error && tab === 'reports' && (
                    <>
                        {pending.length === 0 && (
                            <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                                No pending reports.
                            </div>
                        )}

                        {pending.length > 0 && (
                                    <div className="flex flex-col gap-3 mb-8">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Pending
                                </p>
                                {pending.map(r => (
                                    <div key={r.id} className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {r.type === 'user' ? '👤 User report' : '🖼 Content report'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Reported: <span className="font-medium">{r.reported}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                    By: {r.reporter}
                                                </p>
                                                {r.reason && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">"{r.reason}"</p>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleResolve(r.id)}
                                                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 transition"
                                                >
                                                    Dismiss
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveContent(r.id)}
                                                    className="px-3 py-1.5 text-xs bg-red-50 border border-red-100 rounded-lg text-red-500 hover:bg-red-100 transition"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {resolved.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Resolved
                                </p>
                                {resolved.map(r => (
                                    <div key={r.id} className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 opacity-50">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {r.type === 'user' ? '👤 User report' : '🖼 Content report'} —{' '}
                                                    <span className="font-medium">{r.reported}</span>
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By: {r.reporter}</p>
                                            </div>
                                            <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-lg">
                        Resolved
                      </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* USERS TAB */}
                {!loading && !error && tab === 'users' && (
                    <>
                        {users.length === 0 && (
                            <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">No users found.</div>
                        )}

                        {users.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">User</th>
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Email</th>
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Role</th>
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Status</th>
                                            <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {users.map(u => (
                                            <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition">
                                                <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">@{u.username}</td>
                                                <td className="px-5 py-3 text-gray-400 dark:text-gray-500">{u.email}</td>
                                                <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                u.is_creator
                                    ? 'bg-purple-50 text-purple-600'
                                    : 'bg-blue-50 text-blue-600'
                            }`}>
                              {u.is_creator ? 'Creator' : 'Buyer'}
                            </span>
                                                </td>
                                                <td className="px-5 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                u.is_banned
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-green-50 text-green-600'
                            }`}>
                              {u.is_banned ? 'Banned' : 'Active'}
                            </span>
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {u.is_banned
                                                        ? (
                                                            <button
                                                                onClick={() => handleUnban(u.id)}
                                                                className="text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-500 hover:border-green-300 hover:text-green-600 transition"
                                                            >
                                                                Unban
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleBan(u.id)}
                                                                className="text-xs border border-red-100 px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                                                            >
                                                                Ban
                                                            </button>
                                                        )
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}