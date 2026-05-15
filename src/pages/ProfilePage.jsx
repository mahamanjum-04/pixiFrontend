import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api';

export default function ProfilePage() {
    const { user, login } = useAuth();

    const [form, setForm] = useState({
        first_name: '', last_name: '', bio: '',
    });
    const [avatar, setAvatar]       = useState(null);
    const [preview, setPreview]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState('');
    const [editing, setEditing]     = useState(false);

    useEffect(() => {
        let cancelled = false;

        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/auth/me/');
                if (!cancelled) {
                    setForm({
                        first_name: res.data.first_name || '',
                        last_name:  res.data.last_name  || '',
                        bio:        res.data.bio        || '',
                    });
                    setPreview(res.data.avatar || null);
                }
            } catch {
                if (!cancelled) setError('Failed to load profile.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProfile();
        return () => { cancelled = true; };
    }, []);

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatar(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');
        try {
            const formData = new FormData();
            formData.append('bio',        form.bio);
            formData.append('first_name', form.first_name);
            formData.append('last_name',  form.last_name);
            if (avatar) formData.append('avatar', avatar);

            const res = await api.patch('/api/auth/me/', formData);

            // update auth context with new user data
            const tokens = {
                access:  localStorage.getItem('access_token'),
                refresh: localStorage.getItem('refresh_token'),
            };
            login(tokens, res.data);

            setSuccess('Profile updated.');
            setEditing(false);
            setAvatar(null);
        } catch {
            setError('Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setError('');
        setSuccess('');
        setAvatar(null);
        // reset preview back to saved avatar
        setPreview(user?.avatar || null);
        setForm({
            first_name: user?.first_name || '',
            last_name:  user?.last_name  || '',
            bio:        user?.bio        || '',
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-xl mx-auto px-6 py-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Profile</h1>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {!loading && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-5">

                        {/* Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {preview
                                    ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="text-2xl font-medium text-gray-400">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                                }
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">@{user?.username}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {user?.is_creator ? 'Creator' : 'Buyer'}
                                </p>
                                {editing && (
                                    <button
                                        onClick={() => document.getElementById('avatar-input').click()}
                                        className="text-xs text-gray-400 hover:text-black underline mt-1 transition"
                                    >
                                        Change photo
                                    </button>
                                )}
                                <input
                                    id="avatar-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatar}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        {/* Feedback */}
                        {error && (
                            <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="px-4 py-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-600">
                                {success}
                            </div>
                        )}

                        {/* Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Jane"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Doe"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                            <textarea
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                disabled={!editing}
                                placeholder="Tell us about yourself..."
                                rows={3}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-50 disabled:text-gray-400 resize-none"
                            />
                        </div>

                        {/* Actions */}
                        {!editing
                            ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="w-full border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:border-black hover:text-black transition"
                                >
                                    Edit profile
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-black text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )
                        }

                    </div>
                )}

            </div>
        </div>
    );
}