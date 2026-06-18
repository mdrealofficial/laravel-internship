import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationForm as AppForm, FormField } from '@/types/database';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle, Loader2, BadgeDollarSign, Gift, ChevronRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ApplicationFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<AppForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [allDepartmentSkills, setAllDepartmentSkills] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  // Basic applicant info schema
  const baseSchema = z.object({
    applicant_name: z.string().min(2, 'Name is required'),
    applicant_email: z.string().email('Valid email is required'),
    applicant_phone: z.string().min(10, 'Phone number is required (min 10 digits)'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(baseSchema),
  });

  useEffect(() => {
    if (slug) {
      fetchForm();
    }
  }, [slug]);

  const fetchForm = async () => {
    const { data: formData } = await supabase
      .from('application_forms')
      .select('*, department:departments(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!formData) {
      setLoading(false);
      return;
    }

    const { data: fieldsData } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formData.id)
      .order('display_order');

    const { data: deptsData } = await supabase.from('departments').select('id, name');
    setDepartments(deptsData || []);

    if (formData.is_multi_department) {
      const { data: deptSkillsData } = await supabase
        .from('department_skills')
        .select('*')
        .order('display_order');
      setAllDepartmentSkills(deptSkillsData || []);
    } else {
      setSelectedDepartmentId(formData.department_id || '');
    }

    setForm(formData);
    setFields(fieldsData || []);
    setLoading(false);
  };

  const handleFieldChange = (fieldId: string, value: string | string[]) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
    const current = (fieldValues[fieldId] as string[]) || [];
    if (checked) {
      handleFieldChange(fieldId, [...current, option]);
    } else {
      handleFieldChange(fieldId, current.filter((v) => v !== option));
    }
  };

  const onSubmit = async (data: { applicant_name: string; applicant_email: string; applicant_phone?: string }) => {
    if (!form) return;

    if (form.is_multi_department && !selectedDepartmentId) {
      toast.error('Please select the department you are applying for');
      return;
    }

    // Validate required fields
    const missingRequired = fields.filter(
      (f) => f.is_required && !fieldValues[f.id]
    );

    if (missingRequired.length > 0) {
      toast.error(`Please fill in: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      // Calculate skill score if a skills field is present
      let skillScore: number | null = null;
      const skillsField = fields.find((f) => f.field_type === 'skills');
      if (skillsField) {
        try {
          let config: any = null;
          if (skillsField.options) {
            const raw = Array.isArray(skillsField.options) ? skillsField.options[0] : skillsField.options;
            if (raw) {
              config = typeof raw === 'string' ? JSON.parse(raw) : raw;
            }
          }
          
          if (form.is_multi_department) {
            const configSkillsForDept = selectedDepartmentId && config?.departments?.[selectedDepartmentId];
            const selectedNames = (fieldValues[skillsField.id] as string[]) || [];

            if (configSkillsForDept && Array.isArray(configSkillsForDept)) {
              let earnedPoints = 0;
              let totalPossiblePoints = 0;
              
              configSkillsForDept.forEach((s: any) => {
                if (s.enabled) {
                  totalPossiblePoints += Number(s.points) || 0;
                  if (selectedNames.includes(s.name)) {
                    earnedPoints += Number(s.points) || 0;
                  }
                }
              });

              if (totalPossiblePoints > 0) {
                skillScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
              } else {
                skillScore = 0;
              }
            } else {
              // Fallback to database skills
              const deptSkills = allDepartmentSkills.filter(s => s.department_id === selectedDepartmentId);
              if (deptSkills.length > 0) {
                const selectedCount = deptSkills.filter(s => selectedNames.includes(s.skill_name)).length;
                skillScore = Math.round((selectedCount / deptSkills.length) * 100);
              } else {
                skillScore = 0;
              }
            }
          } else {
            if (config && config.skills) {
              const selectedNames = (fieldValues[skillsField.id] as string[]) || [];
              let earnedPoints = 0;
              let totalPossiblePoints = 0;
              
              config.skills.forEach((s: any) => {
                if (s.enabled) {
                  totalPossiblePoints += Number(s.points) || 0;
                  if (selectedNames.includes(s.name)) {
                    earnedPoints += Number(s.points) || 0;
                  }
                }
              });

              if (totalPossiblePoints > 0) {
                skillScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
              } else {
                skillScore = 0;
              }
            }
          }
        } catch (e) {
          console.error('Failed to parse skills configuration during score calculation:', e);
        }
      }

      // Create application
      const { data: application, error: appError } = await supabase
        .from('applications')
        .insert({
          form_id: form.id,
          department_id: selectedDepartmentId || null,
          applicant_name: data.applicant_name,
          applicant_email: data.applicant_email,
          applicant_phone: data.applicant_phone || null,
          skill_score: skillScore,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Create responses
      const responses = fields.map((field) => {
        let val = Array.isArray(fieldValues[field.id])
          ? (fieldValues[field.id] as string[]).join(', ')
          : fieldValues[field.id] || null;

        if (field.field_type === 'range' && val === null) {
          val = field.options?.[0] || '0';
        }

        return {
          application_id: application.id,
          field_id: field.id,
          response_value: val,
          file_url: field.field_type === 'file' ? val : null,
        };
      });

      const { error: respError } = await supabase.from('application_responses').insert(responses);
      if (respError) throw respError;

      // Send notification
      let deliveryStatus = 'failed';
      try {
        const { data: notifyData } = await supabase.functions.invoke('send-notification', {
          body: {
            template_key: 'application_submitted',
            recipient_email: data.applicant_email,
            recipient_phone: data.applicant_phone || null,
            data: {
              applicant_name: data.applicant_name,
              form_title: form.title,
            },
          },
        });

        if (notifyData && notifyData.success) {
          const emailSuccess = notifyData.results?.email?.success;
          const smsSuccess = notifyData.results?.sms?.success;
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
      } catch (notifyErr) {
        console.error('Failed to send notification:', notifyErr);
      }

      await supabase
        .from('applications')
        .update({ delivery_status: deliveryStatus })
        .eq('id', application.id);

      setSubmitted(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const options = field.options || [];

    switch (field.field_type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder || ''}
            value={(fieldValues[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
          />
        );

      case 'select':
        return (
          <Select
            value={(fieldValues[field.id] as string) || ''}
            onValueChange={(v) => handleFieldChange(field.id, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt, i) => (
                <SelectItem key={i} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={(fieldValues[field.id] as string) || ''}
            onValueChange={(v) => handleFieldChange(field.id, v)}
          >
            {options.map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={opt} id={`${field.id}-${i}`} />
                <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {options.length > 0 ? (
              options.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${i}`}
                    checked={((fieldValues[field.id] as string[]) || []).includes(opt)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(field.id, opt, checked === true)
                    }
                  />
                  <Label htmlFor={`${field.id}-${i}`}>{opt}</Label>
                </div>
              ))
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={(fieldValues[field.id] as string) === 'true'}
                  onCheckedChange={(checked) =>
                    handleFieldChange(field.id, checked ? 'true' : 'false')
                  }
                />
                <Label htmlFor={field.id}>{field.label}</Label>
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className="border-2 border-dashed border-input rounded-md p-6 text-center">
            <Input
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                const fileName = `${Date.now()}-${file.name}`;
                const { data, error } = await supabase.storage
                  .from('company-assets')
                  .upload(`applications/${fileName}`, file);
                
                if (error) {
                  toast.error('Failed to upload file');
                  return;
                }
                
                const { data: { publicUrl } } = supabase.storage
                  .from('company-assets')
                  .getPublicUrl(`applications/${fileName}`);
                
                handleFieldChange(field.id, publicUrl);
                toast.success('File uploaded');
              }}
              className="cursor-pointer"
            />
            {fieldValues[field.id] && (
              <p className="text-sm text-muted-foreground mt-2">File uploaded ✓</p>
            )}
          </div>
        );

      case 'range': {
        const min = Number(options[0]) || 0;
        const max = Number(options[1]) || 100;
        const step = Number(options[2]) || 1;
        const currentVal = fieldValues[field.id] !== undefined ? String(fieldValues[field.id]) : String(min);

        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground text-xs">Min: {min}</span>
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">{currentVal}</span>
              <span className="text-muted-foreground text-xs">Max: {max}</span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={currentVal}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            {field.placeholder && (
              <p className="text-xs text-muted-foreground">{field.placeholder}</p>
            )}
          </div>
        );
      }

      case 'skills': {
        let skillsConfig: { departmentId: string; skills: Array<{ id: string; name: string; enabled: boolean; points: number }>; departments?: Record<string, Array<{ id: string; name: string; enabled: boolean; points: number }>> } | null = null;
        try {
          if (options) {
            const raw = Array.isArray(options) ? options[0] : options;
            if (raw) {
              skillsConfig = typeof raw === 'string' ? JSON.parse(raw) : raw;
            }
          }
        } catch (e) {
          skillsConfig = null;
        }

        let enabledSkills = [];

        if (form.is_multi_department) {
          if (selectedDepartmentId) {
            const configSkillsForDept = skillsConfig?.departments?.[selectedDepartmentId];
            if (configSkillsForDept && Array.isArray(configSkillsForDept)) {
              // ONLY show the enabled skills!
              enabledSkills = configSkillsForDept.filter((s: any) => s.enabled).map((s: any) => ({
                id: s.id,
                name: s.name,
                enabled: true,
                points: s.points
              }));
            } else {
              // Fallback to database skills
              const deptSkills = allDepartmentSkills.filter(s => s.department_id === selectedDepartmentId);
              const pointsPerSkill = deptSkills.length > 0 ? Math.round(100 / deptSkills.length) : 20;
              enabledSkills = deptSkills.map(s => ({
                id: s.id,
                name: s.skill_name,
                enabled: true,
                points: pointsPerSkill
              }));
            }
          }
        } else {
          enabledSkills = skillsConfig?.skills.filter(s => s.enabled) || [];
        }

        return (
          <div className="space-y-3">
            {form.is_multi_department && !selectedDepartmentId ? (
              <p className="text-sm text-muted-foreground italic">Please select a department above to load skills.</p>
            ) : enabledSkills.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium mb-2">
                  Select all the skills you possess:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {enabledSkills.map((skill) => (
                    <div key={skill.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${field.id}-${skill.id}`}
                        checked={((fieldValues[field.id] as string[]) || []).includes(skill.name)}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(field.id, skill.name, checked === true)
                        }
                      />
                      <Label htmlFor={`${field.id}-${skill.id}`} className="cursor-pointer text-sm font-medium">
                        {skill.name} <span className="text-xs text-muted-foreground">({skill.points} pts)</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No department skills configured for this field.</p>
            )}
          </div>
        );
      }

      default:
        return (
          <Input
            type={field.field_type}
            placeholder={field.placeholder || ''}
            value={(fieldValues[field.id] as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              This application form is not available or has been closed.
            </p>
            <Button asChild>
              <Link to="/apply">View Open Positions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (form.deadline && isPast(new Date(form.deadline))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              The deadline for this application has passed.
            </p>
            <Button asChild>
              <Link to="/apply">View Open Positions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying. We will review your application and get back to you soon.
            </p>
            <Button asChild>
              <Link to="/apply">View More Opportunities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Welcome/Details screen (step 0)
  if (showWelcome) {
    const isPaid = form.is_paid ?? false;
    const stipend = form.stipend_amount;
    const facilitiesList: string[] = form.facilities || [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/apply">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Opportunities
              </Link>
            </Button>

            <Card className="overflow-hidden">
              {/* Hero Banner */}
              <div className="bg-gradient-to-r from-primary/90 to-primary px-8 py-10 text-primary-foreground">
                <div className="flex items-center gap-3 mb-3">
                  <Badge
                    variant="secondary"
                    className="text-xs font-semibold px-3 py-1 bg-white/20 text-white border-white/30"
                  >
                    {isPaid ? '💰 Paid Internship' : '🎓 Unpaid Internship'}
                  </Badge>
                  {form.batch_name && (
                    <Badge
                      variant="secondary"
                      className="text-xs font-semibold px-3 py-1 bg-white/20 text-white border-white/30"
                    >
                      {form.batch_name}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
                {form.description && (
                  <p className="text-primary-foreground/80 text-sm">{form.description}</p>
                )}
                {form.deadline && (
                  <p className="text-primary-foreground/70 text-xs mt-3">
                    📅 Application Deadline: {format(new Date(form.deadline), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>

              <CardContent className="p-8 space-y-8">
                {/* Internship Type Details */}
                <div className="space-y-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-primary" />
                    Internship Details
                  </h2>
                  <div className="rounded-lg border bg-muted/40 p-4">
                    {isPaid ? (
                      <div className="space-y-1">
                        <p className="font-medium text-green-600 dark:text-green-400">✅ This is a Paid Internship</p>
                        {stipend && (
                          <p className="text-sm text-muted-foreground">
                            Stipend: <span className="font-semibold text-foreground">BDT {Number(stipend).toLocaleString()}/month</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">📚 This is an Unpaid Internship</p>
                        <p className="text-sm text-muted-foreground">No monetary compensation is provided, but you will gain valuable experience and perks.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Facilities */}
                {facilitiesList.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      What You'll Get
                    </h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {facilitiesList.map((facility, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm rounded-lg border bg-card px-4 py-3">
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          {facility}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Agreement Section */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    By clicking <strong>Agree & Continue</strong>, you acknowledge that you have read and understood the internship details above and agree to proceed with the application.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => setShowWelcome(false)}
                      id="agree-and-continue"
                    >
                      Agree & Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" asChild className="flex-1">
                      <Link to="/apply">Go Back</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/apply">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{form.title}</CardTitle>
              {form.description && <CardDescription>{form.description}</CardDescription>}
              {form.deadline && (
                <p className="text-sm text-muted-foreground">
                  Deadline: {format(new Date(form.deadline), 'MMMM d, yyyy')}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4 border-b pb-6">
                  <h3 className="font-semibold">Your Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="applicant_name">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicant_name"
                      {...register('applicant_name')}
                      placeholder="Enter your full name"
                    />
                    {errors.applicant_name && (
                      <p className="text-sm text-destructive">{errors.applicant_name.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicant_email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicant_email"
                      type="email"
                      {...register('applicant_email')}
                      placeholder="Enter your email"
                    />
                    {errors.applicant_email && (
                      <p className="text-sm text-destructive">{errors.applicant_email.message as string}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicant_phone">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="applicant_phone"
                      type="tel"
                      {...register('applicant_phone')}
                      placeholder="Enter your phone number"
                    />
                    {errors.applicant_phone && (
                      <p className="text-sm text-destructive">{errors.applicant_phone.message as string}</p>
                    )}
                  </div>
                  {form.is_multi_department && (
                    <div className="space-y-2">
                      <Label htmlFor="selected_department">
                        Applying Department <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={selectedDepartmentId}
                        onValueChange={(v) => {
                          setSelectedDepartmentId(v);
                          const skillsField = fields.find((f) => f.field_type === 'skills');
                          if (skillsField) {
                            handleFieldChange(skillsField.id, []);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments
                            .filter((d) => form.allowed_departments?.includes(d.id))
                            .map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Dynamic Fields - filter out system fields that are already shown above */}
                {fields.filter(f => {
                  const validationRules = f.validation_rules as { isSystemField?: boolean } | null;
                  return !validationRules?.isSystemField;
                }).length > 0 && (
                  <div className="space-y-6">
                    <h3 className="font-semibold">Application Questions</h3>
                    {fields
                      .filter(f => {
                        const validationRules = f.validation_rules as { isSystemField?: boolean } | null;
                        return !validationRules?.isSystemField;
                      })
                      .map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label>
                            {field.label}
                            {field.is_required && <span className="text-destructive ml-1">*</span>}
                          </Label>
                          {renderField(field)}
                        </div>
                      ))}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
