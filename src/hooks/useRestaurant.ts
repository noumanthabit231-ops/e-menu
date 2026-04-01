
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Restaurant, Category, MenuItem } from '../types/database';

export function useRestaurant(slug: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      
      setLoading(true);
      
      // Get restaurant
      const { data: restData } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (restData) {
        setRestaurant(restData);
        
        // Get categories
        const { data: catsData } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restData.id)
          .order('sort_order', { ascending: true });
          
        setCategories(catsData || []);
        
        // Get items
        const { data: itemsData } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', (catsData || []).map(c => c.id));
          
        setItems(itemsData || []);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [slug]);

  return { restaurant, categories, items, loading };
}
