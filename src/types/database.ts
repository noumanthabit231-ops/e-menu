
export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  currency: string;
  address: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
}
