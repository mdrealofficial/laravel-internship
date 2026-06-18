import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, MoreHorizontal, Eye, Download, UserPlus, Trash2 } from 'lucide-react';
import { Application, ApplicationForm, ApplicationStatus, FormField, Department } from '@/types/database';
import { format } from 'date-fns';

const statusColors: Record<ApplicationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'secondary',
  reviewing: 'outline',
  shortlisted: 'default',
  approved: 'default',
  rejected: 'destructive',
};

export default function ApplicationManagement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const formFilter = searchParams.get('form');

  const [applications, setApplications] = useState<Application[]>([]);
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFormFilter, setSelectedFormFilter] = useState<string>(formFilter || 'all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [detailApplication, setDetailApplication] = useState<Application | null>(null);
  const [responses, setResponses] = useState<{ field: FormField; value: string | null; file_url: string | null }[]>([]);
  const [adminNotes, setAdminNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  const batchNames = Array.from(
    new Set(
      forms
        .map((f) => f.batch_name)
        .filter((b): b is string => !!b)
    )
  ).sort();

  useEffect(() => {
    fetchForms();
    fetchDepartments();
    fetchApplications();
  }, []);

  const fetchForms = async () => {
    const { data } = await supabase.from('application_forms').select('*').order('title');
    if (data) setForms(data);
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };

  const getDepartmentName = (deptId: string | null | undefined) => {
    if (!deptId) return '—';
    const dept = departments.find((d) => d.id === deptId);
    return dept ? dept.name : '—';
  };

  const handleDeptFilterChange = (value: string) => {
    setSelectedDeptFilter(value);
    if (value !== 'all' && selectedFormFilter !== 'all') {
      const selectedForm = forms.find((f) => f.id === selectedFormFilter);
      if (selectedForm && selectedForm.department_id !== value) {
        setSelectedFormFilter('all');
      }
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*, form:application_forms(*), department:departments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load applications');
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  const fetchResponses = async (applicationId: string, formId: string) => {
    const [responsesRes, fieldsRes] = await Promise.all([
      supabase.from('application_responses').select('*').eq('application_id', applicationId),
      supabase.from('form_fields').select('*').eq('form_id', formId).order('display_order'),
    ]);

    if (fieldsRes.data) {
      const responseMap = new Map(
        (responsesRes.data || []).map((r) => [r.field_id, { value: r.response_value, file_url: r.file_url }])
      );
      setResponses(
        fieldsRes.data.map((field) => ({
          field,
          value: responseMap.get(field.id)?.value || null,
          file_url: responseMap.get(field.id)?.file_url || null,
        }))
      );
    }
  };

  const handleViewDetails = async (app: Application) => {
    setDetailApplication(app);
    setAdminNotes(app.admin_notes || '');
    await fetchResponses(app.id, app.form_id);
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    // Find the application to get contact details
    const app = applications.find(a => a.id === id);
    
    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchApplications();
      if (detailApplication?.id === id) {
        setDetailApplication({ ...detailApplication, status });
      }
      
      // Send notification to applicant about status change
      if (app) {
        sendStatusNotification(app, status);
      }
    }
  };

  const sendStatusNotification = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      // Map status to specific template key
      let templateKey = 'application_status_changed';
      if (newStatus === 'approved') templateKey = 'application_approved';
      else if (newStatus === 'rejected') templateKey = 'application_rejected';
      else if (newStatus === 'shortlisted') templateKey = 'application_shortlisted';
      else if (newStatus === 'reviewing') templateKey = 'application_reviewing';

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: templateKey,
          recipient_email: app.applicant_email,
          recipient_phone: app.applicant_phone || undefined,
          data: {
            applicant_name: app.applicant_name,
            position: app.form?.title || 'Position',
            form_title: app.form?.title || 'Position',
            application_status: newStatus,
            admin_notes: app.admin_notes || '',
            company_name: 'DIGI5 LTD',
          },
        },
      });

      let deliveryStatus = 'failed';
      if (data && data.success) {
        const emailSuccess = data.results?.email?.success;
        const smsSuccess = data.results?.sms?.success;
        if (emailSuccess && smsSuccess) {
          deliveryStatus = 'sent (Email & SMS)';
        } else if (emailSuccess) {
          deliveryStatus = 'sent (Email)';
        } else if (smsSuccess) {
          deliveryStatus = 'sent (SMS)';
        } else {
          deliveryStatus = 'sent';
        }
      }

      await supabase
        .from('applications')
        .update({ delivery_status: deliveryStatus })
        .eq('id', app.id);
        
      fetchApplications();
    } catch (error) {
      console.error('Failed to send status notification:', error);
      await supabase
        .from('applications')
        .update({ delivery_status: 'failed' })
        .eq('id', app.id);
      fetchApplications();
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      // First delete application responses (foreign key references)
      const { error: respError } = await supabase
        .from('application_responses')
        .delete()
        .eq('application_id', id);
        
      if (respError) throw respError;

      // Then delete the application itself
      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (appError) throw appError;

      toast.success('Applicant deleted successfully');
      fetchApplications();
    } catch (error: any) {
      toast.error('Failed to delete applicant: ' + error.message);
    }
  };

  const confirmDeleteSingle = (id: string) => {
    setSingleDeleteId(id);
    setDeleteTarget('single');
  };

  const handleBulkStatusChange = async (status: ApplicationStatus) => {
    if (selectedApplications.length === 0) return;

    // Get applications to send notifications
    const selectedApps = applications.filter(a => selectedApplications.includes(a.id));

    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .in('id', selectedApplications);

    if (error) {
      toast.error('Failed to update statuses');
    } else {
      toast.success(`${selectedApplications.length} applications updated`);
      
      // Send notifications to all selected applications
      for (const app of selectedApps) {
        sendStatusNotification(app, status);
      }
      
      setSelectedApplications([]);
      fetchApplications();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) return;

    try {
      // First delete application responses (foreign key references)
      const { error: respError } = await supabase
        .from('application_responses')
        .delete()
        .in('application_id', selectedApplications);
        
      if (respError) throw respError;

      // Then delete the applications themselves
      const { error: appError } = await supabase
        .from('applications')
        .delete()
        .in('id', selectedApplications);

      if (appError) throw appError;

      toast.success(`${selectedApplications.length} applicants deleted successfully`);
      setSelectedApplications([]);
      fetchApplications();
    } catch (error: any) {
      toast.error('Failed to delete selected applicants: ' + error.message);
    }
  };

  const confirmDeleteBulk = () => {
    setDeleteTarget('bulk');
  };

  const handleSaveNotes = async () => {
    if (!detailApplication) return;

    const { error } = await supabase
      .from('applications')
      .update({ admin_notes: adminNotes })
      .eq('id', detailApplication.id);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
    }
  };

  const handleApproveAndCreateIntern = async (app: Application) => {
    // Update application status
    await handleStatusChange(app.id, 'approved');
    
    // Navigate to intern creation with pre-filled data including phone and batch name
    navigate(`/admin/interns?create=true&name=${encodeURIComponent(app.applicant_name)}&email=${encodeURIComponent(app.applicant_email)}&phone=${encodeURIComponent(app.applicant_phone || '')}&department=${app.department_id || app.form?.department_id || ''}&batch_name=${encodeURIComponent(app.form?.batch_name || '')}`);
  };

  const handleExport = () => {
    const filtered = getFilteredApplications();
    const csv = [
      ['Name', 'Email', 'Phone', 'Form', 'Status', 'Applied Date'].join(','),
      ...filtered.map((app) =>
        [
          app.applicant_name,
          app.applicant_email,
          app.applicant_phone || '',
          app.form?.title || '',
          app.status,
          format(new Date(app.created_at), 'yyyy-MM-dd'),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const getFilteredApplications = () => {
    const filtered = applications.filter((app) => {
      const matchesSearch =
        app.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant_email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesForm = selectedFormFilter === 'all' || app.form_id === selectedFormFilter;
      const matchesDept = selectedDeptFilter === 'all' || (app.department_id || app.form?.department_id) === selectedDeptFilter;
      const matchesBatch = selectedBatchFilter === 'all' || app.form?.batch_name === selectedBatchFilter;
      return matchesSearch && matchesStatus && matchesForm && matchesDept && matchesBatch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'score-desc') {
        const scoreA = a.skill_score !== null && a.skill_score !== undefined ? a.skill_score : -1;
        const scoreB = b.skill_score !== null && b.skill_score !== undefined ? b.skill_score : -1;
        return scoreB - scoreA;
      }
      if (sortBy === 'score-asc') {
        const scoreA = a.skill_score !== null && a.skill_score !== undefined ? a.skill_score : 999;
        const scoreB = b.skill_score !== null && b.skill_score !== undefined ? b.skill_score : 999;
        return scoreA - scoreB;
      }
      if (sortBy === 'name-asc') {
        return a.applicant_name.localeCompare(b.applicant_name);
      }
      if (sortBy === 'name-desc') {
        return b.applicant_name.localeCompare(a.applicant_name);
      }
      return 0;
    });
  };

  const filteredApplications = getFilteredApplications();

  const toggleSelectAll = () => {
    if (selectedApplications.length === filteredApplications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(filteredApplications.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedApplications((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Applications</h1>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedBatchFilter} onValueChange={setSelectedBatchFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batchNames.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDeptFilter} onValueChange={handleDeptFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedFormFilter} onValueChange={setSelectedFormFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by form" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms
                .filter((form) => {
                  const matchesDept = selectedDeptFilter === 'all' || form.department_id === selectedDeptFilter;
                  const matchesBatch = selectedBatchFilter === 'all' || form.batch_name === selectedBatchFilter;
                  return matchesDept && matchesBatch;
                })
                .map((form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Applied (Newest)</SelectItem>
              <SelectItem value="date-asc">Applied (Oldest)</SelectItem>
              <SelectItem value="score-desc">Skill Score (High to Low)</SelectItem>
              <SelectItem value="score-asc">Skill Score (Low to High)</SelectItem>
              <SelectItem value="name-asc">Name (A to Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z to A)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedApplications.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">{selectedApplications.length} selected</span>
            <Select onValueChange={(v) => handleBulkStatusChange(v as ApplicationStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteBulk}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedApplications([])}>
              Clear
            </Button>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredApplications.length > 0 &&
                      selectedApplications.length === filteredApplications.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Applicant</TableHead>
                <TableHead>Form</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Skill Score</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedApplications.includes(app.id)}
                        onCheckedChange={() => toggleSelect(app.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.applicant_name}</p>
                        <p className="text-sm text-muted-foreground">{app.applicant_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.form?.title || '—'}</p>
                        {(app.department_id || app.form?.department_id) && (
                          <span className="inline-block mt-1 text-[10px] font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            {getDepartmentName(app.department_id || app.form?.department_id)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {app.delivery_status ? (
                        <Badge variant="outline" className={
                          app.delivery_status.includes('failed') 
                            ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                            : app.delivery_status.includes('sent')
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }>
                          {app.delivery_status}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {app.skill_score !== null && app.skill_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{app.skill_score}/100</span>
                          <div className="w-16 bg-muted rounded-full h-1.5 hidden sm:block">
                            <div 
                              className={`h-1.5 rounded-full ${
                                app.skill_score >= 80 
                                  ? 'bg-emerald-500' 
                                  : app.skill_score >= 50 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                              }`} 
                              style={{ width: `${app.skill_score}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => confirmDeleteSingle(app.id)}
                          title="Delete Applicant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(app)}
                          title="View Details"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Application Detail Sheet */}
      <Sheet open={!!detailApplication} onOpenChange={() => setDetailApplication(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          {detailApplication && (
            <>
              <SheetHeader>
                <SheetTitle>Application Details</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Applicant Info</h3>
                    <Badge variant={statusColors[detailApplication.status]}>
                      {detailApplication.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Name</p>
                      <p className="font-medium">{detailApplication.applicant_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{detailApplication.applicant_email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{detailApplication.applicant_phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Applied</p>
                      <p className="font-medium">
                        {format(new Date(detailApplication.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Form</p>
                      <p className="font-medium">{detailApplication.form?.title || '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">
                        {getDepartmentName(detailApplication.department_id || detailApplication.form?.department_id)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Change Status</h3>
                  <Select
                    value={detailApplication.status}
                    onValueChange={(v) => handleStatusChange(detailApplication.id, v as ApplicationStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Form Responses</h3>
                  <div className="space-y-4">
                    {responses.map((r) => {
                      const fileUrl = r.file_url || (r.value && (r.value.startsWith('http://') || r.value.startsWith('https://')) && (r.value.includes('/storage/') || r.value.includes('/uploads/')) ? r.value : null);
                      const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                      
                      return (
                        <div key={r.field.id} className="space-y-1">
                          <p className="text-sm text-muted-foreground">{r.field.label}</p>
                          {fileUrl ? (
                            <div className="flex flex-col gap-2 mt-1">
                              {isImage && (
                                <div className="relative max-w-xs border rounded-md overflow-hidden bg-muted">
                                  <img src={fileUrl} alt={r.field.label} className="max-h-32 object-contain" />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View File
                                  </a>
                                </Button>
                                <Button variant="secondary" size="sm" asChild>
                                  <a
                                    href={fileUrl}
                                    download
                                    className="flex items-center gap-1.5"
                                  >
                                    <Download className="h-4 w-4" />
                                    Download
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ) : r.field.field_type === 'range' ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{r.value || '—'}</p>
                              {r.value && r.field.options && r.field.options.length >= 2 && (
                                <div className="w-full bg-muted rounded-full h-1.5 max-w-xs mt-1">
                                  <div 
                                    className="bg-primary h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.min(100, Math.max(0, 
                                        ((Number(r.value) - Number(r.field.options[0])) / 
                                        (Number(r.field.options[1]) - Number(r.field.options[0]))) * 100
                                      ))}%` 
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : r.field.field_type === 'skills' ? (
                            <div className="space-y-1.5 mt-1">
                              {r.value ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.value.split(', ').map((skill, index) => (
                                    <Badge key={index} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10 text-xs py-0.5 px-2 border-primary/20">
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No skills selected</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm font-medium">{r.value || '—'}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Admin Notes</h3>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={4}
                  />
                  <Button onClick={handleSaveNotes} size="sm">
                    Save Notes
                  </Button>
                </div>

                {detailApplication.status === 'approved' && (
                  <Button
                    onClick={() => handleApproveAndCreateIntern(detailApplication)}
                    className="w-full"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Intern Account
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === 'single'
                ? "This action cannot be undone. This will permanently delete this applicant and all of their form responses."
                : `This action cannot be undone. This will permanently delete the ${selectedApplications.length} selected applicants and all of their form responses.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget === 'single' && singleDeleteId) {
                  await handleDeleteApplication(singleDeleteId);
                } else if (deleteTarget === 'bulk') {
                  await handleBulkDelete();
                }
                setDeleteTarget(null);
                setSingleDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
