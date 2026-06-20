import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Image, Upload, Loader2, Save, Trash2, Layers, Check, Mail, MessageSquare, FileText, Menu, Award, Brain, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateOptions, TemplateType } from '@/components/certificates/CertificateTemplate';
import { Slider } from '@/components/ui/slider';
import { SMTPSettingsCard } from '@/components/settings/SMTPSettingsCard';
import { SMSSettingsCard } from '@/components/settings/SMSSettingsCard';
import { NotificationTemplateManager } from '@/components/settings/NotificationTemplateManager';
import { NavMenuManager } from '@/components/settings/NavMenuManager';
import { getAssetUrl } from '@/lib/utils';

// Import preset patterns
import circuitPattern from '@/assets/patterns/circuit-pattern.png';
import hexagonNetwork from '@/assets/patterns/hexagon-network.png';
import binaryMatrix from '@/assets/patterns/binary-matrix.png';
import neuralNetwork from '@/assets/patterns/neural-network.png';
import gearsMechanical from '@/assets/patterns/gears-mechanical.png';
import microchipGrid from '@/assets/patterns/microchip-grid.png';
import dataFlow from '@/assets/patterns/data-flow.png';
import roboticsIcons from '@/assets/patterns/robotics-icons.png';
import cloudComputing from '@/assets/patterns/cloud-computing.png';
import polygonMesh from '@/assets/patterns/polygon-mesh.png';

const PRESET_PATTERNS = [
  { id: 'circuit', name: 'Circuit Board', src: circuitPattern },
  { id: 'hexagon', name: 'Hexagon Network', src: hexagonNetwork },
  { id: 'binary', name: 'Binary Matrix', src: binaryMatrix },
  { id: 'neural', name: 'Neural Network', src: neuralNetwork },
  { id: 'gears', name: 'Gears Mechanical', src: gearsMechanical },
  { id: 'microchip', name: 'Microchip Grid', src: microchipGrid },
  { id: 'dataflow', name: 'Data Flow', src: dataFlow },
  { id: 'robotics', name: 'Robotics Icons', src: roboticsIcons },
  { id: 'cloud', name: 'Cloud Computing', src: cloudComputing },
  { id: 'polygon', name: 'Polygon Mesh', src: polygonMesh },
];

interface SiteSettings {
  company_logo_url: string | null;
  signature_url: string | null;
  favicon_url: string | null;
  certificate_pattern_url: string | null;
  certificate_pattern_enabled: boolean;
  certificate_pattern_opacity: number;
  certificate_default_theme: TemplateType;
  certificate_download_format: 'pdf' | 'png' | 'jpeg';
  gemini_api_key: string | null;
  company_name: string | null;
  admin_email: string | null;
  footer_title: string | null;
  footer_subtitle: string | null;
  footer_website_url: string | null;
  footer_website_text: string | null;
  footer_address: string | null;
  footer_copyright: string | null;
  footer_terms_url: string | null;
  footer_privacy_url: string | null;
  footer_contact_url: string | null;
  footer_instagram_url: string | null;
  footer_facebook_url: string | null;
  footer_twitter_url: string | null;
  footer_youtube_url: string | null;
  footer_tiktok_url: string | null;
  footer_linkedin_url: string | null;
}

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Site settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    company_logo_url: null,
    signature_url: null,
    favicon_url: null,
    certificate_pattern_url: null,
    certificate_pattern_enabled: false,
    certificate_pattern_opacity: 5,
    certificate_default_theme: 'modern',
    certificate_download_format: 'pdf',
    gemini_api_key: null,
    company_name: 'DIGI5 LTD',
    admin_email: null,
    footer_title: null,
    footer_subtitle: null,
    footer_website_url: null,
    footer_website_text: null,
    footer_address: null,
    footer_copyright: null,
    footer_terms_url: null,
    footer_privacy_url: null,
    footer_contact_url: null,
    footer_instagram_url: null,
    footer_facebook_url: null,
    footer_twitter_url: null,
    footer_youtube_url: null,
    footer_tiktok_url: null,
    footer_linkedin_url: null,
  });
  const [companyName, setCompanyName] = useState('DIGI5 LTD');
  const [savingCompanyName, setSavingCompanyName] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingFormat, setSavingFormat] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingPattern, setUploadingPattern] = useState(false);
  const [savingPattern, setSavingPattern] = useState(false);

  // Email Footer Branding States
  const [adminEmail, setAdminEmail] = useState('');
  const [footerTitle, setFooterTitle] = useState('');
  const [footerSubtitle, setFooterSubtitle] = useState('');
  const [footerWebsiteUrl, setFooterWebsiteUrl] = useState('');
  const [footerWebsiteText, setFooterWebsiteText] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerCopyright, setFooterCopyright] = useState('');
  const [footerTermsUrl, setFooterTermsUrl] = useState('');
  const [footerPrivacyUrl, setFooterPrivacyUrl] = useState('');
  const [footerContactUrl, setFooterContactUrl] = useState('');
  const [footerInstagramUrl, setFooterInstagramUrl] = useState('');
  const [footerFacebookUrl, setFooterFacebookUrl] = useState('');
  const [footerTwitterUrl, setFooterTwitterUrl] = useState('');
  const [footerYoutubeUrl, setFooterYoutubeUrl] = useState('');
  const [footerTiktokUrl, setFooterTiktokUrl] = useState('');
  const [footerLinkedinUrl, setFooterLinkedinUrl] = useState('');
  const [savingEmailBranding, setSavingEmailBranding] = useState(false);

  // Gemini API Key state
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setFullName(profile.full_name || '');
        setEmail(profile.email || '');
      }
      
      // Fetch site settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      
      if (settings) {
        const settingsMap: SiteSettings = {
          company_logo_url: null,
          signature_url: null,
          favicon_url: null,
          certificate_pattern_url: null,
          certificate_pattern_enabled: false,
          certificate_pattern_opacity: 5,
          certificate_default_theme: 'modern',
          certificate_download_format: 'pdf',
          gemini_api_key: null,
          company_name: 'DIGI5 LTD',
          admin_email: null,
          footer_title: null,
          footer_subtitle: null,
          footer_website_url: null,
          footer_website_text: null,
          footer_address: null,
          footer_copyright: null,
          footer_terms_url: null,
          footer_privacy_url: null,
          footer_contact_url: null,
          footer_instagram_url: null,
          footer_facebook_url: null,
          footer_twitter_url: null,
          footer_youtube_url: null,
          footer_tiktok_url: null,
          footer_linkedin_url: null,
        };
        settings.forEach(s => {
          if (s.setting_key === 'certificate_pattern_enabled') {
            settingsMap.certificate_pattern_enabled = s.setting_value === 'true';
          } else if (s.setting_key === 'certificate_pattern_opacity') {
            settingsMap.certificate_pattern_opacity = parseInt(s.setting_value || '5', 10);
          } else if (s.setting_key === 'certificate_default_theme') {
            settingsMap.certificate_default_theme = (s.setting_value as TemplateType) || 'modern';
          } else if (s.setting_key === 'certificate_download_format') {
            settingsMap.certificate_download_format = (s.setting_value as 'pdf' | 'png' | 'jpeg') || 'pdf';
          } else if (s.setting_key in settingsMap) {
            (settingsMap as any)[s.setting_key] = s.setting_value;
          }
        });
        setSiteSettings(settingsMap);
        setCompanyName(settingsMap.company_name || 'DIGI5 LTD');
        setGeminiApiKey(settingsMap.gemini_api_key || '');
        setAdminEmail(settingsMap.admin_email || '');
        setFooterTitle(settingsMap.footer_title || '');
        setFooterSubtitle(settingsMap.footer_subtitle || '');
        setFooterWebsiteUrl(settingsMap.footer_website_url || '');
        setFooterWebsiteText(settingsMap.footer_website_text || '');
        setFooterAddress(settingsMap.footer_address || '');
        setFooterCopyright(settingsMap.footer_copyright || '');
        setFooterTermsUrl(settingsMap.footer_terms_url || '');
        setFooterPrivacyUrl(settingsMap.footer_privacy_url || '');
        setFooterContactUrl(settingsMap.footer_contact_url || '');
        setFooterInstagramUrl(settingsMap.footer_instagram_url || '');
        setFooterFacebookUrl(settingsMap.footer_facebook_url || '');
        setFooterTwitterUrl(settingsMap.footer_twitter_url || '');
        setFooterYoutubeUrl(settingsMap.footer_youtube_url || '');
        setFooterTiktokUrl(settingsMap.footer_tiktok_url || '');
        setFooterLinkedinUrl(settingsMap.footer_linkedin_url || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGeminiApiKey = async () => {
    if (!user) return;
    setSavingApiKey(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'gemini_api_key', 
          setting_value: geminiApiKey || null,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, gemini_api_key: geminiApiKey }));
      toast({ title: 'Success', description: 'Gemini API Key saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingApiKey(false);
    }
  };

  const saveEmailBranding = async () => {
    if (!user) return;
    setSavingEmailBranding(true);
    
    try {
      const settingsToSave = [
        { key: 'admin_email', value: adminEmail },
        { key: 'footer_title', value: footerTitle },
        { key: 'footer_subtitle', value: footerSubtitle },
        { key: 'footer_website_url', value: footerWebsiteUrl },
        { key: 'footer_website_text', value: footerWebsiteText },
        { key: 'footer_address', value: footerAddress },
        { key: 'footer_copyright', value: footerCopyright },
        { key: 'footer_terms_url', value: footerTermsUrl },
        { key: 'footer_privacy_url', value: footerPrivacyUrl },
        { key: 'footer_contact_url', value: footerContactUrl },
        { key: 'footer_instagram_url', value: footerInstagramUrl },
        { key: 'footer_facebook_url', value: footerFacebookUrl },
        { key: 'footer_twitter_url', value: footerTwitterUrl },
        { key: 'footer_youtube_url', value: footerYoutubeUrl },
        { key: 'footer_tiktok_url', value: footerTiktokUrl },
        { key: 'footer_linkedin_url', value: footerLinkedinUrl },
      ];

      const promises = settingsToSave.map(s => 
        supabase
          .from('site_settings')
          .upsert({ 
            setting_key: s.key, 
            setting_value: s.value || null,
            updated_at: new Date().toISOString(),
            updated_by: user.id 
          }, { onConflict: 'setting_key' })
      );

      const results = await Promise.all(promises);
      const errResult = results.find(r => r.error);
      if (errResult) throw errResult.error;

      setSiteSettings(prev => ({
        ...prev,
        admin_email: adminEmail,
        footer_title: footerTitle,
        footer_subtitle: footerSubtitle,
        footer_website_url: footerWebsiteUrl,
        footer_website_text: footerWebsiteText,
        footer_address: footerAddress,
        footer_copyright: footerCopyright,
        footer_terms_url: footerTermsUrl,
        footer_privacy_url: footerPrivacyUrl,
        footer_contact_url: footerContactUrl,
        footer_instagram_url: footerInstagramUrl,
        footer_facebook_url: footerFacebookUrl,
        footer_twitter_url: footerTwitterUrl,
        footer_youtube_url: footerYoutubeUrl,
        footer_tiktok_url: footerTiktokUrl,
        footer_linkedin_url: footerLinkedinUrl,
      }));

      toast({ title: 'Success', description: 'Email branding & footer settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingEmailBranding(false);
    }
  };

  const saveCompanyName = async () => {
    if (!user) return;
    setSavingCompanyName(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'company_name', 
          setting_value: companyName || null,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, company_name: companyName }));
      toast({ title: 'Success', description: 'Company Name saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCompanyName(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      if (email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({ email });
        if (authError) throw authError;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Password changed successfully' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setChangingPassword(false);
    }
  };

  const uploadFile = async (
    file: File,
    settingKey: keyof SiteSettings,
    setUploading: (v: boolean) => void
  ) => {
    if (!user) return;
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${settingKey}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);
      
      // Update site settings
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({ setting_value: publicUrl, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('setting_key', settingKey);
      
      if (updateError) throw updateError;
      
      setSiteSettings(prev => ({ ...prev, [settingKey]: publicUrl }));
      toast({ title: 'Success', description: 'Image uploaded successfully' });
      
      // Update favicon in document if it's favicon
      if (settingKey === 'favicon_url') {
        updateFavicon(publicUrl);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (settingKey: keyof SiteSettings) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to remove the ${settingKey.replace('_url', '').replace('_', ' ')}?`)) return;
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: null, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('setting_key', settingKey);
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, [settingKey]: null }));
      toast({ title: 'Success', description: 'Image removed successfully' });
      
      if (settingKey === 'favicon_url') {
        updateFavicon('/favicon.ico');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateFavicon = (url: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    settingKey: keyof SiteSettings,
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size must be less than 2MB', variant: 'destructive' });
        return;
      }
      uploadFile(file, settingKey, setUploading);
    }
  };

  const togglePatternEnabled = async (enabled: boolean) => {
    if (!user) return;
    setSavingPattern(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_pattern_enabled', 
          setting_value: enabled ? 'true' : 'false',
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_pattern_enabled: enabled }));
      toast({ title: 'Success', description: `Certificate pattern ${enabled ? 'enabled' : 'disabled'}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPattern(false);
    }
  };

  const uploadPatternImage = async (file: File) => {
    if (!user) return;
    setUploadingPattern(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `certificate_pattern_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_pattern_url', 
          setting_value: publicUrl,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (updateError) throw updateError;
      
      setSiteSettings(prev => ({ ...prev, certificate_pattern_url: publicUrl }));
      toast({ title: 'Success', description: 'Pattern image uploaded successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingPattern(false);
    }
  };

  const removePatternImage = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to remove the custom pattern image?')) return;
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_pattern_url', 
          setting_value: null,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_pattern_url: null }));
      toast({ title: 'Success', description: 'Pattern image removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const selectPresetPattern = async (patternSrc: string) => {
    if (!user) return;
    setSavingPattern(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_pattern_url', 
          setting_value: patternSrc,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_pattern_url: patternSrc }));
      toast({ title: 'Success', description: 'Pattern selected' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPattern(false);
    }
  };

  const updatePatternOpacity = async (opacity: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_pattern_opacity', 
          setting_value: opacity.toString(),
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_pattern_opacity: opacity }));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const updateDefaultTheme = async (theme: TemplateType) => {
    if (!user) return;
    setSavingTheme(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_default_theme', 
          setting_value: theme,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_default_theme: theme }));
      toast({ title: 'Success', description: `Default certificate theme set to ${templateOptions.find(t => t.id === theme)?.name}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingTheme(false);
    }
  };

  const updateDownloadFormat = async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!user) return;
    setSavingFormat(true);
    
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ 
          setting_key: 'certificate_download_format', 
          setting_value: format,
          updated_at: new Date().toISOString(),
          updated_by: user.id 
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
      
      setSiteSettings(prev => ({ ...prev, certificate_download_format: format }));
      toast({ title: 'Success', description: `Default certificate download format set to ${format.toUpperCase()}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingFormat(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, branding, and notification settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-2.5">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile & Security</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2 py-2.5">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="certificates" className="flex items-center gap-2 py-2.5">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificate Designer</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2 py-2.5">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 py-2.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2 py-2.5">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Navigation</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                    />
                    <p className="text-xs text-muted-foreground">This updates your login credentials and profile email</p>
                  </div>
                </div>
                <Button onClick={updateProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                <Button onClick={changePassword} disabled={changingPassword || !newPassword || !confirmPassword}>
                  {changingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>

            {/* AI Candidate Screening API Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-500 animate-pulse" />
                  AI Candidate Screening (Gemini API)
                </CardTitle>
                <CardDescription>
                  Configure your Google Gemini API key to enable AI Candidate Screening. If no key is set, the system will use a fallback mock generator.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="geminiApiKey">Gemini API Key</Label>
                  <div className="flex gap-2 max-w-xl">
                    <Input
                      id="geminiApiKey"
                      type={showApiKey ? "text" : "password"}
                      value={geminiApiKey || ''}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKey(!showApiKey)}
                      type="button"
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get an API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Google AI Studio</a>.
                  </p>
                </div>
                <Button onClick={saveGeminiApiKey} disabled={savingApiKey}>
                  {savingApiKey ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save API Key
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Branding & Assets
                </CardTitle>
                <CardDescription>Customize your company branding for certificates and the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Name */}
                <div className="space-y-3">
                  <Label htmlFor="companyName">Company Name</Label>
                  <p className="text-sm text-muted-foreground">This name will be displayed across headers, footers, certificates, and notification templates</p>
                  <div className="flex gap-2 max-w-xl">
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. DIGI5 LTD"
                    />
                    <Button onClick={saveCompanyName} disabled={savingCompanyName}>
                      {savingCompanyName ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Name
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Company Logo */}
                <div className="space-y-3">
                  <Label>Company Logo</Label>
                  <p className="text-sm text-muted-foreground">This logo will appear on certificates and the dashboard</p>
                  <div className="flex items-center gap-4">
                    {siteSettings.company_logo_url ? (
                      <div className="relative">
                        <img
                          src={getAssetUrl(siteSettings.company_logo_url)}
                          alt="Company Logo"
                          className="h-20 w-20 object-contain border rounded-lg bg-muted"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage('company_logo_url')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="logo-upload"
                        onChange={(e) => handleFileChange(e, 'company_logo_url', setUploadingLogo)}
                      />
                      <Button asChild variant="outline" disabled={uploadingLogo}>
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          {uploadingLogo ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Logo
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Signature Image */}
                <div className="space-y-3">
                  <Label>Signature Image</Label>
                  <p className="text-sm text-muted-foreground">This signature will appear on certificates</p>
                  <div className="flex items-center gap-4">
                    {siteSettings.signature_url ? (
                      <div className="relative">
                        <img
                          src={getAssetUrl(siteSettings.signature_url)}
                          alt="Signature"
                          className="h-16 w-32 object-contain border rounded-lg bg-muted"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage('signature_url')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-16 w-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground">No signature</span>
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="signature-upload"
                        onChange={(e) => handleFileChange(e, 'signature_url', setUploadingSignature)}
                      />
                      <Button asChild variant="outline" disabled={uploadingSignature}>
                        <label htmlFor="signature-upload" className="cursor-pointer">
                          {uploadingSignature ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Signature
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Favicon */}
                <div className="space-y-3">
                  <Label>Favicon</Label>
                  <p className="text-sm text-muted-foreground">The icon shown in browser tabs (recommended: 32x32 or 64x64 pixels)</p>
                  <div className="flex items-center gap-4">
                    {siteSettings.favicon_url ? (
                      <div className="relative">
                        <img
                          src={getAssetUrl(siteSettings.favicon_url)}
                          alt="Favicon"
                          className="h-12 w-12 object-contain border rounded-lg bg-muted"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => removeImage('favicon_url')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-12 w-12 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground">ico</span>
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*,.ico"
                        className="hidden"
                        id="favicon-upload"
                        onChange={(e) => handleFileChange(e, 'favicon_url', setUploadingFavicon)}
                      />
                      <Button asChild variant="outline" disabled={uploadingFavicon}>
                        <label htmlFor="favicon-upload" className="cursor-pointer">
                          {uploadingFavicon ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Favicon
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificate Designer Tab */}
          <TabsContent value="certificates" className="space-y-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  Certificate Design
                </CardTitle>
                <CardDescription>Configure repeating background patterns and default theme layout preferences for issued certificates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Certificate Background Pattern */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Certificate Background Pattern</Label>
                      <p className="text-sm text-muted-foreground">Add a subtle repeating pattern to certificate backgrounds</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savingPattern && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Switch
                        checked={siteSettings.certificate_pattern_enabled}
                        onCheckedChange={togglePatternEnabled}
                        disabled={savingPattern}
                      />
                    </div>
                  </div>

                  {/* Pattern Opacity Control */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Pattern Opacity</Label>
                      <span className="text-sm text-muted-foreground">{siteSettings.certificate_pattern_opacity}%</span>
                    </div>
                    <Slider
                      value={[siteSettings.certificate_pattern_opacity]}
                      onValueChange={([value]) => setSiteSettings(prev => ({ ...prev, certificate_pattern_opacity: value }))}
                      onValueCommit={([value]) => updatePatternOpacity(value)}
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">Lower values create a more subtle pattern</p>
                  </div>

                  {/* Preset Pattern Gallery */}
                  <div className="space-y-2">
                    <Label className="text-sm">Choose a Preset Pattern</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_PATTERNS.map((pattern) => (
                        <button
                          key={pattern.id}
                          onClick={() => selectPresetPattern(pattern.src)}
                          className={`relative h-16 w-full border rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all ${
                            siteSettings.certificate_pattern_url === pattern.src ? 'ring-2 ring-primary' : ''
                          }`}
                          title={pattern.name}
                        >
                          <div 
                            className="absolute inset-0"
                            style={{ 
                              backgroundImage: `url(${pattern.src})`,
                              backgroundSize: '30px',
                              backgroundRepeat: 'repeat',
                              opacity: 0.3
                            }}
                          />
                          {siteSettings.certificate_pattern_url === pattern.src && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                              <Check className="h-5 w-5 text-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Selection & Custom Upload */}
                  <div className="flex items-center gap-4 pt-2">
                    {siteSettings.certificate_pattern_url ? (
                      <div className="relative">
                        <div 
                          className="h-20 w-20 border rounded-lg overflow-hidden"
                          style={{ 
                            backgroundImage: `url(${getAssetUrl(siteSettings.certificate_pattern_url)})`,
                            backgroundSize: '40px',
                            backgroundRepeat: 'repeat',
                            opacity: siteSettings.certificate_pattern_opacity / 100
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={removePatternImage}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="pattern-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              toast({ title: 'Error', description: 'File size must be less than 2MB', variant: 'destructive' });
                              return;
                            }
                            uploadPatternImage(file);
                          }
                        }}
                      />
                      <Button asChild variant="outline" disabled={uploadingPattern}>
                        <label htmlFor="pattern-upload" className="cursor-pointer">
                          {uploadingPattern ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                          Upload Custom
                        </label>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">Or upload your own pattern</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Default Certificate Theme */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Default Certificate Theme
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Set the default template used when issuing new certificates
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templateOptions.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => updateDefaultTheme(template.id)}
                        disabled={savingTheme}
                        className={`relative p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                          siteSettings.certificate_default_theme === template.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'bg-muted/30'
                        }`}
                      >
                        {siteSettings.certificate_default_theme === template.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </button>
                    ))}
                  </div>
                  
                  {savingTheme && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving theme preference...
                    </div>
                  )}
                </div>

                <Separator />

                {/* Default Certificate Download Format */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Default Certificate Download Format
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose the default format (PDF, PNG, or JPEG) when certificates are downloaded
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'pdf', name: 'PDF Document', description: 'Standard high-quality vector print document' },
                      { id: 'png', name: 'PNG Image', description: 'Lossless transparent image format' },
                      { id: 'jpeg', name: 'JPEG Image', description: 'Standard compressed image format' }
                    ].map((format) => (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => updateDownloadFormat(format.id as 'pdf' | 'png' | 'jpeg')}
                        disabled={savingFormat}
                        className={`relative p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                          siteSettings.certificate_download_format === format.id 
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                            : 'bg-muted/30'
                        }`}
                      >
                        {siteSettings.certificate_download_format === format.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <p className="font-medium">{format.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format.description}</p>
                      </button>
                    ))}
                  </div>
                  
                  {savingFormat && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving format preference...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Communication Channels Tab */}
          <TabsContent value="communication" className="space-y-6 max-w-4xl">
            {user && <SMTPSettingsCard userId={user.id} />}
            {user && <SMSSettingsCard userId={user.id} />}

            {/* Email Footer & Socials Branding Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-500" />
                  Email Footer & Socials Branding
                </CardTitle>
                <CardDescription>
                  Configure company details, legal links, and social media channels to be displayed in all outgoing email templates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin Email */}
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Notification Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@yourcompany.com"
                    className="max-w-xl"
                  />
                  <p className="text-xs text-muted-foreground">Default email address used for admin alerts and notifications.</p>
                </div>

                <Separator />

                {/* Footer Copy & Address */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="footer-title">Footer Title / Headline</Label>
                    <Input
                      id="footer-title"
                      value={footerTitle}
                      onChange={(e) => setFooterTitle(e.target.value)}
                      placeholder="e.g. Receive Globally & Spend Locally"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-subtitle">Footer Subtitle / Description</Label>
                    <Input
                      id="footer-subtitle"
                      value={footerSubtitle}
                      onChange={(e) => setFooterSubtitle(e.target.value)}
                      placeholder="e.g. Download the app and start receiving money..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="footer-website-url">Website Redirect URL</Label>
                    <Input
                      id="footer-website-url"
                      value={footerWebsiteUrl}
                      onChange={(e) => setFooterWebsiteUrl(e.target.value)}
                      placeholder="e.g. https://www.yourcompany.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-website-text">Website Label Text</Label>
                    <Input
                      id="footer-website-text"
                      value={footerWebsiteText}
                      onChange={(e) => setFooterWebsiteText(e.target.value)}
                      placeholder="e.g. www.yourcompany.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="footer-copyright">Copyright Text</Label>
                    <Input
                      id="footer-copyright"
                      value={footerCopyright}
                      onChange={(e) => setFooterCopyright(e.target.value)}
                      placeholder="e.g. ©YourCompany Ltd. 2026"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer-address">Office Address</Label>
                    <Input
                      id="footer-address"
                      value={footerAddress}
                      onChange={(e) => setFooterAddress(e.target.value)}
                      placeholder="e.g. 124 City Road, London, UK"
                    />
                  </div>
                </div>

                <Separator />

                {/* Legal Links */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Legal & Support Links</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="footer-terms">Terms URL</Label>
                      <Input
                        id="footer-terms"
                        value={footerTermsUrl}
                        onChange={(e) => setFooterTermsUrl(e.target.value)}
                        placeholder="https://company.com/terms"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-privacy">Privacy Policy URL</Label>
                      <Input
                        id="footer-privacy"
                        value={footerPrivacyUrl}
                        onChange={(e) => setFooterPrivacyUrl(e.target.value)}
                        placeholder="https://company.com/privacy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer-contact">Contact Us URL</Label>
                      <Input
                        id="footer-contact"
                        value={footerContactUrl}
                        onChange={(e) => setFooterContactUrl(e.target.value)}
                        placeholder="https://company.com/contact"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Social Links */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Social Media URLs</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="social-instagram">Instagram URL</Label>
                      <Input
                        id="social-instagram"
                        value={footerInstagramUrl}
                        onChange={(e) => setFooterInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-facebook">Facebook URL</Label>
                      <Input
                        id="social-facebook"
                        value={footerFacebookUrl}
                        onChange={(e) => setFooterFacebookUrl(e.target.value)}
                        placeholder="https://facebook.com/handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-twitter">X (Twitter) URL</Label>
                      <Input
                        id="social-twitter"
                        value={footerTwitterUrl}
                        onChange={(e) => setFooterTwitterUrl(e.target.value)}
                        placeholder="https://x.com/handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-youtube">YouTube URL</Label>
                      <Input
                        id="social-youtube"
                        value={footerYoutubeUrl}
                        onChange={(e) => setFooterYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/c/handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-tiktok">TikTok URL</Label>
                      <Input
                        id="social-tiktok"
                        value={footerTiktokUrl}
                        onChange={(e) => setFooterTiktokUrl(e.target.value)}
                        placeholder="https://tiktok.com/@handle"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="social-linkedin">LinkedIn URL</Label>
                      <Input
                        id="social-linkedin"
                        value={footerLinkedinUrl}
                        onChange={(e) => setFooterLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/company/handle"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={saveEmailBranding} disabled={savingEmailBranding}>
                    {savingEmailBranding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Email Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="max-w-4xl">
            <NotificationTemplateManager />
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="max-w-4xl">
            <NavMenuManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
