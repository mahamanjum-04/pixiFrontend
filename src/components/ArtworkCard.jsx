import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import SafeImage from './SafeImage.jsx';
import { resolveImage } from '../utils/image.js';

export default function ArtworkCard({ artwork }) {
    const [saved, setSaved]     = useState(artwork.is_saved || false);
    const [savedId, setSavedId] = useState(artwork.saved_id || null);

    const toggleSave = async (e) => {
        e.preventDefault();
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

    const statusColor = {
        available:    'bg-green-50 text-green-700',
        sold:         'bg-red-50 text-red-600',
        not_for_sale: 'bg-gray-100 text-gray-500',
    };

    return (
        <Link to={`/artworks/${artwork.id}`} className="group block">
            <div className="rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition bg-white">

                {/* Image */}
                <div className="relative aspect-square bg-gray-50">
                    <SafeImage
                        src={resolveImage(artwork.image)}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                        onClick={toggleSave}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-sm hover:scale-110 transition"
                    >
                        {saved ? '❤️' : '🤍'}
                    </button>
                    <span className={`absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[artwork.status] || statusColor.available}`}>
            {artwork.status?.replace('_', ' ')}
          </span>
                </div>

                {/* Info */}
                <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{artwork.title}</p>
                    <p className="text-xs text-gray-400 truncate">{artwork.creator_name}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">${artwork.price}</p>
                </div>

            </div>
        </Link>
    );
}