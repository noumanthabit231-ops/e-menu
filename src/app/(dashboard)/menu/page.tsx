'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Upload,
  Info,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Types for our data
interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
  menu_items: MenuItem[];
}

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  // Modal state for adding/editing items
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [showUrlHint, setShowUrlHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurantData, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (resError || !restaurantData) {
        setRestaurant(null);
        setLoading(false);
        return;
      }
      setRestaurant(restaurantData);

      const { data: categoriesData, error: catError } = await supabase
        .from('categories')
        .select('*, menu_items(*)')
        .eq('restaurant_id', restaurantData.id)
        .order('sort_order', { ascending: true });

      if (catError) throw catError;
      
      const sortedCategories = (categoriesData || []).map(cat => ({
        ...cat,
        menu_items: cat.menu_items?.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));
      
      setCategories(sortedCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `menu/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath);

      setEditingItem(prev => ({ ...prev!, image_url: publicUrl }));
    } catch (error: any) {
      alert('Ошибка при загрузке: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurant.id,
          name: newCategoryName,
          sort_order: categories.length
        });

      if (error) throw error;
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию и все ее блюда?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !selectedCategoryId) return;

    try {
      const itemData = {
        category_id: selectedCategoryId,
        name: editingItem.name,
        description: editingItem.description || '',
        price: Number(editingItem.price),
        image_url: editingItem.image_url || null,
        is_available: editingItem.is_available ?? true
      };

      let error;
      if (editingItem.id) {
        const { error: err } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('menu_items')
          .insert(itemData);
        error = err;
      }

      if (error) throw error;
      setIsItemModalOpen(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Удалить это блюдо?')) return;
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Загружаем ваше меню...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto mt-10">
        <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Начните с настроек</h2>
        <p className="text-slate-600 mb-8 text-lg">
          Чтобы создать меню, сначала укажите название и WhatsApp вашего заведения в настройках.
        </p>
        <Link 
          to="/settings"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-100"
        >
          Перейти в настройки
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Мое меню</h1>
          <p className="text-slate-500 mt-2 text-lg">Управляйте категориями и блюдами вашего заведения</p>
        </div>
        
        <form onSubmit={handleAddCategory} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Название категории..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 md:w-64 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
          />
          <button
            type="submit"
            disabled={isAddingCategory || !newCategoryName.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-100"
          >
            {isAddingCategory ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
          </button>
        </form>
      </div>

      <div className="grid gap-12">
        {categories.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 font-medium italic text-lg">Список категорий пуст. Создайте свою первую категорию!</p>
          </div>
        ) : (
          categories.map((category) => (
            <section key={category.id} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Категория
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{category.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setEditingItem({ name: '', description: '', price: 0, image_url: '', is_available: true });
                      setIsItemModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-all font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" /> Добавить блюдо
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {category.menu_items?.map((item) => (
                  <div key={item.id} className="group bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden flex gap-5">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100 relative group-hover:scale-105 transition-transform duration-500">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-200" />
                        </div>
                      )}
                      {!item.is_available && (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-tighter">
                          Нет в наличии
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.name}</h4>
                          <span className="font-black text-indigo-600 text-lg whitespace-nowrap">
                            {item.price} {restaurant.currency === 'KZT' ? '₸' : restaurant.currency === 'RUB' ? '₽' : '$'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      
                      <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setSelectedCategoryId(category.id);
                            setEditingItem(item);
                            setIsItemModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {(!category.menu_items || category.menu_items.length === 0) && (
                <div className="bg-slate-50 rounded-3xl py-10 text-center border border-dashed border-slate-200">
                  <p className="text-slate-400 italic text-sm">В этой категории еще нет блюд</p>
                </div>
              )}
            </section>
          ))
        )}
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-900">
                {editingItem?.id ? 'Редактировать блюдо' : 'Добавить новое блюдо'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-8 space-y-5 overflow-y-auto max-h-[80vh]">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Название блюда *</label>
                <input
                  type="text"
                  required
                  value={editingItem?.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                  placeholder="Например: Пицца Маргарита"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Цена *</label>
                  <input
                    type="number"
                    required
                    value={editingItem?.price || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Доступность</label>
                  <select
                    value={editingItem?.is_available ? 'true' : 'false'}
                    onChange={(e) => setEditingItem({ ...editingItem, is_available: e.target.value === 'true' })}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium"
                  >
                    <option value="true">В наличии</option>
                    <option value="false">Нет в наличии</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Описание</label>
                <textarea
                  value={editingItem?.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium min-h-[80px]"
                  placeholder="Состав, вес, особенности..."
                />
              </div>

              {/* Image Upload / URL Section */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700 ml-1">Фото блюда</label>
                    <div className="relative group">
                      <button 
                        type="button" 
                        onMouseEnter={() => setShowUrlHint(true)}
                        onMouseLeave={() => setShowUrlHint(false)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      {showUrlHint && (
                        <div className="absolute right-0 bottom-6 w-64 p-4 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                          <p className="font-bold mb-2 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Как вставить ссылку:</p>
                          <ol className="list-decimal list-inside space-y-1 opacity-90">
                            <li>Найдите фото в Google</li>
                            <li>Правой кнопкой мыши</li>
                            <li>«Копировать адрес изображения»</li>
                            <li>Вставьте ссылку в поле ниже</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Preview */}
                  {editingItem?.image_url && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 mb-3 group/preview">
                      <img src={editingItem.image_url} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setEditingItem({...editingItem, image_url: ''})}
                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-2xl transition-all font-bold group"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                          <span>Загрузить с ПК</span>
                        </>
                      )}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />

                    <div className="flex items-center gap-4 px-2">
                      <div className="flex-1 h-px bg-slate-100"></div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">ИЛИ ССЫЛКА</span>
                      <div className="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={editingItem?.image_url || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                        className="w-full pl-12 pr-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all font-medium text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-6 py-4 bg-indigo-600 disabled:opacity-50 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Сохранить
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
