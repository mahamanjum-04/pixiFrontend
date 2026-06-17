import { useState } from 'react';

export default function SafeImage({ src, alt, className }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-[#141414] text-gray-300 dark:text-gray-600 text-4xl ${className}`}>
                🖼
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setFailed(true)}
        />
    );
}