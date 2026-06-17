import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, Briefcase } from 'lucide-react';
import { RoleTitle } from '@/types/database';

const RoleTitleManagement = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleTitle | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleTitle | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('role_titles').select('*').order('title');
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    setLoading(true);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from('role_titles')
          .update({
            title: titleInput.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Role title updated' });
      } else {
        const { error } = await supabase
          .from('role_titles')
          .insert({
            title: titleInput.trim(),
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Role title created' });
      }

      setDialogOpen(false);
      setTitleInput('');
      setEditingRole(null);
      fetchRoles();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (role: RoleTitle) => {
    setEditingRole(role);
    setTitleInput(role.title);
    setDialogOpen(true);
  };

  const confirmDelete = (role: RoleTitle) => {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('role_titles').delete().eq('id', deletingRole.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Role title deleted' });
      fetchRoles();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Titles</h1>
            <p className="text-muted-foreground">Manage list of internship role titles.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingRole(null);
              setTitleInput('');
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} /> Add Role Title
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Edit Role Title' : 'Add Role Title'}</DialogTitle>
                <DialogDescription>
                  Enter the name of the role title. It must be unique.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Role Title</Label>
                  <Input
                    id="title"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g. Software Engineer Intern"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Internship Role Titles</CardTitle>
              <CardDescription>Available titles in application and intern forms</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading && roles.length === 0 ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No roles configured. Add one to get started.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.title}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(role)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the role title <strong>{deletingRole?.title}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default RoleTitleManagement;
