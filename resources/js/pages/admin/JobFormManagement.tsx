import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, Copy, Users, Loader2, Share2, QrCode, Check, Sparkles } from 'lucide-react';
import { generateMockApplication } from '@/lib/mockGenerator';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ApplicationForm } from '@/types/database';
import { format } from 'date-fns';

export default function JobFormManagement() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Share Dialog states
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ApplicationForm | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('application_forms')
      .select('*, department:departments(*)')
      .eq('form_type', 'job')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load job forms');
    } else {
      setForms(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);

    const { error } = await supabase.from('application_forms').delete().eq('id', deletingId);
    if (error) {
      toast.error('Failed to delete job form');
    } else {
      toast.success('Job form deleted');
      fetchForms();
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleToggleActive = async (form: ApplicationForm) => {
    const { error } = await supabase
      .from('application_forms')
      .update({ is_active: !form.is_active })
      .eq('id', form.id);

    if (error) {
      toast.error('Failed to update form status');
    } else {
      toast.success(form.is_active ? 'Job form deactivated' : 'Job form activated');
      fetchForms();
    }
  };

  const handleDuplicate = async (form: ApplicationForm) => {
    // First get the form fields
    const { data: fields } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', form.id);

    // Create new form
    const { data: newForm, error } = await supabase
      .from('application_forms')
      .insert({
        title: `${form.title} (Copy)`,
        description: form.description,
        slug: `${form.slug}-copy-${Date.now()}`,
        department_id: form.department_id,
        form_type: 'job',
        is_active: false,
        deadline: form.deadline,
        salary_range: form.salary_range,
        facilities: form.facilities,
        auto_screening: form.auto_screening,
        seo_meta: form.seo_meta,
      })
      .select()
      .single();

    if (error || !newForm) {
      toast.error('Failed to duplicate job form');
      return;
    }

    // Copy fields
    if (fields && fields.length > 0) {
      const newFields = fields.map((f) => ({
        form_id: newForm.id,
        field_type: f.field_type,
        label: f.label,
        placeholder: f.placeholder,
        is_required: f.is_required,
        options: f.options,
        validation_rules: f.validation_rules,
        display_order: f.display_order,
      }));

      await supabase.from('form_fields').insert(newFields);
    }

    toast.success('Job form duplicated');
    fetchForms();
  };

  const handleGenerateAIApplication = async (form: ApplicationForm) => {
    const toastId = toast.loading(`Generating mock application for "${form.title}"...`);
    try {
      await generateMockApplication(form);
      toast.success('Mock application generated successfully!', { id: toastId });
      fetchForms();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate mock application.', { id: toastId });
    }
  };

  const filteredForms = forms.filter(
    (form) =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Job Forms</h1>
          <Button onClick={() => navigate('/admin/job-forms/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Job Form
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Salary Range</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No job forms found. Create your first job posting form.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.title}</p>
                        <p className="text-sm text-muted-foreground">/apply/job/{form.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {form.department?.name || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.is_active ? 'default' : 'secondary'}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {form.salary_range || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {form.deadline ? format(new Date(form.deadline), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>{format(new Date(form.created_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/job-forms/${form.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/apply/job/${form.slug}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedForm(form);
                            setShareDialogOpen(true);
                          }}>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share & QR
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/job-applications?form=${form.id}`)
                            }
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGenerateAIApplication(form)}>
                            <Sparkles className="h-4 w-4 mr-2 text-primary animate-pulse" />
                            Generate AI Application
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(form)}>
                            {form.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingId(form.id);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this job form. All job applicant submissions and files associated with this form will be lost forever.
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
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Job Post
            </DialogTitle>
            <DialogDescription>
              Anyone with this link can view the details and apply for this job.
            </DialogDescription>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-6 py-4 flex flex-col items-center">
              {/* QR Code Container */}
              <div className="border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl bg-white flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-shadow">
                <img
                  src={`https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
                    `${window.location.origin}/apply/job/${selectedForm.slug}`
                  )}`}
                  alt="Job Apply QR Code"
                  className="w-[180px] h-[180px] object-contain rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
                      `${window.location.origin}/apply/job/${selectedForm.slug}`
                    )}`;
                    try {
                      const response = await fetch(qrUrl);
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `qr-${selectedForm.slug}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      window.open(qrUrl, '_blank');
                    }
                  }}
                  className="h-8 text-[11px] flex items-center gap-1 border-slate-200 dark:border-zinc-800 hover:bg-accent/40"
                >
                  <QrCode className="h-3 w-3" />
                  Download QR Code
                </Button>
              </div>

              {/* Link Input & Copy */}
              <div className="flex items-center gap-2 w-full">
                <Input
                  value={`${window.location.origin}/apply/job/${selectedForm.slug}`}
                  readOnly
                  className="flex-1 h-9 text-xs border-slate-200 dark:border-zinc-800 bg-muted/30"
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/apply/job/${selectedForm.slug}`
                    );
                    setCopied(true);
                    toast.success('Share link copied to clipboard!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="h-9 w-9 border border-slate-200 dark:border-zinc-800 bg-background hover:bg-accent/60"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setShareDialogOpen(false)} className="text-xs h-9 bg-primary text-white">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
