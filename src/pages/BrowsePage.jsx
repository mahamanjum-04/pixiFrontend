import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import api from '../services/api.js';
import { getArtworks } from '../services/artworks.js';

const FILTERS = [
    'All', 'Oil', 'Watercolour', 'Acrylic', 'Digital', 'Pencil',
    'Mixed media', 'Abstract', 'Portrait', 'Landscape',
    'Still life', 'Street art', 'Photography'
];

// Map display labels to medium values for filtering
const MEDIUM_MAP = {
    'All': 'All',
    'Oil': 'oil',
    'Watercolour': 'watercolor',
    'Acrylic': 'acrylic',
    'Digital': 'digital',
    'Pencil': 'pencil',
    'Mixed media': 'mixed media',
    'Abstract': 'abstract',
    'Portrait': 'portrait',
    'Landscape': 'landscape',
    'Still life': 'still life',
    'Street art': 'street art',
    'Photography': 'photography',
};

export default function BrowsePage() {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const { user } = useAuth();

    useEffect(() => {
        setLoading(true);
        const endpointFn = user ? () => api.get('/api/artworks/personalised/') : getArtworks;
        endpointFn()
            .then(async (res) => {
                let arts = res.data;

                // If logged in, mark which artworks are saved
                if (user) {
                    try {
                        const savedRes = await api.get('/api/saved/');
                        const savedMap = new Map(savedRes.data.map(s => [s.artwork, s.id]));
                        arts = arts.map(a => ({
                            ...a,
                            is_saved: savedMap.has(a.id),
                            saved_id: savedMap.get(a.id) || null,
                        }));
                    } catch {
                        // silent — cards just won't show as saved
                    }
                }

                setArtworks(arts);
            })
            .catch(() => setError('Failed to load artworks.'))
            .finally(() => setLoading(false));
    }, [user]);

    const filtered = artworks.filter(a => {
        if (activeFilter === 'All') return true;
        const mediumVal = MEDIUM_MAP[activeFilter];
        // Check both medium field and category-style matching
        return a.medium === mediumVal || a.category === mediumVal;
    });

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-full mx-auto px-3 sm:px-6 pt-4 pb-20 md:pb-8">

                {/* Filter pills - horizontal scroll */}
                <div className="overflow-x-auto scrollbar-hide mb-4 -mx-3 px-3 sm:mx-0 sm:px-0">
                    <div className="flex gap-2 w-max">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                                    ${activeFilter === f
                                        ? 'bg-[#9440dd] text-white'
                                        : 'bg-gray-100 dark:bg-[#141414] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personalised label */}
                {user && !loading && (
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-4">
                        Personalised for you ✦
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-[#9440dd] rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-20 text-red-500 text-sm">{error}</div>
                )}

                {/* Empty */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500">No artworks found.</div>
                )}

                {/* Masonry grid */}
                {!loading && !error && filtered.length > 0 && (
                    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
                        {filtered.map(a => <ArtworkCard key={a.id} artwork={a} />)}
                    </div>
                )}

            </div>
        </div>
    );
}