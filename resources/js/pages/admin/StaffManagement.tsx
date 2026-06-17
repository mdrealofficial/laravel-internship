import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Department, Profile, StaffAssignment } from '@/types/database';
import { Plus, Trash2, Loader2, UserCog, Copy, Building2 } from 'lucide-react';

interface StaffMember {
  user_id: string;
  profile: Profile | null;
  assignments: StaffAssignment[];
}

const StaffManagement = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    departmentIds: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch departments
      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      setDepartments(deptData || []);

      // Fetch staff assignments with profiles
      const { data: assignmentsData } = await supabase
        .from('staff_assignments')
        .select(`
          *,
          department:departments(*)
        `);

      // Fetch staff user_ids from user_roles
      const { data: staffRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'staff');

      if (staffRoles) {
        const staffUserIds = staffRoles.map(r => r.user_id);
        
        // Fetch profiles for staff
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', staffUserIds);

        // Group by user_id
        const staffMap = new Map<string, StaffMember>();
        
        staffUserIds.forEach(userId => {
          const profile = profilesData?.find(p => p.user_id === userId) || null;
          const assignments = (assignmentsData || [])
            .filter(a => a.user_id === userId)
            .map(a => ({
              ...a,
              department: a.department as Department
            }));
          
          staffMap.set(userId, { user_id: userId, profile, assignments });
        });

        setStaff(Array.from(staffMap.values()));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to load staff data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.departmentIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one department', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          departmentIds: formData.departmentIds,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setTempPassword(data.tempPassword);
      toast({ title: 'Success', description: 'Staff member created successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create staff member', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    setSubmitting(true);
    try {
      // Delete staff assignments
      await supabase
        .from('staff_assignments')
        .delete()
        .eq('user_id', selectedStaff.user_id);

      // Delete user role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedStaff.user_id);

      // Note: We can't delete the auth user from client-side
      // The profile will remain but user won't have access

      toast({ title: 'Success', description: 'Staff member removed' });
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
      fetchData();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({ title: 'Error', description: 'Failed to delete staff member', variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({ title: 'Copied', description: 'Password copied to clipboard' });
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setTempPassword(null);
    setFormData({ email: '', fullName: '', departmentIds: [] });
  };

  const toggleDepartment = (deptId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter(id => id !== deptId)
        : [...prev.departmentIds, deptId]
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
            <p className="text-muted-foreground mt-1">Manage staff members and their department assignments</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Staff
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Staff Members ({staff.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No staff members yet</p>
                <p className="text-sm">Add staff to allow them to assess interns</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Departments</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.user_id}>
                      <TableCell className="font-medium">
                        {member.profile?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{member.profile?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.assignments.map((a) => (
                            <Badge key={a.id} variant="secondary">
                              {a.department?.name || 'Unknown'}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedStaff(member);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Add Staff Dialog */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          
          {tempPassword ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Staff account created!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Share these credentials with the staff member:
                </p>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Email</Label>
                    <p className="font-mono text-sm">{formData.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Temporary Password</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background rounded text-sm">{tempPassword}</code>
                      <Button size="icon" variant="outline" onClick={copyPassword}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Assigned Departments
                </Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept.id}`}
                        checked={formData.departmentIds.includes(dept.id)}
                        onCheckedChange={() => toggleDepartment(dept.id)}
                      />
                      <label
                        htmlFor={`dept-${dept.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {dept.name}
                      </label>
                    </div>
                  ))}
                </div>
                {formData.departmentIds.length === 0 && (
                  <p className="text-xs text-muted-foreground">Select at least one department</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Staff
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedStaff?.profile?.full_name}'s staff access. They will no longer be able to assess interns.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default StaffManagement;
