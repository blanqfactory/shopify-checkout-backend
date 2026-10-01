import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { name, email, phone, productTitle, amount, address, selectedCourier } = req.body;

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;
    const txnid = 'ORD_' + Date.now();

    const hashString = `${key}|${txnid}|${amount}|${productTitle}|${name}|${email}|||||||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const host = req.headers.host;

    return res.status(200).json({
      payuUrl: 'https://secure.payu.in/_payment',
      params: {
        key,
        txnid,
        amount,
        productinfo: productTitle || "Order Payment",
        firstname: name,
        email,
        phone,
        surl: `https://${host}/api/payu-callback`,
        furl: `https://${host}/api/payu-callback`,
        hash,
        udf1: address || "No address",
        udf2: selectedCourier || "Standard Courier"
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
