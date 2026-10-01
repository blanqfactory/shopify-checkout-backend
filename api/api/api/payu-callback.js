export default async function handler(req, res) {
  const data = req.body;

  if (data && data.status === 'success') {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || 'wxitt0-hn.myshopify.com';
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

    const orderPayload = {
      order: {
        line_items: [{ title: data.productinfo, price: data.amount, quantity: 1 }],
        customer: { first_name: data.firstname, email: data.email, phone: data.phone },
        shipping_address: { first_name: data.firstname, address1: data.udf1, phone: data.phone },
        financial_status: "paid",
        note: `Courier Selected: ${data.udf2} | Txn ID: ${data.txnid}`,
        send_receipt: true,
        send_fulfillment_receipt: true
      }
    };

    try {
      if (accessToken) {
        await fetch(`https://${shopDomain}/admin/api/2024-01/orders.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken
          },
          body: JSON.stringify(orderPayload)
        });
      }
    } catch (e) {
      console.error("Shopify Order Create Error:", e);
    }

    return res.redirect(`https://${shopDomain}/pages/order-success?txnid=${data.txnid}`);
  } else {
    return res.redirect(`https://${process.env.SHOPIFY_STORE_DOMAIN || 'wxitt0-hn.myshopify.com'}/pages/order-failed`);
  }
}
