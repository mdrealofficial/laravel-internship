import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, Loader2, UserPlus, Copy, Star, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Department, Intern, InternshipStatus } from '@/types/database';
import SkillAssessmentModal from '@/components/admin/SkillAssessmentModal';
import BulkSkillAssessmentModal from '@/components/admin/BulkSkillAssessmentModal';

const InternManagement = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [interns, setInterns] = useState<Intern[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState<Intern | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedInternForAssessment, setSelectedInternForAssessment] = useState<Intern | null>(null);
  const [bulkAssessmentOpen, setBulkAssessmentOpen] = useState(false);
  const [roleTitles, setRoleTitles] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    roleTitle: '',
    departmentId: '',
    supervisorName: '',
    startDate: '',
    endDate: '',
    status: 'pending' as InternshipStatus,
    description: '',
    phone: '',
  });

  // Handle pre-fill from URL params (from "Approve & Create Intern")
  useEffect(() => {
    const shouldCreate = searchParams.get('create');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const department = searchParams.get('department');
    
    if (shouldCreate === 'true') {
      setFormData(prev => ({
        ...prev,
        fullName: name || '',
        email: email || '',
        phone: phone || '',
        departmentId: department || '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active',
      }));
      setDialogOpen(true);
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch interns, departments, roles and staff list
      const [internsRes, deptsRes, profilesRes, rolesRes, staffRolesRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('role_titles').select('*').order('title'),
        supabase.from('user_roles').select('user_id').eq('role', 'staff'),
      ]);

      if (rolesRes.data) {
        setRoleTitles(rolesRes.data.map(r => r.title));
      }

      if (staffRolesRes.data && profilesRes.data) {
        const staffIds = staffRolesRes.data.map(r => r.user_id);
        const staffProfiles = profilesRes.data.filter(p => staffIds.includes(p.user_id));
        setStaffList(staffProfiles.map(p => p.full_name).filter(Boolean) as string[]);
      }

      if (internsRes.data && profilesRes.data) {
        const profilesMap = new Map(profilesRes.data.map(p => [p.user_id, p]));
        const deptsMap = new Map(deptsRes.data?.map(d => [d.id, d]) || []);
        
        setInterns(internsRes.data.map(i => ({
          ...i,
          profile: profilesMap.get(i.user_id) || null,
          department: deptsMap.get(i.department_id) || null,
        })));
      }
      if (deptsRes.data) setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreatedPassword(null);

    try {
      if (editingIntern) {
        const { error } = await supabase
          .from('interns')
          .update({
            role_title: formData.roleTitle,
            department_id: formData.departmentId || null,
            supervisor_name: formData.supervisorName || null,
            start_date: formData.startDate,
            end_date: formData.endDate || null,
            status: formData.status,
            description: formData.description || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingIntern.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Intern updated successfully' });
        setDialogOpen(false);
        resetForm();
      } else {
        // Use Edge Function to create user without affecting current session
        const { data, error } = await supabase.functions.invoke('create-intern-user', {
          body: {
            email: formData.email,
            fullName: formData.fullName,
            roleTitle: formData.roleTitle,
            departmentId: formData.departmentId || null,
            supervisorName: formData.supervisorName || null,
            startDate: formData.startDate,
            endDate: formData.endDate || null,
            status: formData.status,
            description: formData.description || null,
            phone: formData.phone || null,
          },
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error);

        setCreatedPassword(data.tempPassword);
        toast({
          title: 'Intern Created Successfully',
          description: 'Copy the temporary password and share it with the intern.',
        });
      }
      fetchData();
    } catch (error: any) {
      const errorMessage = error.message || 'Something went wrong';
      const isEmailExists = errorMessage.toLowerCase().includes('email') && 
                           (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('exists'));
      
      toast({
        title: isEmailExists ? 'Email Already Registered' : 'Error',
        description: isEmailExists 
          ? 'An account with this email address already exists. Please use a different email.'
          : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      toast({ title: 'Copied', description: 'Password copied to clipboard' });
    }
  };

  const handleEdit = (intern: Intern) => {
    setEditingIntern(intern);
    setCreatedPassword(null);
    setFormData({
      email: intern.profile?.email || '',
      fullName: intern.profile?.full_name || '',
      roleTitle: intern.role_title,
      departmentId: intern.department_id || '',
      supervisorName: intern.supervisor_name || '',
      startDate: intern.start_date,
      endDate: intern.end_date || '',
      status: intern.status,
      description: intern.description || '',
      phone: (intern as any).phone || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from('interns').delete().eq('id', deletingId);
      if (error) throw error;

      toast({ title: 'Success', description: 'Intern deleted' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openAssessmentModal = (intern: Intern) => {
    setSelectedInternForAssessment(intern);
    setAssessmentModalOpen(true);
  };

  const resetForm = () => {
    setEditingIntern(null);
    setCreatedPassword(null);
    setFormData({
      email: '',
      fullName: '',
      roleTitle: '',
      departmentId: '',
      supervisorName: '',
      startDate: '',
      endDate: '',
      status: 'pending',
      description: '',
      phone: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      completed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      terminated: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const filteredInterns = interns.filter(intern =>
    intern.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    intern.role_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Intern Management</h1>
            <p className="text-muted-foreground">Manage your interns</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setBulkAssessmentOpen(true)}>
              <Users className="h-4 w-4" /> Bulk Assessment
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" /> Add Intern
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIntern ? 'Edit Intern' : 'Add New Intern'}</DialogTitle>
                <DialogDescription>
                  {editingIntern ? 'Update intern details' : 'Create a new intern account'}
                </DialogDescription>
              </DialogHeader>

              {createdPassword ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                      ✓ Intern account created successfully!
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Share this temporary password with the intern. They should change it on first login.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input value={createdPassword} readOnly className="font-mono" />
                      <Button variant="outline" size="icon" onClick={copyPassword}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!editingIntern && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="roleTitle">Role Title</Label>
                    <Select value={formData.roleTitle} onValueChange={(v) => setFormData({ ...formData, roleTitle: v })}>
                      <SelectTrigger><SelectValue placeholder="Select role title" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([...roleTitles, formData.roleTitle].filter(Boolean))).map((title) => (
                          <SelectItem key={title} value={title}>{title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={formData.departmentId} onValueChange={(v) => setFormData({ ...formData, departmentId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor">Supervisor Name</Label>
                    <Select value={formData.supervisorName} onValueChange={(v) => setFormData({ ...formData, supervisorName: v })}>
                      <SelectTrigger><SelectValue placeholder="Select supervisor" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([...staffList, formData.supervisorName].filter(Boolean))).map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="e.g., +1 234 567 8900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v: InternshipStatus) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {editingIntern ? 'Update Intern' : 'Create Intern'}
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search interns..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredInterns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No interns found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInterns.map((intern) => (
                      <TableRow key={intern.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{intern.profile?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{intern.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{intern.role_title}</TableCell>
                        <TableCell>{intern.department?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(intern.status)}</TableCell>
                        <TableCell>{new Date(intern.start_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openAssessmentModal(intern)}
                            title="Assess Skills"
                            disabled={!intern.department_id}
                          >
                            <Star className="h-4 w-4 text-amber-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(intern)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setDeletingId(intern.id);
                            setDeleteDialogOpen(true);
                          }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <SkillAssessmentModal
        open={assessmentModalOpen}
        onOpenChange={setAssessmentModalOpen}
        intern={selectedInternForAssessment}
        onSaved={fetchData}
      />

      <BulkSkillAssessmentModal
        open={bulkAssessmentOpen}
        onOpenChange={setBulkAssessmentOpen}
        onSaved={fetchData}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this intern's record and remove them from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Intern
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default InternManagement;