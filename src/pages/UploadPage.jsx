import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { uploadArtwork } from '../services/artworks';

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

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('price', form.price);
            formData.append('medium', form.medium);
            formData.append('description', form.description || '');
            formData.append('dimensions', form.dimensions || '');
            formData.append('status', form.status);
            formData.append('image', image);

            // ✅ Use the service instead of direct api call
            await uploadArtwork(formData);
            navigate('/portfolio');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-6 py-8">

                <h1 className="text-2xl font-semibold text-gray-900 mb-6">Upload artwork</h1>

                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-5">

                    {/* Image upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Artwork image *</label>
                        <div
                            onClick={() => document.getElementById('img-input').click()}
                            className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition overflow-hidden"
                        >
                            {preview
                                ? <img src={preview} alt="preview" className="w-full h-full object-cover" />
                                : <div className="text-center text-gray-300">
                                    <div className="text-4xl mb-2">🖼</div>
                                    <p className="text-sm">Click to upload image</p>
                                </div>
                            }
                        </div>
                        <input id="img-input" type="file" accept="image/*" onChange={handleImage} className="hidden" />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text" name="title" value={form.title} onChange={handleChange}
                            placeholder="Sunset Painting"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            name="description" value={form.description} onChange={handleChange}
                            placeholder="Tell buyers about this piece..."
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                        />
                    </div>

                    {/* Price + Medium */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                            <input
                                type="number" name="price" value={form.price} onChange={handleChange}
                                placeholder="150.00" min="0" step="0.01"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                            <select
                                name="medium" value={form.medium} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                {MEDIUMS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Dimensions + Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                            <input
                                type="text" name="dimensions" value={form.dimensions} onChange={handleChange}
                                placeholder="30x40cm"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status" value={form.status} onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="available">Available</option>
                                <option value="sold">Sold</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {loading ? 'Uploading...' : 'Upload artwork'}
                    </button>

                </div>
            </div>
        </div>
    );
}