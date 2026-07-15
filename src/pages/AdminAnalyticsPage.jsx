import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { getAdminAnalytics } from '../services/admin';
import { Link } from 'react-router-dom';

export default function AdminAnalyticsPage() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchAnalytics = async () => {
            try {
                const res = await getAdminAnalytics();
                if (!cancelled) setData(res.data);
            } catch {
                if (!cancelled) setError('Analytics not available yet.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAnalytics();
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Platform analytics</h1>
                    <Link
                        to="/admin"
                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-[#9440dd] hover:text-[#9440dd] transition"
                    >
                        🛠 Admin dashboard
                    </Link>
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

                {!loading && !error && data && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            {[
                                { label: 'Total users',    value: data.total_users    ?? '—' },
                                { label: 'Total artworks', value: data.total_artworks ?? '—' },
                                { label: 'Total sales',    value: data.total_sales    ?? '—' },
                                { label: 'Total revenue',  value: data.total_revenue ? `$${data.total_revenue}` : '—' },
                            ].map(s => (
                                <div key={s.label} className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Sales over time bar chart */}
                        {data.sales_over_time?.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-6 mb-6">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Sales over time</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={data.sales_over_time}>
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="sales" fill="#9440dd" radius={[4,4,0,0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* New users over time line chart */}
                        {data.new_users_over_time?.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-6 mb-6">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">New users over time</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={data.new_users_over_time}>
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="new_users"
                                            stroke="#0cc0df"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Top artworks table */}
                        {data.top_artworks?.length > 0 && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Top artworks</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                             <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">#</th>
                                             <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Artwork</th>
                                             <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Creator</th>
                                             <th className="text-right px-5 py-3 text-xs font-medium text-gray-400 dark:text-gray-500">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.top_artworks.map((a, i) => (
                                            <tr key={i} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#0a0a0a] transition">
                                                 <td className="px-5 py-3 text-gray-300 dark:text-gray-600 text-xs">{i + 1}</td>
                                                 <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{a.title}</td>
                                                 <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{a.creator}</td>
                                                <td className="px-5 py-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                a.sold
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-green-50 text-green-600'
                            }`}>
                              {a.sold ? 'Sold' : 'Available'}
                            </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* No data */}
                        {!data.sales_over_time?.length &&
                            !data.new_users_over_time?.length &&
                            !data.top_artworks?.length && (
                                <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                                    No data available yet.
                                </div>
                            )}
                    </>
                )}

            </div>
        </div>
    );
}