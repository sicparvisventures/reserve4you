'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  X, 
  Copy,
  Image as ImageIcon,
  Loader2,
  ChevronUp,
  ChevronDown,
  Star,
  UtensilsCrossed
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuManagerProps {
  locationId: string;
  locationName: string;
  tenantLocations?: { id: string; name: string }[];
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  dietary_info: string[];
  allergens: string[];
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
  prep_time_minutes: number | null;
  calories: number | null;
  spice_level: number | null;
}

export function MenuManager({ locationId, locationName, tenantLocations = [] }: MenuManagerProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [copyMenuDialogOpen, setCopyMenuDialogOpen] = useState(false);
  
  // Edit states
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [itemForm, setItemForm] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category_id: null,
    dietary_info: [],
    allergens: [],
    is_available: true,
    is_featured: false,
    prep_time_minutes: null,
    calories: null,
    spice_level: null,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [copyToLocationId, setCopyToLocationId] = useState('');

  useEffect(() => {
    loadMenu();
  }, [locationId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const [categoriesRes, itemsRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('location_id', locationId)
          .order('display_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('location_id', locationId)
          .order('display_order')
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (itemsRes.data) setItems(itemsRes.data);
    } catch (error) {
      console.error('Error loading menu:', error);
      alert('Fout bij laden van menu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('Categorie naam is verplicht');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update({
            name: categoryForm.name,
            description: categoryForm.description || null,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert({
            location_id: locationId,
            name: categoryForm.name,
            description: categoryForm.description || null,
            display_order: categories.length,
          });

        if (error) throw error;
      }

      await loadMenu();
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '' });
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Fout bij opslaan van categorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Weet je zeker dat je deze categorie wilt verwijderen?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      await loadMenu();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Fout bij verwijderen van categorie');
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      if (file.size > 5 * 1024 * 1024) {
        alert('Bestand is te groot. Maximaal 5MB toegestaan.');
        return;
      }

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      setItemForm(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Fout bij uploaden van afbeelding');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveItem = async () => {
    if (!itemForm.name?.trim()) {
      alert('Item naam is verplicht');
      return;
    }

    if (!itemForm.price || itemForm.price < 0) {
      alert('Prijs moet een positief getal zijn');
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      const itemData = {
        location_id: locationId,
        category_id: itemForm.category_id || null,
        name: itemForm.name,
        description: itemForm.description || null,
        price: itemForm.price,
        image_url: itemForm.image_url || null,
        dietary_info: itemForm.dietary_info || [],
        allergens: itemForm.allergens || [],
        is_available: itemForm.is_available ?? true,
        is_featured: itemForm.is_featured ?? false,
        prep_time_minutes: itemForm.prep_time_minutes || null,
        calories: itemForm.calories || null,
        spice_level: itemForm.spice_level || null,
        display_order: editingItem ? editingItem.display_order : items.length,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(itemData);

        if (error) throw error;
      }

      await loadMenu();
      setItemDialogOpen(false);
      setEditingItem(null);
      setItemForm({
        name: '',
        description: '',
        price: 0,
        category_id: null,
        dietary_info: [],
        allergens: [],
        is_available: true,
        is_featured: false,
      });
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Fout bij opslaan van item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await loadMenu();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Fout bij verwijderen van item');
    }
  };

  const handleCopyMenu = async () => {
    if (!copyToLocationId) {
      alert('Selecteer een doellocatie');
      return;
    }

    if (!confirm(`Menu kopiëren naar de geselecteerde locatie? Dit overschrijft het bestaande menu.`)) {
      return;
    }

    try {
      setSaving(true);
      const supabase = createClient();

      const { data, error } = await supabase.rpc('copy_menu_to_location', {
        p_source_location_id: locationId,
        p_target_location_id: copyToLocationId,
      });

      if (error) throw error;

      alert(`Menu succesvol gekopieerd! ${data[0].categories_copied} categorieën en ${data[0].items_copied} items.`);
      setCopyMenuDialogOpen(false);
      setCopyToLocationId('');
    } catch (error) {
      console.error('Error copying menu:', error);
      alert('Fout bij kopiëren van menu');
    } finally {
      setSaving(false);
    }
  };

  const getItemsByCategory = (categoryId: string | null) => {
    return items.filter(item => item.category_id === categoryId);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-muted-foreground">Menu laden...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Menu Beheer</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {categories.length} categorieën • {items.length} items
            </p>
          </div>
          <div className="flex gap-2">
            {tenantLocations.length > 1 && (
              <Button
                variant="outline"
                onClick={() => setCopyMenuDialogOpen(true)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Kopieer Menu
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setCategoryForm({ name: '', description: '' });
                setEditingCategory(null);
                setCategoryDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Categorie
            </Button>
            <Button
              onClick={() => {
                setItemForm({
                  name: '',
                  description: '',
                  price: 0,
                  category_id: null,
                  dietary_info: [],
                  allergens: [],
                  is_available: true,
                  is_featured: false,
                });
                setEditingItem(null);
                setItemDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nieuw Item
            </Button>
          </div>
        </div>
      </Card>

      {/* Categories and Items */}
      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                  {!category.is_active && (
                    <Badge variant="secondary">Inactief</Badge>
                  )}
                  <Badge variant="outline">
                    {getItemsByCategory(category.id).length} items
                  </Badge>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCategory(category);
                    setCategoryForm({
                      name: category.name,
                      description: category.description || '',
                    });
                    setCategoryDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items in this category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {getItemsByCategory(category.id).map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                            {item.is_featured && (
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm font-bold text-primary mt-1">
                            €{item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(item);
                              setItemForm(item);
                              setItemDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {!item.is_available && (
                          <Badge variant="secondary" className="text-xs">
                            Niet beschikbaar
                          </Badge>
                        )}
                        {item.dietary_info && item.dietary_info.length > 0 && item.dietary_info.map((info: string) => (
                          <Badge key={info} variant="outline" className="text-xs">
                            {info}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}

        {/* Uncategorized items */}
        {getItemsByCategory(null).length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Zonder Categorie ({getItemsByCategory(null).length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getItemsByCategory(null).map((item) => (
                <Card key={item.id} className="p-4">
                  {/* Same item card structure */}
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <p className="text-sm font-bold text-primary">€{item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => {
                            setEditingItem(item);
                            setItemForm(item);
                            setItemDialogOpen(true);
                          }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Categorie Bewerken' : 'Nieuwe Categorie'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Naam *</Label>
              <Input
                id="cat-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Voorgerechten, Hoofdgerechten, etc."
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Beschrijving</Label>
              <Textarea
                id="cat-desc"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optionele beschrijving van de categorie"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog - Part 1 */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Item Bewerken' : 'Nieuw Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="item-name">Naam *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Bijv. Caesar Salade"
                />
              </div>
              <div>
                <Label htmlFor="item-category">Categorie</Label>
                <select
                  id="item-category"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={itemForm.category_id || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, category_id: e.target.value || null }))}
                >
                  <option value="">Geen categorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="item-price">Prijs (€) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={itemForm.price || 0}
                  onChange={(e) => setItemForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="item-desc">Beschrijving</Label>
                <Textarea
                  id="item-desc"
                  value={itemForm.description || ''}
                  onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Beschrijf het gerecht"
                  rows={3}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>Afbeelding</Label>
              {itemForm.image_url ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                  <img src={itemForm.image_url} alt="Item" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setItemForm(prev => ({ ...prev, image_url: null }))}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className={cn(
                  "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50",
                  uploadingImage && "opacity-50 cursor-not-allowed"
                )}>
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Klik om afbeelding te uploaden</p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Switches */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.is_available ?? true}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_available: checked }))}
                />
                <Label>Beschikbaar</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={itemForm.is_featured ?? false}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label>Uitgelicht</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleSaveItem} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Menu Dialog */}
      <Dialog open={copyMenuDialogOpen} onOpenChange={setCopyMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Menu Kopiëren</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kopieer het volledige menu van {locationName} naar een andere locatie.
            </p>
            <div>
              <Label htmlFor="copy-location">Doellocatie</Label>
              <select
                id="copy-location"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={copyToLocationId}
                onChange={(e) => setCopyToLocationId(e.target.value)}
              >
                <option value="">Selecteer locatie</option>
                {tenantLocations
                  .filter(loc => loc.id !== locationId)
                  .map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyMenuDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCopyMenu} disabled={saving || !copyToLocationId}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Kopiëren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

