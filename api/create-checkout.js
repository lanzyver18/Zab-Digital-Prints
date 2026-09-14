export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { items, customerName, customerEmail, customerPhone, address, orderID } = req.body;
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) return res.status(500).json({ error: 'PAYMONGO_SECRET_KEY missing in Vercel.' });

    try {
        const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

        // Map your cart items to PayMongo's exact required format
        const lineItems = items.map(item => ({
            currency: 'PHP',
            amount: Math.round(Number(item.price) * 100), // Convert to centavos
            name: `${item.name} (${item.variant})`,
            quantity: parseInt(item.qty)
        }));

        const payload = {
            data: {
                attributes: {
                    billing: {
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        address: { line1: address }
                    },
                    send_email_receipt: true,
                    show_description: true,
                    show_line_items: true,
                    line_items: lineItems,
                    payment_method_types: ['gcash', 'paymaya', 'card', 'dob'],
                    description: `Order ${orderID} - Zab Digital Prints`
                }
            }
        };

        const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('PayMongo API Error:', data);
            return res.status(response.status).json({ error: data.errors?.[0]?.detail || 'Failed to create checkout' });
        }

        // Return the secure checkout URL
        return res.status(200).json({
            checkoutUrl: data.data.attributes.checkout_url
        });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
