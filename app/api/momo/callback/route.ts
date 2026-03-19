import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const callbackData = await request.json();

        console.log('Received MoMo callback:', callbackData);

        // Extract transaction details
        const {
            amount,
            currency,
            externalId,
            financialTransactionId,
            status,
            payer,
        } = callbackData;

        // Update your database based on status
        switch (status) {
            case 'SUCCESSFUL':
                console.log(`Payment successful for order ${externalId}`);
                // await updateOrderStatus(externalId, 'PAID', financialTransactionId);
                break;
            case 'FAILED':
                console.log(`Payment failed for order ${externalId}`);
                // await updateOrderStatus(externalId, 'FAILED');
                break;
            case 'PENDING':
                console.log(`Payment pending for order ${externalId}`);
                break;
            default:
                console.log(`Unknown status ${status} for order ${externalId}`);
        }

        // Always return 200 OK to MTN
        return new NextResponse('OK', { status: 200 });

    } catch (error: any) {
        console.error('Callback error:', error);
        // Still return 200 to prevent MTN from retrying indefinitely
        return new NextResponse('OK', { status: 200 });
    }
}