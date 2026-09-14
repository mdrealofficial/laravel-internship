import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  HelpCircle,
  FileText,
  Plus,
  Trash2,
  Monitor,
  Smartphone,
  Sparkles,
  Layout,
  Code,
  Info,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  SendHorizontal,
  Eye,
  Calendar
} from 'lucide-react';
import { Department, Intern, ApplicationForm, Application } from '@/types/database';
import VisualEmailBuilder, { EmailBlock } from '@/components/admin/VisualEmailBuilder';

interface LogEntry {
  name: string;
  email: string;
  phone: string;
  emailStatus: string;
  smsStatus: string;
  error?: string;
}

export default function BatchMessaging() {
  const location = useLocation();
  const navigate = useNavigate();

  // Tab path syncing
  const getTabFromPath = (path: string) => {
    if (path.includes('/admin/job-batch-messaging')) return 'job';
    return 'intern';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    const tab = getTabFromPath(location.pathname);
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.pathname]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === 'intern') {
      navigate('/admin/batch-messaging');
    } else {
      navigate('/admin/job-batch-messaging');
    }
  };

  // Shared / General Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [brandingSettings, setBrandingSettings] = useState<Record<string, string>>({});
  
  // Wizard Steps: 'setup' | 'design' | 'review'
  const [internStep, setInternStep] = useState<'setup' | 'design' | 'review'>('setup');
  const [jobStep, setJobStep] = useState<'setup' | 'design' | 'review'>('setup');

  // Test send states
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTestSMS, setSendingTestSMS] = useState(false);

  // Intern Broadcast States
  const [interns, setInterns] = useState<Intern[]>([]);
  const [internTargetType, setInternTargetType] = useState<'batch' | 'department'>('batch');
  const [internCampaignName, setInternCampaignName] = useState('');
  const [internSelectedBatch, setInternSelectedBatch] = useState<string>('all');
  const [internSelectedDepartment, setInternSelectedDepartment] = useState<string>('all');
  const [internSendEmail, setInternSendEmail] = useState(true);
  const [internSendSMS, setInternSendSMS] = useState(false);
  const [internEmailSubject, setInternEmailSubject] = useState('');
  const [internEmailBody, setInternEmailBody] = useState('');
  const [internSmsBody, setInternSmsBody] = useState('');
  const [internIsScheduled, setInternIsScheduled] = useState(false);
  const [internScheduledAt, setInternScheduledAt] = useState('');
  const [internSending, setInternSending] = useState(false);
  const [internProgress, setInternProgress] = useState({ total: 0, sent: 0, success: 0, failed: 0 });
  const [internLogs, setInternLogs] = useState<LogEntry[]>([]);
  const [internShowProgressDialog, setInternShowProgressDialog] = useState(false);

  // Intern Visual Email Blocks State
  const [internBlocks, setInternBlocks] = useState<EmailBlock[]>([
    {
      id: 'intern-b-header',
      type: 'header',
      properties: { title: 'Internship Program Update', subtitle: 'DIGI5 LTD Intern Broadcast', bgColor: '#4f46e5', textColor: '#ffffff', padding: '24px', align: 'center' }
    },
    {
      id: 'intern-b-text',
      type: 'text',
      content: 'Dear {{name}},\n\nWe would like to share an important announcement regarding our internship schedule and expectations.\n\nPlease check the details below and stay updated.',
      properties: { align: 'left', fontSize: '15px', color: '#334155', bgColor: '#ffffff', padding: '16px 24px' }
    },
    {
      id: 'intern-b-footer',
      type: 'footer',
      properties: { bgColor: '#f8fafc', padding: '24px' }
    }
  ]);
  const [internEditorMode, setInternEditorMode] = useState<'visual' | 'code'>('visual');

  // Job Broadcast States
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobForms, setJobForms] = useState<ApplicationForm[]>([]);
  const [jobSelectedForm, setJobSelectedForm] = useState<string>('all');
  const [jobSelectedDepartment, setJobSelectedDepartment] = useState<string>('all');
  const [jobSelectedStatus, setJobSelectedStatus] = useState<string>('all');
  const [jobCampaignName, setJobCampaignName] = useState('');
  const [jobSendEmail, setJobSendEmail] = useState(true);
  const [jobSendSMS, setJobSendSMS] = useState(false);
  const [jobEmailSubject, setJobEmailSubject] = useState('');
  const [jobEmailBody, setJobEmailBody] = useState('');
  const [jobSmsBody, setJobSmsBody] = useState('');
  const [jobIsScheduled, setJobIsScheduled] = useState(false);
  const [jobScheduledAt, setJobScheduledAt] = useState('');
  const [jobSending, setJobSending] = useState(false);
  const [jobProgress, setJobProgress] = useState({ total: 0, sent: 0, success: 0, failed: 0 });
  const [jobLogs, setJobLogs] = useState<LogEntry[]>([]);
  const [jobShowProgressDialog, setJobShowProgressDialog] = useState(false);

  // Job Visual Email Blocks State
  const [jobBlocks, setJobBlocks] = useState<EmailBlock[]>([
    {
      id: 'job-b-header',
      type: 'header',
      properties: { title: 'Application Process Update', subtitle: 'DIGI5 LTD Recruitment', bgColor: '#4f46e5', textColor: '#ffffff', padding: '24px', align: 'center' }
    },
    {
      id: 'job-b-text',
      type: 'text',
      content: 'Dear {{name}},\n\nThank you for applying for the {{position}} role. We are pleased to provide an update on your application status.\n\nYour current application status is: **{{status}}**.',
      properties: { align: 'left', fontSize: '15px', color: '#334155', bgColor: '#ffffff', padding: '16px 24px' }
    },
    {
      id: 'job-b-footer',
      type: 'footer',
      properties: { bgColor: '#f8fafc', padding: '24px' }
    }
  ]);
  const [jobEditorMode, setJobEditorMode] = useState<'visual' | 'code'>('visual');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsRes, deptsRes, profilesRes, appsRes, formsRes, settingsRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase
          .from('applications')
          .select('*, form:application_forms(*), department:departments(*)')
          .eq('form_type', 'job')
          .order('created_at', { ascending: false }),
        supabase
          .from('application_forms')
          .select('*')
          .eq('form_type', 'job')
          .order('title'),
        supabase
          .from('site_settings')
          .select('setting_key, setting_value')
      ]);

      if (deptsRes.data) {
        setDepartments(deptsRes.data);
      }

      if (settingsRes.data) {
        const settings: Record<string, string> = {};
        settingsRes.data.forEach(s => {
          if (s.setting_key) settings[s.setting_key] = s.setting_value || '';
        });
        setBrandingSettings(settings);
        
        // Auto fill admin email for testing if available
        const adminEmail = settings['admin_email'] || '';
        if (adminEmail) setTestEmailAddress(adminEmail);
      }

      if (internsRes.data && profilesRes.data) {
        const profilesMap = new Map(profilesRes.data.map(p => [p.user_id, p]));
        const deptsMap = new Map(deptsRes.data?.map(d => [d.id, d]) || []);
        
        const mappedInterns = internsRes.data.map(i => ({
          ...i,
          profile: profilesMap.get(i.user_id) || null,
          department: deptsMap.get(i.department_id) || null,
        }));
        
        setInterns(mappedInterns);
      }

      if (appsRes.data) setApplications(appsRes.data);
      if (formsRes.data) setJobForms(formsRes.data);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load messaging target data');
    } finally {
      setLoading(false);
    }
  };

  // Compile visual blocks to responsive standard HTML
  const compileBlocksToHtml = (blocksList: EmailBlock[]) => {
    const emailHeader = brandingSettings['email_header'] || '';
    const logoUrl = brandingSettings['company_logo_url'] || '';
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    
    let headerHtml = '';
    if (emailHeader) {
      headerHtml = emailHeader;
    } else if (logoUrl) {
      headerHtml = `<div style="text-align: center; padding: 24px 16px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;"><img src="${logoUrl}" style="max-height: 48px; object-fit: contain;" alt="${company}" /></div>`;
    } else {
      headerHtml = `<div style="text-align: center; padding: 24px 16px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;"><h2 style="margin: 0; color: #1e293b; font-size: 20px; font-weight: 700;">${company}</h2></div>`;
    }

    let html = `<div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">`;
    
    // Add custom header first
    html += headerHtml;

    blocksList.forEach((block) => {
      const props = block.properties || {};
      const align = props.align || 'left';
      const bgColor = props.bgColor || 'transparent';
      const textColor = props.textColor || '#334155';
      const fontSize = props.fontSize || '15px';
      const padding = props.padding || '16px 24px';
      
      if (block.type === 'header') {
        const title = props.title || 'Broadcast Announcement';
        const subtitle = props.subtitle || '';
        const bg = props.bgColor || '#4f46e5';
        const text = props.textColor || '#ffffff';
        html += `
          <div style="background-color: ${bg}; padding: ${padding}; text-align: ${align};">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: ${text}; letter-spacing: -0.02em;">${title}</h1>
            ${subtitle ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: ${text}; opacity: 0.9; font-weight: 500;">${subtitle}</p>` : ''}
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
        const btnBg = props.bgColor || '#4f46e5';
        const btnText = props.textColor || '#ffffff';
        const borderRadius = props.borderRadius || '8px';
        html += `
          <div style="padding: ${padding}; text-align: ${align}; background-color: ${bgColor};">
            <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: ${btnBg}; color: ${btnText}; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: ${borderRadius}; text-align: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);" target="_blank">${label}</a>
          </div>
        `;
      } else if (block.type === 'divider') {
        const thickness = props.thickness || '1px';
        const color = props.color || '#e2e8f0';
        const spacing = props.spacing || '20px 0';
        html += `
          <div style="padding: 0 24px; background-color: ${bgColor};">
            <hr style="border: 0; border-top: ${thickness} solid ${color}; margin: ${spacing};" />
          </div>
        `;
      } else if (block.type === 'spacer') {
        const height = props.height || '30px';
        html += `
          <div style="height: ${height}; background-color: ${bgColor}; border: 0; margin: 0;"></div>
        `;
      } else if (block.type === 'image') {
        const imageUrl = props.imageUrl || '';
        const altText = props.altText || '';
        const width = props.width || '100%';
        const borderRadius = props.borderRadius || '8px';
        html += `
          <div style="padding: ${padding}; text-align: ${align}; background-color: ${bgColor};">
            <img src="${imageUrl}" style="max-width: 100%; width: ${width}; border-radius: ${borderRadius}; display: inline-block;" alt="${altText}" />
          </div>
        `;
      } else if (block.type === 'footer') {
        html += compileFooterHtml();
      }
    });
    
    // Auto append footer branding setting if user omitted the footer element
    if (!blocksList.some(b => b.type === 'footer')) {
      html += compileFooterHtml();
    }
    
    html += `</div>`;
    return html;
  };

  const compileFooterHtml = () => {
    const customFooter = brandingSettings['email_footer'] || '';
    if (customFooter) return customFooter;

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
    
    let socialIcons = '';
    const socials = [
      { key: 'footer_instagram_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/instagram-new.png', alt: 'instagram' },
      { key: 'footer_facebook_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/facebook-new.png', alt: 'facebook' },
      { key: 'footer_twitter_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/twitter.png', alt: 'twitter' },
      { key: 'footer_youtube_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/youtube-play.png', alt: 'youtube' },
      { key: 'footer_tiktok_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/tiktok.png', alt: 'tiktok' },
      { key: 'footer_linkedin_url', img: 'https://img.icons8.com/material-outlined/48/4f5660/linkedin--v1.png', alt: 'linkedin' }
    ];
    
    socials.forEach(s => {
      const url = brandingSettings[s.key];
      if (url) {
        socialIcons += `
          <a href="${url}" style="margin: 0 4px; text-decoration: none;" target="_blank">
            <img src="${s.img}" style="width: 18px; height: 18px; opacity: 0.7; display: inline-block; vertical-align: middle;" alt="${s.alt}" />
          </a>
        `;
      }
    });

    return `
      <div style="text-align: center; font-family: Arial, sans-serif; color: #94a3b8; font-size: 11px; padding: 32px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; line-height: 1.6;">
        ${title ? `<h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #475569;">${title}</h4>` : ''}
        ${subtitle ? `<p style="margin: 0 0 12px 0; color: #94a3b8;">${subtitle}</p>` : ''}
        ${webUrl ? `<a href="${webUrl}" style="font-weight: 650; color: #1e293b; text-decoration: underline; display: block; margin-bottom: 12px;" target="_blank">${webText}</a>` : ''}
        
        ${socialIcons ? `<div style="margin-bottom: 12px; text-align: center;">${socialIcons}</div>` : ''}
        
        <p style="margin: 0 0 8px 0;">If you no longer wish to receive commercial emails from ${company}, you can <a href="#" style="color: #64748b; text-decoration: underline;">Unsubscribe</a>.</p>
        <p style="margin: 0 0 12px 0; font-size: 10px; color: #94a3b8;">${[copyright, address].filter(Boolean).join(' - ')}</p>
        <p style="margin: 0; font-size: 10px; text-decoration: underline;">
          ${terms ? `<a href="${terms}" style="color: #94a3b8; margin: 0 4px;" target="_blank">Terms</a>` : ''}
          ${privacy ? `<a href="${privacy}" style="color: #94a3b8; margin: 0 4px;" target="_blank">Privacy policy</a>` : ''}
          ${contact ? `<a href="${contact}" style="color: #94a3b8; margin: 0 4px;" target="_blank">Contact us</a>` : ''}
        </p>
      </div>
    `;
  };

  const getPreviewHeaderHtml = () => {
    const company = brandingSettings['company_name'] || 'DIGI5 LTD';
    const logoUrl = brandingSettings['company_logo_url'] || '';
    const emailHeader = brandingSettings['email_header'] || '';
    
    if (emailHeader) {
      return <div dangerouslySetInnerHTML={{ __html: emailHeader }} />;
    }
    
    return (
      <div className="text-center py-6 border-b border-slate-100 bg-white">
        {logoUrl ? (
          <img src={logoUrl} className="max-h-11 mx-auto object-contain" alt={company} />
        ) : (
          <h2 className="margin-0 text-slate-800 text-lg font-bold tracking-tight">{company}</h2>
        )}
      </div>
    );
  };

  const getPreviewFooterHtml = () => {
    return <div dangerouslySetInnerHTML={{ __html: compileFooterHtml() }} />;
  };

  const insertVariable = (variable: string, channel: 'email' | 'sms', target: 'intern' | 'job') => {
    const isIntern = target === 'intern';
    const editorMode = isIntern ? internEditorMode : jobEditorMode;
    
    if (channel === 'email' && editorMode === 'visual') {
      toast.info('Click inside a text block and use its variables list to insert tokens.');
      return;
    }

    if (target === 'intern') {
      if (channel === 'email') {
        setInternEmailBody(prev => prev + ` {{${variable}}}`);
      } else {
        setInternSmsBody(prev => prev + ` {{${variable}}}`);
      }
    } else {
      if (channel === 'email') {
        setJobEmailBody(prev => prev + ` {{${variable}}}`);
      } else {
        setJobSmsBody(prev => prev + ` {{${variable}}}`);
      }
    }
  };

  // Helper: Extract unique batches from interns
  const getUniqueBatches = () => {
    const batches = interns
      .map(i => i.batch_name)
      .filter((b): b is string => !!b);
    return Array.from(new Set(batches)).sort();
  };

  const uniqueBatches = getUniqueBatches();

  // Filter interns based on target parameters
  const getSelectedInternRecipients = () => {
    return interns.filter(intern => {
      const batchMatch = 
        internSelectedBatch === 'all' || 
        intern.batch_name === internSelectedBatch ||
        (internSelectedBatch === 'Unassigned' && !intern.batch_name);

      const deptMatch = 
        internTargetType === 'batch' || 
        internSelectedDepartment === 'all' || 
        intern.department_id === internSelectedDepartment;

      const statusMatch = intern.status === 'active';

      return batchMatch && deptMatch && statusMatch;
    });
  };

  // Filter applications based on selected parameters
  const getSelectedJobRecipients = () => {
    return applications.filter(app => {
      const formMatch = jobSelectedForm === 'all' || app.form_id === jobSelectedForm;
      const deptMatch = jobSelectedDepartment === 'all' || (app.department_id || app.form?.department_id) === jobSelectedDepartment;
      const statusMatch = jobSelectedStatus === 'all' || app.status === jobSelectedStatus;
      return formMatch && deptMatch && statusMatch;
    });
  };

  const internRecipients = getSelectedInternRecipients();
  const jobRecipients = getSelectedJobRecipients();

  // Validate step transitions
  const handleValidateSetupStep = (tab: 'intern' | 'job') => {
    const isIntern = tab === 'intern';
    const campaignName = isIntern ? internCampaignName : jobCampaignName;
    const recipients = isIntern ? internRecipients : jobRecipients;
    const sendEmail = isIntern ? internSendEmail : jobSendEmail;
    const sendSMS = isIntern ? internSendSMS : jobSendSMS;
    const setStep = isIntern ? setInternStep : setJobStep;

    if (!campaignName.trim()) {
      toast.error('Campaign Name is required.');
      return;
    }
    if (recipients.length === 0) {
      toast.error('No recipients found matching your audience filters.');
      return;
    }
    if (!sendEmail && !sendSMS) {
      toast.error('Please check at least one delivery channel (Email or SMS).');
      return;
    }
    
    setStep('design');
  };

  const handleValidateDesignStep = (tab: 'intern' | 'job') => {
    const isIntern = tab === 'intern';
    const sendEmail = isIntern ? internSendEmail : jobSendEmail;
    const sendSMS = isIntern ? internSendSMS : jobSendSMS;
    const emailSubject = isIntern ? internEmailSubject : jobEmailSubject;
    const emailBlocks = isIntern ? internBlocks : jobBlocks;
    const smsBody = isIntern ? internSmsBody : jobSmsBody;
    const setStep = isIntern ? setInternStep : setJobStep;

    if (sendEmail) {
      if (!emailSubject.trim()) {
        toast.error('Email Subject Line is required.');
        return;
      }
      if (emailBlocks.length === 0) {
        toast.error('Email must contain at least 1 visual block.');
        return;
      }
    }
    if (sendSMS && !smsBody.trim()) {
      toast.error('SMS message body is required.');
      return;
    }

    setStep('review');
  };

  // Test Sends
  const handleSendTestEmail = async (tab: 'intern' | 'job') => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    
    setSendingTestEmail(true);
    try {
      const isIntern = tab === 'intern';
      const blocksList = isIntern ? internBlocks : jobBlocks;
      const subject = isIntern ? internEmailSubject : jobEmailSubject;
      const finalEmailHtml = compileBlocksToHtml(blocksList);

      const personalizationData = {
        name: 'Test Intern',
        applicant_name: 'Test Candidate',
        role: 'Software Engineer',
        position: 'Software Engineer',
        batch: 'Batch 2026',
        department: 'Development',
        status: 'shortlisted',
        company_name: brandingSettings['company_name'] || 'DIGI5 LTD'
      };

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'custom_broadcast',
          recipient_email: testEmailAddress,
          subject: `[TEST] ${subject}`,
          body: finalEmailHtml,
          data: personalizationData,
          force_send: true,
          campaign_name: `${isIntern ? internCampaignName : jobCampaignName} (Test)`
        }
      });

      if (error) throw new Error(error.message);
      
      if (data && data.success) {
        toast.success(`Test email successfully sent to ${testEmailAddress}`);
      } else {
        throw new Error(data?.error || 'Edge function dispatch failed');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Test email failed: ${e.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSendTestSMS = async (tab: 'intern' | 'job') => {
    if (!testPhoneNumber.trim()) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setSendingTestSMS(true);
    try {
      const isIntern = tab === 'intern';
      const smsBody = isIntern ? internSmsBody : jobSmsBody;

      const personalizationData = {
        name: 'Test Intern',
        applicant_name: 'Test Candidate',
        role: 'Software Engineer',
        position: 'Software Engineer',
        batch: 'Batch 2026',
        department: 'Development',
        status: 'shortlisted',
        company_name: brandingSettings['company_name'] || 'DIGI5 LTD'
      };

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'custom_broadcast',
          recipient_phone: testPhoneNumber,
          sms_body: smsBody,
          data: personalizationData,
          force_send: true,
          campaign_name: `${isIntern ? internCampaignName : jobCampaignName} (Test)`
        }
      });

      if (error) throw new Error(error.message);

      if (data && data.success) {
        toast.success(`Test SMS successfully sent to ${testPhoneNumber}`);
      } else {
        throw new Error(data?.error || 'Edge function dispatch failed');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(`Test SMS failed: ${e.message}`);
    } finally {
      setSendingTestSMS(false);
    }
  };

  // Launch Broadcast for Interns
  const handleSendInternBroadcast = async () => {
    setInternSending(true);
    setInternProgress({ total: internRecipients.length, sent: 0, success: 0, failed: 0 });
    setInternLogs([]);
    setInternShowProgressDialog(true);

    const tempLogs: LogEntry[] = [];
    const finalEmailBody = compileBlocksToHtml(internBlocks);

    for (let i = 0; i < internRecipients.length; i++) {
      const intern = internRecipients[i];
      const name = intern.profile?.full_name || 'Intern';
      const email = intern.profile?.email || '';
      const phone = intern.phone || '';
      const role = intern.role_title || 'Intern';
      const batch = intern.batch_name || 'Unassigned';
      const department = intern.department?.name || 'Unassigned';

      const personalizationData = {
        name,
        applicant_name: name,
        intern_name: name,
        role,
        role_title: role,
        position: role,
        batch,
        batch_name: batch,
        department,
        department_name: department,
        company_name: brandingSettings['company_name'] || 'DIGI5 LTD'
      };

      let emailStatus = 'skipped';
      let smsStatus = 'skipped';
      let errorMessage = '';

      try {
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            template_key: 'custom_broadcast',
            recipient_email: internSendEmail && email ? email : undefined,
            recipient_phone: internSendSMS && phone ? phone : undefined,
            subject: internEmailSubject,
            body: finalEmailBody,
            sms_body: internSmsBody,
            data: personalizationData,
            force_send: true,
            campaign_name: internCampaignName,
            scheduled_at: internIsScheduled && internScheduledAt ? new Date(internScheduledAt).toISOString() : undefined
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.success) {
          if (internIsScheduled) {
            emailStatus = internSendEmail && email ? 'scheduled' : 'skipped';
            smsStatus = internSendSMS && phone ? 'scheduled' : 'skipped';
          } else {
            if (internSendEmail && email) {
              emailStatus = data.results?.email?.success ? 'success' : 'failed';
              if (emailStatus === 'failed') errorMessage += `Email: ${data.results?.email?.error || 'Failed'}; `;
            }
            if (internSendSMS && phone) {
              smsStatus = data.results?.sms?.success ? 'success' : 'failed';
              if (smsStatus === 'failed') errorMessage += `SMS: ${data.results?.sms?.error || 'Failed'}; `;
            }
          }
        } else {
          throw new Error(data?.error || 'Failed to dispatch broadcast');
        }
      } catch (err: any) {
        if (internSendEmail) emailStatus = 'failed';
        if (internSendSMS) smsStatus = 'failed';
        errorMessage = err.message || 'Unknown error occurred';
      }

      const isSuccess = 
        (!internSendEmail || !email || emailStatus === 'success' || emailStatus === 'scheduled') && 
        (!internSendSMS || !phone || smsStatus === 'success' || smsStatus === 'scheduled');

      const entry: LogEntry = {
        name,
        email: email || 'No Email',
        phone: phone || 'No Phone',
        emailStatus,
        smsStatus,
        error: isSuccess ? undefined : (errorMessage || 'Some channels failed')
      };

      tempLogs.push(entry);
      setInternLogs([...tempLogs]);

      setInternProgress(prev => ({
        ...prev,
        sent: i + 1,
        success: prev.success + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1)
      }));
    }

    setInternSending(false);
    toast.success(internIsScheduled ? 'Broadcast campaign successfully scheduled!' : 'Broadcast transmission completed!');
  };

  // Launch Broadcast for Job Applicants
  const handleSendJobBroadcast = async () => {
    setJobSending(true);
    setJobProgress({ total: jobRecipients.length, sent: 0, success: 0, failed: 0 });
    setJobLogs([]);
    setJobShowProgressDialog(true);

    const tempLogs: LogEntry[] = [];
    const finalEmailBody = compileBlocksToHtml(jobBlocks);

    for (let i = 0; i < jobRecipients.length; i++) {
      const app = jobRecipients[i];
      const name = app.applicant_name || 'Candidate';
      const email = app.applicant_email || '';
      const phone = app.applicant_phone || '';
      const position = app.form?.title || 'Job Position';
      const department = app.department?.name || app.form?.department?.name || 'Unassigned';
      const status = app.status;

      const personalizationData = {
        name,
        applicant_name: name,
        position,
        form_title: position,
        department,
        department_name: department,
        application_status: status,
        company_name: brandingSettings['company_name'] || 'DIGI5 LTD'
      };

      let emailStatus = 'skipped';
      let smsStatus = 'skipped';
      let errorMessage = '';

      try {
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            template_key: 'custom_broadcast',
            recipient_email: jobSendEmail && email ? email : undefined,
            recipient_phone: jobSendSMS && phone ? phone : undefined,
            subject: jobEmailSubject,
            body: finalEmailBody,
            sms_body: jobSmsBody,
            data: personalizationData,
            force_send: true,
            campaign_name: jobCampaignName,
            scheduled_at: jobIsScheduled && jobScheduledAt ? new Date(jobScheduledAt).toISOString() : undefined
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.success) {
          if (jobIsScheduled) {
            emailStatus = jobSendEmail && email ? 'scheduled' : 'skipped';
            smsStatus = jobSendSMS && phone ? 'scheduled' : 'skipped';
          } else {
            if (jobSendEmail && email) {
              emailStatus = data.results?.email?.success ? 'success' : 'failed';
              if (emailStatus === 'failed') errorMessage += `Email: ${data.results?.email?.error || 'Failed'}; `;
            }
            if (jobSendSMS && phone) {
              smsStatus = data.results?.sms?.success ? 'success' : 'failed';
              if (smsStatus === 'failed') errorMessage += `SMS: ${data.results?.sms?.error || 'Failed'}; `;
            }
          }
        } else {
          throw new Error(data?.error || 'Failed to dispatch broadcast');
        }
      } catch (err: any) {
        if (jobSendEmail) emailStatus = 'failed';
        if (jobSendSMS) smsStatus = 'failed';
        errorMessage = err.message || 'Unknown error occurred';
      }

      const isSuccess = 
        (!jobSendEmail || !email || emailStatus === 'success' || emailStatus === 'scheduled') && 
        (!jobSendSMS || !phone || smsStatus === 'success' || smsStatus === 'scheduled');

      const entry: LogEntry = {
        name,
        email: email || 'No Email',
        phone: phone || 'No Phone',
        emailStatus,
        smsStatus,
        error: isSuccess ? undefined : (errorMessage || 'Some channels failed')
      };

      tempLogs.push(entry);
      setJobLogs([...tempLogs]);

      setJobProgress(prev => ({
        ...prev,
        sent: i + 1,
        success: prev.success + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1)
      }));
    }

    setJobSending(false);
    toast.success(jobIsScheduled ? 'Job broadcast campaign successfully scheduled!' : 'Job broadcast transmission completed!');
  };

  const renderStepperHeader = (currentStep: 'setup' | 'design' | 'review') => {
    const steps = [
      { id: 'setup', title: '1. Setup Target', desc: 'Audience & parameters' },
      { id: 'design', title: '2. Compose & Design', desc: 'Blocks and SMS content' },
      { id: 'review', title: '3. Review & Send', desc: 'Verify and launch' }
    ];

    return (
      <div className="w-full mb-6">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          {steps.map((s, idx) => {
            const isActive = s.id === currentStep;
            const isCompleted = 
              (currentStep === 'design' && s.id === 'setup') || 
              (currentStep === 'review' && (s.id === 'setup' || s.id === 'design'));
            
            return (
              <React.Fragment key={s.id}>
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs ring-4 ring-indigo-50/50' 
                        : isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-750 uppercase tracking-wider">{s.title}</h4>
                    <p className="text-[10px] text-slate-450 leading-none mt-0.5">{s.desc}</p>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden md:block h-4.5 w-4.5 text-slate-350 mx-1" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSmsPhoneMockup = (textBody: string) => {
    return (
      <div className="w-[260px] h-[450px] border-[8px] border-slate-800 rounded-[32px] bg-slate-950 relative shadow-md ring-4 ring-slate-200/20 overflow-hidden mx-auto my-3">
        {/* Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3 bg-slate-800 rounded-full z-20" />
        
        {/* Phone Header */}
        <div className="pt-5 pb-2 px-3 bg-slate-900 border-b border-slate-850 text-center text-white text-[10px]">
          <div className="h-6 w-6 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-1 text-[8px] font-bold text-slate-300">HQ</div>
          <div className="font-semibold">DIGI5 Notifications</div>
          <div className="text-[7.5px] text-slate-500">iMessage / SMS Thread</div>
        </div>
        
        {/* Messages Body */}
        <div className="p-3 space-y-3 h-[300px] overflow-y-auto bg-slate-950 flex flex-col justify-start">
          <div className="text-[8px] text-slate-550 text-center uppercase tracking-wider">Today 10:00 AM</div>
          
          <div className="max-w-[85%] self-start bg-slate-900 border border-slate-850 text-slate-100 text-[11px] rounded-2xl py-2 px-3 leading-relaxed shadow-3xs">
            {textBody || 'SMS Message body is empty. Type your message to see it render live here.'}
          </div>
        </div>

        {/* Input Bar */}
        <div className="absolute bottom-0 inset-x-0 p-2 bg-slate-900 border-t border-slate-850 flex items-center gap-1.5 z-10">
          <div className="flex-1 bg-slate-950 border border-slate-850 rounded-full px-3 py-1 text-[9px] text-slate-500 select-none">
            iMessage text...
          </div>
          <div className="h-5.5 w-5.5 rounded-full bg-emerald-500 flex items-center justify-center cursor-pointer">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative px-1 sm:px-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Broadcast Campaigns</h1>
            <p className="text-slate-550 mt-1">Send bulk personalized Updates, Emails, or SMS to Interns or Job Candidates.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-sm bg-slate-100 p-0.5 rounded-xl h-9.5">
              <TabsTrigger value="intern" className="rounded-lg py-1.5 font-bold text-xs">Intern Broadcasts</TabsTrigger>
              <TabsTrigger value="job" className="rounded-lg py-1.5 font-bold text-xs">Job Applicants</TabsTrigger>
            </TabsList>

            {/* INTERN BROADCASTS TAB */}
            <TabsContent value="intern" className="mt-0 focus-visible:outline-none">
              {renderStepperHeader(internStep)}

              {/* STEP 1: SETUP & TARGET */}
              {internStep === 'setup' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* Setup parameters cards */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Campaign Specifications</CardTitle>
                        <CardDescription>Give your campaign a title and select the communication channels.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="internCampaignName" className="font-bold text-xs text-slate-500 uppercase tracking-wider">Campaign Name <span className="text-red-500">*</span></Label>
                          <Input 
                            id="internCampaignName" 
                            placeholder="e.g. Weekly Operations Sync - Interns" 
                            value={internCampaignName} 
                            onChange={(e) => setInternCampaignName(e.target.value)} 
                          />
                        </div>

                        {/* Channels selection */}
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Delivery Channels</Label>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-xl cursor-pointer hover:bg-slate-100/50 flex-1">
                              <Checkbox 
                                id="internEmailChannel" 
                                checked={internSendEmail} 
                                onCheckedChange={(checked) => setInternSendEmail(!!checked)} 
                              />
                              <Label htmlFor="internEmailChannel" className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                                <Mail size={16} className="text-slate-500" /> Send Email Broadcast
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-xl cursor-pointer hover:bg-slate-100/50 flex-1">
                              <Checkbox 
                                id="internSmsChannel" 
                                checked={internSendSMS} 
                                onCheckedChange={(checked) => setInternSendSMS(!!checked)} 
                              />
                              <Label htmlFor="internSmsChannel" className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                                <MessageSquare size={16} className="text-slate-500" /> Send SMS Message
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Scheduling Queue */}
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="internScheduleToggle" 
                              checked={internIsScheduled} 
                              onCheckedChange={(checked) => setInternIsScheduled(!!checked)} 
                            />
                            <Label htmlFor="internScheduleToggle" className="cursor-pointer font-semibold text-slate-700 text-sm">
                              Schedule Campaign (Queue System)
                            </Label>
                          </div>
                          {internIsScheduled && (
                            <div className="space-y-2 max-w-sm pl-6 animate-fade-in">
                              <Label htmlFor="internScheduledAt" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled Launch Date & Time <span className="text-red-500">*</span></Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                <Input 
                                  id="internScheduledAt" 
                                  type="datetime-local" 
                                  value={internScheduledAt} 
                                  onChange={(e) => setInternScheduledAt(e.target.value)} 
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar Target Audience */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Audience Segmentation</CardTitle>
                        <CardDescription>Choose filters to segment your recipients.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filter Type</Label>
                          <Select value={internTargetType} onValueChange={(v: 'batch' | 'department') => setInternTargetType(v)}>
                            <SelectTrigger className="rounded-xl h-9.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="batch">Full Batch Wise</SelectItem>
                              <SelectItem value="department">Department & Batch Wise</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Batch</Label>
                          <Select value={internSelectedBatch} onValueChange={setInternSelectedBatch}>
                            <SelectTrigger className="rounded-xl h-9.5">
                              <SelectValue placeholder="Select a batch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Batches</SelectItem>
                              {uniqueBatches.map(batch => (
                                <SelectItem key={batch} value={batch}>{batch}</SelectItem>
                              ))}
                              <SelectItem value="Unassigned">Unassigned Batch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {internTargetType === 'department' && (
                          <div className="space-y-1.5">
                            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Select Department</Label>
                            <Select value={internSelectedDepartment} onValueChange={setInternSelectedDepartment}>
                              <SelectTrigger className="rounded-xl h-9.5">
                                <SelectValue placeholder="Select a department" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(d => (
                                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 mt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipients ({internRecipients.length})</span>
                            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-none font-bold text-[10px]">Active</Badge>
                          </div>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                            {internRecipients.length === 0 ? (
                              <p className="text-slate-400 italic py-2 text-center">No matching active interns found.</p>
                            ) : (
                              internRecipients.map(r => (
                                <div key={r.id} className="flex justify-between items-center bg-white p-2 border rounded-lg">
                                  <span className="font-semibold text-slate-700 truncate max-w-[130px]">{r.profile?.full_name}</span>
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{r.department?.name || 'Unassigned'}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Navigation footer */}
                  <div className="lg:col-span-3 flex justify-end border-t pt-4 mt-2">
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={() => handleValidateSetupStep('intern')}
                    >
                      Next: Compose Content <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: COMPOSE & DESIGN */}
              {internStep === 'design' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Tabs layout for Email vs SMS composer */}
                  <Tabs defaultValue={internSendEmail ? "email" : "sms"} className="w-full space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <TabsList className="bg-slate-100 p-0.5 rounded-xl h-8.5">
                        {internSendEmail && <TabsTrigger value="email" className="text-xs font-bold rounded-lg py-1 px-3">Email Template Designer</TabsTrigger>}
                        {internSendSMS && <TabsTrigger value="sms" className="text-xs font-bold rounded-lg py-1 px-3">SMS Message Writer</TabsTrigger>}
                      </TabsList>
                      <span className="text-[10px] text-slate-400 font-semibold italic">Design content for enabled channels</span>
                    </div>

                    {/* Email Visual Designer View */}
                    {internSendEmail && (
                      <TabsContent value="email" className="mt-0 focus-visible:outline-none w-full">
                        <VisualEmailBuilder 
                          blocks={internBlocks}
                          onChange={setInternBlocks}
                          subject={internEmailSubject}
                          onSubjectChange={setInternEmailSubject}
                          personalizationTokens={['name', 'role', 'batch', 'department']}
                          brandingSettings={brandingSettings}
                        />
                      </TabsContent>
                    )}

                    {/* SMS Composer View */}
                    {internSendSMS && (
                      <TabsContent value="sms" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <Card className="lg:col-span-7 border border-slate-200 shadow-xs bg-white rounded-2xl">
                            <CardHeader>
                              <CardTitle className="text-base font-bold text-slate-750">SMS Composition</CardTitle>
                              <CardDescription>Compose raw text notification to be sent to target phones.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <Label htmlFor="internSmsBody" className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Message</Label>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {internSmsBody.length} characters ({Math.ceil(internSmsBody.length / 160)} SMS parts)
                                  </span>
                                </div>
                                <Textarea 
                                  id="internSmsBody" 
                                  placeholder="Hi {{name}}, your weekly sync review checklist has been posted. - DIGI5 LTD" 
                                  className="min-h-[160px] text-sm rounded-xl leading-relaxed" 
                                  value={internSmsBody} 
                                  onChange={(e) => setInternSmsBody(e.target.value)} 
                                />
                              </div>

                              {/* Variable Quick Badges */}
                              <div className="space-y-2 pt-2 border-t">
                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <HelpCircle className="h-3.5 w-3.5" /> Insert variables in SMS
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {['name', 'role', 'batch', 'department'].map(token => (
                                    <Badge 
                                      key={token} 
                                      variant="secondary" 
                                      className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors py-1 px-2 text-[10px] font-mono border rounded-lg"
                                      onClick={() => insertVariable(token, 'sms', 'intern')}
                                    >
                                      {`{{${token}}}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Live Phone Preview panel */}
                          <div className="lg:col-span-5 flex flex-col bg-slate-50 border rounded-2xl p-5 justify-center min-h-[400px]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 text-center">SMS Phone Mockup</span>
                            {renderSmsPhoneMockup(internSmsBody)}
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>

                  {/* Navigation footer */}
                  <div className="flex justify-between border-t pt-4 mt-2">
                    <Button 
                      variant="outline"
                      className="rounded-xl border-slate-200 font-semibold px-5 flex items-center gap-1.5"
                      onClick={() => setInternStep('setup')}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Setup
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={() => handleValidateDesignStep('intern')}
                    >
                      Next: Review Campaign <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & SEND */}
              {internStep === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left Column: Campaign Stats & Test Send checks (col-span-5) */}
                  <div className="lg:col-span-5 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Campaign Audit Review</CardTitle>
                        <CardDescription>Confirm target metrics before sending bulk communications.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 border p-3.5 rounded-xl text-center">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Audience Segment</span>
                            <span className="text-sm font-bold text-slate-750 mt-1 block">Active Interns</span>
                          </div>
                          <div className="bg-slate-50 border p-3.5 rounded-xl text-center">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Recipients Count</span>
                            <span className="text-sm font-bold text-indigo-650 mt-1 block">{internRecipients.length} Targets</span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t pt-3.5">
                          <div className="flex justify-between text-xs py-1 border-b">
                            <span className="font-semibold text-slate-500">Campaign Title</span>
                            <span className="font-medium text-slate-800">{internCampaignName}</span>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-b">
                            <span className="font-semibold text-slate-500">Delivery Channels</span>
                            <span className="font-medium text-slate-800">
                              {[internSendEmail && 'Email', internSendSMS && 'SMS'].filter(Boolean).join(' & ')}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs py-1">
                            <span className="font-semibold text-slate-500">Delivery Schedule</span>
                            <span className="font-semibold text-slate-800">
                              {internIsScheduled ? `Scheduled for ${new Date(internScheduledAt).toLocaleString()}` : 'Send Instantly'}
                            </span>
                          </div>
                        </div>

                        {/* Test send card */}
                        <div className="border border-indigo-100 bg-indigo-50/15 p-4 rounded-xl space-y-3.5 mt-2">
                          <h4 className="text-xs font-bold text-indigo-750 flex items-center gap-1.5">
                            <SendHorizontal className="h-4 w-4" /> Send Test Message
                          </h4>
                          <p className="text-[11px] text-slate-450 leading-relaxed">
                            Verify how elements render in a real inbox before starting the bulk transmission process.
                          </p>

                          {internSendEmail && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Email Address</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={testEmailAddress}
                                  onChange={(e) => setTestEmailAddress(e.target.value)}
                                  placeholder="admin@domain.com"
                                  className="h-8.5 text-xs rounded-lg bg-white"
                                />
                                <Button 
                                  size="sm"
                                  disabled={sendingTestEmail || !testEmailAddress}
                                  onClick={() => handleSendTestEmail('intern')}
                                  className="h-8.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
                                >
                                  {sendingTestEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {internSendSMS && (
                            <div className="space-y-1.5 pt-1.5">
                              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Phone Number</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={testPhoneNumber}
                                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                                  placeholder="+8801700000000"
                                  className="h-8.5 text-xs rounded-lg bg-white"
                                />
                                <Button 
                                  size="sm"
                                  disabled={sendingTestSMS || !testPhoneNumber}
                                  onClick={() => handleSendTestSMS('intern')}
                                  className="h-8.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
                                >
                                  {sendingTestSMS ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: HTML and SMS live compiled previews (col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-h-[480px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4">Composed Output Preview</span>
                    
                    <Tabs defaultValue={internSendEmail ? "emailPreview" : "smsPreview"} className="w-full flex-1 flex flex-col">
                      <TabsList className="bg-white border rounded-xl p-0.5 self-center mb-4">
                        {internSendEmail && <TabsTrigger value="emailPreview" className="text-xs rounded-lg py-1 px-3">Email Template</TabsTrigger>}
                        {internSendSMS && <TabsTrigger value="smsPreview" className="text-xs rounded-lg py-1 px-3">SMS Message</TabsTrigger>}
                      </TabsList>

                      {internSendEmail && (
                        <TabsContent value="emailPreview" className="mt-0 focus-visible:outline-none flex-1 flex justify-center items-start overflow-y-auto max-h-[500px]">
                          <div className="w-full max-w-[480px] bg-white border shadow-xs rounded-xl overflow-hidden">
                            {getPreviewHeaderHtml()}
                            <div className="font-sans text-sm">
                              {internBlocks.map((block) => {
                                const props = block.properties || {};
                                const align = props.align || 'left';
                                const bgColor = props.bgColor || 'transparent';
                                const textColor = props.textColor || '#334155';
                                const fontSize = props.fontSize || '15px';
                                const padding = props.padding || '12px 24px';
                                
                                return (
                                  <div key={block.id} style={{ backgroundColor: block.type === 'footer' ? 'transparent' : bgColor }}>
                                    {block.type === 'header' && (
                                      <div style={{ backgroundColor: props.bgColor || '#4f46e5', padding: props.padding || '24px', textAlign: align }}>
                                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 850, color: props.textColor || '#ffffff' }}>
                                          {props.title || 'Header Title'}
                                        </h1>
                                        {props.subtitle && (
                                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: props.textColor || '#ffffff', opacity: 0.8 }}>
                                            {props.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {block.type === 'text' && (
                                      <div style={{ padding, textAlign: align, color: textColor, fontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {block.content || 'Empty text block.'}
                                      </div>
                                    )}

                                    {block.type === 'button' && (
                                      <div style={{ padding, textAlign: align }}>
                                        <span style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: props.bgColor || '#4f46e5', color: props.textColor || '#ffffff', fontWeight: 650, fontSize: '13px', borderRadius: props.borderRadius || '6px' }}>
                                          {props.label || 'Click Here'}
                                        </span>
                                      </div>
                                    )}

                                    {block.type === 'divider' && (
                                      <div style={{ padding: '0 24px' }}>
                                        <hr style={{ border: 0, borderTop: `${props.thickness || '1px'} solid ${props.color || '#e2e8f0'}`, margin: props.spacing || '16px 0' }} />
                                      </div>
                                    )}

                                    {block.type === 'spacer' && (
                                      <div style={{ height: props.height || '30px' }} />
                                    )}

                                    {block.type === 'image' && (
                                      <div style={{ padding, textAlign: align }}>
                                        <img src={props.imageUrl} style={{ maxWidth: '100%', width: props.width || '100%', borderRadius: props.borderRadius || '8px' }} alt={props.altText} />
                                      </div>
                                    )}

                                    {block.type === 'footer' && getPreviewFooterHtml()}
                                  </div>
                                );
                              })}
                            </div>
                            {!internBlocks.some(b => b.type === 'footer') && getPreviewFooterHtml()}
                          </div>
                        </TabsContent>
                      )}

                      {internSendSMS && (
                        <TabsContent value="smsPreview" className="mt-0 focus-visible:outline-none flex-1 flex justify-center items-center">
                          {renderSmsPhoneMockup(internSmsBody)}
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>

                  {/* Stepper controls */}
                  <div className="lg:col-span-12 flex justify-between border-t pt-4 mt-2">
                    <Button 
                      variant="outline"
                      className="rounded-xl border-slate-200 font-semibold px-5 flex items-center gap-1.5"
                      onClick={() => setInternStep('design')}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Editor
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={handleSendInternBroadcast}
                    >
                      <Send className="h-4 w-4" /> Launch Campaign Now
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* JOB BROADCASTS TAB */}
            <TabsContent value="job" className="mt-0 focus-visible:outline-none">
              {renderStepperHeader(jobStep)}

              {/* STEP 1: SETUP & TARGET */}
              {jobStep === 'setup' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                  
                  {/* Setup parameters cards */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Campaign Specifications</CardTitle>
                        <CardDescription>Configure specifications and delivery options for job applicants.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="jobCampaignName" className="font-bold text-xs text-slate-500 uppercase tracking-wider">Campaign Name <span className="text-red-500">*</span></Label>
                          <Input 
                            id="jobCampaignName" 
                            placeholder="e.g. Interview Slots Selection Campaign" 
                            value={jobCampaignName} 
                            onChange={(e) => setJobCampaignName(e.target.value)} 
                          />
                        </div>

                        {/* Channels selection */}
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="font-bold text-xs text-slate-500 uppercase tracking-wider block mb-2">Delivery Channels</Label>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-xl cursor-pointer hover:bg-slate-100/50 flex-1">
                              <Checkbox 
                                id="jobEmailChannel" 
                                checked={jobSendEmail} 
                                onCheckedChange={(checked) => setJobSendEmail(!!checked)} 
                              />
                              <Label htmlFor="jobEmailChannel" className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                                <Mail size={16} className="text-slate-500" /> Send Email Broadcast
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-slate-50 border p-3 rounded-xl cursor-pointer hover:bg-slate-100/50 flex-1">
                              <Checkbox 
                                id="jobSmsChannel" 
                                checked={jobSendSMS} 
                                onCheckedChange={(checked) => setJobSendSMS(!!checked)} 
                              />
                              <Label htmlFor="jobSmsChannel" className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 text-sm">
                                <MessageSquare size={16} className="text-slate-500" /> Send SMS Message
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Scheduling Queue */}
                        <div className="space-y-3 pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="jobScheduleToggle" 
                              checked={jobIsScheduled} 
                              onCheckedChange={(checked) => setJobIsScheduled(!!checked)} 
                            />
                            <Label htmlFor="jobScheduleToggle" className="cursor-pointer font-semibold text-slate-700 text-sm">
                              Schedule Campaign (Queue System)
                            </Label>
                          </div>
                          {jobIsScheduled && (
                            <div className="space-y-2 max-w-sm pl-6 animate-fade-in">
                              <Label htmlFor="jobScheduledAt" className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scheduled Launch Date & Time <span className="text-red-500">*</span></Label>
                              <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                                <Input 
                                  id="jobScheduledAt" 
                                  type="datetime-local" 
                                  value={jobScheduledAt} 
                                  onChange={(e) => setJobScheduledAt(e.target.value)} 
                                  className="pl-10"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar Target Filters */}
                  <div className="lg:col-span-1 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Audience Segmentation</CardTitle>
                        <CardDescription>Choose filters to segment targeted candidates.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Position</Label>
                          <Select value={jobSelectedForm} onValueChange={setJobSelectedForm}>
                            <SelectTrigger className="rounded-xl h-9.5">
                              <SelectValue placeholder="All Positions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Positions</SelectItem>
                              {jobForms.map(form => (
                                <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Department</Label>
                          <Select value={jobSelectedDepartment} onValueChange={setJobSelectedDepartment}>
                            <SelectTrigger className="rounded-xl h-9.5">
                              <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              {departments.map(d => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Candidate Status</Label>
                          <Select value={jobSelectedStatus} onValueChange={setJobSelectedStatus}>
                            <SelectTrigger className="rounded-xl h-9.5">
                              <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 mt-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recipients List ({jobRecipients.length})</span>
                          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 text-xs">
                            {jobRecipients.length === 0 ? (
                              <p className="text-slate-400 italic py-2 text-center">No matching candidates found.</p>
                            ) : (
                              jobRecipients.map(r => (
                                <div key={r.id} className="flex justify-between items-center bg-white p-2 border rounded-lg">
                                  <span className="font-semibold text-slate-700 truncate max-w-[130px]">{r.applicant_name}</span>
                                  <span className="text-[10px] text-indigo-600 font-bold truncate max-w-[120px] capitalize">{r.status}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Navigation footer */}
                  <div className="lg:col-span-3 flex justify-end border-t pt-4 mt-2">
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={() => handleValidateSetupStep('job')}
                    >
                      Next: Compose Content <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: COMPOSE & DESIGN */}
              {jobStep === 'design' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Tabs layout for Email vs SMS composer */}
                  <Tabs defaultValue={jobSendEmail ? "email" : "sms"} className="w-full space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <TabsList className="bg-slate-100 p-0.5 rounded-xl h-8.5">
                        {jobSendEmail && <TabsTrigger value="email" className="text-xs font-bold rounded-lg py-1 px-3">Email Template Designer</TabsTrigger>}
                        {jobSendSMS && <TabsTrigger value="sms" className="text-xs font-bold rounded-lg py-1 px-3">SMS Message Writer</TabsTrigger>}
                      </TabsList>
                      <span className="text-[10px] text-slate-400 font-semibold italic">Design content for enabled channels</span>
                    </div>

                    {/* Email Visual Designer View */}
                    {jobSendEmail && (
                      <TabsContent value="email" className="mt-0 focus-visible:outline-none w-full">
                        <VisualEmailBuilder 
                          blocks={jobBlocks}
                          onChange={setJobBlocks}
                          subject={jobEmailSubject}
                          onSubjectChange={setJobEmailSubject}
                          personalizationTokens={['name', 'position', 'department', 'status']}
                          brandingSettings={brandingSettings}
                        />
                      </TabsContent>
                    )}

                    {/* SMS Composer View */}
                    {jobSendSMS && (
                      <TabsContent value="sms" className="mt-0 focus-visible:outline-none">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <Card className="lg:col-span-7 border border-slate-200 shadow-xs bg-white rounded-2xl">
                            <CardHeader>
                              <CardTitle className="text-base font-bold text-slate-750">SMS Composition</CardTitle>
                              <CardDescription>Compose raw text notification to be sent to target phones.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <Label htmlFor="jobSmsBody" className="text-xs font-bold text-slate-500 uppercase tracking-wider">SMS Message</Label>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {jobSmsBody.length} characters ({Math.ceil(jobSmsBody.length / 160)} SMS parts)
                                  </span>
                                </div>
                                <Textarea 
                                  id="jobSmsBody" 
                                  placeholder="Hi {{name}}, update on your application for {{position}}: {{status}}. - DIGI5 LTD" 
                                  className="min-h-[160px] text-sm rounded-xl leading-relaxed" 
                                  value={jobSmsBody} 
                                  onChange={(e) => setJobSmsBody(e.target.value)} 
                                />
                              </div>

                              {/* Variable Quick Badges */}
                              <div className="space-y-2 pt-2 border-t">
                                <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                  <HelpCircle className="h-3.5 w-3.5" /> Insert variables in SMS
                                </Label>
                                <div className="flex flex-wrap gap-1.5">
                                  {['name', 'position', 'department', 'status'].map(token => (
                                    <Badge 
                                      key={token} 
                                      variant="secondary" 
                                      className="cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors py-1 px-2 text-[10px] font-mono border rounded-lg"
                                      onClick={() => insertVariable(token, 'sms', 'job')}
                                    >
                                      {`{{${token}}}`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Live Phone Preview panel */}
                          <div className="lg:col-span-5 flex flex-col bg-slate-50 border rounded-2xl p-5 justify-center min-h-[400px]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4 text-center">SMS Phone Mockup</span>
                            {renderSmsPhoneMockup(jobSmsBody)}
                          </div>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>

                  {/* Navigation footer */}
                  <div className="flex justify-between border-t pt-4 mt-2">
                    <Button 
                      variant="outline"
                      className="rounded-xl border-slate-200 font-semibold px-5 flex items-center gap-1.5"
                      onClick={() => setJobStep('setup')}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Setup
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={() => handleValidateDesignStep('job')}
                    >
                      Next: Review Campaign <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & SEND */}
              {jobStep === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left Column: Campaign Stats & Test Send checks (col-span-5) */}
                  <div className="lg:col-span-5 space-y-6">
                    <Card className="border border-slate-200 shadow-xs bg-white rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-750">Campaign Audit Review</CardTitle>
                        <CardDescription>Confirm target metrics before sending bulk communications.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 border p-3.5 rounded-xl text-center">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Audience Segment</span>
                            <span className="text-sm font-bold text-slate-750 mt-1 block">Job Candidates</span>
                          </div>
                          <div className="bg-slate-50 border p-3.5 rounded-xl text-center">
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Recipients Count</span>
                            <span className="text-sm font-bold text-indigo-650 mt-1 block">{jobRecipients.length} Targets</span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t pt-3.5">
                          <div className="flex justify-between text-xs py-1 border-b">
                            <span className="font-semibold text-slate-500">Campaign Title</span>
                            <span className="font-medium text-slate-800">{jobCampaignName}</span>
                          </div>
                          <div className="flex justify-between text-xs py-1 border-b">
                            <span className="font-semibold text-slate-500">Delivery Channels</span>
                            <span className="font-medium text-slate-800">
                              {[jobSendEmail && 'Email', jobSendSMS && 'SMS'].filter(Boolean).join(' & ')}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs py-1">
                            <span className="font-semibold text-slate-500">Delivery Schedule</span>
                            <span className="font-semibold text-slate-800">
                              {jobIsScheduled ? `Scheduled for ${new Date(jobScheduledAt).toLocaleString()}` : 'Send Instantly'}
                            </span>
                          </div>
                        </div>

                        {/* Test send card */}
                        <div className="border border-indigo-100 bg-indigo-50/15 p-4 rounded-xl space-y-3.5 mt-2">
                          <h4 className="text-xs font-bold text-indigo-750 flex items-center gap-1.5">
                            <SendHorizontal className="h-4 w-4" /> Send Test Message
                          </h4>
                          <p className="text-[11px] text-slate-450 leading-relaxed">
                            Verify how elements render in a real inbox before starting the bulk transmission process.
                          </p>

                          {jobSendEmail && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Email Address</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={testEmailAddress}
                                  onChange={(e) => setTestEmailAddress(e.target.value)}
                                  placeholder="admin@domain.com"
                                  className="h-8.5 text-xs rounded-lg bg-white"
                                />
                                <Button 
                                  size="sm"
                                  disabled={sendingTestEmail || !testEmailAddress}
                                  onClick={() => handleSendTestEmail('job')}
                                  className="h-8.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
                                >
                                  {sendingTestEmail ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
                                </Button>
                              </div>
                            </div>
                          )}

                          {jobSendSMS && (
                            <div className="space-y-1.5 pt-1.5">
                              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Test Phone Number</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={testPhoneNumber}
                                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                                  placeholder="+8801700000000"
                                  className="h-8.5 text-xs rounded-lg bg-white"
                                />
                                <Button 
                                  size="sm"
                                  disabled={sendingTestSMS || !testPhoneNumber}
                                  onClick={() => handleSendTestSMS('job')}
                                  className="h-8.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs"
                                >
                                  {sendingTestSMS ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column: HTML and SMS live compiled previews (col-span-7) */}
                  <div className="lg:col-span-7 flex flex-col bg-slate-50 border border-slate-200/80 rounded-2xl p-4 min-h-[480px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-4">Composed Output Preview</span>
                    
                    <Tabs defaultValue={jobSendEmail ? "emailPreview" : "smsPreview"} className="w-full flex-1 flex flex-col">
                      <TabsList className="bg-white border rounded-xl p-0.5 self-center mb-4">
                        {jobSendEmail && <TabsTrigger value="emailPreview" className="text-xs rounded-lg py-1 px-3">Email Template</TabsTrigger>}
                        {jobSendSMS && <TabsTrigger value="smsPreview" className="text-xs rounded-lg py-1 px-3">SMS Message</TabsTrigger>}
                      </TabsList>

                      {jobSendEmail && (
                        <TabsContent value="emailPreview" className="mt-0 focus-visible:outline-none flex-1 flex justify-center items-start overflow-y-auto max-h-[500px]">
                          <div className="w-full max-w-[480px] bg-white border shadow-xs rounded-xl overflow-hidden">
                            {getPreviewHeaderHtml()}
                            <div className="font-sans text-sm">
                              {jobBlocks.map((block) => {
                                const props = block.properties || {};
                                const align = props.align || 'left';
                                const bgColor = props.bgColor || 'transparent';
                                const textColor = props.textColor || '#334155';
                                const fontSize = props.fontSize || '15px';
                                const padding = props.padding || '12px 24px';
                                
                                return (
                                  <div key={block.id} style={{ backgroundColor: block.type === 'footer' ? 'transparent' : bgColor }}>
                                    {block.type === 'header' && (
                                      <div style={{ backgroundColor: props.bgColor || '#4f46e5', padding: props.padding || '24px', textAlign: align }}>
                                        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 850, color: props.textColor || '#ffffff' }}>
                                          {props.title || 'Header Title'}
                                        </h1>
                                        {props.subtitle && (
                                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: props.textColor || '#ffffff', opacity: 0.8 }}>
                                            {props.subtitle}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {block.type === 'text' && (
                                      <div style={{ padding, textAlign: align, color: textColor, fontSize, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {block.content || 'Empty text block.'}
                                      </div>
                                    )}

                                    {block.type === 'button' && (
                                      <div style={{ padding, textAlign: align }}>
                                        <span style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: props.bgColor || '#4f46e5', color: props.textColor || '#ffffff', fontWeight: 650, fontSize: '13px', borderRadius: props.borderRadius || '6px' }}>
                                          {props.label || 'Click Here'}
                                        </span>
                                      </div>
                                    )}

                                    {block.type === 'divider' && (
                                      <div style={{ padding: '0 24px' }}>
                                        <hr style={{ border: 0, borderTop: `${props.thickness || '1px'} solid ${props.color || '#e2e8f0'}`, margin: props.spacing || '16px 0' }} />
                                      </div>
                                    )}

                                    {block.type === 'spacer' && (
                                      <div style={{ height: props.height || '30px' }} />
                                    )}

                                    {block.type === 'image' && (
                                      <div style={{ padding, textAlign: align }}>
                                        <img src={props.imageUrl} style={{ maxWidth: '100%', width: props.width || '100%', borderRadius: props.borderRadius || '8px' }} alt={props.altText} />
                                      </div>
                                    )}

                                    {block.type === 'footer' && getPreviewFooterHtml()}
                                  </div>
                                );
                              })}
                            </div>
                            {!jobBlocks.some(b => b.type === 'footer') && getPreviewFooterHtml()}
                          </div>
                        </TabsContent>
                      )}

                      {jobSendSMS && (
                        <TabsContent value="smsPreview" className="mt-0 focus-visible:outline-none flex-1 flex justify-center items-center">
                          {renderSmsPhoneMockup(jobSmsBody)}
                        </TabsContent>
                      )}
                    </Tabs>
                  </div>

                  {/* Stepper controls */}
                  <div className="lg:col-span-12 flex justify-between border-t pt-4 mt-2">
                    <Button 
                      variant="outline"
                      className="rounded-xl border-slate-200 font-semibold px-5 flex items-center gap-1.5"
                      onClick={() => setJobStep('design')}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Editor
                    </Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs font-semibold px-6 flex items-center gap-1.5"
                      onClick={handleSendJobBroadcast}
                    >
                      <Send className="h-4 w-4" /> Launch Campaign Now
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* PROGRESS MODAL DIALOGS */}
        
        {/* Intern Progress Dialog */}
        <Dialog open={internShowProgressDialog} onOpenChange={(open) => { if (!internSending) setInternShowProgressDialog(open); }}>
          <DialogContent className="max-w-md rounded-2xl border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {internSending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    Sending Broadcast
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Broadcast Complete
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {internSending 
                  ? `Transmitting personalized messages. Please do not close this window.`
                  : `Successfully processed broadcast messages for ${internProgress.total} recipients.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Sending Progress</span>
                  <span>{internProgress.sent} / {internProgress.total}</span>
                </div>
                <Progress value={(internProgress.sent / internProgress.total) * 100} className="h-2.5 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium mt-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border">
                  <p className="text-[10px] text-slate-450 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-slate-700 mt-0.5">{internProgress.total}</p>
                </div>
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Success</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{internProgress.success}</p>
                </div>
                <div className="bg-red-50/40 p-2.5 rounded-xl border border-red-100/50">
                  <p className="text-[10px] text-red-500 uppercase tracking-wider">Failed</p>
                  <p className="text-lg font-bold text-red-750 mt-0.5">{internProgress.failed}</p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 text-xs p-3 rounded-xl font-mono h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {internLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Initializing stream...</p>
                ) : (
                  [...internLogs].reverse().map((log, index) => {
                    const isSuccess = log.emailStatus !== 'failed' && log.smsStatus !== 'failed';
                    return (
                      <p key={index} className={isSuccess ? 'text-emerald-400 animate-fade-in' : 'text-red-455 animate-fade-in'}>
                        {isSuccess ? '✓' : '✗'} {log.name}: {
                          [
                            log.emailStatus === 'success' && 'Email Sent',
                            log.smsStatus === 'success' && 'SMS Sent',
                            log.emailStatus === 'failed' && 'Email Failed',
                            log.smsStatus === 'failed' && 'SMS Failed',
                          ].filter(Boolean).join(', ')
                        }
                      </p>
                    );
                  })
                )}
              </div>
            </div>

            {!internSending && (
              <Button 
                className="w-full bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-semibold" 
                onClick={() => {
                  setInternShowProgressDialog(false);
                  setInternStep('setup');
                }}
              >
                Close Summary
              </Button>
            )}
          </DialogContent>
        </Dialog>

        {/* Job Progress Dialog */}
        <Dialog open={jobShowProgressDialog} onOpenChange={(open) => { if (!jobSending) setJobShowProgressDialog(open); }}>
          <DialogContent className="max-w-md rounded-2xl border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {jobSending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                    Sending Broadcast
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Broadcast Complete
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {jobSending 
                  ? `Transmitting personalized messages. Please do not close this window.`
                  : `Successfully processed broadcast messages for ${jobProgress.total} recipients.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Sending Progress</span>
                  <span>{jobProgress.sent} / {jobProgress.total}</span>
                </div>
                <Progress value={(jobProgress.sent / jobProgress.total) * 100} className="h-2.5 bg-slate-100 rounded-full" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium mt-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border">
                  <p className="text-[10px] text-slate-450 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-slate-700 mt-0.5">{jobProgress.total}</p>
                </div>
                <div className="bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/50">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Success</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{jobProgress.success}</p>
                </div>
                <div className="bg-red-50/40 p-2.5 rounded-xl border border-red-100/50">
                  <p className="text-[10px] text-red-500 uppercase tracking-wider">Failed</p>
                  <p className="text-lg font-bold text-red-750 mt-0.5">{jobProgress.failed}</p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 text-xs p-3 rounded-xl font-mono h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {jobLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Initializing stream...</p>
                ) : (
                  [...jobLogs].reverse().map((log, index) => {
                    const isSuccess = log.emailStatus !== 'failed' && log.smsStatus !== 'failed';
                    return (
                      <p key={index} className={isSuccess ? 'text-emerald-400 animate-fade-in' : 'text-red-455 animate-fade-in'}>
                        {isSuccess ? '✓' : '✗'} {log.name}: {
                          [
                            log.emailStatus === 'success' && 'Email Sent',
                            log.smsStatus === 'success' && 'SMS Sent',
                            log.emailStatus === 'failed' && 'Email Failed',
                            log.smsStatus === 'failed' && 'SMS Failed',
                          ].filter(Boolean).join(', ')
                        }
                      </p>
                    );
                  })
                )}
              </div>
            </div>

            {!jobSending && (
              <Button 
                className="w-full bg-slate-800 hover:bg-slate-950 text-white rounded-xl font-semibold" 
                onClick={() => {
                  setJobShowProgressDialog(false);
                  setJobStep('setup');
                }}
              >
                Close Summary
              </Button>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
