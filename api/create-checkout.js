export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { amount, description, remarks } = req.body;
    
    // This securely grabs the key you placed in Vercel Settings
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
        return res.status(500).json({ error: 'PAYMONGO_SECRET_KEY is missing in Vercel.' });
    }

    try {
        const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

        const response = await fetch('https://api.paymongo.com/v1/links', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        amount: Math.round(Number(amount) * 100), // PayMongo requires centavos
                        description: description || 'Zab Digital Prints Order',
                        remarks: remarks || ''
                    }
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PayMongo API Error:', data);
            return res.status(response.status).json({ 
                error: data.errors?.[0]?.detail || 'Failed to create payment link' 
            });
        }

        return res.status(200).json({
            checkoutUrl: data.data.attributes.checkout_url,
            referenceNumber: data.data.attributes.reference_number
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: error.message });
    }
}
