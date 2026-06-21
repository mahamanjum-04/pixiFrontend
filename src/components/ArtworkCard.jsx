import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import SafeImage from './SafeImage.jsx';
import { resolveImage } from '../utils/image.js';

export default function ArtworkCard({ artwork }) {
    const [saved, setSaved]     = useState(artwork.is_saved || false);
    const [savedId, setSavedId] = useState(artwork.saved_id || null);

    useEffect(() => {
        setSaved(artwork.is_saved || false);
        setSavedId(artwork.saved_id || null);
    }, [artwork.is_saved, artwork.saved_id]);

    const toggleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (saved) {
                await api.delete(`/api/saved/${savedId}/`);
                setSaved(false);
                setSavedId(null);
            } else {
                const res = await api.post('/api/saved/', { artwork: artwork.id });
                setSaved(true);
                setSavedId(res.data.id);
            }
        } catch (err) {
            console.error('Save failed:', err);
        }
    };

    return (
        <Link to={`/artworks/${artwork.id}`} className="group block break-inside-avoid mb-3">
            <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#141414] relative">

                {/* Image */}
                <SafeImage
                    src={resolveImage(artwork.image)}
                    alt={artwork.title}
                    className="w-full h-auto"
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3">
                    {/* Save button - top right */}
                    <div className="flex justify-end">
                        <button
                            onClick={toggleSave}
                            className="w-9 h-9 rounded-full bg-white/90 dark:bg-[#1e1e1e]/90 shadow-md flex items-center justify-center hover:scale-110 transition"
                        >
                            {saved
                                ? <img src="/assets/liked-button.png" alt="Liked" className="w-5 h-5" />
                                : <img src="/assets/like-button.png" alt="Save" className="w-5 h-5" />
                            }
                        </button>
                    </div>

                    {/* Bottom info */}
                    <div>
                        <p className="text-sm font-semibold text-white truncate">{artwork.title}</p>
                        <p className="text-xs text-white/70 truncate">{artwork.creator_name}</p>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-sm font-bold text-white">${artwork.price}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                artwork.status === 'available'
                                    ? 'bg-[#9440dd] text-white'
                                    : 'bg-gray-600 text-gray-200'
                            }`}>
                                {artwork.status?.replace('_', ' ')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}