import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerRequest } from '../services/auth.js';
import { useAuth } from '../hooks/useAuthContext.jsx';
export default function RegisterPage() {
    const { login } = useAuth();
    const navigate  = useNavigate();

    const [form, setForm] = useState({
        username: '', email: '', password: '', is_creator: false, is_buyer: true,
    });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const setRole = (isCreator) => setForm(f => ({
        ...f,
        is_creator: isCreator,
        is_buyer: !isCreator,
    }));

    const handleSubmit = async () => {
        setError('');
        if (!form.username || !form.email || !form.password) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        setLoading(true);
        try {
            const res = await registerRequest(form);
            const { access, refresh, user } = res.data;
            login({ access, refresh }, user);
            if (!user.has_set_interests) navigate('/interests');
            else if (user.is_creator) navigate('/portfolio');
            else navigate('/browse');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create your account</h1>
                <p className="text-sm text-gray-500 mb-6">Join PIXI as a creator or buyer</p>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="artlover"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Min. 8 characters"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[{ label: 'Buyer', isCreator: false }, { label: 'Creator', isCreator: true }].map(r => (
                                <button
                                    key={r.label}
                                    type="button"
                                    onClick={() => setRole(r.isCreator)}
                                    className={`py-2.5 rounded-lg text-sm font-medium border transition
                                    ${form.is_creator === r.isCreator
                                        ? 'bg-black text-white border-black'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="mt-6 w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {loading ? 'Creating account...' : 'Create account'}
                </button>

                <p className="mt-4 text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-black font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}