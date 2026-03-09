-- Supabase Schema for Restaurant POS

-- 1. Users Table (Custom authentication via phone)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,
  options TEXT[],
  is_veg BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  table_number TEXT,
  order_number TEXT,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, preparing, served, completed, cancelled
  payment_method TEXT, -- upi, cash
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_time NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample menu data
INSERT INTO menu_items (name, description, price, category, image_url, is_veg) VALUES
('Truffle Parmesan Fries', 'Crispy skin-on fries tossed in truffle oil, topped with aged parmesan and fresh parsley.', 450, 'Starters & Small Plates', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYx6OuMaKaxQa2PAcK0_1Q7nKYD2AD_ntG_p6FmxAWCM99Zt-Z4O5jeRIn7icylxOIMXgVwDmiCW4AUBBBiTfpUbktJiV1CiptMQ4o4pbKtvMFCgk_V6frzHS3IWtO_UHbaC3sVkdlhJK7dteB5BQad3iqS2WYXQYLDeuTU26QmLQ2CSnvi76yNv4tAHP3Kp_2dBZIpL2BsXo4CwGM_u1isIxooWtZIfPpItLL29lX8F6pqJq6M6rhnW4JEGs95GTrqNktFamuGrs_', true),
('Wagyu Slider', 'Premium Wagyu beef, caramelized onions, Gruyère cheese, and our signature saffron aioli.', 890, 'Starters & Small Plates', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY3IGzVh5pizxyEEFaS0Z3FiOXV9zva2_khkGuBe-csl-XcUgEiOWzrckWEOnUE8m3yVv-Ywrh5FKD6TJaGpdRpv4AwLf-AqDFv4ZAJVf0BsUk0dGe8G5kMWUaWqyt1rKL2MwncRlJA878Xruc9hU-sFwAE2gj_Q3cF2mENU8T8ewmHlT9OvJEE3SFlKFJbaVU1VgefE_zAIw6CwLAwmHH4SK483oAn_4V-UjkLyEaUqoSXhyJaeRxlOGAiXw5ElMmwS-ao0b_0n3l', false),
('Classic Chicken Tikka', 'Clay oven roasted chicken marinated in yogurt and a blend of Kashmiri spices.', 620, 'Starters & Small Plates', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKZsQfYGC5ftJowaftykX5x8fADekeucnG-d5aWb1ZxVKCzSyyimzsGjwjcnpNH1wbG5OCH5QW5hr-T3EnOq2b98eJTCmDtSUAzcpTTS69NER33TaVSeQNqDXYLpJpgXtbhM0s1PGf2-3ZnsScB8mSWp-KRdGjx9evdYIE57pCH5leBDPyAlFcJcOGOkywpEQrwuUtA-Nd3otRACsPL0yT31T-QYhB4qnwDHrU7WCv8rYOqDcY5b2keU_tFSJ7-6vYwp3yLR130blG', false),
('Saffron Infused Biryani', 'Aromatic long-grain basmati rice cooked with slow-cooked lamb, exotic spices, and pure Kashmiri saffron.', 1250, 'Signature Mains', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnIYaop3MMG4nj7xE9xdMBA4dPa5lKfD3YyjPM9dWgQBkEDHO0iRkDIc36lYw_rIN3fj71rGdynZjLhjVZUtyo7ZvZemToGIM8_cNQIQonY1MgyCGn2PskL43HaQ3Yu0eqH3jsoINTSf-jhYEWO0UxgxT5Sh9HBV-Lqti31Eo2yPcPuQ7eKrkFOcmNJ3g55obD-lLnUR5EIwxgvWfTY417OVKPbOhYyMBUxC3QjiRaqxVO4__uouKxyezZCqNeeux5Ud4vUgeTdgRb', false),
('Paneer Tikka Masala', 'Cottage cheese cubes in a rich, creamy tomato gravy.', 380, 'Signature Mains', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxFfY4-H8iImixd-fl6DNw7ColbtdHrPDyVpKAbkYSHTPf-LGeSQV6Qtf5lAQwpAGLnaC104uirEPLEwuPtMdTcr2TX9v4PFTonX1Eum8b60ri_q5wNUMZJ724wuW2QOT6hGR_8PLUlf-2cJIV21Bk-bo2Qo-Xz4FxYvePlLT2J8QbrE4T9se9B8J7hpnN_LvWMF2Q6d_IA8_R6t66CDiKc3LNO_qA2Z9SVwmNYYDF5v2GeGEEUqwOq7Fq7AWFo0b2Pk13qgvuWtZU', true),
('Garlic Naan', 'Traditional Indian flatbread topped with garlic and butter.', 110, 'Breads', 'https://lh3.googleusercontent.com/aida-public/AB6AXuApjK3irrAxDnOEl3BFs8n2k3LfZirK-u7r2xJ3WfkknkK314nV3T81y3RXVvp8YfwyKg1jYf1nDwNbNJawA-IkvWGIT5BCJeAw0hs7ufOcVafD2qRmcAQpE2HlNsLZgHQSMyDG5as3wxa22wFk4qmIzmsoJ4Y8aNu6pF7Fm-YC3i-aC9foglZ3RAB-ED5ljHlXWSXE7GEibtLqOk5HynL_cVD03_7U_5swy9c27gUI7suu7gqrZtC7x9cl_bvA86oo9a3wKzKEBrBW', true),
('Classic Mango Lassi', 'Refreshing yogurt drink blended with sweet mangoes.', 150, 'Beverages', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL5P-qNEDFIiBgLmGlrL7ShUhGKe7R8EI0sYk3kftjapxowAf-ZikFMEftQrqLAuR0KbQY5vS5YHhBWysDshp3TtyxUE01bsN4fkokcZe_Ufdf7Qp2tcoMQ-4HZCBQ5qNE4b-HGfb_zgwrplBfgLjIO5GCF89vh84e7c4k7Q2qVGgKmfhCLHFVTiYFOoQ1NRAte1DiamxdOZIMq83LtrcOiKCXyDVBjQmBU16fba19lsbEi4xQJKIiPy-ook4eg2dGi3tcU1nTiJ9r', true)
ON CONFLICT DO NOTHING;
