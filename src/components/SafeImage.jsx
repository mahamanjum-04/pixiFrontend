import { useState, useEffect } from 'react';
import api from '../services/api';
import { resolveImage } from '../utils/image';

export default function SafeImage({ src, alt, className }) {
    const [blobUrl, setBlobUrl] = useState(null);
    const [failed, setFailed]   = useState(false);

    useEffect(() => {
        if (!src) return;

        let objectUrl = null;

        api.get(resolveImage(src), { responseType: 'blob' })
            .then(res => {
                objectUrl = URL.createObjectURL(res.data);
                setBlobUrl(objectUrl);
            })
            .catch(() => setFailed(true));

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    if (failed || !src) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 text-gray-200 text-4xl ${className}`}>
                🖼
            </div>
        );
    }

    if (!blobUrl) {
        return (
            <div className={`flex items-center justify-center bg-gray-50 ${className}`}>
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin" />
            </div>
        );
    }

    return <img src={blobUrl} alt={alt} className={className} />;
}