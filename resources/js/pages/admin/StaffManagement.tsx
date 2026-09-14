import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogDescription,
  DialogTrigger,
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
import { Department, Profile, StaffAssignment, RoleTitle } from '@/types/database';
import { Plus, Trash2, Loader2, UserCog, Copy, Building2, Briefcase, Edit, Settings } from 'lucide-react';
import DepartmentSkillsManager from '@/components/admin/DepartmentSkillsManager';

interface StaffMember {
  user_id: string;
  profile: Profile | null;
  assignments: StaffAssignment[];
}

const StaffManagement = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from URL path
  const getTabFromPath = (path: string) => {
    if (path.includes('/admin/departments')) return 'departments';
    if (path.includes('/admin/positions') || path.includes('/admin/roles')) return 'positions';
    return 'staff';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  // Sync tab state when URL changes
  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === 'staff') navigate('/admin/staff');
    else if (val === 'departments') navigate('/admin/departments');
    else if (val === 'positions') navigate('/admin/positions');
  };

  // ==========================================
  // Staff Directory Tab States & Logic
  // ==========================================
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [staffDeleteDialogOpen, setStaffDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    email: '',
    fullName: '',
    departmentIds: [] as string[],
  });

  const fetchStaffData = async () => {
    setStaffLoading(true);
    try {
      // Fetch departments first (shared between staff forms & dept tab)
      const { data: deptData } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      setSharedDepartments(deptData || []);

      // Fetch staff assignments with departments
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
      console.error('Error fetching staff:', error);
      toast({ title: 'Error', description: 'Failed to load staff directory', variant: 'destructive' });
    } finally {
      setStaffLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (staffFormData.departmentIds.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one department', variant: 'destructive' });
      return;
    }

    setStaffSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-staff-user', {
        body: {
          email: staffFormData.email,
          fullName: staffFormData.fullName,
          departmentIds: staffFormData.departmentIds,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setTempPassword(data.tempPassword);
      toast({ title: 'Success', description: 'Staff member created successfully' });
      fetchStaffData();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create staff member', variant: 'destructive' });
    } finally {
      setStaffSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    setStaffSubmitting(true);
    try {
      await supabase.from('staff_assignments').delete().eq('user_id', selectedStaff.user_id);
      await supabase.from('user_roles').delete().eq('user_id', selectedStaff.user_id);

      toast({ title: 'Success', description: 'Staff member removed' });
      setStaffDeleteDialogOpen(false);
      setSelectedStaff(null);
      fetchStaffData();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      toast({ title: 'Error', description: 'Failed to delete staff member', variant: 'destructive' });
    } finally {
      setStaffSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({ title: 'Copied', description: 'Password copied to clipboard' });
    }
  };

  const closeStaffDialog = () => {
    setStaffDialogOpen(false);
    setTempPassword(null);
    setStaffFormData({ email: '', fullName: '', departmentIds: [] });
  };

  const toggleStaffDepartment = (deptId: string) => {
    setStaffFormData(prev => ({
      ...prev,
      departmentIds: prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter(id => id !== deptId)
        : [...prev.departmentIds, deptId]
    }));
  };


  // ==========================================
  // Departments Tab States & Logic
  // ==========================================
  const [sharedDepartments, setSharedDepartments] = useState<Department[]>([]);
  const [departmentsList, setDepartmentsList] = useState<(Department & { skillCount?: number })[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptFormData, setDeptFormData] = useState({ name: '', description: '', headName: '' });
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptDeleteDialogOpen, setDeptDeleteDialogOpen] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [deptDeleting, setDeptDeleting] = useState(false);

  const fetchDepartmentsData = async () => {
    setDeptLoading(true);
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

      setDepartmentsList((depts || []).map(d => ({
        ...d,
        skillCount: skillCounts[d.id] || 0,
      })));
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({ title: 'Error', description: 'Failed to load departments', variant: 'destructive' });
    } finally {
      setDeptLoading(false);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptDeleting(true);

    try {
      if (editingDept) {
        const { error } = await supabase.from('departments').update({
          name: deptFormData.name,
          description: deptFormData.description || null,
          head_name: deptFormData.headName || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingDept.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Department updated' });
      } else {
        const { error } = await supabase.from('departments').insert({
          name: deptFormData.name,
          description: deptFormData.description || null,
          head_name: deptFormData.headName || null,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Department created' });
      }

      setDeptDialogOpen(false);
      resetDeptForm();
      fetchDepartmentsData();
      fetchStaffData(); // Refresh department options in staff tab
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeptDeleting(false);
    }
  };

  const handleEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      description: dept.description || '',
      headName: dept.head_name || '',
    });
    setDeptDialogOpen(true);
  };

  const confirmDeleteDept = (dept: Department) => {
    setDeletingDept(dept);
    setDeptDeleteDialogOpen(true);
  };

  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    setDeptDeleting(true);

    try {
      const { error } = await supabase.from('departments').delete().eq('id', deletingDept.id);
      if (error) throw error;
      toast({ title: 'Success', description: `"${deletingDept.name}" has been deleted` });
      setDeptDeleteDialogOpen(false);
      setDeletingDept(null);
      fetchDepartmentsData();
      fetchStaffData(); // Update staff directories list too
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeptDeleting(false);
    }
  };

  const openSkillsManager = (dept: Department) => {
    setSelectedDept(dept);
    setSkillsDialogOpen(true);
  };

  const resetDeptForm = () => {
    setEditingDept(null);
    setDeptFormData({ name: '', description: '', headName: '' });
  };


  // ==========================================
  // Role Titles Tab States & Logic
  // ==========================================
  const [roles, setRoles] = useState<RoleTitle[]>([]);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleTitle | null>(null);
  const [roleTitleInput, setRoleTitleInput] = useState('');
  const [roleDeleteDialogOpen, setRoleDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<RoleTitle | null>(null);
  const [roleDeleting, setRoleDeleting] = useState(false);

  const fetchRolesData = async () => {
    setRoleLoading(true);
    try {
      const { data, error } = await supabase.from('role_titles').select('*').order('title');
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching role titles:', error);
      toast({ title: 'Error', description: 'Failed to load role titles', variant: 'destructive' });
    } finally {
      setRoleLoading(false);
    }
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTitleInput.trim()) return;

    setRoleDeleting(true);
    try {
      if (editingRole) {
        const { error } = await supabase
          .from('role_titles')
          .update({
            title: roleTitleInput.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Role title updated' });
      } else {
        const { error } = await supabase
          .from('role_titles')
          .insert({
            title: roleTitleInput.trim(),
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Role title created' });
      }

      setRoleDialogOpen(false);
      setRoleTitleInput('');
      setEditingRole(null);
      fetchRolesData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setRoleDeleting(false);
    }
  };

  const handleEditRole = (role: RoleTitle) => {
    setEditingRole(role);
    setRoleTitleInput(role.title);
    setRoleDialogOpen(true);
  };

  const confirmDeleteRole = (role: RoleTitle) => {
    setDeletingRole(role);
    setRoleDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setRoleDeleting(true);
    try {
      const { error } = await supabase.from('role_titles').delete().eq('id', deletingRole.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Role title deleted' });
      fetchRolesData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setRoleDeleting(false);
      setRoleDeleteDialogOpen(false);
      setDeletingRole(null);
    }
  };


  // ==========================================
  // Fetch All Data on Mount
  // ==========================================
  useEffect(() => {
    fetchStaffData();
    fetchDepartmentsData();
    fetchRolesData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff & Organization</h1>
          <p className="text-muted-foreground">Manage system directories, department competencies, and role designations.</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-xl h-auto p-1 bg-muted">
            <TabsTrigger value="staff" className="flex items-center gap-2 py-2.5">
              <UserCog className="h-4 w-4" />
              <span>Staff Directory</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center gap-2 py-2.5">
              <Building2 className="h-4 w-4" />
              <span>Departments</span>
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2 py-2.5">
              <Briefcase className="h-4 w-4" />
              <span>Positions</span>
            </TabsTrigger>
          </TabsList>

          {/* ==========================================
              STAFF DIRECTORY TAB CONTENT
             ========================================== */}
          <TabsContent value="staff" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Staff Members</h2>
                <p className="text-sm text-muted-foreground">Manage administrative staff and their department access.</p>
              </div>
              <Button onClick={() => setStaffDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Staff
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : staff.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50 text-indigo-500" />
                    <p className="font-semibold text-foreground">No staff members yet</p>
                    <p className="text-sm">Create staff accounts to allow access to evaluations.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Assigned Departments</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStaff(member);
                                setStaffDeleteDialogOpen(true);
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

            {/* Add Staff Dialog */}
            <Dialog open={staffDialogOpen} onOpenChange={closeStaffDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                  <DialogDescription>Create a new staff profile and set department assignments.</DialogDescription>
                </DialogHeader>
                
                {tempPassword ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm font-semibold mb-2 text-indigo-600 dark:text-indigo-400">Account created successfully!</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Provide these credentials to the staff member:
                      </p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs">Email</Label>
                          <p className="font-mono text-sm font-semibold">{staffFormData.email}</p>
                        </div>
                        <div>
                          <Label className="text-xs">Temporary Password</Label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-background border rounded text-sm font-semibold">{tempPassword}</code>
                            <Button size="icon" variant="outline" onClick={copyPassword}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={closeStaffDialog} className="w-full">Done</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="staff-fullName">Full Name</Label>
                      <Input
                        id="staff-fullName"
                        value={staffFormData.fullName}
                        onChange={(e) => setStaffFormData({ ...staffFormData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff-email">Email</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        value={staffFormData.email}
                        onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Assigned Departments
                      </Label>
                      <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                        {sharedDepartments.map((dept) => (
                          <div key={dept.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`dept-${dept.id}`}
                              checked={staffFormData.departmentIds.includes(dept.id)}
                              onCheckedChange={() => toggleStaffDepartment(dept.id)}
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
                      {staffFormData.departmentIds.length === 0 && (
                        <p className="text-xs text-muted-foreground">Select at least one department</p>
                      )}
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={closeStaffDialog}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={staffSubmitting}>
                        {staffSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Staff
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Remove Staff Dialog */}
            <AlertDialog open={staffDeleteDialogOpen} onOpenChange={setStaffDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Staff Member?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently revoke {selectedStaff?.profile?.full_name || 'this user'}'s staff privileges and clear their evaluations role.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStaff} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {staffSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ==========================================
              DEPARTMENTS TAB CONTENT
             ========================================== */}
          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Departments</h2>
                <p className="text-sm text-muted-foreground">Manage organization units and map core capability metrics.</p>
              </div>
              <Button onClick={() => setDeptDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                {deptLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : departmentsList.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <p className="font-semibold text-foreground">No departments yet</p>
                    <p className="text-sm text-muted-foreground">Get started by creating your first department.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Head</TableHead>
                        <TableHead>Skills</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departmentsList.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">{dept.name}</TableCell>
                          <TableCell>{dept.head_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/85" onClick={() => openSkillsManager(dept)}>
                              {dept.skillCount || 0} skills
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{dept.description || '-'}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openSkillsManager(dept)} title="Manage Skills">
                              <Settings className="h-4 w-4 text-indigo-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditDept(dept)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteDept(dept)}>
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

            {/* Save Department Dialog */}
            <Dialog open={deptDialogOpen} onOpenChange={(open) => { setDeptDialogOpen(open); if (!open) resetDeptForm(); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDept ? 'Edit Department' : 'Add Department'}</DialogTitle>
                  <DialogDescription>Input department identity and leadership details.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveDepartment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dept-name">Name</Label>
                    <Input id="dept-name" value={deptFormData.name} onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-headName">Department Head</Label>
                    <Input id="dept-headName" value={deptFormData.headName} onChange={(e) => setDeptFormData({ ...deptFormData, headName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dept-description">Description</Label>
                    <Textarea id="dept-description" value={deptFormData.description} onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })} />
                  </div>
                  <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={deptDeleting}>
                      {deptDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {editingDept ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Department Skills Dialog */}
            <DepartmentSkillsManager
              open={skillsDialogOpen}
              onOpenChange={(open) => {
                setSkillsDialogOpen(open);
                if (!open) {
                  setSelectedDept(null);
                  fetchDepartmentsData();
                }
              }}
              department={selectedDept}
            />

            {/* Delete Department Dialog */}
            <AlertDialog open={deptDeleteDialogOpen} onOpenChange={(open) => { setDeptDeleteDialogOpen(open); if (!open) setDeletingDept(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Department</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete <strong>{deletingDept?.name}</strong>? This action will permanently remove all associated skills.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deptDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteDept}
                    disabled={deptDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deptDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* ==========================================
              POSITIONS TAB CONTENT
             ========================================== */}
          <TabsContent value="positions" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Positions</h2>
                <p className="text-sm text-muted-foreground">Manage list of positions and designations for interns and jobs.</p>
              </div>
              <Dialog open={roleDialogOpen} onOpenChange={(open) => {
                setRoleDialogOpen(open);
                if (!open) {
                  setEditingRole(null);
                  setRoleTitleInput('');
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2 h-4 w-4" /> Add Position
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingRole ? 'Edit Position' : 'Add Position'}</DialogTitle>
                    <DialogDescription>
                      Input the name for the position designation. It must be unique.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSaveRole} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="position-title">Position Title</Label>
                      <Input
                        id="position-title"
                        value={roleTitleInput}
                        onChange={(e) => setRoleTitleInput(e.target.value)}
                        placeholder="e.g. Software Engineer Intern"
                        required
                      />
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="button" variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={roleDeleting}>
                        {roleDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                {roleLoading && roles.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-semibold text-foreground">No positions configured</p>
                    <p className="text-sm">Configure positions to tag applications and job openings correctly.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position Title</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">{role.title}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDeleteRole(role)} className="text-destructive hover:text-destructive">
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

            {/* Delete Position AlertDialog */}
            <AlertDialog open={roleDeleteDialogOpen} onOpenChange={setRoleDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete the position designation <strong>{deletingRole?.title}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={roleDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={(e) => {
                    e.preventDefault();
                    handleDeleteRole();
                  }} disabled={roleDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {roleDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;
