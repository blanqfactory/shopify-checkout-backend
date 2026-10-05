const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();

// CORS configuration taaki Shopify se request allow ho
app.use(cors({
  origin: [
    'https://blanqfactory.com', 
    'https://www.blanqfactory.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route check karne ke liye ki server zinda hai ya nahi
app.get('/', (req, res) => {
  res.send('PayU Backend API is running successfully!');
});

// PayU Hash Generation Route
app.post('/api/payu-hash', (req, res) => {
  const { txnid, amount, productinfo, firstname, email, phone } = req.body;

  // Yeh credentials aapke Vercel environment variables se uthayega
  const key = process.env.PAYU_KEY || "YOUR_MERCHANT_KEY";
  const salt = process.env.PAYU_SALT || "YOUR_MERCHANT_SALT";

  if (!txnid || !amount || !productinfo || !firstname || !email) {
    return res.status(400).json({ error: 'Mandatory fields are missing' });
  }

  // PayU hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
  const udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "";
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
  
  const genHash = crypto.hash ? crypto.hash('sha512', hashString) : crypto.createHash('sha512').update(hashString).digest('hex');

  res.json({
    key: key,
    txnid: txnid,
    hash: genHash
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
