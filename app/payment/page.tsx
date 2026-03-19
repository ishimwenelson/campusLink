"use client";  // This MUST be the very first line

import { useRouter } from 'next/navigation';
import MomoPaymentForm from '@/components/MomoPaymentForm';

// Define the type for the success data
interface PaymentSuccessData {
    transactionId: string;
    externalId: string;
    message?: string;
    status?: string;
}

export default function PaymentPage() {
    const router = useRouter();

    const handlePaymentSuccess = (data: PaymentSuccessData) => {
        console.log('✅ Payment initiated successfully:', data);

        // Redirect to success page with transaction details
        router.push(`/payment/success?transactionId=${data.transactionId}&externalId=${data.externalId}`);
    };

    const handlePaymentError = (error: string) => {
        console.error('❌ Payment error:', error);

        // You could also show a toast notification here
        // or update some state to display the error
    };

    const handlePaymentCancel = () => {
        console.log('💳 Payment cancelled by user');
        router.push('/payment/cancelled');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                {/* Page Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
                    <p className="text-gray-600 mt-2">Pay securely with MTN Mobile Money</p>
                </div>

                {/* Payment Form Component */}
                <MomoPaymentForm
                    orderId="ORDER-123"
                    amount={100}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                />

                {/* Security Badge */}
                <div className="text-center mt-6 text-sm text-gray-500">
                    <p>🔒 Secured by MTN MoMo API</p>
                    <p className="text-xs mt-1">You'll receive a USSD prompt on your phone to complete the payment</p>
                </div>
            </div>
        </div>
    );
}