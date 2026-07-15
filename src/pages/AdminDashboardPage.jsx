import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { resolveImage } from '../utils/image.js';
import {
    getUsers, getReports, banUser, unbanUser,
    removeContent, updateReportStatus, warnUser, escalateReport,
} from '../services/admin.js';

export default function AdminDashboardPage() {
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState([]);
    const [tab, setTab] = useState('reports');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        type: '', severity: '', status: '', date_from: '', date_to: '', sort: '-created_at',
    });

    const loadReports = async (f = filters) => {
        try {
            const res = await getReports(f);
            setReports(res.data);
        } catch {
            setError('Failed to load dashboard data.');
        }
    };

    useEffect(() => {
        let cancelled = false;
        const fetchAll = async () => {
            try {
                const [usersRes, reportsRes] = await Promise.all([
                    getUsers(),
                    getReports(filters),
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

    const applyFilters = (next) => {
        const merged = { ...filters, ...next };
        setFilters(merged);
        loadReports(merged);
    };

    const handleBan = async (id) => {
        if (!confirm('Ban this user?')) return;
        try {
            await banUser(id);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: true } : u));
        } catch { alert('Failed to ban user.'); }
    };

    const handleUnban = async (id) => {
        try {
            await unbanUser(id);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, is_banned: false } : u));
        } catch { alert('Failed to unban user.'); }
    };

    const handleRemoveContent = async (report) => {
        if (!report.reported_artwork) return;
        if (!confirm('Remove this content?')) return;
        try {
            await removeContent(report.reported_artwork, report.id);
            setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to remove content.');
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await updateReportStatus(id, newStatus);
            setReports(prev => prev.map(r => r.id === id ? res.data : r));
        } catch { alert('Failed to update status.'); }
    };

    const handleWarn = async (id) => {
        const message = prompt('Warning message to send:', 'You have received a warning for violating community guidelines.');
        if (message === null) return;
        try {
            const res = await warnUser(id, message);
            setReports(prev => prev.map(r => r.id === id ? res.data : r));
        } catch { alert('Failed to warn user.'); }
    };

    const handleEscalate = async (id) => {
        try {
            const res = await escalateReport(id);
            setReports(prev => prev.map(r => r.id === id ? res.data : r));
        } catch { alert('Failed to escalate report.'); }
    };

    const STATUS_LABELS = {
        pending: 'Pending', reviewed: 'Reviewed', in_progress: 'In Progress', resolved: 'Resolved',
    };
    const STATUS_COLORS = {
        pending: 'bg-gray-100 text-gray-600',
        reviewed: 'bg-blue-50 text-blue-600',
        in_progress: 'bg-yellow-50 text-yellow-700',
        resolved: 'bg-green-50 text-green-600',
    };
    const SEVERITY_COLORS = {
        low: 'bg-gray-100 text-gray-500',
        medium: 'bg-yellow-50 text-yellow-700',
        high: 'bg-red-50 text-red-500',
    };

    const active = reports.filter(r => r.status !== 'resolved');
    const resolved = reports.filter(r => r.status === 'resolved');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Admin dashboard</h1>
                    <Link
                        to="/admin/analytics"
                        className="px-4 py-2 bg-[#9440dd] text-white rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition"
                    >
                        📊 Admin analytics
                    </Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                    {[
                        { key: 'reports', label: `Reports (${active.length})` },
                        { key: 'users', label: `Users (${users.length})` },
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

                {/* Filters (reports tab only) */}
                {tab === 'reports' && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <select
                            value={filters.type}
                            onChange={e => applyFilters({ type: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        >
                            <option value="">All types</option>
                            <option value="content">Content</option>
                            <option value="user">User</option>
                        </select>
                        <select
                            value={filters.severity}
                            onChange={e => applyFilters({ severity: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        >
                            <option value="">All severities</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={e => applyFilters({ status: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        >
                            <option value="">All statuses</option>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={e => applyFilters({ date_from: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        />
                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={e => applyFilters({ date_to: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        />
                        <select
                            value={filters.sort}
                            onChange={e => applyFilters({ sort: e.target.value })}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                        >
                            <option value="-created_at">Newest first</option>
                            <option value="created_at">Oldest first</option>
                            <option value="-severity">Highest severity first</option>
                        </select>
                    </div>
                )}

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
                    <div className="flex flex-col gap-3">
                        {reports.length === 0 && (
                            <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                                No reports match these filters.
                            </div>
                        )}
                        {reports.map(r => (
                            <div key={r.id} className={`bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 ${r.status === 'resolved' ? 'opacity-50' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 flex gap-3">
                                        {r.type === 'content' && (
                                            <Link to={`/artworks/${r.reported_artwork}`} className="flex-shrink-0">
                                                <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-[#0a0a0a] overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                                    {r.reported_image ? (
                                                        <img
                                                            src={resolveImage(r.reported_image)}
                                                            alt={r.reported}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-200 text-xl">🖼</span>
                                                    )}
                                                </div>
                                            </Link>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                                                    {STATUS_LABELS[r.status]}
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[r.severity]}`}>
                                                    {r.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {r.type === 'user' ? '👤 User report' : '🖼 Content report'}
                                            </p>
                                            {r.type === 'content' ? (
                                                <Link to={`/artworks/${r.reported_artwork}`} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                                                    Reported: <span className="font-medium">{r.reported}</span>
                                                </Link>
                                            ) : (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Reported: <span className="font-medium">{r.reported}</span>
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">By: {r.reporter_name}</p>
                                            {r.description && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic">"{r.description}"</p>
                                            )}
                                            <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                                {new Date(r.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {r.status !== 'resolved' && (
                                        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                                            <select
                                                value={r.status}
                                                onChange={e => handleStatusChange(r.id, e.target.value)}
                                                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300"
                                            >
                                                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                            </select>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => handleWarn(r.id)}
                                                    className="px-2.5 py-1 text-xs border border-yellow-200 rounded-lg text-yellow-600 hover:bg-yellow-50 transition"
                                                >
                                                    Warn
                                                </button>
                                                {r.severity !== 'high' && (
                                                    <button
                                                        onClick={() => handleEscalate(r.id)}
                                                        className="px-2.5 py-1 text-xs border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition"
                                                    >
                                                        Escalate
                                                    </button>
                                                )}
                                                {r.type === 'content' && (
                                                    <button
                                                        onClick={() => handleRemoveContent(r)}
                                                        className="px-2.5 py-1 text-xs bg-red-50 border border-red-100 rounded-lg text-red-500 hover:bg-red-100 transition"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
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