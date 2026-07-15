import { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe.js';
import { confirmPurchase } from '../services/purchases.js';

function CheckoutForm({ artwork, onSuccess, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setSubmitting(true);
        setError('');

        try {
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setError(submitError.message);
                setSubmitting(false);
                return;
            }

            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
            });

            if (confirmError) {
                setError(confirmError.message || 'Payment failed.');
                setSubmitting(false);
                return;
            }

            if (paymentIntent?.status === 'succeeded') {
                await confirmPurchase({ payment_intent_id: paymentIntent.id, artwork: artwork.id });
                onSuccess();
            } else {
                setError(`Payment status: ${paymentIntent?.status || 'unknown'}`);
            }
        } catch (err) {
            console.error('Stripe confirmPayment threw:', err);
            setError(err.message || 'Something went wrong processing payment.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="min-h-[200px]">
                <PaymentElement />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || submitting}
                className="w-full bg-[#9440dd] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
            >
                {submitting ? 'Processing...' : `Pay $${artwork.price}`}
            </button>
            <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
                Cancel
            </button>
        </form>
    );
}

export default function PurchaseModal({ artwork, clientSecret, onSuccess, onClose }) {
    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-[#141414] rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header - fixed */}
                <div className="flex items-center justify-between p-6 pb-2 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Complete your purchase</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#0a0a0a]"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Artwork info - fixed */}
                <div className="px-6 py-2 flex-shrink-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Purchasing: <span className="font-medium text-gray-900 dark:text-gray-100">{artwork.title}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                        by {artwork.creator_name}
                    </p>
                </div>

                {/* Scrollable content */}
                <div className="px-6 py-4 overflow-y-auto flex-1">
                    <Elements key={clientSecret} stripe={getStripe()} options={{ clientSecret }}>
                        <CheckoutForm artwork={artwork} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                </div>
            </div>
        </div>
    );
}