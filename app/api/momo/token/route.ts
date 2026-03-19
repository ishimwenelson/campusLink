import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const subscriptionKey = process.env.MOMO_SUBSCRIPTION_KEY;
        const base64Auth = process.env.MOMO_BASE64_AUTH;

        if (!subscriptionKey || !base64Auth) {
            return NextResponse.json(
                { error: 'Missing Momo credentials' },
                { status: 500 }
            );
        }

        console.log('Requesting token with:', {
            url: `${process.env.MOMO_BASE_URL}/collection/token/`,
            hasAuth: !!base64Auth,
            hasKey: !!subscriptionKey
        });

        const response = await fetch(
            `${process.env.MOMO_BASE_URL}/collection/token/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${base64Auth}`,
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                    'Content-Type': 'application/json',
                },
                body: '{}', // Must be empty JSON object
            }
        );

        const responseText = await response.text();
        console.log('Token response status:', response.status);
        console.log('Token response body:', responseText);

        // Check for HTML rejection
        if (responseText.includes('<html>')) {
            return NextResponse.json(
                { error: 'Token request rejected by MTN gateway', details: responseText },
                { status: 400 }
            );
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(`Invalid JSON response: ${responseText}`);
        }

        if (!response.ok) {
            throw new Error(data.error || `Token request failed: ${response.status}`);
        }

        return NextResponse.json({
            access_token: data.access_token,
            expires_in: data.expires_in
        });

    } catch (error: any) {
        console.error('Token error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get token' },
            { status: 500 }
        );
    }
}