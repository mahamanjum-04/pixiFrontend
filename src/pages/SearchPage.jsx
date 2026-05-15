import { useState } from 'react';
import Navbar from '../components/Navbar';
import ArtworkCard from '../components/ArtworkCard';
import { searchByText, searchByImage } from '../services/search';
import { getArtwork } from '../services/artworks';

export default function SearchPage() {
    const [tab, setTab]           = useState('text');
    const [query, setQuery]       = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [results, setResults]   = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [searched, setSearched] = useState(false);

    // after getting IDs from search, fetch full artwork objects
    const fetchArtworkDetails = async (searchResults) => {
        const artworks = await Promise.all(
            searchResults.map(r =>
                getArtwork(r.artwork_id)
                    .then(res => ({ ...res.data, score: r.score }))
                    .catch(() => null)
            )
        );
        return artworks.filter(Boolean); // remove any failed fetches
    };

    const handleTextSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        setError('');
        setSearched(true);
        try {
            const res     = await searchByText(query.trim());
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
            const res      = await searchByImage(imageFile);
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
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">AI Search</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Find artworks by description or by uploading a similar image
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'text',  label: '🔤 Text search'  },
                        { key: 'image', label: '🖼 Image search' },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => handleTabSwitch(t.key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition
                ${tab === t.key
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
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
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                        />
                        <button
                            onClick={handleTextSearch}
                            disabled={loading || !query.trim()}
                            className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40"
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
                            className="w-full max-w-sm aspect-video rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition overflow-hidden mb-3"
                        >
                            {imagePreview
                                ? <img src={imagePreview} alt="query" className="w-full h-full object-cover" />
                                : <div className="text-center text-gray-300">
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
                            className="px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40"
                        >
                            {loading ? 'Searching...' : 'Find similar artworks'}
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="text-center py-10 text-red-400 text-sm">{error}</div>
                )}

                {/* No results */}
                {!loading && searched && !error && results.length === 0 && (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        No matching artworks found. Try a different search.
                    </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                    <>
                        <p className="text-sm text-gray-400 mb-4">
                            {results.length} result{results.length !== 1 ? 's' : ''} found
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {results.map(a => (
                                <div key={a.id} className="relative">
                                    <ArtworkCard artwork={a} />
                                    {/* Similarity score badge */}
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