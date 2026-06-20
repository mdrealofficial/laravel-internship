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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Loader2, Save, Edit, Mail, MessageSquare, Info, Copy, 
  ArrowUp, ArrowDown, Plus, Trash2, Monitor, Smartphone, Sparkles, Layout, Code
} from 'lucide-react';

interface NotificationTemplate {
  id: string;
  template_key: string;
  template_type: 'email' | 'sms';
  name: string;
  subject: string | null;
  body_template: string;
  is_enabled: boolean;
}

interface EmailBlock {
  id: string;
  type: 'header' | 'text' | 'button' | 'divider' | 'footer';
  content?: string;
  properties: Record<string, any>;
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
  { key: '{{interview_time}}', description: 'Scheduled interview date & time' },
  { key: '{{interview_type}}', description: 'Interview medium/type' },
  { key: '{{interview_link}}', description: 'Interview meeting link or venue location' },
];

export const NotificationTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Editor mode: 'visual' or 'code'
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  // Site Branding details for preview
  const [brandingSettings, setBrandingSettings] = useState<Record<string, string>>({});
  const [geminiApiKey, setGeminiApiKey] = useState('');
  
  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchBrandingSettings();
  }, []);

  useEffect(() => {
    if (editingTemplate) {
      if (editingTemplate.template_type === 'email') {
        parseTemplateBody(editingTemplate.body_template);
      }
    } else {
      setBlocks([]);
      setSelectedBlockId(null);
    }
  }, [editingTemplate]);

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

  const fetchBrandingSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      if (data) {
        const settings: Record<string, string> = {};
        data.forEach(s => {
          if (s.setting_key) settings[s.setting_key] = s.setting_value || '';
        });
        setBrandingSettings(settings);
        setGeminiApiKey(settings['gemini_api_key'] || '');
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    }
  };

  const parseTemplateBody = (body: string) => {
    // Search for TEMPLATE_JSON comment in body
    const match = body.match(/<!-- TEMPLATE_JSON:\s*(\{.*?\})\s*-->/s);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed && Array.isArray(parsed.blocks)) {
          setBlocks(parsed.blocks);
          if (parsed.blocks.length > 0) {
            setSelectedBlockId(parsed.blocks[0].id);
          }
          setEditorMode('visual');
          return;
        }
      } catch (e) {
        console.error('Failed to parse template JSON comment:', e);
      }
    }
    
    // Fallback: import raw HTML/text as a single text block
    const defaultBlocks: EmailBlock[] = [
      {
        id: 'block-init-text',
        type: 'text',
        content: body,
        properties: { align: 'left', fontSize: '16px', color: '#1f2937', bgColor: 'transparent', padding: '16px 24px' }
      }
    ];
    setBlocks(defaultBlocks);
    setSelectedBlockId('block-init-text');
    setEditorMode('code'); // Open in raw code mode for legacy emails
  };

  const compileBlocksToHtml = (blocksList: EmailBlock[]) => {
    let html = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">`;
    
    blocksList.forEach((block) => {
      const props = block.properties || {};
      const align = props.align || 'left';
      const bgColor = props.bgColor || 'transparent';
      const textColor = props.textColor || '#1f2937';
      const fontSize = props.fontSize || '16px';
      const padding = props.padding || '16px 24px';
      
      if (block.type === 'header') {
        const title = props.title || 'Header Title';
        const subtitle = props.subtitle || '';
        const bg = props.bgColor || '#f3f4f6';
        const text = props.textColor || '#111827';
        html += `
          <div style="background-color: ${bg}; padding: 32px 24px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${text};">${title}</h1>
            ${subtitle ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: ${text}; opacity: 0.8;">${subtitle}</p>` : ''}
          </div>
        `;
      } else if (block.type === 'text') {
        const textContent = block.content || '';
        const formattedText = textContent.replace(/\n/g, '<br>');
        html += `
          <div style="padding: ${padding}; text-align: ${align}; color: ${textColor}; font-size: ${fontSize}; line-height: 1.6; background-color: ${bgColor};">
            ${formattedText}
          </div>
        `;
      } else if (block.type === 'button') {
        const label = props.label || 'Click Here';
        const url = props.url || '#';
        const btnBg = props.bgColor || '#2563eb';
        const btnText = props.textColor || '#ffffff';
        const borderRadius = props.borderRadius || '6px';
        html += `
          <div style="padding: ${padding}; text-align: ${align}; background-color: ${bgColor};">
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: ${btnBg}; color: ${btnText}; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: ${borderRadius};" target="_blank">${label}</a>
          </div>
        `;
      } else if (block.type === 'divider') {
        const thickness = props.thickness || '1px';
        const color = props.color || '#e5e7eb';
        const spacing = props.spacing || '24px 0';
        html += `
          <div style="padding: 0 24px; background-color: ${bgColor};">
            <hr style="border: 0; border-top: ${thickness} solid ${color}; margin: ${spacing};" />
          </div>
        `;
      } else if (block.type === 'footer') {
        html += `{{email_footer}}`;
      }
    });
    
    html += `</div>`;
    return html;
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
      let finalBody = editingTemplate.body_template;
      
      if (editingTemplate.template_type === 'email' && editorMode === 'visual') {
        const compiledHtml = compileBlocksToHtml(blocks);
        // Embed block structures as a metadata JSON comment
        finalBody = `${compiledHtml}\n<!-- TEMPLATE_JSON: ${JSON.stringify({ blocks })} -->`;
      }

      const { error } = await supabase
        .from('notification_templates')
        .update({
          subject: editingTemplate.subject,
          body_template: finalBody,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;
      
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id ? { ...t, subject: editingTemplate.subject, body_template: finalBody } : t
      ));
      
      setEditingTemplate(null);
      toast({ title: 'Success', description: 'Template saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Up/down reordering helpers
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;
    setBlocks(newBlocks);
  };

  const addBlock = (type: EmailBlock['type']) => {
    const newId = `block-${Date.now()}`;
    let newBlock: EmailBlock;
    
    if (type === 'header') {
      newBlock = {
        id: newId,
        type,
        properties: { title: 'Notification Title', subtitle: 'Important Update', bgColor: '#4f46e5', textColor: '#ffffff' }
      };
    } else if (type === 'text') {
      newBlock = {
        id: newId,
        type,
        content: 'Write your email paragraph message content here. You can use available placeholders like {{applicant_name}}.',
        properties: { align: 'left', fontSize: '16px', color: '#374151', bgColor: 'transparent', padding: '16px 24px' }
      };
    } else if (type === 'button') {
      newBlock = {
        id: newId,
        type,
        properties: { label: 'Click to Action', url: '{{status_url}}', align: 'center', bgColor: '#4f46e5', textColor: '#ffffff', borderRadius: '6px', padding: '16px 24px' }
      };
    } else if (type === 'divider') {
      newBlock = {
        id: newId,
        type,
        properties: { thickness: '1px', color: '#e5e7eb', spacing: '24px 0', bgColor: 'transparent' }
      };
    } else {
      newBlock = {
        id: newId,
        type,
        properties: { bgColor: 'transparent' }
      };
    }
    
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newId);
  };

  const deleteBlock = (id: string) => {
    const remaining = blocks.filter(b => b.id !== id);
    setBlocks(remaining);
    if (selectedBlockId === id && remaining.length > 0) {
      setSelectedBlockId(remaining[0].id);
    } else if (remaining.length === 0) {
      setSelectedBlockId(null);
    }
  };

  const updateBlockProperty = (id: string, key: string, value: any) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        return {
          ...b,
          properties: { ...b.properties, [key]: value }
        };
      }
      return b;
    }));
  };

  const updateBlockContent = (id: string, value: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        return { ...b, content: value };
      }
      return b;
    }));
  };

  const importPresetLayout = (layoutType: string) => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    let loaded: EmailBlock[] = [];
    
    if (layoutType === 'welcome') {
      loaded = [
        {
          id: 'welcome-header',
          type: 'header',
          properties: { title: `Welcome to ${company}`, subtitle: 'Thank you for your application', bgColor: '#4f46e5', textColor: '#ffffff' }
        },
        {
          id: 'welcome-text-1',
          type: 'text',
          content: `Hi {{applicant_name}},\n\nWe have received your application for the {{form_title}} program. We are excited about the opportunity to review your qualifications.\n\nYou can track the live status of your application at any time by clicking the button below.`,
          properties: { align: 'left', fontSize: '16px', color: '#374151', bgColor: 'transparent', padding: '24px 24px 12px 24px' }
        },
        {
          id: 'welcome-button',
          type: 'button',
          properties: { label: 'Track Application Status', url: '{{status_url}}', align: 'center', bgColor: '#4f46e5', textColor: '#ffffff', borderRadius: '6px', padding: '16px 24px' }
        },
        {
          id: 'welcome-text-2',
          type: 'text',
          content: 'If you have any questions or require support, please do not hesitate to contact our team.\n\nBest regards,\nThe Recruitment Team',
          properties: { align: 'left', fontSize: '14px', color: '#6b7280', bgColor: 'transparent', padding: '12px 24px 24px 24px' }
        },
        {
          id: 'welcome-divider',
          type: 'divider',
          properties: { thickness: '1px', color: '#e5e7eb', spacing: '12px 0', bgColor: 'transparent' }
        },
        {
          id: 'welcome-footer',
          type: 'footer',
          properties: {}
        }
      ];
    } else if (layoutType === 'interview') {
      loaded = [
        {
          id: 'int-header',
          type: 'header',
          properties: { title: 'Interview Scheduled', subtitle: 'Congratulations! You have been shortlisted', bgColor: '#10b981', textColor: '#ffffff' }
        },
        {
          id: 'int-text-1',
          type: 'text',
          content: `Dear {{applicant_name}},\n\nWe are pleased to inform you that your interview for the {{form_title}} position has been scheduled.\n\nHere are your scheduled details:\n- **Time**: {{interview_time}}\n- **Type**: {{interview_type}}\n- **Link/Venue**: {{interview_link}}`,
          properties: { align: 'left', fontSize: '16px', color: '#374151', bgColor: 'transparent', padding: '24px 24px 12px 24px' }
        },
        {
          id: 'int-button',
          type: 'button',
          properties: { label: 'Confirm Meeting Time', url: '{{status_url}}', align: 'center', bgColor: '#10b981', textColor: '#ffffff', borderRadius: '6px', padding: '16px 24px' }
        },
        {
          id: 'int-divider',
          type: 'divider',
          properties: { thickness: '1px', color: '#e5e7eb', spacing: '12px 0', bgColor: 'transparent' }
        },
        {
          id: 'int-footer',
          type: 'footer',
          properties: {}
        }
      ];
    } else if (layoutType === 'alert') {
      loaded = [
        {
          id: 'alert-header',
          type: 'header',
          properties: { title: 'Application Update', subtitle: 'Changes have occurred on your portal', bgColor: '#f59e0b', textColor: '#ffffff' }
        },
        {
          id: 'alert-text',
          type: 'text',
          content: `Hi {{applicant_name}},\n\nYour application status for the {{form_title}} program has been updated to:\n\n**{{application_status}}**\n\nPlease log in to your portal to review any additional details or next steps.`,
          properties: { align: 'left', fontSize: '16px', color: '#374151', bgColor: 'transparent', padding: '24px 24px 12px 24px' }
        },
        {
          id: 'alert-button',
          type: 'button',
          properties: { label: 'View Application', url: '{{status_url}}', align: 'center', bgColor: '#f59e0b', textColor: '#ffffff', borderRadius: '6px', padding: '16px 24px' }
        },
        {
          id: 'alert-footer',
          type: 'footer',
          properties: {}
        }
      ];
    }
    
    if (loaded.length > 0) {
      setBlocks(loaded);
      setSelectedBlockId(loaded[0].id);
      toast({ title: 'Layout Loaded', description: `Successfully loaded preset '${layoutType}' template.` });
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt) {
      toast({ title: 'AI Assistant', description: 'Please type an instruction first.', variant: 'destructive' });
      return;
    }
    if (!geminiApiKey) {
      toast({ title: 'AI Assistant', description: 'Please configure your Gemini API Key in Branding settings first.', variant: 'destructive' });
      return;
    }
    
    setGeneratingAI(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You are an email copywriter. Write the body content for an email template block. Context/Prompt: "${aiPrompt}". Keep it brief, professional, and clear. Do not include subject lines, header graphics, or HTML wrappers. Output ONLY raw text with paragraphs separated by double newlines.` }] }]
        })
      });
      
      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        if (selectedBlockId) {
          const selected = blocks.find(b => b.id === selectedBlockId);
          if (selected && selected.type === 'text') {
            updateBlockContent(selectedBlockId, text.trim());
            toast({ title: 'AI Copy Added', description: 'Draft inserted into selected text block.' });
            setAiPrompt('');
          } else {
            // Create a new text block
            const newId = `block-ai-${Date.now()}`;
            const newBlock: EmailBlock = {
              id: newId,
              type: 'text',
              content: text.trim(),
              properties: { align: 'left', fontSize: '16px', color: '#374151', bgColor: 'transparent', padding: '16px 24px' }
            };
            setBlocks([...blocks, newBlock]);
            setSelectedBlockId(newId);
            toast({ title: 'AI Block Created', description: 'Created a new text block with draft content.' });
            setAiPrompt('');
          }
        }
      } else {
        throw new Error('No copy returned from AI');
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'AI Draft Failed', description: e.message || 'Check your Gemini API Key.', variant: 'destructive' });
    } finally {
      setGeneratingAI(false);
    }
  };

  const renderSocialIcon = (url: string, platform: string, iconUrl: string) => {
    if (!url) return null;
    return (
      <span style={{ display: 'inline-block', margin: '0 8px' }}>
        <img src={iconUrl} width="20" height="20" alt={platform} style={{ verticalAlign: 'middle' }} />
      </span>
    );
  };

  const getPreviewFooterHtml = () => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    const title = brandingSettings['footer_title'] || '';
    const subtitle = brandingSettings['footer_subtitle'] || '';
    const webUrl = brandingSettings['footer_website_url'] || '';
    const webText = brandingSettings['footer_website_text'] || webUrl;
    const copyright = brandingSettings['footer_copyright'] || '';
    const address = brandingSettings['footer_address'] || '';
    const terms = brandingSettings['footer_terms_url'] || '';
    const privacy = brandingSettings['footer_privacy_url'] || '';
    const contact = brandingSettings['footer_contact_url'] || '';
    
    return (
      <div className="text-center font-sans text-gray-500 text-xs py-8 px-6 bg-slate-50 border-t border-slate-100 mt-6">
        {title && <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>}
        {subtitle && <p className="text-gray-500 mb-3 max-w-xs mx-auto">{subtitle}</p>}
        {webUrl && <a href={webUrl} className="font-semibold text-gray-900 underline mb-4 block" target="_blank" rel="noreferrer">{webText}</a>}
        
        <div className="flex justify-center items-center gap-2 mb-4">
          {brandingSettings['footer_instagram_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/instagram-new.png" className="w-5 h-5" alt="instagram" />}
          {brandingSettings['footer_facebook_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/facebook-new.png" className="w-5 h-5" alt="facebook" />}
          {brandingSettings['footer_twitter_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/twitter.png" className="w-5 h-5" alt="twitter" />}
          {brandingSettings['footer_youtube_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/youtube-play.png" className="w-5 h-5" alt="youtube" />}
          {brandingSettings['footer_tiktok_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/tiktok.png" className="w-5 h-5" alt="tiktok" />}
          {brandingSettings['footer_linkedin_url'] && <img src="https://img.icons8.com/material-outlined/48/4f5660/linkedin--v1.png" className="w-5 h-5" alt="linkedin" />}
        </div>
        
        <p className="mb-2">If you no longer wish to receive commercial emails from {company}, you can <a href="#" className="underline">Unsubscribe</a>.</p>
        <p className="text-gray-400 mb-3">{[copyright, address].filter(Boolean).join(' - ')}</p>
        <p className="flex justify-center gap-3 text-[11px] underline">
          {terms && <a href={terms} target="_blank" rel="noreferrer">Terms</a>}
          {privacy && <a href={privacy} target="_blank" rel="noreferrer">Privacy policy</a>}
          {contact && <a href={contact} target="_blank" rel="noreferrer">Contact us</a>}
        </p>
      </div>
    );
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
      'application_interview_scheduled': 'Internship Interview Scheduled',
      'job_application_interview_scheduled': 'Job Interview Scheduled',
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

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

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
        <DialogContent className="max-w-[95vw] w-[1200px] max-h-[92vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xl font-bold">
                {editingTemplate?.template_type === 'email' ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                Edit {editingTemplate?.name}
              </span>
              
              {editingTemplate?.template_type === 'email' && (
                <div className="flex items-center gap-2 border rounded-lg p-0.5 mr-6 bg-slate-50">
                  <Button 
                    variant={editorMode === 'visual' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8"
                    onClick={() => setEditorMode('visual')}
                  >
                    <Layout className="h-3.5 w-3.5 mr-1.5" />
                    Visual Builder
                  </Button>
                  <Button 
                    variant={editorMode === 'code' ? 'default' : 'ghost'} 
                    size="sm"
                    className="h-8"
                    onClick={() => setEditorMode('code')}
                  >
                    <Code className="h-3.5 w-3.5 mr-1.5" />
                    HTML Code Editor
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {editingTemplate && (
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
              
              {/* Left Settings Panel */}
              <div className="lg:col-span-5 flex flex-col space-y-4 overflow-y-auto max-h-[60vh] lg:max-h-none pr-1">
                {editingTemplate.template_type === 'email' && (
                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Email Subject</Label>
                    <Input
                      id="template-subject"
                      value={editingTemplate.subject || ''}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                      placeholder="Email subject line"
                    />
                  </div>
                )}

                {/* SMS Raw Input Mode */}
                {(editingTemplate.template_type === 'sms' || editorMode === 'code') ? (
                  <div className="space-y-4 flex-1 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="template-body">
                        {editingTemplate.template_type === 'email' ? 'HTML Source Code' : 'SMS Message'}
                      </Label>
                      {editingTemplate.template_type === 'sms' && (
                        <span className="text-xs text-muted-foreground">
                          {editingTemplate.body_template.length}/160 chars
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="template-body"
                      value={editingTemplate.body_template}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, body_template: e.target.value })}
                      placeholder="Enter template contents..."
                      className="font-mono text-sm flex-1 min-h-[250px] resize-none"
                    />
                  </div>
                ) : (
                  // Visual Block Builder Sidebar
                  <div className="space-y-6 flex-1 flex flex-col">
                    
                    {/* Preset Layout Loader */}
                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-semibold text-xs">
                        <Layout className="h-3.5 w-3.5" />
                        Import Template Layout Preset
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Button size="xs" variant="outline" onClick={() => importPresetLayout('welcome')}>Welcome</Button>
                        <Button size="xs" variant="outline" onClick={() => importPresetLayout('interview')}>Interview</Button>
                        <Button size="xs" variant="outline" onClick={() => importPresetLayout('alert')}>Alert/Update</Button>
                      </div>
                    </div>

                    {/* Block Layout Controller */}
                    <div className="space-y-3">
                      <Label className="font-semibold text-sm">Design Blocks Layout</Label>
                      <div className="grid grid-cols-5 gap-1">
                        <Button size="xs" variant="outline" onClick={() => addBlock('header')} className="flex flex-col gap-1 py-2 h-auto text-[10px]">
                          <Plus className="h-3 w-3" /> Header
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => addBlock('text')} className="flex flex-col gap-1 py-2 h-auto text-[10px]">
                          <Plus className="h-3 w-3" /> Text
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => addBlock('button')} className="flex flex-col gap-1 py-2 h-auto text-[10px]">
                          <Plus className="h-3 w-3" /> Button
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => addBlock('divider')} className="flex flex-col gap-1 py-2 h-auto text-[10px]">
                          <Plus className="h-3 w-3" /> Divider
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => addBlock('footer')} className="flex flex-col gap-1 py-2 h-auto text-[10px]" disabled={blocks.some(b => b.type === 'footer')}>
                          <Plus className="h-3 w-3" /> Footer
                        </Button>
                      </div>
                    </div>

                    {/* Blocks Hierarchy list */}
                    <div className="space-y-2 flex-1 max-h-[300px] overflow-y-auto border rounded-lg p-2 bg-slate-50/50">
                      {blocks.map((block, idx) => (
                        <div 
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          className={`flex items-center justify-between p-2 rounded-md border transition-all cursor-pointer ${
                            selectedBlockId === block.id 
                              ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase">{block.type}</Badge>
                            <span className="text-xs truncate max-w-[150px] font-medium">
                              {block.type === 'text' ? block.content?.substring(0, 30) || 'Empty text' : block.properties.title || block.properties.label || ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'up'); }}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === blocks.length - 1} onClick={(e) => { e.stopPropagation(); moveBlock(idx, 'down'); }}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Block Settings */}
                    {selectedBlock && (
                      <Card className="border-indigo-100 bg-slate-50/30">
                        <CardHeader className="py-3 border-b bg-indigo-50/30">
                          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                            Block Properties: {selectedBlock.type}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 space-y-4">
                          {selectedBlock.type === 'header' && (
                            <>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Title</Label>
                                <Input 
                                  value={selectedBlock.properties.title || ''}
                                  onChange={(e) => updateBlockProperty(selectedBlock.id, 'title', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Subtitle</Label>
                                <Input 
                                  value={selectedBlock.properties.subtitle || ''}
                                  onChange={(e) => updateBlockProperty(selectedBlock.id, 'subtitle', e.target.value)}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Bg Color</Label>
                                  <Input 
                                    type="color"
                                    value={selectedBlock.properties.bgColor || '#4f46e5'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'bgColor', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Text Color</Label>
                                  <Input 
                                    type="color"
                                    value={selectedBlock.properties.textColor || '#ffffff'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'textColor', e.target.value)}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedBlock.type === 'text' && (
                            <>
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <Label className="text-xs">Content Text</Label>
                                  {geminiApiKey && (
                                    <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 flex gap-0.5 items-center">
                                      <Sparkles className="h-2.5 w-2.5" /> AI Enabled
                                    </Badge>
                                  )}
                                </div>
                                <Textarea 
                                  rows={4}
                                  value={selectedBlock.content || ''}
                                  onChange={(e) => updateBlockContent(selectedBlock.id, e.target.value)}
                                  className="text-xs"
                                />
                              </div>

                              {/* Gemini AI Helper Inside Block Editor */}
                              {geminiApiKey && (
                                <div className="space-y-1.5 border border-indigo-150 p-2 rounded bg-indigo-50/20">
                                  <Label className="text-[11px] text-indigo-700 font-semibold flex gap-1 items-center">
                                    <Sparkles className="h-3 w-3" /> Gemini Copy Assistant
                                  </Label>
                                  <div className="flex gap-1.5">
                                    <Input
                                      placeholder="e.g. rewrite professionally..."
                                      value={aiPrompt}
                                      onChange={(e) => setAiPrompt(e.target.value)}
                                      className="text-xs h-7 flex-1"
                                    />
                                    <Button size="xs" onClick={generateWithAI} disabled={generatingAI || !aiPrompt}>
                                      {generatingAI ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Draft'}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Text Align</Label>
                                  <RadioGroup 
                                    value={selectedBlock.properties.align || 'left'} 
                                    onValueChange={(v) => updateBlockProperty(selectedBlock.id, 'align', v)}
                                    className="flex gap-2"
                                  >
                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem value="left" id="align-l" className="h-3.5 w-3.5" />
                                      <label htmlFor="align-l" className="text-[10px] cursor-pointer">Left</label>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem value="center" id="align-c" className="h-3.5 w-3.5" />
                                      <label htmlFor="align-c" className="text-[10px] cursor-pointer">Center</label>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <RadioGroupItem value="right" id="align-r" className="h-3.5 w-3.5" />
                                      <label htmlFor="align-r" className="text-[10px] cursor-pointer">Right</label>
                                    </div>
                                  </RadioGroup>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Font Size</Label>
                                  <Input 
                                    value={selectedBlock.properties.fontSize || '16px'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'fontSize', e.target.value)}
                                    placeholder="16px"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedBlock.type === 'button' && (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Label</Label>
                                  <Input 
                                    value={selectedBlock.properties.label || ''}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'label', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">URL</Label>
                                  <Input 
                                    value={selectedBlock.properties.url || ''}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'url', e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Btn Color</Label>
                                  <Input 
                                    type="color"
                                    value={selectedBlock.properties.bgColor || '#4f46e5'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'bgColor', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Text Color</Label>
                                  <Input 
                                    type="color"
                                    value={selectedBlock.properties.textColor || '#ffffff'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'textColor', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Radius</Label>
                                  <Input 
                                    value={selectedBlock.properties.borderRadius || '6px'}
                                    onChange={(e) => updateBlockProperty(selectedBlock.id, 'borderRadius', e.target.value)}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {selectedBlock.type === 'divider' && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Thickness</Label>
                                <Input 
                                  value={selectedBlock.properties.thickness || '1px'}
                                  onChange={(e) => updateBlockProperty(selectedBlock.id, 'thickness', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Color</Label>
                                <Input 
                                  type="color"
                                  value={selectedBlock.properties.color || '#e5e7eb'}
                                  onChange={(e) => updateBlockProperty(selectedBlock.id, 'color', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Spacing</Label>
                                <Input 
                                  value={selectedBlock.properties.spacing || '24px 0'}
                                  onChange={(e) => updateBlockProperty(selectedBlock.id, 'spacing', e.target.value)}
                                />
                              </div>
                            </div>
                          )}

                          {selectedBlock.type === 'footer' && (
                            <p className="text-xs text-muted-foreground">
                              The footer will pull configurations from your settings branding tab, including address, copyright, socials, and unsubscribe links.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Available Placeholders references */}
                <div className="space-y-2 pt-2 border-t mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-xs text-muted-foreground font-semibold">Available Placeholders</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto p-2 rounded-md bg-slate-50 border text-xs">
                    {PLACEHOLDERS.map((p) => (
                      <div
                        key={p.key}
                        onClick={() => {
                          navigator.clipboard.writeText(p.key);
                          toast({ title: 'Copied', description: `${p.key} copied to clipboard.` });
                        }}
                        className="flex items-center justify-between p-1 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer group transition-all"
                        title={p.description}
                      >
                        <code className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-mono font-semibold">{p.key}</code>
                        <span className="text-[10px] text-muted-foreground truncate ml-1">{p.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Preview Panel */}
              <div className="lg:col-span-7 flex flex-col bg-slate-100 dark:bg-slate-900 border rounded-xl overflow-hidden p-4 min-h-[500px]">
                
                {/* Device and Preview Controls */}
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Device Live Preview</span>
                  
                  {editingTemplate.template_type === 'email' && (
                    <div className="flex items-center gap-1 bg-white border rounded-lg p-0.5">
                      <Button 
                        variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setPreviewDevice('desktop')}
                        title="Desktop Preview"
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setPreviewDevice('mobile')}
                        title="Mobile Preview"
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email Canvas Rendering */}
                <div className="flex-1 flex justify-center items-start overflow-y-auto">
                  {editingTemplate.template_type === 'sms' ? (
                    // SMS Mockup Preview
                    <div className="w-[300px] border-8 border-slate-800 rounded-3xl bg-slate-950 p-2 shadow-2xl relative">
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full" />
                      <div className="bg-slate-900 rounded-2xl p-4 min-h-[380px] text-white flex flex-col justify-end">
                        <div className="bg-primary text-white rounded-2xl p-3 text-sm self-end max-w-[85%] mb-4 shadow-md font-sans leading-relaxed whitespace-pre-line">
                          {editingTemplate.body_template || 'Type SMS content...'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Email Mockup Preview
                    <div 
                      className={`bg-white shadow-md border rounded-md transition-all duration-300 overflow-y-auto max-h-[60vh] ${
                        previewDevice === 'desktop' ? 'w-full max-w-[600px]' : 'w-[375px]'
                      }`}
                    >
                      {editorMode === 'code' ? (
                        // Render raw HTML body directly
                        <div className="p-6 font-sans">
                          <div dangerouslySetInnerHTML={{ __html: editingTemplate.body_template }} />
                          {getPreviewFooterHtml()}
                        </div>
                      ) : (
                        // Render blocks live in visual builder
                        <div className="font-sans">
                          {blocks.map((block) => {
                            const props = block.properties || {};
                            const align = props.align || 'left';
                            const bgColor = props.bgColor || 'transparent';
                            const textColor = props.textColor || '#1f2937';
                            const fontSize = props.fontSize || '16px';
                            const padding = props.padding || '16px 24px';
                            
                            const isSelected = block.id === selectedBlockId;
                            
                            return (
                              <div
                                key={block.id}
                                onClick={() => setSelectedBlockId(block.id)}
                                className={`relative group transition-all duration-200 ${
                                  isSelected 
                                    ? 'ring-2 ring-primary bg-primary/5' 
                                    : 'hover:ring-1 hover:ring-primary/40'
                                }`}
                              >
                                {block.type === 'header' && (
                                  <div style={{ backgroundColor: props.bgColor || '#f3f4f6', padding: '32px 24px', textAlign: align }}>
                                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: props.textColor || '#111827' }}>
                                      {props.title || 'Header Title'}
                                    </h1>
                                    {props.subtitle && (
                                      <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: props.textColor || '#111827', opacity: 0.8 }}>
                                        {props.subtitle}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {block.type === 'text' && (
                                  <div style={{ padding, textAlign: align, color: textColor, fontSize, lineHeight: 1.6, backgroundColor: bgColor, whiteSpace: 'pre-wrap' }}>
                                    {block.content || 'Empty text block. Double click or select to edit.'}
                                  </div>
                                )}

                                {block.type === 'button' && (
                                  <div style={{ padding, textAlign: align, backgroundColor: bgColor }}>
                                    <a 
                                      href="#" 
                                      onClick={(e) => e.preventDefault()}
                                      style={{ 
                                        display: 'inline-block', 
                                        padding: '12px 24px', 
                                        backgroundColor: props.bgColor || '#2563eb', 
                                        color: props.textColor || '#ffffff', 
                                        textDecoration: 'none', 
                                        fontWeight: 600, 
                                        fontSize: '14px', 
                                        borderRadius: props.borderRadius || '6px' 
                                      }}
                                    >
                                      {props.label || 'Click Here'}
                                    </a>
                                  </div>
                                )}

                                {block.type === 'divider' && (
                                  <div style={{ padding: '0 24px', backgroundColor: bgColor }}>
                                    <hr style={{ border: 0, borderTop: `${props.thickness || '1px'} solid ${props.color || '#e5e7eb'}`, margin: props.spacing || '24px 0' }} />
                                  </div>
                                )}

                                {block.type === 'footer' && getPreviewFooterHtml()}

                                {/* Action Overlay inside Preview */}
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur border rounded p-0.5 shadow-sm">
                                  <Button size="icon" variant="ghost" className="h-5 w-5 text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          <DialogFooter className="pt-3 border-t">
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
