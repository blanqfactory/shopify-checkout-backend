const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Enable for Shopify
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 1. Shiprocket Pincode Check
app.get('/api/shiprocket-couriers', async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode) return res.status(400).json({ error: 'Pincode required' });

    const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    });
    const token = authRes.data.token;

    const courierRes = await axios.get(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${process.env.PICKUP_PINCODE}&delivery_postcode=${pincode}&weight=0.5&cod=0`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const available = (courierRes.data.data.available_courier_companies || []).map(c => ({
      courier_name: c.courier_name,
      rate: c.rate,
      etd: c.etd
    }));

    res.json({ couriers: available });
  } catch (err) {
    res.status(500).json({ error: 'Shiprocket error', details: err.message });
  }
});

// 2. PayU Payment Hash Generator
app.post('/api/payu-initiate', (req, res) => {
  try {
    const { name, email, phone, productTitle, qty, shippingRate, productPrice } = req.body;
    const txnid = "TXN_" + Date.now();
    
    const subtotal = (parseFloat(productPrice) || 0) * (parseInt(qty) || 1);
    const grandTotal = (subtotal + (parseFloat(shippingRate) || 0)) * 1.18; // 18% GST

    const payuKey = process.env.PAYU_KEY;
    const payuSalt = process.env.PAYU_SALT;

    const hashString = `${payuKey}|${txnid}|${grandTotal.toFixed(2)}|${productTitle}|${name}|${email}|||||||||||${payuSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    res.json({
      payuUrl: "https://secure.payu.in/_payment",
      params: {
        key: payuKey,
        txnid: txnid,
        amount: grandTotal.toFixed(2),
        productinfo: productTitle,
        firstname: name,
        email: email,
        phone: phone,
        surl: `${process.env.VERCEL_PROJECT_URL}/api/payu-callback`,
        furl: `${process.env.VERCEL_PROJECT_URL}/api/payu-callback`,
        hash: hash
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'PayU error', details: err.message });
  }
});

// 3. PayU Success Callback
app.post('/api/payu-callback', (req, res) => {
  const { status, txnid, payuMoneyId, amount } = req.body;
  const storeDomain = process.env.SHOPIFY_STORE_URL;
  
  if (status === 'success') {
    res.redirect(`${storeDomain}/pages/order-success?status=success&txnid=${txnid}&billing_id=${payuMoneyId}&amount=${amount}`);
  } else {
    res.redirect(`${storeDomain}/pages/order-success?status=failed`);
  }
});

module.exports = app;
