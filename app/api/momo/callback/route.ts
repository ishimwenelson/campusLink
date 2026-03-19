import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const callbackData = await request.json();

        console.log('Received MoMo callback:', callbackData);

        
        const {
            amount,
            currency,
            externalId,
            financialTransactionId,
            status,
            payer,
        } = callbackData;

        
        switch (status) {
            case 'SUCCESSFUL':
                console.log(`Payment successful for order ${externalId}`);
                
                break;
            case 'FAILED':
                console.log(`Payment failed for order ${externalId}`);
                
                break;
            case 'PENDING':
                console.log(`Payment pending for order ${externalId}`);
                break;
            default:
                console.log(`Unknown status ${status} for order ${externalId}`);
        }

        
        return new NextResponse('OK', { status: 200 });

    } catch (error: any) {
        console.error('Callback error:', error);
        
        return new NextResponse('OK', { status: 200 });
    }
}