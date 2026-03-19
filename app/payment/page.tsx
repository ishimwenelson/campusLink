"use client";  

import { useRouter } from 'next/navigation';
import MomoPaymentForm from '@/components/MomoPaymentForm';


interface PaymentSuccessData {
    transactionId: string;
    externalId: string;
    message?: string;
    status?: string;
}

export default function PaymentPage() {
    const router = useRouter();

    const handlePaymentSuccess = (data: PaymentSuccessData) => {
        console.log(' Payment initiated successfully:', data);

        
        router.push(`/payment/success?transactionId=${data.transactionId}&externalId=${data.externalId}`);
    };

    const handlePaymentError = (error: string) => {
        console.error(' Payment error:', error);

        
        
    };

    const handlePaymentCancel = () => {
        console.log(' Payment cancelled by user');
        router.push('/payment/cancelled');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                {}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Complete Your Payment</h1>
                    <p className="text-gray-600 mt-2">Pay securely with MTN Mobile Money</p>
                </div>

                {}
                <MomoPaymentForm
                    orderId="ORDER-123"
                    amount={100}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                />

                {}
                <div className="text-center mt-6 text-sm text-gray-500">
                    <p> Secured by MTN MoMo API</p>
                    <p className="text-xs mt-1">You'll receive a USSD prompt on your phone to complete the payment</p>
                </div>
            </div>
        </div>
    );
}