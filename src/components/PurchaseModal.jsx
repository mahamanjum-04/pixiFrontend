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
            <PaymentElement />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
                type="submit"
                disabled={!stripe || submitting}
                className="w-full bg-[#9440dd] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#7d36c0] transition disabled:opacity-50"
            >
                {submitting ? 'Processing...' : `Pay $${artwork.price}`}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500">
                Cancel
            </button>
        </form>
    );
}

export default function PurchaseModal({ artwork, clientSecret, onSuccess, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold mb-4">Complete your purchase</h2>
                <Elements key={clientSecret} stripe={getStripe()} options={{ clientSecret }}>
                    <CheckoutForm artwork={artwork} onSuccess={onSuccess} onClose={onClose} />
                </Elements>
            </div>
        </div>
    );
}