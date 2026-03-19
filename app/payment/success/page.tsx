"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transactionId');
    const externalId = searchParams.get('externalId');

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Initiated!</h1>
                    <p className="text-gray-600 mb-6">
                        Please check your phone to complete the payment via USSD prompt.
                    </p>

                    <div className="bg-gray-50 p-4 rounded mb-6 text-left">
                        <p className="text-sm text-gray-600">Transaction ID:</p>
                        <p className="font-mono text-sm break-all">{transactionId}</p>
                        <p className="text-sm text-gray-600 mt-2">Order ID:</p>
                        <p className="font-mono text-sm">{externalId}</p>
                    </div>

                    <Link
                        href="/"
                        className="inline-block bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-md">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
                    </div>
                </div>
            </div>
        }>
            <PaymentSuccessContent />
        </Suspense>
    );
}