"use client";

import { useState } from 'react';

interface PaymentFormProps {
    orderId?: string;
    amount?: number;
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    onCancel?: () => void;
}

export default function MomoPaymentForm({
    orderId = '',
    amount = 0,
    onSuccess,
    onError,
    onCancel
}: PaymentFormProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentAmount, setPaymentAmount] = useState(amount.toString());
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        type: 'success' | 'error' | 'info' | null;
        message: string;
    }>({ type: null, message: '' });

    
    const testNumbers = [
        { number: '46733123450', label: ' Success' },
        { number: '46733123451', label: ' Reject' },
        { number: '46733123452', label: '⏱️ Expire' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: 'info', message: 'Initiating payment...' });

        try {
            const response = await fetch('/api/momo/request-pay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: paymentAmount,
                    phoneNumber: phoneNumber,
                    orderId: orderId || `ORDER-${Date.now()}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Payment failed');
            }

            setStatus({
                type: 'success',
                message: 'Payment request sent! Please check your phone to complete the payment.',
            });

            if (onSuccess) {
                onSuccess(data);
            }

        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.message || 'An error occurred',
            });

            if (onError) {
                onError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">MTN Mobile Money Payment</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        MTN Mobile Money Number
                    </label>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="46733123450"
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2">
                            <p className="text-xs text-gray-600 mb-1">Test numbers (sandbox):</p>
                            <div className="flex flex-wrap gap-2">
                                {testNumbers.map((test) => (
                                    <button
                                        key={test.number}
                                        type="button"
                                        onClick={() => setPhoneNumber(test.number)}
                                        className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                                    >
                                        {test.label}: {test.number}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount (EUR)
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                    />
                </div>

                {orderId && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        Order ID: <span className="font-mono">{orderId}</span>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-yellow-500 text-white p-3 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : 'Pay with MoMo'}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {status.type && (
                <div className={`mt-4 p-3 rounded ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' :
                        status.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                    <div className="flex items-start">
                        {status.type === 'success' && <span className="mr-2"></span>}
                        {status.type === 'error' && <span className="mr-2"></span>}
                        {status.type === 'info' && <span className="mr-2">ℹ️</span>}
                        <span>{status.message}</span>
                    </div>
                </div>
            )}

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-3 bg-gray-50 rounded text-xs">
                    <p className="font-semibold mb-2 text-gray-700"> Sandbox Testing Guide:</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-600">
                        <li><span className="font-mono">46733123450</span> →  Successful payment</li>
                        <li><span className="font-mono">46733123451</span> →  Payment rejected</li>
                        <li><span className="font-mono">46733123452</span> → ⏱️ Payment expires</li>
                        <li>Amount in EUR (sandbox currency)</li>
                        <li>Check your webhook.site for callbacks</li>
                    </ul>
                </div>
            )}
        </div>
    );
}