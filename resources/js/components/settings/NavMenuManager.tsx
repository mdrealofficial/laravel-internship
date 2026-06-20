import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, ExternalLink, Link as LinkIcon, Loader2, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AVAILABLE_ICONS, LucideIcon } from '@/components/layout/PublicNavbar';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  is_external: boolean;
  display_order: number;
  is_active: boolean;
}

export const NavMenuManager = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', url: '', icon: '', is_external: false });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('nav_menu_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async () => {
    if (!newItem.label || !newItem.url) {
      toast({ title: 'Error', description: 'Label and URL are required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const maxOrder = menuItems.length > 0 ? Math.max(...menuItems.map(m => m.display_order)) : 0;
      
      const { data, error } = await supabase
        .from('nav_menu_items')
        .insert({
          label: newItem.label,
          url: newItem.url,
          icon: newItem.icon || null,
          is_external: newItem.is_external,
          display_order: maxOrder + 1,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setMenuItems([...menuItems, data]);
      setNewItem({ label: '', url: '', icon: '', is_external: false });
      toast({ title: 'Success', description: 'Menu item added' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const { error } = await supabase
        .from('nav_menu_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setMenuItems(menuItems.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const deleteMenuItem = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('nav_menu_items')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;

      setMenuItems(menuItems.filter(item => item.id !== deletingId));
      toast({ title: 'Success', description: 'Menu item deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= menuItems.length) return;

    const items = [...menuItems];
    const temp = items[index].display_order;
    items[index].display_order = items[newIndex].display_order;
    items[newIndex].display_order = temp;

    // Swap positions
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setMenuItems(items);

    // Update in database
    try {
      await Promise.all([
        supabase.from('nav_menu_items').update({ display_order: items[index].display_order }).eq('id', items[index].id),
        supabase.from('nav_menu_items').update({ display_order: items[newIndex].display_order }).eq('id', items[newIndex].id)
      ]);
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to reorder items', variant: 'destructive' });
      fetchMenuItems();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Navigation Menu
          </CardTitle>
          <CardDescription>
            Manage custom links shown in the public navigation bar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new item form */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h4 className="font-medium">Add New Menu Item</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="newLabel">Label</Label>
                <Input
                  id="newLabel"
                  placeholder="e.g. About Us"
                  value={newItem.label}
                  onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUrl">URL</Label>
                <Input
                  id="newUrl"
                  placeholder="e.g. /about or https://example.com"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newIcon">Icon</Label>
                <Select
                  value={newItem.icon || 'none'}
                  onValueChange={(val) => setNewItem({ ...newItem, icon: val === 'none' ? '' : val })}
                >
                  <SelectTrigger id="newIcon" className="w-full">
                    <SelectValue placeholder="Select Icon" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Icon</SelectItem>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.name} value={icon.name}>
                        <span className="flex items-center gap-2">
                          <LucideIcon name={icon.name} className="h-4 w-4" />
                          {icon.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="isExternal"
                  checked={newItem.is_external}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, is_external: checked })}
                />
                <Label htmlFor="isExternal" className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab (external link)
                </Label>
              </div>
              <Button onClick={addMenuItem} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Item
              </Button>
            </div>
          </div>

          {/* Existing menu items */}
          <div className="space-y-3">
            <h4 className="font-medium">Menu Items</h4>
            {menuItems.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No menu items yet. Add your first one above.
              </p>
            ) : (
              <div className="space-y-2">
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === menuItems.length - 1}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 grid gap-2 md:grid-cols-3">
                      <Input
                        value={item.label}
                        onChange={(e) => updateMenuItem(item.id, { label: e.target.value })}
                        placeholder="Label"
                      />
                      <Input
                        value={item.url}
                        onChange={(e) => updateMenuItem(item.id, { url: e.target.value })}
                        placeholder="URL"
                      />
                      <Select
                        value={item.icon || 'none'}
                        onValueChange={(val) => updateMenuItem(item.id, { icon: val === 'none' ? null : val })}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Icon</SelectItem>
                          {AVAILABLE_ICONS.map((icon) => (
                            <SelectItem key={icon.name} value={icon.name}>
                              <span className="flex items-center gap-2">
                                <LucideIcon name={icon.name} className="h-4 w-4" />
                                {icon.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_external}
                          onCheckedChange={(checked) => updateMenuItem(item.id, { is_external: checked })}
                        />
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) => updateMenuItem(item.id, { is_active: checked })}
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeletingId(item.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this navigation menu item. The link will be removed from the public website header immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMenuItem();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
