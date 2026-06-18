import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Loader2, Save, Edit, Mail, MessageSquare, Info, Copy } from 'lucide-react';

interface NotificationTemplate {
  id: string;
  template_key: string;
  template_type: 'email' | 'sms';
  name: string;
  subject: string | null;
  body_template: string;
  is_enabled: boolean;
}

const PLACEHOLDERS = [
  { key: '{{applicant_name}}', description: 'Applicant full name' },
  { key: '{{applicant_email}}', description: 'Applicant email address' },
  { key: '{{applicant_phone}}', description: 'Applicant phone number' },
  { key: '{{form_title}}', description: 'Application form title' },
  { key: '{{application_status}}', description: 'Current application status' },
  { key: '{{intern_name}}', description: 'Intern full name' },
  { key: '{{certificate_id}}', description: 'Certificate ID' },
  { key: '{{department_name}}', description: 'Department name' },
  { key: '{{company_name}}', description: 'Company name' },
  { key: '{{verification_url}}', description: 'Certificate verification URL' },
  { key: '{{status_url}}', description: 'Application status check URL' },
  { key: '{{start_date}}', description: 'Internship start date' },
  { key: '{{end_date}}', description: 'Internship end date' },
];

export const NotificationTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('template_key', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplate = async (template: NotificationTemplate) => {
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({ is_enabled: !template.is_enabled, updated_at: new Date().toISOString() })
        .eq('id', template.id);

      if (error) throw error;
      
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, is_enabled: !t.is_enabled } : t
      ));
      
      toast({ 
        title: 'Success', 
        description: `Template ${!template.is_enabled ? 'enabled' : 'disabled'}` 
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const saveTemplate = async () => {
    if (!editingTemplate) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_templates')
        .update({
          subject: editingTemplate.subject,
          body_template: editingTemplate.body_template,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? editingTemplate : t
      ));
      
      setEditingTemplate(null);
      toast({ title: 'Success', description: 'Template saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!editingTemplate) return;
    
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = editingTemplate.body_template;
      const newText = text.substring(0, start) + placeholder + text.substring(end);
      setEditingTemplate({ ...editingTemplate, body_template: newText });
    } else {
      setEditingTemplate({ 
        ...editingTemplate, 
        body_template: editingTemplate.body_template + placeholder 
      });
    }
  };

  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    toast({ title: 'Copied', description: `${placeholder} copied to clipboard` });
  };

  const getTemplateLabel = (key: string) => {
    const labels: Record<string, string> = {
      'application_submitted': 'Application Submitted',
      'application_status_changed': 'Application Status Changed',
      'certificate_issued': 'Certificate Issued',
      'certificate_revoked': 'Certificate Revoked',
      'test_email': 'Test Email',
      'test_sms': 'Test SMS',
      'job_application_submitted': 'Job Application Submitted',
      'job_application_status_changed': 'Job Application Status Changed',
      'job_application_approved': 'Job Application Approved',
      'job_application_rejected': 'Job Application Rejected',
      'job_application_shortlisted': 'Job Application Shortlisted',
      'job_application_reviewing': 'Job Application Under Review',
    };
    return labels[key] || key;
  };

  const emailTemplates = templates.filter(t => t.template_type === 'email');
  const smsTemplates = templates.filter(t => t.template_type === 'sms');

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <CardTitle>Notification Templates</CardTitle>
              <CardDescription>Customize email and SMS templates for different events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="email" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Templates
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-3">
              {emailTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.is_enabled ? "default" : "secondary"} className="text-xs">
                        {template.is_enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{template.subject}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_enabled}
                      onCheckedChange={() => toggleTemplate(template)}
                    />
                    <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="sms" className="space-y-3">
              {smsTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{template.name}</h4>
                      <Badge variant={template.is_enabled ? "default" : "secondary"} className="text-xs">
                        {template.is_enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {template.body_template.substring(0, 80)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={template.is_enabled}
                      onCheckedChange={() => toggleTemplate(template)}
                    />
                    <Button variant="outline" size="sm" onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingTemplate?.template_type === 'email' ? (
                <Mail className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              Edit {editingTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              {editingTemplate.template_type === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    placeholder="Email subject line"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="template-body">
                    {editingTemplate.template_type === 'email' ? 'Email Body (HTML supported)' : 'SMS Message'}
                  </Label>
                  {editingTemplate.template_type === 'sms' && (
                    <span className="text-xs text-muted-foreground">
                      {editingTemplate.body_template.length}/160 characters
                    </span>
                  )}
                </div>
                <Textarea
                  id="template-body"
                  value={editingTemplate.body_template}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_template: e.target.value })}
                  placeholder="Enter template content..."
                  rows={editingTemplate.template_type === 'email' ? 12 : 4}
                  className="font-mono text-sm"
                />
              </div>

              {/* Placeholders Reference */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm text-muted-foreground">Available Placeholders</Label>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-3 rounded-lg bg-muted/50 border">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => insertPlaceholder(p.key)}
                      className="flex items-center justify-between p-2 rounded text-left text-sm hover:bg-background transition-colors group"
                    >
                      <div>
                        <code className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">{p.key}</code>
                        <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
                      </div>
                      <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
