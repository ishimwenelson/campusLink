import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { amount, phoneNumber, orderId } = await request.json();

        
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/momo/token`, {
            method: 'POST',
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const transactionUuid = uuidv4();
        const externalId = orderId || `ORDER-${Date.now()}`;

        
        const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

        
        const testPhone = formattedPhone.startsWith('467') ? formattedPhone : `467${formattedPhone}`;

        
        const requestBody = {
            amount: amount.toString(),
            currency: 'EUR',  
            externalId: externalId,
            payer: {
                partyIdType: 'MSISDN',
                partyId: testPhone  
            },
            payerMessage: `Payment for order ${externalId}`,
            payeeNote: 'Thank you for your purchase'
        };

        console.log('Sending request to MTN:', JSON.stringify(requestBody, null, 2));

        const momoResponse = await fetch(
            `${process.env.MOMO_BASE_URL}/collection/v1_0/requesttopay`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Reference-Id': transactionUuid,
                    'X-Target-Environment': 'sandbox',  
                    'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
                    'X-Callback-Url': `https://${process.env.MOMO_CALLBACK_HOST}/api/momo/callback`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        
        const responseText = await momoResponse.text();
        console.log('Response Status:', momoResponse.status);
        console.log('Response Headers:', Object.fromEntries(momoResponse.headers));
        console.log('Response Body:', responseText);

        if (momoResponse.status === 202) {
            return NextResponse.json({
                success: true,
                transactionId: transactionUuid,
                externalId: externalId,
            });
        } else {
            
            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch {
                errorData = responseText || 'Empty response';
            }

            return NextResponse.json(
                { error: `MTN API Error: ${momoResponse.status}`, details: errorData },
                { status: momoResponse.status }
            );
        }

    } catch (error: any) {
        console.error('Request to pay error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}