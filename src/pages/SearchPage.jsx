import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import ArtworkCard from '../components/ArtworkCard.jsx';
import { searchByText, searchByImage } from '../services/search.js';
import { getArtwork } from '../services/artworks.js';

const SEARCH_STATE_KEY = 'pixi_search_state';

export default function SearchPage() {

    const restored = (() => {
        try {
            const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    })();
    const [tab, setTab] = useState('text');
    const [query, setQuery] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        try {
            sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify({
                tab, query, imagePreview, results, searched,
            }));
        } catch {
            // sessionStorage might be full or unavailable — fail silently
        }
    }, [tab, query, imagePreview, results, searched]);

    const fetchArtworkDetails = async (searchResults) => {
        const artworks = await Promise.all(
            searchResults.map(r =>
                getArtwork(r.artwork_id)
                    .then(res => ({ ...res.data, score: r.score }))
                    .catch(() => null)
            )
        );
        return artworks.filter(Boolean);
    };

    const handleTextSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setSearched(true);
        try {
            const res = await searchByText(query.trim());
            const artworks = await fetchArtworkDetails(res.data.results);
            setResults(artworks);
        } catch {
            setError('Search failed. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setResults([]);
        setSearched(false);
    };

    const handleImageSearch = async () => {
        if (!imageFile) return;
        setLoading(true);
        setError('');
        setSearched(true);
        try {
            const res = await searchByImage(imageFile);
            const artworks = await fetchArtworkDetails(res.data.results);
            setResults(artworks);
        } catch {
            setError('Image search failed. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTabSwitch = (t) => {
        setTab(t);
        setResults([]);
        setError('');
        setSearched(false);
        setQuery('');
        setImageFile(null);
        setImagePreview(null);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">AI Search</h1>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                        Find artworks by description or by uploading a similar image
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'text', label: '🔤 Text search' },
                        { key: 'image', label: '🖼 Image search' },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleTabSwitch(t.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                                ${tab === t.key
                                ? 'bg-[#9440dd] text-white'
                                : 'bg-gray-100 dark:bg-[#141414] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1e1e1e]'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Text search input */}
                {tab === 'text' && (
                    <div className="flex gap-3 mb-8">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleTextSearch()}
                            placeholder="e.g. blue abstract painting, sunset landscape oil..."
                            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9440dd] bg-white dark:bg-[#141414] text-gray-900 dark:text-gray-100"
                        />
                        <button
                            onClick={handleTextSearch}
                            disabled={loading || !query.trim()}
                            className="px-5 py-2.5 bg-[#9440dd] text-white rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-40"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                )}

                {/* Image search input */}
                {tab === 'image' && (
                    <div className="mb-8">
                        <div
                            onClick={() => document.getElementById('search-img-input').click()}
                            className="w-full max-w-sm aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#9440dd] transition overflow-hidden mb-3 bg-gray-50 dark:bg-[#141414]"
                        >
                            {imagePreview
                                ? <img src={imagePreview} alt="query" className="w-full h-full object-cover" />
                                : <div className="text-center text-gray-300 dark:text-gray-600">
                                    <div className="text-3xl mb-1">🖼</div>
                                    <p className="text-sm">Click to upload an image</p>
                                    <p className="text-xs mt-1">We'll find visually similar artworks</p>
                                </div>
                            }
                        </div>
                        <input
                            id="search-img-input"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <button
                            onClick={handleImageSearch}
                            disabled={loading || !imageFile}
                            className="px-5 py-2.5 bg-[#9440dd] text-white rounded-lg text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-40"
                        >
                            {loading ? 'Searching...' : 'Find similar artworks'}
                        </button>
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
                    <div className="text-center py-10 text-red-400 dark:text-red-500 text-sm">{error}</div>
                )}

                {/* No results */}
                {!loading && searched && !error && results.length === 0 && (
                    <div className="text-center py-20 text-gray-400 dark:text-gray-500 text-sm">
                        No matching artworks found. Try a different search.
                    </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                    <>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                            {results.length} result{results.length !== 1 ? 's' : ''} found
                        </p>
                        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                            {results.map(a => (
                                <div key={a.id} className="relative">
                                    <ArtworkCard artwork={a} />
                                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        {Math.round(a.score * 100)}% match
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}