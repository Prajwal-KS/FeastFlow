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

