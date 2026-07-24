import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

// Komponen formulir untuk memberikan rating dan ulasan
function VendorReviewForm({ poCode, onSubmit, onCancel, loading }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ rating, comment });
    };

    return (
        <form onSubmit={handleSubmit}>
            <p className="text-sm text-gray-600 mb-4">
                Berikan penilaian Anda untuk pesanan <strong>{poCode}</strong>. Ulasan ini akan membantu vendor lain dan dapur dalam komunitas.
            </p>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating Keseluruhan</label>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`cursor-pointer transition-colors ${
                                (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
            </div>
            <div className="mb-6">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Ulasan (Opsional)</label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="4"
                    className="input-style"
                    placeholder="Bagikan pengalaman Anda mengenai kualitas produk, ketepatan waktu, dan pelayanan..."
                ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="btn-secondary">
                    Batal
                </button>
                <button type="submit" disabled={rating === 0 || loading} className="btn-primary">
                    {loading ? <Loader2 className="animate-spin" /> : 'Kirim Ulasan'}
                </button>
            </div>
        </form>
    );
}

export default VendorReviewForm;
