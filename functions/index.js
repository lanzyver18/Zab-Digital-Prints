const functions = require("firebase-functions");

// Insert your REGENERATED Secret Key here. Do NOT use the compromised key.
const PAYMONGO_SECRET_KEY = "sk_live_eHD4uoXiVt7N6mfqHik8oxXy"; 

exports.createPaymongoCheckout = functions.https.onCall(async (data, context) => {
    const { amount, description, customerName, customerEmail, customerPhone } = data;

    const payload = {
        data: {
            attributes: {
                amount: parseInt(amount * 100), // PayMongo requires centavos (e.g., 10000 = ₱100.00)
                description: description,
                remarks: "Zab Digital Prints Order"
            }
        }
    };

    try {
        const response = await fetch('https://api.paymongo.com/v1/links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`
            },
            body: JSON.stringify(payload)
        });

        const jsonResponse = await response.json();

        if (!response.ok) {
            console.error("PayMongo Error:", jsonResponse);
            throw new functions.https.HttpsError('internal', 'PayMongo API Error');
        }
        
        return { 
            checkoutUrl: jsonResponse.data.attributes.checkout_url,
            referenceNumber: jsonResponse.data.attributes.reference_number
        };

    } catch (error) {
        console.error(error);
        throw new functions.https.HttpsError('internal', 'Unable to create PayMongo link.');
    }
});
