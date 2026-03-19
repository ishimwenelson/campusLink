import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const { amount, phoneNumber, orderId } = await request.json();

        // Get access token (your existing code)
        const tokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/momo/token`, {
            method: 'POST',
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        const transactionUuid = uuidv4();
        const externalId = orderId || `ORDER-${Date.now()}`;

        // IMPORTANT: Format phone number correctly (remove any + or spaces)
        const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

        // For sandbox, use the test number format
        const testPhone = formattedPhone.startsWith('467') ? formattedPhone : `467${formattedPhone}`;

        // CRITICAL: The request body must match EXACTLY this format
        const requestBody = {
            amount: amount.toString(),
            currency: 'EUR',  // Sandbox uses EUR
            externalId: externalId,
            payer: {
                partyIdType: 'MSISDN',
                partyId: testPhone  // e.g., "46733123450"
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
                    'X-Target-Environment': 'sandbox',  // Hardcode for testing
                    'Ocp-Apim-Subscription-Key': process.env.MOMO_SUBSCRIPTION_KEY!,
                    'X-Callback-Url': `https://${process.env.MOMO_CALLBACK_HOST}/api/momo/callback`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        // Log the raw response for debugging
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
            // Try to parse error
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