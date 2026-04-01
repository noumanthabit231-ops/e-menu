'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Globe, 
  Phone, 
  MapPin, 
  Coins, 
  Save, 
  Loader2, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    whatsapp_number: '',
    address: '',
    currency: 'KZT',
  });

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setRestaurantId(data.id);
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          whatsapp_number: data.whatsapp_number || '',
          address: data.address || '',
          currency: data.currency || 'KZT',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    // Validation for slug (latin only, no spaces)
    if (!/^[a-zA-Z0-9-]+$/.test(formData.slug)) {
      setError('Slug должен содержать только латинские буквы, цифры и тире');
      setSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('restaurants')
        .upsert({
          ...(restaurantId ? { id: restaurantId } : {}),
          user_id: userId,
          ...formData,
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setRestaurantId(data.id);
      }
      
      setSuccess(true);

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Настройки заведения</h1>
        <p className="text-slate-500 mt-2">
          Настройте основную информацию о вашем ресторане для работы меню.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Название заведения
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="Напр: Coffee House"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" />
            Уникальная ссылка (slug)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              menu.qr/
            </span>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
              className="w-full pl-20 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="my-cafe"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Phone className="w-4 h-4 text-slate-400" />
            Номер WhatsApp
          </label>
          <input
            type="tel"
            required
            value={formData.whatsapp_number}
            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            placeholder="77071234567"
          />
          <p className="text-[11px] text-slate-400 italic">
            Введите номер в международном формате (только цифры)
          </p>
        </div>

        {/* Currency */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Coins className="w-4 h-4 text-slate-400" />
            Валюта
          </label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="KZT text-sm">KZT (₸)</option>
            <option value="RUB">RUB (₽)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        {/* Address */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Адрес заведения
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
            placeholder="г. Алматы, ул. Абая, 1..."
          />
        </div>

        <div className="md:col-span-2 flex justify-between items-center pt-4">
          {formData.slug && (
            <Link 
              to={`/${formData.slug}`} 
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Посмотреть меню: {formData.slug}
            </Link>
          )}
          
          <button
            type="submit"
            disabled={saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all
              ${success ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}
              disabled:opacity-70
            `}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Сохранено!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Сохранить настройки
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
