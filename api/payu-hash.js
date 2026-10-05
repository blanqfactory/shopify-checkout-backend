const crypto = require('crypto');

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { txnid, amount, productinfo, firstname, email, phone } = req.body;

  const key = process.env.PAYU_KEY;
  const salt = process.env.PAYU_SALT;

  if (!key || !salt) {
    return res.status(500).json({ error: 'PayU credentials missing in environment variables' });
  }

  const udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "", udf6 = "", udf7 = "", udf8 = "", udf9 = "", udf10 = "";
  
  const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|${udf6}|${udf7}|${udf8}|${udf9}|${udf10}|${salt}`;
  
  const genHash = crypto.createHash('sha512').update(hashString).digest('hex');

  return res.status(200).json({
    hash: genHash,
    txnid: txnid,
    key: key
  });
};
