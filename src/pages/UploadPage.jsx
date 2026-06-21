import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { uploadArtwork, updateArtwork } from '../services/artworks.js';

const MEDIUMS = ['oil', 'watercolor', 'acrylic', 'digital', 'pencil', 'other'];

export default function UploadPage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '', description: '', price: '', medium: 'oil', dimensions: '', status: 'available',
    });
    const [image, setImage]     = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const handleChange = e =>
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImage(file);
        setPreview(URL.createObjectURL(file));
    };


    const handleSubmit = async () => {
        setError('');
        if (!form.title || !form.price || !image) {
            setError('Title, price and image are required.');
            return;
        }

        // 🔍 Debug: Check if image exists
        console.log('Image being uploaded:', image);
        console.log('Image type:', image?.type);
        console.log('Image size:', image?.size);

        setLoading(true);
        try {
            const formData = new FormData();
            // 🔍 Debug: Log what's being appended
            console.log('Appending fields...');
            formData.append('title', form.title);
            formData.append('price', form.price);
            formData.append('medium', form.medium);
            formData.append('description', form.description || '');
            formData.append('dimensions', form.dimensions || '');
            formData.append('status', form.status);
            formData.append('image', image);  // ← This should be a File object

            // 🔍 Debug: Check FormData contents
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            const uploadRes = await uploadArtwork(formData);
            console.log('Upload response:', uploadRes);
            console.log('Response data:', uploadRes.data);

            // ... rest of code
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20 md:pb-8">

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Upload artwork</h1>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-[#141414] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-5">

                    {/* Image upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Artwork image *</label>
                        <div
                            onClick={() => document.getElementById('img-input').click()}
                            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-[#9440dd] transition overflow-hidden bg-white dark:bg-[#0a0a0a]"
                        >
                            {preview
                                ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                : <div className="text-center text-gray-300 dark:text-gray-600">
                                    <div className="text-4xl mb-2">🖼</div>
                                    <p className="text-sm">Click to upload image</p>
                                </div>
                            }
                        </div>
                        <input id="img-input" type="file" accept="image/*" onChange={handleImage} className="hidden" />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                        <input
                            type="text" name="title" value={form.title} onChange={handleChange}
                            placeholder="Sunset Painting"
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            placeholder="Tell buyers about this piece..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd] resize-none"
                        />
                    </div>

                    {/* Price + Medium */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price ($) *</label>
                            <input
                                type="number" name="price" value={form.price} onChange={handleChange}
                                placeholder="150.00" min="0" step="0.01"
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medium</label>
                            <select
                                name="medium" value={form.medium} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                            >
                                {MEDIUMS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dimensions + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dimensions</label>
                            <input
                                type="text" name="dimensions" value={form.dimensions} onChange={handleChange}
                                placeholder="30x40cm"
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                name="status" value={form.status} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#9440dd]"
                            >
                                <option value="available">Available</option>
                                <option value="sold">Sold</option>
                                <option value="not_for_sale">Not for sale</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#9440dd] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
                    >
                        {loading ? 'Uploading...' : 'Upload artwork'}
                    </button>

                </div>
            </div>
        </div>
    );
}