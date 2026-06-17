import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, Building2, Settings } from 'lucide-react';
import { Department } from '@/types/database';
import DepartmentSkillsManager from '@/components/admin/DepartmentSkillsManager';

const DepartmentManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<(Department & { skillCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', headName: '' });
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data: depts, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;

      // Get skill counts for each department
      const { data: skills } = await supabase
        .from('department_skills')
        .select('department_id');

      const skillCounts: Record<string, number> = {};
      skills?.forEach(s => {
        skillCounts[s.department_id] = (skillCounts[s.department_id] || 0) + 1;
      });

      setDepartments((depts || []).map(d => ({
        ...d,
        skillCount: skillCounts[d.id] || 0,
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingDept) {
        const { error } = await supabase.from('departments').update({
          name: formData.name,
          description: formData.description || null,
          head_name: formData.headName || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingDept.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Department updated' });
      } else {
        const { error } = await supabase.from('departments').insert({
          name: formData.name,
          description: formData.description || null,
          head_name: formData.headName || null,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Department created' });
      }

      setDialogOpen(false);
      resetForm();
      fetchDepartments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      headName: dept.head_name || '',
    });
    setDialogOpen(true);
  };

  const confirmDelete = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from('departments').delete().eq('id', deletingDept.id);
      if (error) throw error;
      toast({ title: 'Success', description: `"${deletingDept.name}" has been deleted` });
      setDeleteDialogOpen(false);
      setDeletingDept(null);
      fetchDepartments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const openSkillsManager = (dept: Department) => {
    setSelectedDept(dept);
    setSkillsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', headName: '' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Department Management</h1>
            <p className="text-muted-foreground">Manage departments and their skills</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
                <DialogDescription>Enter department details</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headName">Department Head</Label>
                  <Input id="headName" value={formData.headName} onChange={(e) => setFormData({ ...formData, headName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingDept ? 'Update' : 'Create'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader />
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : departments.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No departments yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Head</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell>{dept.head_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="cursor-pointer" onClick={() => openSkillsManager(dept)}>
                          {dept.skillCount} skills
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{dept.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openSkillsManager(dept)} title="Manage Skills">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(dept)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(dept)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DepartmentSkillsManager
        open={skillsDialogOpen}
        onOpenChange={(open) => {
          setSkillsDialogOpen(open);
          if (!open) {
            setSelectedDept(null);
            fetchDepartments();
          }
        }}
        department={selectedDept}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeletingDept(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingDept?.name}</strong>? This action cannot be undone and will also remove all associated skills.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DepartmentManagement;