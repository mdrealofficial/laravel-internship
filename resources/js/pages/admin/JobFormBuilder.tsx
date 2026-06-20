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
import { Save, ArrowLeft, Eye, Plus, Trash2, Sparkles, Copy, Check, QrCode, AlertCircle, Info, Share2, Award } from 'lucide-react';
import { Department, FormFieldType } from '@/types/database';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

interface AutoScreeningRules {
  enabled: boolean;
  minScore: number;
  passStatus: string;
  failStatus: string;
}

interface SeoMetaConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

const JOB_PRESETS: Record<string, {
  name: string;
  title: string;
  description: string;
  salaryRange: string;
  facilities: string[];
  fields: CanvasField[];
}> = {
  'web-developer': {
    name: 'Web Developer',
    title: 'Web Developer',
    description: 'We are seeking a talented Web Developer to join our growing team. You will be responsible for building, optimizing, and maintaining user-friendly web applications. You should have strong skills in HTML, CSS, JavaScript, and modern frameworks like React.',
    salaryRange: 'BDT 45,000 - 70,000',
    facilities: ['Flexible Working Hours', 'Remote Work Friendly', 'Weekly Lunch & Snacks', 'Learning & Development Budget'],
    fields: [
      { id: 'q-web-exp', type: 'number', label: 'Years of Web Development Experience', placeholder: 'e.g. 2', isRequired: true, options: [] },
      { id: 'q-web-react', type: 'range', label: 'React Experience Level (1-10)', placeholder: '', isRequired: true, options: ['1', '10', '1'] },
      { id: 'q-web-portfolio', type: 'text', label: 'Portfolio or GitHub Link', placeholder: 'https://...', isRequired: true, options: [] },
      { id: 'q-web-challenge', type: 'textarea', label: 'Briefly describe your most challenging web project', placeholder: 'Explain what you built and how you solved difficulties...', isRequired: false, options: [] },
    ]
  },
  'graphic-designer': {
    name: 'Graphic Designer',
    title: 'Graphic Designer',
    description: 'We are looking for a creative Graphic Designer to craft engaging visual content for marketing, social media, and brand identity. You should be proficient in Photoshop, Illustrator, and Figma, with a strong eye for detail.',
    salaryRange: 'BDT 35,000 - 50,000',
    facilities: ['Creative Working Environment', 'Annual Bonus', 'Health Insurance Coverage', 'Paid Time Off'],
    fields: [
      { id: 'q-design-portfolio', type: 'text', label: 'Behance or Dribbble Portfolio Link', placeholder: 'https://...', isRequired: true, options: [] },
      { id: 'q-design-exp', type: 'number', label: 'Years of Graphic Design Experience', placeholder: 'e.g. 1', isRequired: true, options: [] },
      { id: 'q-design-tools', type: 'text', label: 'Favorite design tools/software', placeholder: 'Figma, Illustrator, etc.', isRequired: true, options: [] },
      { id: 'q-design-process', type: 'textarea', label: 'Describe your creative process from initial brief to final review', placeholder: 'Your methodology...', isRequired: false, options: [] },
    ]
  },
  'digital-marketer': {
    name: 'Digital Marketer',
    title: 'Digital Marketer',
    description: 'We are hiring a Digital Marketer to design, execute, and monitor online marketing campaigns. Key duties include managing social media platforms, executing search engine optimization (SEO), and configuring paid ads on Facebook and Google.',
    salaryRange: 'BDT 40,000 - 60,000',
    facilities: ['Performance-based Bonuses', 'Home Office Allowance', 'Skill Development Sponsorship', 'Two Festival Bonuses'],
    fields: [
      { id: 'q-mark-exp', type: 'number', label: 'Years of Digital Marketing Experience', placeholder: 'e.g. 3', isRequired: true, options: [] },
      { id: 'q-mark-ads', type: 'textarea', label: 'Describe your experience with paid ad campaigns and average budgets managed', placeholder: 'Google Ads, FB Ads...', isRequired: true, options: [] },
      { id: 'q-mark-seo', type: 'select', label: 'Do you have experience with SEO tools (Ahrefs, SEMrush, etc.)?', placeholder: '', isRequired: true, options: ['Yes, extensively', 'Yes, basic knowledge', 'No'] },
      { id: 'q-mark-copy', type: 'text', label: 'Link to copywriting samples or portfolio', placeholder: 'https://...', isRequired: false, options: [] },
    ]
  }
};

export default function JobFormBuilder() {
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
  const [startDate, setStartDate] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<CanvasField | null>(null);
  const [saving, setSaving] = useState(false);

  // AI Generator Dialog state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');

  // Preset Template confirmation dialog state
  const [presetConfirmOpen, setPresetConfirmOpen] = useState(false);
  const [selectedPresetKey, setSelectedPresetKey] = useState('');

  // Auto-Screening state
  const [autoScreening, setAutoScreening] = useState<AutoScreeningRules>({
    enabled: false,
    minScore: 70,
    passStatus: 'shortlisted',
    failStatus: 'rejected',
  });

  // SEO & Social state
  const [seoMeta, setSeoMeta] = useState<SeoMetaConfig>({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });

  // Share Dialog state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    fetchDepartments();
    fetchApiKey();
    if (isEditing) {
      fetchForm();
    }
  }, [id]);

  const fetchApiKey = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .eq('setting_key', 'gemini_api_key')
        .maybeSingle();
      if (data) {
        setGeminiApiKey(data.setting_value || '');
      }
    } catch (e) {
      console.error('Failed to fetch Gemini API Key:', e);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };

  const fetchForm = async () => {
    const { data: form } = await supabase
      .from('application_forms')
      .select('*, form_fields:form_fields(*)')
      .eq('id', id)
      .eq('form_type', 'job')
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
      setStartDate(form.start_date ? form.start_date.split('T')[0] : '');
      setSalaryRange(form.salary_range || '');
      setFacilities(form.facilities || []);
      setAutoScreening(form.auto_screening || {
        enabled: false,
        minScore: 70,
        passStatus: 'shortlisted',
        failStatus: 'rejected',
      });
      setSeoMeta(form.seo_meta || {
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
      });
      
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

  const handleLoadPreset = () => {
    const preset = JOB_PRESETS[selectedPresetKey];
    if (!preset) return;

    setFormTitle(preset.title);
    setFormDescription(preset.description);
    setSalaryRange(preset.salaryRange);
    setFacilities(preset.facilities);
    setFields(preset.fields);
    setFormSlug(generateSlug(preset.title));

    setSeoMeta({
      metaTitle: `${preset.title} Hiring`,
      metaDescription: `Apply now for the ${preset.title} position at our company. We offer attractive benefits and competitive packages.`,
      metaKeywords: `${preset.title.toLowerCase()}, job opportunity, hiring, career`,
    });

    toast.success(`${preset.name} preset loaded successfully`);
    setPresetConfirmOpen(false);
  };

  const handleGenerateAI = async () => {
    if (!geminiApiKey) {
      toast.error('Gemini API key is not configured. Please add your key in the Admin Settings -> Branding panel first.');
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `Generate a detailed, professional job description for a "${formTitle || 'Job Position'}" role with focus keywords: "${aiKeywords}". The tone should be ${aiTone}. Format it with clear sections: "About the Role", "Key Responsibilities", and "Requirements". Do NOT use markdown like asterisks or hashtags since this will be pasted into a plain textarea. Keep it under 250 words.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error('Gemini API request failed.');
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        setAiResult(generatedText.trim());
      } else {
        throw new Error('No content received from Gemini.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate job description');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formSlug.trim()) {
      toast.error('Please enter a title and slug');
      return;
    }

    setSaving(true);

    try {
      let formId = id;

      const payload = {
        title: formTitle,
        batch_name: batchName || null,
        description: formDescription || null,
        slug: formSlug,
        department_id: departmentId || null,
        is_multi_department: isMultiDepartment,
        allowed_departments: allowedDepartments.length > 0 ? allowedDepartments : null,
        is_active: isActive,
        deadline: deadline || null,
        start_date: startDate || null,
        form_type: 'job',
        salary_range: salaryRange || null,
        is_paid: false,
        stipend_amount: null,
        facilities: facilities.length > 0 ? facilities : null,
        auto_screening: autoScreening,
        seo_meta: seoMeta,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('application_forms')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        await supabase.from('form_fields').delete().eq('form_id', id);
      } else {
        const { data: newForm, error } = await supabase
          .from('application_forms')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        formId = newForm.id;
      }

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

      toast.success(isEditing ? 'Job form updated successfully' : 'Job form created successfully');
      navigate('/admin/job-forms');
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Failed to save job form');
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = `${window.location.origin}/apply/job/${formSlug}`;
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(shareUrl)}`;

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Share link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${formSlug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(qrUrl, '_blank');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/job-forms')} className="hover:bg-accent/60">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Job Form' : 'Create Job Form'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="flex items-center gap-2 border-slate-200 dark:border-zinc-800">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" onClick={() => window.open(`/apply/job/${formSlug}`, '_blank')} className="border-slate-200 dark:border-zinc-800">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/95 text-white">
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
            <div className="col-span-4 space-y-6">
              <Tabs defaultValue="fields" className="w-full">
                <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-xl">
                  <TabsTrigger value="fields" className="rounded-lg text-xs py-2">Fields</TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-lg text-xs py-2">Settings</TabsTrigger>
                  <TabsTrigger value="rules" className="rounded-lg text-xs py-2">Rules & SEO</TabsTrigger>
                </TabsList>
                
                <TabsContent value="fields" className="mt-4 space-y-4">
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Plus className="h-4 w-4 text-primary" />
                        Form Fields
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FieldPalette />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4 space-y-4">
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">General Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Title & Slug */}
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-semibold">Job Title</Label>
                        <Input
                          id="title"
                          value={formTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="h-9 text-sm"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-xs font-semibold">URL Slug</Label>
                        <Input
                          id="slug"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="job-url-slug"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="batch" className="text-xs font-semibold">Batch / Department Label</Label>
                        <Input
                          id="batch"
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          placeholder="e.g. Q3 Hiring, Tech Team"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="description" className="text-xs font-semibold">Job Description</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!geminiApiKey) {
                                toast.error('Please configure your Gemini API Key in Settings page first.');
                              } else {
                                setAiDialogOpen(true);
                              }
                            }}
                            className="h-6 text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 px-1.5 hover:bg-primary/5"
                          >
                            <Sparkles className="h-3 w-3" />
                            AI Write
                          </Button>
                        </div>
                        <Textarea
                          id="description"
                          value={formDescription}
                          onChange={(e) => setFormDescription(e.target.value)}
                          placeholder="Brief description of the job role"
                          rows={4}
                          className="text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-zinc-800">
                        <Label htmlFor="multi-dept" className="text-xs font-semibold">Allow Multi-Department</Label>
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
                          <Label htmlFor="department" className="text-xs font-semibold">Department</Label>
                          <Select value={departmentId || 'none'} onValueChange={(v) => setDepartmentId(v === 'none' ? '' : v)}>
                            <SelectTrigger className="h-9 text-xs">
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
                          <Label className="text-xs font-semibold">Allowed Departments</Label>
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
                        <Label htmlFor="deadline" className="text-xs font-semibold">Application Deadline</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="start-date" className="text-xs font-semibold">Expected Joining Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="active" className="text-xs font-semibold">Active Status</Label>
                        <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rules" className="mt-4 space-y-4">
                  {/* Presets Card */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm bg-gradient-to-r from-amber-500/5 to-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Role Presets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Instantly populate job description, perks, salary, and screening questions.
                      </p>
                      <Select value={selectedPresetKey} onValueChange={setSelectedPresetKey}>
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="Choose a preset role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(JOB_PRESETS).map((key) => (
                            <SelectItem key={key} value={key} className="text-xs">
                              {JOB_PRESETS[key].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full text-xs h-9"
                        disabled={!selectedPresetKey}
                        onClick={() => setPresetConfirmOpen(true)}
                      >
                        Load Role Template
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Compensation & Benefits */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Compensation & Perks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="salary-range" className="text-xs font-semibold">Salary Range</Label>
                        <Input
                          id="salary-range"
                          value={salaryRange}
                          onChange={(e) => setSalaryRange(e.target.value)}
                          placeholder="e.g. BDT 40k - 50k or Negotiable"
                          className="h-9 text-xs"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">Job Benefits / Perks</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newFacility}
                            onChange={(e) => setNewFacility(e.target.value)}
                            placeholder="Add benefit..."
                            className="h-8 text-xs flex-1"
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
                            className="h-8 w-8"
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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {facilities.map((f, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] py-0.5 px-2 flex items-center gap-1">
                                <span className="truncate max-w-[120px]">{f}</span>
                                <button
                                  type="button"
                                  onClick={() => setFacilities(facilities.filter((_, idx) => idx !== i))}
                                  className="text-muted-foreground hover:text-foreground font-bold"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Auto-Screening Card */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        Auto-Screening Rules
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <Label htmlFor="auto-screen-enabled" className="text-xs font-semibold cursor-pointer">
                          Enable Auto-Screening
                        </Label>
                        <Switch
                          id="auto-screen-enabled"
                          checked={autoScreening.enabled}
                          onCheckedChange={(checked) => setAutoScreening({ ...autoScreening, enabled: checked })}
                        />
                      </div>
                      
                      {autoScreening.enabled ? (
                        <div className="space-y-3 pt-1">
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Auto-screening filters candidates based on their Skill Score computed from the <strong>Department Skills</strong> field.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="min-score" className="text-xs font-semibold">Min Skill Score Threshold ({autoScreening.minScore}%)</Label>
                            <div className="flex items-center gap-4">
                              <input
                                id="min-score"
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={autoScreening.minScore}
                                onChange={(e) => setAutoScreening({ ...autoScreening, minScore: Number(e.target.value) })}
                                className="flex-1 accent-primary"
                              />
                              <span className="text-xs font-bold w-8 text-right">{autoScreening.minScore}%</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pass-status" className="text-xs font-semibold">Status when Passed</Label>
                            <Select
                              value={autoScreening.passStatus}
                              onValueChange={(val) => setAutoScreening({ ...autoScreening, passStatus: val })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shortlisted" className="text-xs">Shortlisted</SelectItem>
                                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                                <SelectItem value="reviewing" className="text-xs">Reviewing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fail-status" className="text-xs font-semibold">Status when Failed</Label>
                            <Select
                              value={autoScreening.failStatus}
                              onValueChange={(val) => setAutoScreening({ ...autoScreening, failStatus: val })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                                <SelectItem value="submitted" className="text-xs">Submitted (No Action)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-2">
                          Auto-screening is disabled.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* SEO & Meta Card */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Award className="h-4 w-4 text-emerald-500" />
                        SEO & Social Meta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="meta-title" className="text-xs font-semibold">SEO Title</Label>
                        <Input
                          id="meta-title"
                          value={seoMeta.metaTitle}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaTitle: e.target.value })}
                          placeholder="e.g. Apply for Web Developer"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="meta-desc" className="text-xs font-semibold">SEO Meta Description</Label>
                        <Textarea
                          id="meta-desc"
                          value={seoMeta.metaDescription}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaDescription: e.target.value })}
                          placeholder="e.g. Join our team as a Web Developer. Competitive salary and outstanding perks..."
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="meta-keywords" className="text-xs font-semibold">SEO Keywords</Label>
                        <Input
                          id="meta-keywords"
                          value={seoMeta.metaKeywords}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaKeywords: e.target.value })}
                          placeholder="e.g. developer, react, jobs"
                          className="h-8 text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right - Form Canvas */}
            <div className="col-span-8">
              <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
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

      {/* Preset template confirmation dialog */}
      <AlertDialog open={presetConfirmOpen} onOpenChange={setPresetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Loading a preset will replace the current job title, description, salary, perks, and screening questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadPreset} className="bg-primary text-white hover:bg-primary/95">
              Confirm Load
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI generator dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              AI Job Description Writer
            </DialogTitle>
            <DialogDescription>
              Generate a high-quality job description instantly using Google Gemini AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-title" className="text-xs font-semibold">Job Title</Label>
              <Input
                id="ai-title"
                value={formTitle}
                disabled
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-keywords" className="text-xs font-semibold">Focus Keywords & Requirements</Label>
              <Textarea
                id="ai-keywords"
                placeholder="e.g. React, Next.js, TypeScript, 3 years experience, flexible, team player"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-tone" className="text-xs font-semibold">Tone of Voice</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional" className="text-xs">Professional & Formal</SelectItem>
                  <SelectItem value="casual" className="text-xs">Friendly & Casual</SelectItem>
                  <SelectItem value="tech-oriented" className="text-xs">Tech-focused & Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aiResult && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs font-semibold">Generated Description Preview</Label>
                <div className="max-h-[160px] overflow-y-auto border rounded-md p-3 text-xs bg-muted/30 whitespace-pre-wrap leading-relaxed">
                  {aiResult}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between w-full sm:justify-between">
            {aiResult ? (
              <Button type="button" variant="outline" onClick={() => setAiResult('')} className="text-xs h-9">
                Clear Result
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {aiResult ? (
                <>
                  <Button type="button" variant="outline" onClick={handleGenerateAI} disabled={aiLoading} className="text-xs h-9">
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                    Regenerate
                  </Button>
                  <Button type="button" onClick={applyGeneratedDescription} className="text-xs h-9 bg-primary text-white hover:bg-primary/95">
                    Insert Description
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setAiDialogOpen(false)} className="text-xs h-9">
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleGenerateAI} disabled={aiLoading} className="text-xs h-9 bg-primary text-white hover:bg-primary/95">
                    {aiLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-2" />
                        Generate AI Copy
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <div className="space-y-6 py-4 flex flex-col items-center">
            {/* QR Code Container */}
            <div className="border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl bg-white flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-shadow">
              <img
                src={qrUrl}
                alt="Job Apply QR Code"
                className="w-[180px] h-[180px] object-contain rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadQrCode}
                className="h-8 text-[11px] flex items-center gap-1 border-slate-200 dark:border-zinc-800 hover:bg-accent/40"
              >
                <QrCode className="h-3 w-3" />
                Download QR Code
              </Button>
            </div>

            {/* Link Input & Copy */}
            <div className="flex items-center gap-2 w-full">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 h-9 text-xs border-slate-200 dark:border-zinc-800 bg-muted/30"
              />
              <Button
                type="button"
                size="icon"
                onClick={copyShareLink}
                className="h-9 w-9 border border-slate-200 dark:border-zinc-800 bg-background hover:bg-accent/60"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
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
