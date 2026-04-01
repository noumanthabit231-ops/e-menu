'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  ChevronRight, 
  MapPin, 
  Phone, 
  X, 
  Send, 
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Restaurant {
  id: string;
  name: string;
  whatsapp_number: string;
  currency: string;
  address: string | null;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function PublicRestaurantMenu({ params }: { params: { restaurantSlug: string } }) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout form state
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Наличные');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch restaurant
        const { data: rest, error: restErr } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', params.restaurantSlug)
          .single();

        if (restErr || !rest) {
          setError('Заведение не найдено');
          setLoading(false);
          return;
        }
        setRestaurant(rest);

        // 2. Fetch categories
        const { data: cats, error: catsErr } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', rest.id)
          .order('sort_order', { ascending: true });

        if (catsErr) throw catsErr;
        setCategories(cats || []);

        // 3. Fetch menu items
        const { data: items, error: itemsErr } = await supabase
          .from('menu_items')
          .select('*')
          .in('category_id', (cats || []).map(c => c.id))
          .eq('is_available', true);

        if (itemsErr) throw itemsErr;
        setMenuItems(items || []);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.restaurantSlug]);

  const updateQuantity = (item: MenuItem, delta: number) => {
    setCart(prev => {
      const existing = prev[item.id];
      const newQty = (existing?.quantity || 0) + delta;
      
      if (newQty <= 0) {
        const { [item.id]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [item.id]: { ...item, quantity: newQty }
      };
    });
  };

  const totalItems = useMemo(() => 
    Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  , [cart]);

  const totalPrice = useMemo(() => 
    Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0)
  , [cart]);

  const formatWhatsAppMessage = () => {
    if (!restaurant) return '';
    
    let message = `🍽 *Новый заказ!* \n\n`;
    Object.values(cart).forEach(item => {
      message += `▪️ ${item.name} x${item.quantity} = ${item.price * item.quantity} ${restaurant.currency}\n`;
    });
    
    message += `\n💰 *Итого: ${totalPrice} ${restaurant.currency}*`;
    message += `\n\n📍 *Город:* ${city}`;
    message += `\n🏠 *Адрес:* ${address}`;
    message += `\n💳 *Оплата:* ${paymentMethod}`;
    
    return encodeURIComponent(message);
  };

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    
    const cleanPhone = restaurant.whatsapp_number.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${formatWhatsAppMessage()}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Упс! Ошибка</h1>
          <p className="text-slate-500 mb-6">{error || 'Заведение не найдено'}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
            {restaurant.name}
          </h1>
          {(restaurant.address || restaurant.whatsapp_number) && (
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              {restaurant.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  {restaurant.address}
                </div>
              )}
              {restaurant.whatsapp_number && (
                <div className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-4 h-4 text-green-500" />
                  {restaurant.whatsapp_number}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Category Nav */}
      <nav className="bg-white border-b border-slate-100 overflow-x-auto no-scrollbar sticky top-[89px] z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 flex gap-4 py-3 whitespace-nowrap">
          {categories.map(cat => (
            <a 
              key={cat.id} 
              href={`#cat-${cat.id}`}
              className="text-sm font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 mt-6">
        {categories.map(cat => {
          const catItems = menuItems.filter(item => item.category_id === cat.id);
          if (catItems.length === 0) return null;
          
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="mb-10 scroll-mt-36">
              <h2 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                {cat.name}
              </h2>
              <div className="space-y-4">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 hover:border-indigo-100 transition-colors">
                    {item.image_url && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-black text-indigo-600">
                          {item.price} {restaurant.currency}
                        </span>
                        
                        {cart[item.id] ? (
                          <div className="flex items-center gap-3 bg-indigo-50 px-2 py-1.5 rounded-xl border border-indigo-100">
                            <button 
                              onClick={() => updateQuantity(item, -1)}
                              className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-indigo-600 active:scale-95 transition-transform"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-indigo-900 w-4 text-center">
                              {cart[item.id].quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item, 1)}
                              className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-lg shadow-sm text-white active:scale-95 transition-transform"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => updateQuantity(item, 1)}
                            className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-100"
                          >
                            <Plus className="w-4 h-4" /> Добавить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Sticky Cart Footer */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-10"
          >
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-xl">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-black text-lg leading-tight">{totalItems} товаров</div>
                <div className="text-indigo-100 text-xs font-medium uppercase tracking-wider">Оформить заказ</div>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black text-xl">
              {totalPrice} {restaurant.currency}
              <ChevronRight className="w-6 h-6 opacity-70" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-20 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-indigo-600" />
                Ваш заказ
              </h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 bg-slate-50/50">
              {/* Cart List */}
              <div className="space-y-4 mb-8">
                {Object.values(cart).map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{item.quantity} x {item.price} {restaurant.currency}</div>
                    </div>
                    <div className="font-black text-slate-900">
                      {item.price * item.quantity} {restaurant.currency}
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Итого к оплате:</span>
                  <span className="text-2xl font-black text-indigo-600">{totalPrice} {restaurant.currency}</span>
                </div>
              </div>

              {/* Form */}
              <form id="order-form" onSubmit={handleSendOrder} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Город</label>
                  <input 
                    type="text" 
                    required 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Например: Алматы"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Адрес доставки</label>
                  <input 
                    type="text" 
                    required 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Улица, дом, кв/офис"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Способ оплаты</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none"
                  >
                    <option value="Наличные">Наличные</option>
                    <option value="Карта курьеру">Карта курьеру</option>
                    <option value="Перевод/Kaspi">Перевод/Kaspi</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <button 
                type="submit" 
                form="order-form"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100 text-lg active:scale-95"
              >
                <Send className="w-5 h-5" />
                Отправить в WhatsApp
              </button>
              <p className="text-center text-slate-400 text-xs mt-4 uppercase tracking-widest font-bold">
                Безопасная оплата через WhatsApp
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
