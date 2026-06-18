import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FieldPalette } from '@/components/forms/FieldPalette';
import { FormCanvas, CanvasField } from '@/components/forms/FormCanvas';
import { FieldConfigModal } from '@/components/forms/FieldConfigModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, ArrowLeft, Eye, Plus, Trash2 } from 'lucide-react';
import { Department, FormFieldType } from '@/types/database';

// System fields (Name, Email, Phone) are hardcoded in ApplicationForm
// and don't need to be added to form_fields table

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isMultiDepartment, setIsMultiDepartment] = useState(false);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [stipendAmount, setStipendAmount] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<CanvasField | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    fetchDepartments();
    if (isEditing) {
      fetchForm();
    }
  }, [id]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };

  const fetchForm = async () => {
    const { data: form } = await supabase
      .from('application_forms')
      .select('*, form_fields:form_fields(*)')
      .eq('id', id)
      .single();

    if (form) {
      setFormTitle(form.title);
      setBatchName(form.batch_name || '');
      setFormDescription(form.description || '');
      setFormSlug(form.slug);
      setDepartmentId(form.department_id || '');
      setIsMultiDepartment(form.is_multi_department ?? false);
      setAllowedDepartments(form.allowed_departments || []);
      setIsActive(form.is_active ?? true);
      setDeadline(form.deadline ? form.deadline.split('T')[0] : '');
      setIsPaid(form.is_paid ?? false);
      setStipendAmount(form.stipend_amount ? String(form.stipend_amount) : '');
      setFacilities(form.facilities || []);
      
      // Filter out any old system fields that may have been saved
      const customFields = (form.form_fields || [])
        .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)
        .filter((f: { validation_rules: { isSystemField?: boolean } | null }) => !f.validation_rules?.isSystemField)
        .map((f: { id: string; field_type: FormFieldType; label: string; placeholder: string | null; is_required: boolean | null; options: string[] | null }) => ({
          id: f.id,
          type: f.field_type,
          label: f.label,
          placeholder: f.placeholder || '',
          isRequired: f.is_required ?? false,
          options: f.options || [],
        }));
      
      setFields(customFields);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setFormTitle(value);
    if (!isEditing) {
      setFormSlug(generateSlug(value));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle new field from palette
    if (String(active.id).startsWith('palette-')) {
      const fieldType = active.data.current?.type as FormFieldType;
      const newField: CanvasField = {
        id: `field-${Date.now()}`,
        type: fieldType,
        label: fieldType === 'skills' ? 'Skills' : `New ${fieldType} field`,
        placeholder: '',
        isRequired: false,
        options: fieldType === 'range' ? ['0', '100', '1'] : [],
      };
      setFields([...fields, newField]);
      setEditingField(newField);
      return;
    }

    // Handle reordering
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        setFields(arrayMove(fields, oldIndex, newIndex));
      }
    }
  };

  const handleSaveField = (updatedField: CanvasField) => {
    setFields(fields.map((f) => (f.id === updatedField.id ? updatedField : f)));
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formSlug.trim()) {
      toast.error('Please enter a title and slug');
      return;
    }

    setSaving(true);

    try {
      let formId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('application_forms')
          .update({
            title: formTitle,
            batch_name: batchName || null,
            description: formDescription || null,
            slug: formSlug,
            department_id: departmentId || null,
            is_multi_department: isMultiDepartment,
            allowed_departments: allowedDepartments.length > 0 ? allowedDepartments : null,
            is_active: isActive,
            deadline: deadline || null,
            is_paid: isPaid,
            stipend_amount: isPaid && stipendAmount ? parseFloat(stipendAmount) : null,
            facilities: facilities.length > 0 ? facilities : null,
          })
          .eq('id', id);

        if (error) throw error;

        // Delete existing fields and re-insert
        await supabase.from('form_fields').delete().eq('form_id', id);
      } else {
        const { data: newForm, error } = await supabase
          .from('application_forms')
          .insert({
            title: formTitle,
            batch_name: batchName || null,
            description: formDescription || null,
            slug: formSlug,
            department_id: departmentId || null,
            is_multi_department: isMultiDepartment,
            allowed_departments: allowedDepartments.length > 0 ? allowedDepartments : null,
            is_active: isActive,
            deadline: deadline || null,
            is_paid: isPaid,
            stipend_amount: isPaid && stipendAmount ? parseFloat(stipendAmount) : null,
            facilities: facilities.length > 0 ? facilities : null,
          })
          .select()
          .single();

        if (error) throw error;
        formId = newForm.id;
      }

      // Insert custom fields only (system fields are hardcoded in ApplicationForm)
      if (fields.length > 0 && formId) {
        const fieldsToInsert = fields.map((f, index) => ({
          form_id: formId,
          field_type: f.type,
          label: f.label,
          placeholder: f.placeholder || null,
          is_required: f.isRequired,
          options: f.options.length > 0 ? f.options : null,
          display_order: index,
          validation_rules: null,
        }));

        const { error: fieldsError } = await supabase.from('form_fields').insert(fieldsToInsert);
        if (fieldsError) throw fieldsError;
      }

      toast.success(isEditing ? 'Form updated successfully' : 'Form created successfully');
      navigate('/admin/forms');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/forms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Form' : 'Create Application Form'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="outline" onClick={() => window.open(`/apply/${formSlug}`, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Form Settings & Field Palette */}
            <div className="col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Application Form Title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch">Batch Name</Label>
                    <Input
                      id="batch"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g. Batch 1, Summer 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      placeholder="form-url-slug"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Brief description of this form"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between pb-2 border-b">
                    <Label htmlFor="multi-dept">Allow Multi-Department</Label>
                    <Switch
                      id="multi-dept"
                      checked={isMultiDepartment}
                      onCheckedChange={(checked) => {
                        setIsMultiDepartment(checked);
                        if (checked) {
                          setDepartmentId('');
                        } else {
                          setAllowedDepartments([]);
                        }
                      }}
                    />
                  </div>

                  {!isMultiDepartment ? (
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={departmentId || 'none'} onValueChange={(v) => setDepartmentId(v === 'none' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Allowed Departments</Label>
                      <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                        {departments.map((dept) => {
                          const checked = allowedDepartments.includes(dept.id);
                          return (
                            <div key={dept.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dept-${dept.id}`}
                                checked={checked}
                                onCheckedChange={(isChecked) => {
                                  if (isChecked) {
                                    setAllowedDepartments([...allowedDepartments, dept.id]);
                                  } else {
                                    setAllowedDepartments(allowedDepartments.filter(id => id !== dept.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`dept-${dept.id}`} className="text-xs cursor-pointer">
                                {dept.name}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="active">Active</Label>
                    <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  {/* Internship Type */}
                  <div className="border-t pt-3 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Internship Type</p>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is-paid">Paid Internship</Label>
                      <Switch
                        id="is-paid"
                        checked={isPaid}
                        onCheckedChange={(checked) => {
                          setIsPaid(checked);
                          if (!checked) setStipendAmount('');
                        }}
                      />
                    </div>
                    {isPaid && (
                      <div className="space-y-2">
                        <Label htmlFor="stipend">Stipend Amount (BDT/month)</Label>
                        <Input
                          id="stipend"
                          type="number"
                          min="0"
                          value={stipendAmount}
                          onChange={(e) => setStipendAmount(e.target.value)}
                          placeholder="e.g. 5000"
                        />
                      </div>
                    )}
                  </div>

                  {/* Facilities */}
                  <div className="space-y-2">
                    <Label>Facilities / Perks</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        placeholder="Add a facility..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newFacility.trim()) {
                              setFacilities([...facilities, newFacility.trim()]);
                              setNewFacility('');
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          if (newFacility.trim()) {
                            setFacilities([...facilities, newFacility.trim()]);
                            setNewFacility('');
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {facilities.length > 0 && (
                      <ul className="space-y-1 mt-1">
                        {facilities.map((f, i) => (
                          <li key={i} className="flex items-center justify-between text-xs bg-muted rounded px-2 py-1">
                            <span className="truncate">{f}</span>
                            <button
                              type="button"
                              className="ml-2 text-destructive hover:text-destructive/80"
                              onClick={() => setFacilities(facilities.filter((_, idx) => idx !== i))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Field Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <FieldPalette />
                </CardContent>
              </Card>
            </div>

            {/* Right - Form Canvas */}
            <div className="col-span-9">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Questions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Drag fields from the palette to add custom questions. Basic info (Name, Email, Phone) is collected automatically.
                  </p>
                </CardHeader>
                <CardContent>
                  <FormCanvas
                    fields={fields}
                    onEditField={setEditingField}
                    onDeleteField={handleDeleteField}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
          <DragOverlay>
            {activeId && activeId.startsWith('palette-') && (
              <div className="p-3 bg-card border border-primary rounded-lg shadow-lg">
                Dragging field...
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <FieldConfigModal
        field={editingField}
        open={!!editingField}
        onClose={() => setEditingField(null)}
        onSave={handleSaveField}
        isMultiDepartment={isMultiDepartment}
        allowedDepartments={allowedDepartments}
        formDepartmentId={departmentId}
      />
    </DashboardLayout>
  );
}
