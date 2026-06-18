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
import { Search, MoreHorizontal, Eye, Download, Trash2, LayoutGrid, List, Calendar, Sparkles, Clock, Video, MapPin, PhoneCall, Link2, Brain, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { Application, ApplicationForm, ApplicationStatus, FormField, Department } from '@/types/database';
import { format } from 'date-fns';

const statusColors: Record<ApplicationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  submitted: 'secondary',
  reviewing: 'outline',
  shortlisted: 'default',
  approved: 'default',
  rejected: 'destructive',
};

export default function JobApplicationManagement() {
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
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [aiScreeningLoading, setAiScreeningLoading] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('google-meet');
  const [interviewLink, setInterviewLink] = useState('');
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
    const { data } = await supabase
      .from('application_forms')
      .select('*')
      .eq('form_type', 'job')
      .order('title');
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
      .eq('form_type', 'job')
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
    setInterviewDate(app.interview_scheduled_at ? format(new Date(app.interview_scheduled_at), "yyyy-MM-dd'T'HH:mm") : '');
    setInterviewType(app.interview_type || 'google-meet');
    setInterviewLink(app.interview_meeting_link || '');
    await fetchResponses(app.id, app.form_id);
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
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
      
      if (app) {
        sendStatusNotification(app, status);
      }
    }
  };

  const sendStatusNotification = async (app: Application, newStatus: ApplicationStatus) => {
    try {
      let templateKey = 'job_application_status_changed';
      if (newStatus === 'approved') templateKey = 'job_application_approved';
      else if (newStatus === 'rejected') templateKey = 'job_application_rejected';
      else if (newStatus === 'shortlisted') templateKey = 'job_application_shortlisted';
      else if (newStatus === 'reviewing') templateKey = 'job_application_reviewing';

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
      const { error: respError } = await supabase
        .from('application_responses')
        .delete()
        .eq('application_id', id);
        
      if (respError) throw respError;

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

    const selectedApps = applications.filter(a => selectedApplications.includes(a.id));

    const { error } = await supabase
      .from('applications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .in('id', selectedApplications);

    if (error) {
      toast.error('Failed to update statuses');
    } else {
      toast.success(`${selectedApplications.length} applications updated`);
      
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
      const { error: respError } = await supabase
        .from('application_responses')
        .delete()
        .in('application_id', selectedApplications);
        
      if (respError) throw respError;

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

  const handleAIScreen = async (appId: string) => {
    setAiScreeningLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('screen-candidate', {
        body: { application_id: appId }
      });
      if (error) {
        toast.error(error.message || 'AI Screening failed');
      } else if (data && data.success) {
        toast.success('AI candidate screening complete!');
        fetchApplications();
        if (detailApplication?.id === appId) {
          const updatedScreening = JSON.stringify(data.screening);
          setDetailApplication(prev => prev ? { ...prev, ai_screening: updatedScreening } : null);
        }
      }
    } catch (err: any) {
      toast.error('AI screening request error: ' + err.message);
    } finally {
      setAiScreeningLoading(false);
    }
  };

  const handleSaveInterviewSchedule = async () => {
    if (!detailApplication) return;
    if (!interviewDate) {
      toast.error('Please select an interview date and time');
      return;
    }

    setSchedulingLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          interview_scheduled_at: new Date(interviewDate).toISOString(),
          interview_type: interviewType,
          interview_meeting_link: interviewLink,
        })
        .eq('id', detailApplication.id);

      if (error) {
        toast.error('Failed to schedule interview');
      } else {
        toast.success('Interview scheduled successfully');
        
        fetchApplications();
        setDetailApplication(prev => prev ? {
          ...prev,
          interview_scheduled_at: new Date(interviewDate).toISOString(),
          interview_type: interviewType,
          interview_meeting_link: interviewLink
        } : null);

        await supabase.functions.invoke('send-notification', {
          body: {
            template_key: 'job_application_interview_scheduled',
            recipient_email: detailApplication.applicant_email,
            recipient_phone: detailApplication.applicant_phone || undefined,
            data: {
              applicant_name: detailApplication.applicant_name,
              position: detailApplication.form?.title || 'Job Position',
              form_title: detailApplication.form?.title || 'Job Position',
              interview_time: format(new Date(interviewDate), 'PPPP p'),
              interview_type: interviewType === 'google-meet' ? 'Google Meet' : interviewType === 'zoom' ? 'Zoom' : interviewType === 'phone' ? 'Phone Call' : 'In Person',
              interview_link: interviewLink || 'N/A',
              company_name: 'DIGI5 LTD',
            }
          }
        });
      }
    } catch (err: any) {
      toast.error('Scheduling request error: ' + err.message);
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('applicationId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('applicationId');
    if (id) {
      await handleStatusChange(id, status);
    }
  };

  const handleExport = () => {
    const filtered = getFilteredApplications();
    const csv = [
      ['Name', 'Email', 'Phone', 'Job Form', 'Status', 'Applied Date'].join(','),
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
    a.download = `job-applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Job Applications</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded-md p-0.5 bg-background shadow-sm">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4 mr-1.5" />
                Table
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4 mr-1.5" />
                Kanban
              </Button>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
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
              <SelectValue placeholder="Filter by label/batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Labels</SelectItem>
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
              <SelectValue placeholder="Filter by job position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
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

        {viewMode === 'table' ? (
          <div className="border rounded-lg bg-card">
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
                  <TableHead>Position</TableHead>
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
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 select-none min-h-[500px] rounded-lg p-2"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              backgroundColor: '#fafafa'
            }}
          >
            {(['submitted', 'reviewing', 'shortlisted', 'approved', 'rejected'] as ApplicationStatus[]).map((status) => {
              const colApps = filteredApplications.filter(a => a.status === status);
              const headerLabels = {
                submitted: 'Submitted',
                reviewing: 'Reviewing',
                shortlisted: 'Shortlisted',
                approved: 'Approved',
                rejected: 'Rejected',
              };

              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className={`flex flex-col rounded-lg border p-3 min-h-[400px] backdrop-blur-sm transition-all duration-200 ${
                    status === 'submitted' ? 'border-blue-100 bg-blue-50/20' :
                    status === 'reviewing' ? 'border-amber-100 bg-amber-50/20' :
                    status === 'shortlisted' ? 'border-purple-100 bg-purple-50/20' :
                    status === 'approved' ? 'border-emerald-100 bg-emerald-50/20' :
                    'border-rose-100 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 pb-2 border-b">
                    <span className="font-semibold text-sm capitalize flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === 'submitted' ? 'bg-blue-500' :
                        status === 'reviewing' ? 'bg-amber-500' :
                        status === 'shortlisted' ? 'bg-purple-500' :
                        status === 'approved' ? 'bg-emerald-500' :
                        'bg-rose-500'
                      }`} />
                      {headerLabels[status]}
                    </span>
                    <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
                      {colApps.length}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {colApps.length === 0 ? (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-lg py-8 px-2 text-center text-xs text-muted-foreground/60 bg-background/50">
                        Drag cards here
                      </div>
                    ) : (
                      colApps.map((app) => (
                        <div
                          key={app.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onClick={() => handleViewDetails(app)}
                          className="p-3 bg-background border rounded-lg shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all duration-200 space-y-2 relative group"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-semibold text-sm leading-tight text-foreground block group-hover:text-primary transition-colors">
                              {app.applicant_name}
                            </span>
                            {app.skill_score !== null && app.skill_score !== undefined && (
                              <Badge variant="outline" className={`text-[10px] shrink-0 font-bold ${
                                app.skill_score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                app.skill_score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {app.skill_score}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground truncate">{app.applicant_email}</p>
                          
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded max-w-full truncate" title={app.form?.title}>
                              {app.form?.title}
                            </span>
                            {app.interview_scheduled_at && (
                              <Badge variant="outline" className="text-[9px] bg-primary/5 text-primary border-primary/20 flex items-center gap-1 px-1 py-0 shrink-0">
                                <Calendar className="h-2.5 w-2.5" />
                                Scheduled
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-dashed">
                            <span>{format(new Date(app.created_at), 'MMM d, yyyy')}</span>
                            {app.delivery_status && (
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                app.delivery_status.includes('failed') ? 'bg-red-500' :
                                app.delivery_status.includes('sent') ? 'bg-emerald-500' :
                                'bg-amber-500'
                              }`} title={app.delivery_status} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                      <p className="text-muted-foreground">Position</p>
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

                {/* AI Candidate Screening */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-1.5">
                      <Brain className="h-5 w-5 text-indigo-500" />
                      AI Candidate Screening
                    </h3>
                    {detailApplication.ai_screening && (
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 animate-pulse text-indigo-500" />
                        Screened
                      </Badge>
                    )}
                  </div>

                  {detailApplication.ai_screening ? (() => {
                    let screening = { fit_score: 0, summary: '', questions: [] };
                    try {
                      screening = JSON.parse(detailApplication.ai_screening);
                    } catch(e) {
                      console.error(e);
                    }
                    
                    return (
                      <div className="space-y-4 p-4 border rounded-lg bg-indigo-50/20 border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-sm ${
                            screening.fit_score >= 80 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                            screening.fit_score >= 50 ? 'bg-amber-50 border-amber-300 text-amber-700' :
                            'bg-rose-50 border-rose-300 text-rose-700'
                          }`}>
                            <span className="text-lg font-bold leading-none">{screening.fit_score}</span>
                            <span className="text-[8px] uppercase tracking-wider font-semibold opacity-85">Match</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">Fit Evaluation</p>
                            <p className="text-xs text-muted-foreground">
                              {screening.fit_score >= 80 ? 'Highly recommended candidate.' :
                               screening.fit_score >= 50 ? 'Good potential, matches basic criteria.' :
                               'Low match, proceed with caution.'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Executive Summary</p>
                          <blockquote className="text-sm border-l-2 border-indigo-400 pl-3 italic text-muted-foreground leading-relaxed">
                            "{screening.summary}"
                          </blockquote>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tailored Interview Questions</p>
                          <ul className="space-y-1.5">
                            {screening.questions?.map((q: string, idx: number) => (
                              <li key={idx} className="text-xs text-foreground flex items-start gap-1.5 leading-normal">
                                <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAIScreen(detailApplication.id)}
                          disabled={aiScreeningLoading}
                          className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50/50"
                        >
                          {aiScreeningLoading ? 'Re-analyzing application...' : 'Re-run AI Analysis'}
                        </Button>
                      </div>
                    );
                  })() : (
                    <div className="p-4 border border-dashed rounded-lg text-center space-y-3 bg-muted/30">
                      <Brain className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold">Generate fit analysis using Gemini AI</p>
                        <p className="text-xs text-muted-foreground">This will analyze application responses to generate a fit score, summary, and questions.</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAIScreen(detailApplication.id)}
                        disabled={aiScreeningLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {aiScreeningLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            AI Screening Candidate...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Screen Candidate with AI
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Interview Scheduler */}
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold flex items-center gap-1.5">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Interview Scheduler
                  </h3>
                  <div className="space-y-3 p-4 border rounded-lg bg-card shadow-sm space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Interview Date & Time</label>
                      <div className="relative">
                        <Input
                          type="datetime-local"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="w-full pl-3"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Interview Type</label>
                      <Select value={interviewType} onValueChange={setInterviewType}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google-meet">Google Meet (Online)</SelectItem>
                          <SelectItem value="zoom">Zoom (Online)</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="in-person">In Person (At Office)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Meeting Link / Location</label>
                      <Input
                        type="text"
                        placeholder="e.g. Google Meet link or Office address"
                        value={interviewLink}
                        onChange={(e) => setInterviewLink(e.target.value)}
                        className="w-full"
                      />
                    </div>

                    <Button 
                      onClick={handleSaveInterviewSchedule}
                      disabled={schedulingLoading}
                      size="sm"
                      className="w-full bg-primary text-primary-foreground"
                    >
                      {schedulingLoading ? 'Scheduling...' : 'Save & Send Schedule Notification'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
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
