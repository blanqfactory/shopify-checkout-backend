export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { pincode } = req.query;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({ error: "Invalid Pincode" });
  }

  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      })
    });
    const authData = await authRes.json();
    const token = authData.token;

    const rateRes = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110001&delivery_postcode=${pincode}&weight=0.5&cod=0`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const rateData = await rateRes.json();

    if (rateData.status === 200 && rateData.data && rateData.data.available_courier_companies) {
      const couriers = rateData.data.available_courier_companies.map(c => ({
        courier_id: c.courier_company_id,
        courier_name: c.courier_name,
        rate: c.rate,
        etd: c.etd
      }));
      return res.status(200).json({ couriers });
    } else {
      return res.status(200).json({
        couriers: [
          { courier_id: 1, courier_name: "Delhivery Surface", rate: 90, etd: "3-5 Days" },
          { courier_id: 2, courier_name: "Bluedart Express", rate: 140, etd: "1-2 Days" }
        ]
      });
    }
  } catch (err) {
    return res.status(200).json({
      couriers: [
        { courier_id: 1, courier_name: "Standard Delivery", rate: 90, etd: "3-5 Days" },
        { courier_id: 2, courier_name: "Express Delivery", rate: 140, etd: "1-2 Days" }
      ]
    });
  }
}
