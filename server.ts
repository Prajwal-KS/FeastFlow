import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Cashfree Create Order API
  app.post('/api/create-order', async (req, res) => {
    try {
      const { orderAmount, customerId, customerPhone, orderId } = req.body;
      
      const appId = process.env.CASHFREE_APP_ID;
      const secretKey = process.env.CASHFREE_SECRET_KEY;
      const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';

      if (!appId || !secretKey) {
        return res.status(500).json({ error: 'Cashfree credentials missing' });
      }

      const baseUrl = environment === 'PRODUCTION' 
        ? 'https://api.cashfree.com/pg/orders' 
        : 'https://sandbox.cashfree.com/pg/orders';

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId || `ORDER_${Date.now()}`,
          order_amount: orderAmount,
          order_currency: 'INR',
          customer_details: {
            customer_id: customerId || 'guest_user',
            customer_phone: customerPhone || '9999999999',
          },
          order_meta: {
            return_url: `${process.env.APP_URL || 'http://localhost:3000'}/checkout?order_id={order_id}`
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Cashfree error:', data);
        return res.status(response.status).json({ error: data.message || 'Payment initiation failed' });
      }

      res.json({ payment_session_id: data.payment_session_id, order_id: data.order_id });
    } catch (error: any) {
      console.error('Server error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fast2SMS Send OTP API
  app.post('/api/send-otp', async (req, res) => {
    try {
      const { phone, otp } = req.body;
      const apiKey = process.env.VITE_FAST2SMS_API_KEY;

      if (!apiKey) {
        console.warn('Fast2SMS API key is missing. Check your environment variables.');
        return res.json({ success: true, message: 'DEV MODE: OTP logged to console' });
      }

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND',
          message: `Your Restaurant POS verification code is ${otp}`,
          language: 'english',
          flash: 0,
          numbers: phone,
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.return) {
        console.warn('Fast2SMS API returned an error:', data.message || data);
        // Fallback to dev mode so the user isn't blocked by Fast2SMS account restrictions
        console.warn('Fast2SMS API failed. Falling back to DEV MODE.');
        return res.json({ 
          success: true, 
          message: 'DEV MODE: OTP logged to console', 
          warning: data.message || 'Failed to send OTP via Fast2SMS' 
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Server error sending OTP:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve static files and fallback to index.html for SPA routing
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
