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
import { Plus, Search, MoreHorizontal, Edit, Eye, Trash2, Copy, Users } from 'lucide-react';
import { ApplicationForm } from '@/types/database';
import { format } from 'date-fns';

export default function FormManagement() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('application_forms')
      .select('*, department:departments(*)')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load forms');
    } else {
      setForms(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form? All applications will also be deleted.')) {
      return;
    }

    const { error } = await supabase.from('application_forms').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete form');
    } else {
      toast.success('Form deleted');
      fetchForms();
    }
  };

  const handleToggleActive = async (form: ApplicationForm) => {
    const { error } = await supabase
      .from('application_forms')
      .update({ is_active: !form.is_active })
      .eq('id', form.id);

    if (error) {
      toast.error('Failed to update form status');
    } else {
      toast.success(form.is_active ? 'Form deactivated' : 'Form activated');
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
        is_active: false,
        deadline: form.deadline,
      })
      .select()
      .single();

    if (error || !newForm) {
      toast.error('Failed to duplicate form');
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

    toast.success('Form duplicated');
    fetchForms();
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
          <h1 className="text-2xl font-bold">Application Forms</h1>
          <Button onClick={() => navigate('/admin/forms/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
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
                <TableHead>Deadline</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredForms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No forms found. Create your first application form.
                  </TableCell>
                </TableRow>
              ) : (
                filteredForms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{form.title}</p>
                        <p className="text-sm text-muted-foreground">/apply/{form.slug}</p>
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
                          <DropdownMenuItem onClick={() => navigate(`/admin/forms/${form.id}`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/apply/${form.slug}`, '_blank')}>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(`/admin/applications?form=${form.id}`)
                            }
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Applications
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(form)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(form)}>
                            {form.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(form.id)}
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
    </DashboardLayout>
  );
}
