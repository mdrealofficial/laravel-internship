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
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function ApplicationFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<AppForm | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string | string[]>>({});

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
      // Create application
      const { data: application, error: appError } = await supabase
        .from('applications')
        .insert({
          form_id: form.id,
          applicant_name: data.applicant_name,
          applicant_email: data.applicant_email,
          applicant_phone: data.applicant_phone || null,
        })
        .select()
        .single();

      if (appError) throw appError;

      // Create responses
      const responses = fields.map((field) => ({
        application_id: application.id,
        field_id: field.id,
        response_value: Array.isArray(fieldValues[field.id])
          ? (fieldValues[field.id] as string[]).join(', ')
          : fieldValues[field.id] || null,
      }));

      const { error: respError } = await supabase.from('application_responses').insert(responses);
      if (respError) throw respError;

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
