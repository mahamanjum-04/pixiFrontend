import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import { resolveImage } from '../utils/image.js';
import InterestsPicker from '../components/InterestsPicker.jsx';
import { getInterests, saveInterests } from '../services/interests.js';
import { submitReport } from '../services/admin.js';
import { getMe, updateMe } from '../services/auth.js';
import { getArtworks } from '../services/artworks.js';

export default function ProfilePage() {
    const { userId }  = useParams();
    const { user, login } = useAuth();
    const navigate    = useNavigate();

    const isOwnProfile = !userId || parseInt(userId) === user?.id;

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
    const [interests, setInterests]           = useState([]);
    const [savingInterests, setSavingInterests] = useState(false);
    const [interestSuccess, setInterestSuccess] = useState('');

    // Report user state
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason]   = useState('inappropriate');
    const [reportDesc, setReportDesc]       = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSuccess, setReportSuccess] = useState('');
    const [reportError, setReportError]     = useState('');

    // Tab state
    const [activeTab, setActiveTab] = useState('created');
    const [tabArtworks, setTabArtworks] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);

    // Viewed user data (for other user profiles)
    const [viewedUser, setViewedUser] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const fetchProfile = async () => {
            if (isOwnProfile) {
                try {
                    const res = await getMe();
                    if (!cancelled) {
                        setForm({
                            first_name: res.data.first_name || '',
                            last_name:  res.data.last_name  || '',
                            bio:        res.data.bio        || '',
                        });
                        getInterests()
                            .then(res => setInterests(res.data.interests || []))
                            .catch(() => {});
                        setPreview(res.data.avatar || null);
                    }
                } catch {
                    if (!cancelled) setError('Failed to load profile.');
                } finally {
                    if (!cancelled) setLoading(false);
                }
            } else {
                // Fetching another user's profile - load their artworks
                setActiveTab('created');
                setLoading(false);
            }
        };

        fetchProfile();
        return () => { cancelled = true; };
    }, [userId, user, isOwnProfile]);

    // Fetch tab artworks
    useEffect(() => {
        setTabLoading(true);
        if (activeTab === 'created') {
            getArtworks()
                .then(res => {
                    const creatorId = isOwnProfile ? user?.id : parseInt(userId);
                    const mine = res.data.filter(a => a.creator === creatorId);
                    if (!isOwnProfile && mine.length > 0) {
                        setViewedUser({
                            username: mine[0].creator_name,
                            id: creatorId,
                            is_creator: true,
                        });
                    }
                    setTabArtworks(mine);
                })
                .catch(() => setTabArtworks([]))
                .finally(() => setTabLoading(false));
        } else if (activeTab === 'saved' && isOwnProfile) {
            api.get('/api/saved/')
                .then(async (res) => {
                    const { getArtwork } = await import('../services/artworks.js');
                    const full = await Promise.all(
                        res.data.map(s =>
                            getArtwork(s.artwork)
                                .then(r => ({ ...r.data, is_saved: true, saved_id: s.id }))
                                .catch(() => null)
                        )
                    );
                    setTabArtworks(full.filter(Boolean));
                })
                .catch(() => setTabArtworks([]))
                .finally(() => setTabLoading(false));
        } else if (activeTab === 'purchased' && isOwnProfile) {
            import('../services/purchases.js').then(({ getPurchases }) =>
                getPurchases()
                    .then(res => {
                        const normalized = res.data.map(p => ({
                            id: p.artwork,
                            title: p.artwork_title,
                            image: p.artwork_image,
                            price: p.amount_paid,
                            purchased_at: p.purchased_at,
                        }));
                        setTabArtworks(normalized);
                    })
                    .catch(() => setTabArtworks([]))
                    .finally(() => setTabLoading(false))
            );
        } else {
            setTabLoading(false);
        }
    }, [activeTab, user, userId, isOwnProfile]);

    const handleSaveInterests = async () => {
        setSavingInterests(true);
        setInterestSuccess('');
        try {
            await saveInterests(interests);
            setInterestSuccess('Interests updated.');
            setTimeout(() => setInterestSuccess(''), 2500);
        } catch {
            setError('Failed to save interests.');
        } finally {
            setSavingInterests(false);
        }
    };

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

            const res = await updateMe(formData);

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
        setPreview(user?.avatar || null);
        setForm({
            first_name: user?.first_name || '',
            last_name:  user?.last_name  || '',
            bio:        user?.bio        || '',
        });
    };

    const handleReport = async () => {
        setReportLoading(true);
        setReportError('');
        setReportSuccess('');
        try {
            const reportedUserId = isOwnProfile ? null : parseInt(userId);
            await submitReport({
                reported_artwork: null,
                reported_user:    reportedUserId,
                reason:           reportReason,
                description:      reportDesc || `Reported user: ${viewedUser?.username || userId}`,
            });
            setReportSuccess('Report submitted. Our team will review it shortly.');
            setReportDesc('');
            setTimeout(() => {
                setShowReport(false);
                setReportSuccess('');
            }, 2500);
        } catch {
            setReportError('Failed to submit report. Please try again.');
        } finally {
            setReportLoading(false);
        }
    };

    const REASONS = ['inappropriate', 'spam', 'harassment', 'fake', 'other'];

    const tabs = isOwnProfile
        ? user?.is_creator
            ? [{ key: 'created', label: 'Created' }, { key: 'saved', label: 'Saved' }]
            : [{ key: 'saved', label: 'Saved' }, { key: 'purchased', label: 'Purchased' }]
        : [{ key: 'created', label: 'Artworks' }];

    const displayName = isOwnProfile ? user?.username : (viewedUser?.username || `User #${userId}`);
    const displayRole = isOwnProfile
        ? (user?.is_creator ? 'Creator' : 'Buyer')
        : (viewedUser?.is_creator ? 'Creator' : 'User');

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {!loading && (
                    <>
                        {/* Profile header */}
                        <div className="flex flex-col items-center sm:items-start sm:flex-row sm:items-center gap-4 mb-8">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-full bg-[#9440dd] overflow-hidden flex items-center justify-center flex-shrink-0">
                                {preview
                                    ? <img src={resolveImage(preview)} alt="avatar" className="w-full h-full object-cover" />
                                    : <span className="text-3xl font-semibold text-white">
                                        {displayName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                }
                            </div>

                            <div className="text-center sm:text-left flex-1">
                                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{displayName}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {displayRole}
                                </p>
                                {isOwnProfile && user?.bio && !editing && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.bio}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {isOwnProfile && !editing && (
                                    <button
                                        onClick={() => setEditing(true)}
                                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-[#9440dd] hover:text-[#9440dd] transition"
                                    >
                                        Edit profile
                                    </button>
                                )}
                                {!isOwnProfile && (
                                    <button
                                        onClick={() => setShowReport(r => !r)}
                                        className="px-4 py-2 border border-red-200 dark:border-red-800 rounded-xl text-sm font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                    >
                                        ⚑ Report user
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Report panel */}
                        {showReport && !isOwnProfile && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-xl p-4 mb-8">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Report this user</p>

                                {reportSuccess && (
                                    <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg mb-3">
                                        {reportSuccess}
                                    </p>
                                )}
                                {reportError && (
                                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg mb-3">
                                        {reportError}
                                    </p>
                                )}

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Reason</label>
                                    <div className="flex flex-wrap gap-2">
                                        {REASONS.map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setReportReason(r)}
                                                className={`px-3 py-1 rounded-full text-xs border transition capitalize
                                                    ${reportReason === r
                                                        ? 'bg-[#9440dd] text-white border-[#9440dd]'
                                                        : 'bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Additional details (optional)
                                    </label>
                                    <textarea
                                        value={reportDesc}
                                        onChange={e => setReportDesc(e.target.value)}
                                        placeholder="Describe the issue..."
                                        rows={2}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] resize-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleReport}
                                        disabled={reportLoading}
                                        className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition disabled:opacity-50"
                                    >
                                        {reportLoading ? 'Submitting...' : 'Submit report'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowReport(false);
                                            setReportError('');
                                            setReportDesc('');
                                        }}
                                        className="flex-1 border border-gray-200 dark:border-gray-700 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400 hover:border-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Feedback */}
                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400">
                                {success}
                            </div>
                        )}

                        {/* Edit form (own profile only) */}
                        {editing && (
                            <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Edit Profile</h2>

                                {/* Avatar upload */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-16 h-16 rounded-full bg-[#9440dd] overflow-hidden flex items-center justify-center flex-shrink-0">
                                        {preview
                                            ? <img src={resolveImage(preview)} alt="avatar" className="w-full h-full object-cover" />
                                            : <span className="text-xl font-semibold text-white">
                                                {user?.username?.[0]?.toUpperCase() || 'U'}
                                            </span>
                                        }
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('avatar-input').click()}
                                        className="text-sm text-[#9440dd] hover:underline transition"
                                    >
                                        Change photo
                                    </button>
                                    <input
                                        id="avatar-input"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatar}
                                        className="hidden"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={form.first_name}
                                            onChange={handleChange}
                                            placeholder="Jane"
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={form.last_name}
                                            onChange={handleChange}
                                            placeholder="Doe"
                                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="text"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-100 dark:bg-[#0a0a0a] text-gray-400 dark:text-gray-500"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea
                                        name="bio"
                                        value={form.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] resize-none"
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Interests</label>
                                    <InterestsPicker selected={interests} onChange={setInterests} />
                                    {interestSuccess && (
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">{interestSuccess}</p>
                                    )}
                                    <button
                                        onClick={handleSaveInterests}
                                        disabled={savingInterests}
                                        className="mt-3 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-[#9440dd] hover:text-[#9440dd] transition disabled:opacity-50"
                                    >
                                        {savingInterests ? 'Saving...' : 'Update interests'}
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 bg-[#9440dd] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save changes'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 border border-gray-200 dark:border-gray-700 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-400 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab switcher */}
                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setActiveTab(t.key)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                                        ${activeTab === t.key
                                            ? 'bg-[#9440dd] text-white'
                                            : 'bg-gray-100 dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        {tabLoading && (
                            <div className="flex justify-center py-10">
                                <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                            </div>
                        )}

                        {!tabLoading && tabArtworks.length === 0 && (
                            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
                                Nothing here yet.
                            </div>
                        )}

                        {!tabLoading && tabArtworks.length > 0 && (
                            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                                {tabArtworks.map(a => (
                                    <ArtworkCard key={a.id} artwork={a} />
                                ))}
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    );
}