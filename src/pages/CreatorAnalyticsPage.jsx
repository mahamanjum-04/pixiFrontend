import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getCreatorAnalytics } from '../services/admin.js';

export default function CreatorAnalyticsPage() {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchAnalytics = async () => {
            try {
                const res = await getCreatorAnalytics();
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 py-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-6">My analytics</h1>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-gray-400 text-sm">{error}</div>
                )}

                {!loading && !error && data && (
                    <>
                        {/* Stats cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                            {[
                                { label: 'Total sales',    value: data.total_sales    ?? '—' },
                                { label: 'Total revenue',  value: data.total_revenue  ? `$${data.total_revenue}` : '—' },
                                { label: 'Total messages', value: data.total_messages ?? '—' },
                            ].map(s => (
                                <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Interactions table */}
                        {data.interactions?.length > 0 && (
                            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-700">Interaction history</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Client</th>
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Artwork</th>
                                            <th className="text-left px-5 py-3 text-xs font-medium text-gray-400">Date</th>
                                            <th className="text-right px-5 py-3 text-xs font-medium text-gray-400">Amount</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {data.interactions.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                                <td className="px-5 py-3 text-gray-700">{item.client_name}</td>
                                                <td className="px-5 py-3 text-gray-500 truncate max-w-[160px]">{item.artwork_title}</td>
                                                <td className="px-5 py-3 text-gray-400">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-5 py-3 text-right font-medium text-gray-900">
                                                    ${item.amount}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* No interactions */}
                        {(!data.interactions || data.interactions.length === 0) && (
                            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 text-sm">
                                No interactions yet. Sales will appear here once buyers purchase your work.
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}