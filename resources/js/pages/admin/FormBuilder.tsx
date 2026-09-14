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
import { Save, ArrowLeft, Eye, Plus, Trash2, Sparkles, Copy, Check, QrCode, AlertCircle, Info, Share2, Bold, Italic, Heading, List, Edit2, Loader2 } from 'lucide-react';
import { Department, FormFieldType } from '@/types/database';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FormattedText } from '@/components/FormattedText';
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

const INTERN_PRESETS: Record<string, {
  name: string;
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  preferredSkills: string;
  benefits: string;
  isPaid: boolean;
  stipendAmount: string;
  facilities: string[];
  fields: CanvasField[];
}> = {
  'software-engineering-intern': {
    name: 'Software Engineering Intern',
    title: 'Software Engineering Intern',
    description: 'We are seeking a Software Engineering Intern to join our product development team. You will work alongside senior engineers to design, code, and test new features.',
    responsibilities: '- Assist in designing, coding, and testing new software features.\n- Participate in code reviews and team standups.\n- Debug and resolve software issues.',
    requirements: '- Basic understanding of programming fundamentals and data structures.\n- Familiarity with web technologies (HTML, CSS, JavaScript).\n- Willingness to learn and collaborate.',
    preferredSkills: '- Experience with React or Node.js.\n- Familiarity with SQL or MongoDB.\n- Contributions to open-source projects.',
    benefits: '- Mentorship from senior software engineers.\n- Hands-on experience with real-world products.\n- Certificate of completion and potential full-time offer.',
    isPaid: true,
    stipendAmount: '8000',
    facilities: ['Flexible Work Environment', 'Mentorship Program', 'Weekly Team Lunches', 'Certificate of Completion'],
    fields: [
      { id: 'q-intern-git', type: 'text', label: 'GitHub Profile Link', placeholder: 'https://github.com/...', isRequired: true, options: [] },
      { id: 'q-intern-lang', type: 'text', label: 'Primary Programming Language', placeholder: 'e.g. JavaScript, Python', isRequired: true, options: [] },
      { id: 'q-intern-project', type: 'textarea', label: 'Briefly describe a personal coding project you built', placeholder: 'Explain what you did and why...', isRequired: true, options: [] },
    ]
  },
  'ui-ux-design-intern': {
    name: 'UI/UX Design Intern',
    title: 'UI/UX Design Intern',
    description: 'We are looking for a passionate UI/UX Design Intern to assist in creating intuitive interfaces for our digital products.',
    responsibilities: '- Assist in creating wireframes, prototypes, and visual designs in Figma.\n- Participate in user research and usability testing.\n- Collaborate with product managers and engineers.',
    requirements: '- Basic understanding of UI/UX principles and design systems.\n- Proficiency in Figma or similar design tools.\n- Good communication and collaboration skills.',
    preferredSkills: '- Experience with interactive prototyping.\n- Basic knowledge of HTML/CSS.\n- Portfolio of personal design projects.',
    benefits: '- Personal mentorship and feedback sessions.\n- Access to professional design tools.\n- Certificate of completion and project references.',
    isPaid: true,
    stipendAmount: '7000',
    facilities: ['Flexible Work Environment', 'Figma Pro License', 'One-on-One Mentorship', 'Certificate of Completion'],
    fields: [
      { id: 'q-design-portfolio', type: 'text', label: 'Portfolio Link (Behance, Dribbble, Figma)', placeholder: 'https://...', isRequired: true, options: [] },
      { id: 'q-design-tools', type: 'text', label: 'Design Tools You Know', placeholder: 'e.g. Figma, Illustrator', isRequired: true, options: [] },
    ]
  },
  'marketing-intern': {
    name: 'Marketing Intern',
    title: 'Marketing Intern',
    description: 'We are hiring a Marketing Intern to assist our growth and communication campaigns.',
    responsibilities: '- Support social media management and content creation.\n- Assist in executing digital marketing campaigns.\n- Perform market research and track campaign analytics.',
    requirements: '- Strong writing, communication, and editing skills.\n- Active presence and understanding of major social media channels.\n- Eager to learn growth marketing strategies.',
    preferredSkills: '- Experience with Canva or basic design tools.\n- Familiarity with Google Analytics or Facebook Ads.\n- Basic video editing skills.',
    benefits: '- Mentorship from experienced growth marketers.\n- Letter of recommendation and certification.\n- Flexible work schedule.',
    isPaid: false,
    stipendAmount: '',
    facilities: ['Certificate of Completion', 'Flexible Hours', 'L&D Session Access', 'Letter of Recommendation'],
    fields: [
      { id: 'q-mkt-writing', type: 'text', label: 'Link to writing sample or social post you created', placeholder: 'https://...', isRequired: false, options: [] },
      { id: 'q-mkt-interest', type: 'textarea', label: 'Why are you interested in digital marketing?', placeholder: 'Describe your passion...', isRequired: true, options: [] },
    ]
  }
};

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formResponsibilities, setFormResponsibilities] = useState('');
  const [formRequirements, setFormRequirements] = useState('');
  const [formPreferredSkills, setFormPreferredSkills] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [jobType, setJobType] = useState('Internship');
  const [jobLocation, setJobLocation] = useState('');
  const [officeTiming, setOfficeTiming] = useState('');
  const [workingDays, setWorkingDays] = useState('');
  const [activeTabs, setActiveTabs] = useState<Record<string, 'write' | 'preview'>>({});
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isMultiDepartment, setIsMultiDepartment] = useState(false);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [batchName, setBatchName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [stipendAmount, setStipendAmount] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [newFacility, setNewFacility] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fields, setFields] = useState<CanvasField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<CanvasField | null>(null);
  const [saving, setSaving] = useState(false);

  // Seeking positions state
  const [seekingPositions, setSeekingPositions] = useState<string[]>([]);
  const [availablePositions, setAvailablePositions] = useState<{ id: string; title: string }[]>([]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    fetchDepartments();
    fetchApiKey();
    fetchAvailablePositions();
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

  const fetchAvailablePositions = async () => {
    const { data } = await supabase.from('role_titles').select('*').order('title');
    if (data) setAvailablePositions(data);
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
      .single();

    if (form) {
      setFormTitle(form.title);
      setBatchName(form.batch_name || '');
      setFormDescription(form.description || '');
      setFormResponsibilities(form.responsibilities || '');
      setFormRequirements(form.requirements || '');
      setFormPreferredSkills(form.preferred_skills || '');
      setFormBenefits(form.benefits || '');
      setJobType(form.job_type || 'Internship');
      setJobLocation(form.job_location || '');
      setOfficeTiming(form.office_timing || '');
      setWorkingDays(form.working_days || '');
      setFormSlug(form.slug);
      setDepartmentId(form.department_id || '');
      setIsMultiDepartment(form.is_multi_department ?? false);
      setAllowedDepartments(form.allowed_departments || []);
      setIsActive(form.is_active ?? true);
      setDeadline(form.deadline ? form.deadline.split('T')[0] : '');
      setStartDate(form.start_date ? form.start_date.split('T')[0] : '');
      setIsPaid(form.is_paid ?? false);
      setStipendAmount(form.stipend_amount ? String(form.stipend_amount) : '');
      setFacilities(form.facilities || []);
      setSeekingPositions(form.seeking_positions || []);
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

  const handleLoadPreset = () => {
    const preset = INTERN_PRESETS[selectedPresetKey];
    if (!preset) return;

    setFormTitle(preset.title);
    setFormTitle(preset.title);
    setFormDescription(preset.description);
    setFormResponsibilities(preset.responsibilities || '');
    setFormRequirements(preset.requirements || '');
    setFormPreferredSkills(preset.preferredSkills || '');
    setFormBenefits(preset.benefits || '');
    setJobType('Internship');
    setJobLocation('');
    setOfficeTiming('');
    setWorkingDays('');
    setIsPaid(preset.isPaid);
    setStipendAmount(preset.stipendAmount);
    setFacilities(preset.facilities);
    setFields(preset.fields);
    setFormSlug(generateSlug(preset.title));

    setSeoMeta({
      metaTitle: `${preset.title} Application`,
      metaDescription: `Apply for the ${preset.title} internship position. Join our mentorship-focused team and grow your skills.`,
      metaKeywords: `${preset.title.toLowerCase()}, internship, hire, career`,
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
      const prompt = `Generate a detailed, professional internship description for a "${formTitle || 'Internship Position'}" role with focus keywords: "${aiKeywords}". The tone should be ${aiTone}. Format it with clear sections: "About the Internship", "Responsibilities", and "Who We Are Looking For". Do NOT use markdown like asterisks or hashtags since this will be pasted into a plain textarea. Keep it under 250 words.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:key=${geminiApiKey}`, {
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
      toast.error(e.message || 'Failed to generate internship description');
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
        responsibilities: formResponsibilities || null,
        requirements: formRequirements || null,
        preferred_skills: formPreferredSkills || null,
        benefits: formBenefits || null,
        job_type: jobType || null,
        job_location: jobLocation || null,
        office_timing: officeTiming || null,
        working_days: workingDays || null,
        slug: formSlug,
        department_id: departmentId || null,
        is_multi_department: isMultiDepartment,
        allowed_departments: allowedDepartments.length > 0 ? allowedDepartments : null,
        is_active: isActive,
        deadline: deadline || null,
        start_date: startDate || null,
        is_paid: isPaid,
        stipend_amount: isPaid && stipendAmount ? parseFloat(stipendAmount) : null,
        facilities: facilities.length > 0 ? facilities : null,
        seeking_positions: seekingPositions.length > 0 ? seekingPositions : null,
        auto_screening: autoScreening,
        seo_meta: seoMeta,
        form_type: 'internship',
      };

      if (isEditing) {
        const { error } = await supabase
          .from('application_forms')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        // Delete existing fields and re-insert
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

  const insertFormatting = (editorId: string, prefix: string, suffix: string = '') => {
    const textarea = document.getElementById(editorId) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = prefix + selected + suffix;

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    if (editorId === 'description') setFormDescription(newValue);
    else if (editorId === 'responsibilities') setFormResponsibilities(newValue);
    else if (editorId === 'requirements') setFormRequirements(newValue);
    else if (editorId === 'preferred_skills') setFormPreferredSkills(newValue);
    else if (editorId === 'benefits') setFormBenefits(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const renderFormattedTextArea = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    rows: number = 4
  ) => {
    const isPreview = activeTabs[id] === 'preview';

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={id} className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{label}</Label>
          <div className="flex items-center gap-1.5">
            {id === 'description' && (
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
                <Sparkles className="h-3.5 w-3.5" />
                AI Write
              </Button>
            )}
            <div className="flex rounded-md border border-input p-0.5 bg-muted/40 shadow-sm">
              <Button
                type="button"
                variant={!isPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTabs(prev => ({ ...prev, [id]: 'write' }))}
                className="h-5 px-2 text-[10px] rounded-sm flex items-center gap-1 font-medium transition-all"
              >
                <Edit2 className="h-2.5 w-2.5" />
                Write
              </Button>
              <Button
                type="button"
                variant={isPreview ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTabs(prev => ({ ...prev, [id]: 'preview' }))}
                className="h-5 px-2 text-[10px] rounded-sm flex items-center gap-1 font-medium transition-all"
              >
                <Eye className="h-2.5 w-2.5" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {!isPreview ? (
          <div className="rounded-md border border-input bg-background shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 bg-muted/20 p-1.5 border-b border-input">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md flex items-center justify-center transition-all"
                onClick={() => insertFormatting(id, '**', '**')}
                title="Bold (**text**)"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md flex items-center justify-center transition-all"
                onClick={() => insertFormatting(id, '*', '*')}
                title="Italic (*text*)"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md flex items-center justify-center transition-all"
                onClick={() => insertFormatting(id, '### ')}
                title="Heading (###)"
              >
                <Heading className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-md flex items-center justify-center transition-all"
                onClick={() => insertFormatting(id, '- ')}
                title="Bullet List (-)"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Textarea
              id={id}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="text-xs rounded-t-none border-0 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 focus:outline-none focus:ring-0 min-h-[100px]"
            />
          </div>
        ) : (
          <div className="text-xs p-4 border border-input rounded-md bg-slate-50/50 dark:bg-zinc-950/50 min-h-[143px] max-h-[300px] overflow-y-auto shadow-inner">
            {value ? (
              <FormattedText text={value} />
            ) : (
              <span className="text-muted-foreground italic">Nothing to preview. Type something first!</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/forms')} className="hover:bg-accent/60">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{isEditing ? 'Edit Internship Form' : 'Create Internship Form'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="outline" onClick={() => window.open(`/apply/${formSlug}`, '_blank')} className="border-slate-200 dark:border-zinc-800">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
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
                        <Label htmlFor="title" className="text-xs font-semibold">Internship Title</Label>
                        <Input
                          id="title"
                          value={formTitle}
                          onChange={(e) => handleTitleChange(e.target.value)}
                          placeholder="e.g. Frontend Web Intern"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug" className="text-xs font-semibold">URL Slug</Label>
                        <Input
                          id="slug"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="intern-url-slug"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="batch" className="text-xs font-semibold">Batch Name</Label>
                        <Input
                          id="batch"
                          value={batchName}
                          onChange={(e) => setBatchName(e.target.value)}
                          placeholder="e.g. Batch 1, Summer 2026"
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job-type" className="text-xs font-semibold">Job/Internship Type</Label>
                          <Select value={jobType} onValueChange={setJobType}>
                            <SelectTrigger id="job-type" className="h-9 text-xs">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Internship">Internship</SelectItem>
                              <SelectItem value="Full-time">Full-time</SelectItem>
                              <SelectItem value="Part-time">Part-time</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="job-location" className="text-xs font-semibold">Location</Label>
                          <Input
                            id="job-location"
                            value={jobLocation}
                            onChange={(e) => setJobLocation(e.target.value)}
                            placeholder="e.g. Dhaka (On-site / Hybrid)"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="office-timing" className="text-xs font-semibold">Office Timing</Label>
                          <Input
                            id="office-timing"
                            value={officeTiming}
                            onChange={(e) => setOfficeTiming(e.target.value)}
                            placeholder="e.g. 9:00 AM - 6:00 PM"
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="working-days" className="text-xs font-semibold">Working Days</Label>
                          <Input
                            id="working-days"
                            value={workingDays}
                            onChange={(e) => setWorkingDays(e.target.value)}
                            placeholder="e.g. Sunday - Thursday"
                            className="h-9 text-xs"
                          />
                        </div>
                      </div>

                      {renderFormattedTextArea(
                        'description',
                        'Internship Description / About the Role',
                        formDescription,
                        setFormDescription,
                        'Brief description of the internship role. Supports bold (**text**), italic (*text*), headings (### Heading), and bullet points (- Item).'
                      )}

                      {renderFormattedTextArea(
                        'responsibilities',
                        'Responsibilities',
                        formResponsibilities,
                        setFormResponsibilities,
                        'Key responsibilities of the position. Supports bold, italic, and lists.'
                      )}

                      {renderFormattedTextArea(
                        'requirements',
                        'Requirements',
                        formRequirements,
                        setFormRequirements,
                        'Educational or professional requirements. Supports bold, italic, and lists.'
                      )}

                      {renderFormattedTextArea(
                        'preferred_skills',
                        'Preferred Skills',
                        formPreferredSkills,
                        setFormPreferredSkills,
                        'Skills that are preferred but not mandatory. Supports bold, italic, and lists.'
                      )}

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

                      {/* SEEKING POSITIONS LIST */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          Seeking Positions
                          <Info className="h-3 w-3 text-muted-foreground" title="Tag positions this form is recruiting for." />
                        </Label>
                        <div className="space-y-2 border rounded-md p-3 max-h-40 overflow-y-auto bg-background">
                          {availablePositions.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No positions configured in Staff & Dept.</p>
                          ) : (
                            availablePositions.map((pos) => {
                              const checked = seekingPositions.includes(pos.title);
                              return (
                                <div key={pos.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`pos-${pos.id}`}
                                    checked={checked}
                                    onCheckedChange={(isChecked) => {
                                      if (isChecked) {
                                        setSeekingPositions([...seekingPositions, pos.title]);
                                      } else {
                                        setSeekingPositions(seekingPositions.filter(t => t !== pos.title));
                                      }
                                    }}
                                  />
                                  <Label htmlFor={`pos-${pos.id}`} className="text-xs cursor-pointer">
                                    {pos.title}
                                  </Label>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

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
                        <Label htmlFor="start-date" className="text-xs font-semibold">Expected Start Date</Label>
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
                        Intern Presets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Instantly populate internship details, stipend, perks, and screening questions.
                      </p>
                      <Select value={selectedPresetKey} onValueChange={setSelectedPresetKey}>
                        <SelectTrigger className="h-9 text-xs bg-background">
                          <SelectValue placeholder="Select an intern role preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(INTERN_PRESETS).map(([key, p]) => (
                            <SelectItem key={key} value={key}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPresetKey && (
                        <Button
                          type="button"
                          className="w-full text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                          onClick={() => setPresetConfirmOpen(true)}
                        >
                          Apply Preset Template
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {/* Compensation & Benefits */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Compensation & Perks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                        <Label htmlFor="is-paid" className="text-xs font-semibold">Paid Internship</Label>
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
                          <Label htmlFor="stipend" className="text-xs font-semibold">Stipend Amount (BDT/month)</Label>
                          <Input
                            id="stipend"
                            type="number"
                            min="0"
                            value={stipendAmount}
                            onChange={(e) => setStipendAmount(e.target.value)}
                            placeholder="e.g. 8000"
                            className="h-9 text-xs"
                          />
                        </div>
                      )}
                      
                      {renderFormattedTextArea(
                        'benefits',
                        'Benefits & Perks',
                        formBenefits,
                        setFormBenefits,
                        'Benefits and compensation perks. Supports bold, italic, and lists.'
                      )}
                    </CardContent>
                  </Card>

                  {/* Auto-Screening Card */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center justify-between">
                        <span>Auto-Screening Rules</span>
                        <Switch
                          checked={autoScreening.enabled}
                          onCheckedChange={(checked) => setAutoScreening({ ...autoScreening, enabled: checked })}
                        />
                      </CardTitle>
                    </CardHeader>
                    {autoScreening.enabled && (
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-[11px] text-muted-foreground">
                          Applicants scoring below the minimum passing score will be automatically designated.
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <Label>Minimum Passing Score</Label>
                            <span className="text-primary">{autoScreening.minScore}%</span>
                          </div>
                          <Input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={autoScreening.minScore}
                            onChange={(e) => setAutoScreening({ ...autoScreening, minScore: parseInt(e.target.value) })}
                            className="h-5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold">Pass Status</Label>
                            <Select
                              value={autoScreening.passStatus}
                              onValueChange={(val) => setAutoScreening({ ...autoScreening, passStatus: val })}
                            >
                              <SelectTrigger className="h-8 text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-semibold">Fail Status</Label>
                            <Select
                              value={autoScreening.failStatus}
                              onValueChange={(val) => setAutoScreening({ ...autoScreening, failStatus: val })}
                            >
                              <SelectTrigger className="h-8 text-[11px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* SEO Card */}
                  <Card className="border-slate-100 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        SEO & Social Share
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seo-title" className="text-xs font-semibold">Meta Title</Label>
                        <Input
                          id="seo-title"
                          value={seoMeta.metaTitle}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaTitle: e.target.value })}
                          placeholder="e.g. Intern Hiring Campaign"
                          className="h-9 text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seo-desc" className="text-xs font-semibold">Meta Description</Label>
                        <Textarea
                          id="seo-desc"
                          value={seoMeta.metaDescription}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaDescription: e.target.value })}
                          placeholder="Meta description for search engine listings..."
                          rows={3}
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seo-keywords" className="text-xs font-semibold">Meta Keywords</Label>
                        <Input
                          id="seo-keywords"
                          value={seoMeta.metaKeywords}
                          onChange={(e) => setSeoMeta({ ...seoMeta, metaKeywords: e.target.value })}
                          placeholder="e.g. intern, hiring, software, design"
                          className="h-9 text-xs"
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
                    Drag fields from the palette tab to add custom questions. Basic info (Name, Email, Phone) is collected automatically.
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

      {/* Preset template confirmation dialog */}
      <AlertDialog open={presetConfirmOpen} onOpenChange={setPresetConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Applying this preset template will overwrite the title, description, stipend status, perks, and custom form questions with pre-configured settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLoadPreset} className="bg-primary text-white hover:bg-primary/95">
              Load Preset Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI generator dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Internship Description Writer
            </DialogTitle>
            <DialogDescription>
              Provide keywords and let Gemini generate an engaging description for this role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Internship Role Title</Label>
              <Input value={formTitle} readOnly disabled className="bg-muted h-9 text-xs" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ai-keywords" className="text-xs font-semibold">Keywords / Skills to emphasize</Label>
              <Input
                id="ai-keywords"
                placeholder="e.g. React, UI components, teamwork, basic Git"
                value={aiKeywords}
                onChange={(e) => setAiKeywords(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-tone" className="text-xs font-semibold">Tone</Label>
              <Select value={aiTone} onValueChange={setAiTone}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual & encouraging">Casual & Encouraging</SelectItem>
                  <SelectItem value="innovative & energetic">Innovative & Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {aiResult && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Generated Output</Label>
                <div className="p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-40 overflow-y-auto border">
                  {aiResult}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between w-full sm:justify-between">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setAiDialogOpen(false)} className="text-xs h-9">
                Close
              </Button>
              {aiResult && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setFormDescription(aiResult);
                    setAiDialogOpen(false);
                    toast.success('Description updated with AI generated text!');
                  }}
                  className="text-xs h-9 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  Apply Text
                </Button>
              )}
            </div>
            <Button
              type="button"
              disabled={aiLoading || !formTitle}
              onClick={handleGenerateAI}
              className="text-xs h-9 bg-primary text-white"
            >
              {aiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {aiResult ? 'Re-generate' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
