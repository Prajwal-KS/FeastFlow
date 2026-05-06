# Modern Restaurant POS & Customer Ordering Platform

A full-stack, responsive web application built to handle customer self-ordering, real-time order tracking, and restaurant menu management. The platform features an integrated Express backend for secure payment and OTP handling, while utilizing Supabase for real-time database updates and authentication.

## 🚀 Features

*   **Customer Self-Ordering**: Intuitive layout with category filters and cart management. 
*   **Dine-In vs Takeaway**: Supports both modes automatically applying a configurable packaging charge for takeaway orders.
*   **OTP Authentication**: Quick and secure login via phone number using the Fast2SMS API.
*   **Real-time Order Tracking**: Live order status updates (Pending -> Preparing -> Ready -> Served/Completed).
*   **Dynamic Order Queuing**: 
    *   Cash orders generate a temporary tracking ID (`T-XXXX`) until confirmed by the admin at the counter.
    *   Paid orders automatically generate sequential order numbers based on daily volume (e.g., `#0042`).
*   **Secure Payment Integration**: Gateway integration using Cashfree Payments.
*   **Rate Limiting**: Backend protected by `express-rate-limit` against OTP brute-forcing and API abuse.
*   **Real-time Settings**: Globally update restaurant behaviors (like enabling/disabling Table Service) without redeploying.

## 🛠️ Tech Stack

*   **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, React Router
*   **Backend**: Node.js, Express (serving Vite middleware locally, and static files in production)
*   **Database & Real-time**: Supabase (PostgreSQL)
*   **SMS Gateway**: Fast2SMS
*   **Payments**: Cashfree Payments

## 📦 Prerequisites

*   Node.js (v18+)
*   Supabase Account & Project
*   Fast2SMS Account (for OTP capabilities)
*   Cashfree Merchant Account

## ⚙️ Environment Variables

Create a `.env` file in the root of the project with the following keys:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cashfree Payments Configuration
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=SANDBOX # Use PRODUCTION for live

# SMS Gateway Configuration
FAST2SMS_API_KEY=your_fast2sms_api_key

# App config
APP_URL=http://localhost:3000
```

## 🏗️ Supabase Database Setup

To run this project, execute the following schemas in your Supabase SQL Editor:

```sql
-- 1. Menu Items Table
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image_url TEXT,
  category TEXT DEFAULT 'Uncategorized',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_menu_items_category ON menu_items(category); 

-- 2. Orders Table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  table_number TEXT,
  order_number TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, preparing, ready, completed, cancelled
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  order_type TEXT DEFAULT 'dine_in', -- dine_in, takeaway
  packaging_charge NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- 3. Order Items Table
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Restaurant Settings Table
CREATE TABLE restaurant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_table_service_enabled BOOLEAN DEFAULT true,
  packaging_charge NUMERIC DEFAULT 20,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO restaurant_settings (is_table_service_enabled, packaging_charge) VALUES (true, 20);

-- 5. OTP Verifications Table (For Backend Logic)
CREATE TABLE otp_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_otp_phone ON otp_verifications(phone);
```

## 🚀 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000` executing `server.ts` powered by Vite middleware.*

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Start the production server:**
   ```bash
   npm run start
   ```

## 💡 System Architecture Note

This project utilizes a **BFF (Backend-For-Frontend)** architecture where `server.ts` securely handles SMS OTP delivery, rate-limiting, and payment initiation without exposing critical third-party secrets to the browser. The frontend interacts directly with Supabase via Row Level Security (RLS) for retrieving menu items and fetching order status in real-time.

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
