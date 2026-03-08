export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  badge?: string;
  options?: string[]; // e.g., "Extra Spicy", "Buttered"
}

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Truffle Parmesan Fries',
    description: 'Crispy skin-on fries tossed in truffle oil, topped with aged parmesan and fresh parsley.',
    price: 450,
    category: 'Starters & Small Plates',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYx6OuMaKaxQa2PAcK0_1Q7nKYD2AD_ntG_p6FmxAWCM99Zt-Z4O5jeRIn7icylxOIMXgVwDmiCW4AUBBBiTfpUbktJiV1CiptMQ4o4pbKtvMFCgk_V6frzHS3IWtO_UHbaC3sVkdlhJK7dteB5BQad3iqS2WYXQYLDeuTU26QmLQ2CSnvi76yNv4tAHP3Kp_2dBZIpL2BsXo4CwGM_u1isIxooWtZIfPpItLL29lX8F6pqJq6M6rhnW4JEGs95GTrqNktFamuGrs_',
  },
  {
    id: '2',
    name: 'Wagyu Slider',
    description: 'Premium Wagyu beef, caramelized onions, Gruyère cheese, and our signature saffron aioli.',
    price: 890,
    category: 'Starters & Small Plates',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCY3IGzVh5pizxyEEFaS0Z3FiOXV9zva2_khkGuBe-csl-XcUgEiOWzrckWEOnUE8m3yVv-Ywrh5FKD6TJaGpdRpv4AwLf-AqDFv4ZAJVf0BsUk0dGe8G5kMWUaWqyt1rKL2MwncRlJA878Xruc9hU-sFwAE2gj_Q3cF2mENU8T8ewmHlT9OvJEE3SFlKFJbaVU1VgefE_zAIw6CwLAwmHH4SK483oAn_4V-UjkLyEaUqoSXhyJaeRxlOGAiXw5ElMmwS-ao0b_0n3l',
  },
  {
    id: '3',
    name: 'Classic Chicken Tikka',
    description: 'Clay oven roasted chicken marinated in yogurt and a blend of Kashmiri spices.',
    price: 620,
    category: 'Starters & Small Plates',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKZsQfYGC5ftJowaftykX5x8fADekeucnG-d5aWb1ZxVKCzSyyimzsGjwjcnpNH1wbG5OCH5QW5hr-T3EnOq2b98eJTCmDtSUAzcpTTS69NER33TaVSeQNqDXYLpJpgXtbhM0s1PGf2-3ZnsScB8mSWp-KRdGjx9evdYIE57pCH5leBDPyAlFcJcOGOkywpEQrwuUtA-Nd3otRACsPL0yT31T-QYhB4qnwDHrU7WCv8rYOqDcY5b2keU_tFSJ7-6vYwp3yLR130blG',
  },
  {
    id: '4',
    name: 'Saffron Infused Biryani',
    description: 'Aromatic long-grain basmati rice cooked with slow-cooked lamb, exotic spices, and pure Kashmiri saffron.',
    price: 1250,
    category: 'Signature Mains',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnIYaop3MMG4nj7xE9xdMBA4dPa5lKfD3YyjPM9dWgQBkEDHO0iRkDIc36lYw_rIN3fj71rGdynZjLhjVZUtyo7ZvZemToGIM8_cNQIQonY1MgyCGn2PskL43HaQ3Yu0eqH3jsoINTSf-jhYEWO0UxgxT5Sh9HBV-Lqti31Eo2yPcPuQ7eKrkFOcmNJ3g55obD-lLnUR5EIwxgvWfTY417OVKPbOhYyMBUxC3QjiRaqxVO4__uouKxyezZCqNeeux5Ud4vUgeTdgRb',
  },
  {
    id: '5',
    name: 'Paneer Tikka Masala',
    description: 'Cottage cheese cubes in a rich, creamy tomato gravy.',
    price: 380,
    category: 'Signature Mains',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxFfY4-H8iImixd-fl6DNw7ColbtdHrPDyVpKAbkYSHTPf-LGeSQV6Qtf5lAQwpAGLnaC104uirEPLEwuPtMdTcr2TX9v4PFTonX1Eum8b60ri_q5wNUMZJ724wuW2QOT6hGR_8PLUlf-2cJIV21Bk-bo2Qo-Xz4FxYvePlLT2J8QbrE4T9se9B8J7hpnN_LvWMF2Q6d_IA8_R6t66CDiKc3LNO_qA2Z9SVwmNYYDF5v2GeGEEUqwOq7Fq7AWFo0b2Pk13qgvuWtZU',
  },
  {
    id: '6',
    name: 'Garlic Naan',
    description: 'Traditional Indian flatbread topped with garlic and butter.',
    price: 110,
    category: 'Breads',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApjK3irrAxDnOEl3BFs8n2k3LfZirK-u7r2xJ3WfkknkK314nV3T81y3RXVvp8YfwyKg1jYf1nDwNbNJawA-IkvWGIT5BCJeAw0hs7ufOcVafD2qRmcAQpE2HlNsLZgHQSMyDG5as3wxa22wFk4qmIzmsoJ4Y8aNu6pF7Fm-YC3i-aC9foglZ3RAB-ED5ljHlXWSXE7GEibtLqOk5HynL_cVD03_7U_5swy9c27gUI7suu7gqrZtC7x9cl_bvA86oo9a3wKzKEBrBW',
  },
  {
    id: '7',
    name: 'Classic Mango Lassi',
    description: 'Refreshing yogurt drink blended with sweet mangoes.',
    price: 150,
    category: 'Beverages',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCL5P-qNEDFIiBgLmGlrL7ShUhGKe7R8EI0sYk3kftjapxowAf-ZikFMEftQrqLAuR0KbQY5vS5YHhBWysDshp3TtyxUE01bsN4fkokcZe_Ufdf7Qp2tcoMQ-4HZCBQ5qNE4b-HGfb_zgwrplBfgLjIO5GCF89vh84e7c4k7Q2qVGgKmfhCLHFVTiYFOoQ1NRAte1DiamxdOZIMq83LtrcOiKCXyDVBjQmBU16fba19lsbEi4xQJKIiPy-ook4eg2dGi3tcU1nTiJ9r',
  }
];

export const categories = ['All Items', 'Starters & Small Plates', 'Signature Mains', 'Breads', 'Beverages'];
