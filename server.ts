import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize Supabase Client for backend
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy if you are behind a load balancer (like Render)
  app.set('trust proxy', 1);

  app.use(express.json());

  // --- Rate Limiters ---
  const orderLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Too many order requests from this IP, please try again later.' }
  });

  const otpRequestLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 OTP requests per 10 minutes
    message: { error: 'Too many OTP requests from this IP, please try again after 10 minutes.' }
  });

  const otpVerifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 verification attempts per 10 minutes
    message: { error: 'Too many verification attempts, please try again later.' }
  });

  // Cashfree Create Order API
  app.post('/api/create-order', orderLimiter, async (req, res) => {
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
  app.post('/api/send-otp', otpRequestLimiter, async (req, res) => {
    try {
      const { phone } = req.body;
      const apiKey = process.env.FAST2SMS_API_KEY;

      // Generate a random 6-digit OTP on the backend
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 600000).toISOString(); // 10 minutes from now
      
      // Store OTP in Supabase
      const { error: dbError } = await supabase
        .from('otp_verifications')
        .insert([{ phone, otp: generatedOtp, expires_at: expiresAt }]);

      if (dbError) {
        console.error('Error saving OTP to Supabase:', dbError);
        return res.status(500).json({ error: 'Failed to generate OTP. Please ensure the otp_verifications table exists.' });
      }

      if (!apiKey) {
        console.warn('Fast2SMS API key is missing. Check your environment variables.');
        console.log('\n=========================================');
        console.log(`[DEV MODE] OTP for ${phone} is: ${generatedOtp}`);
        console.log('=========================================\n');
        return res.json({ success: true, message: 'DEV MODE: OTP logged to backend console' });
      }

      // Fast2SMS expects a 10-digit number without country code
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);

      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: generatedOtp,
          numbers: cleanPhone,
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('Fast2SMS API returned non-JSON response:', responseText);
        console.warn('Fast2SMS API failed. Falling back to DEV MODE.');
        console.log('\n=========================================');
        console.log(`[DEV MODE] OTP for ${phone} is: ${generatedOtp}`);
        console.log('=========================================\n');
        return res.json({ 
          success: true, 
          message: 'DEV MODE: OTP logged to backend console', 
          warning: 'Failed to parse Fast2SMS response' 
        });
      }
      
      if (!response.ok || !data.return) {
        console.warn('Fast2SMS API returned an error:', data.message || data);
        // Fallback to dev mode so the user isn't blocked by Fast2SMS account restrictions
        console.warn('Fast2SMS API failed. Falling back to DEV MODE.');
        console.log('\n=========================================');
        console.log(`[DEV MODE] OTP for ${phone} is: ${generatedOtp}`);
        console.log('=========================================\n');
        return res.json({ 
          success: true, 
          message: 'DEV MODE: OTP logged to backend console', 
          warning: data.message || 'Failed to send OTP via Fast2SMS' 
        });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Server error sending OTP:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Verify OTP API
  app.post('/api/verify-otp', otpVerifyLimiter, async (req, res) => {
    try {
      const { phone, otp } = req.body;
      
      // Fetch valid OTPs for this phone from Supabase
      const { data: validOtps, error: fetchError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone', phone)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching OTPs:', fetchError);
        return res.status(500).json({ error: 'Database error verifying OTP' });
      }

      if (!validOtps || validOtps.length === 0) {
        // Clean up expired OTPs for this phone
        await supabase.from('otp_verifications').delete().eq('phone', phone).lte('expires_at', new Date().toISOString());
        return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
      }

      // Check if the provided OTP matches any of the valid ones
      const matchedOtp = validOtps.find(o => o.otp === otp);

      if (!matchedOtp) {
        return res.status(400).json({ error: 'Invalid OTP' });
      }

      // OTP is valid, remove all OTPs for this phone so they can't be reused
      await supabase.from('otp_verifications').delete().eq('phone', phone);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Server error verifying OTP:', error);
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
