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
import { User, Lock, Image, Upload, Loader2, Save, Trash2, Layers, Check, Mail, MessageSquare, FileText, Menu, Award } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { templateOptions, TemplateType } from '@/components/certificates/CertificateTemplate';
import { Slider } from '@/components/ui/slider';
import { SMTPSettingsCard } from '@/components/settings/SMTPSettingsCard';
import { SMSSettingsCard } from '@/components/settings/SMSSettingsCard';
import { NotificationTemplateManager } from '@/components/settings/NotificationTemplateManager';
import { NavMenuManager } from '@/components/settings/NavMenuManager';

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
  });
  const [savingTheme, setSavingTheme] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingPattern, setUploadingPattern] = useState(false);
  const [savingPattern, setSavingPattern] = useState(false);

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
        };
        settings.forEach(s => {
          if (s.setting_key === 'certificate_pattern_enabled') {
            settingsMap.certificate_pattern_enabled = s.setting_value === 'true';
          } else if (s.setting_key === 'certificate_pattern_opacity') {
            settingsMap.certificate_pattern_opacity = parseInt(s.setting_value || '5', 10);
          } else if (s.setting_key === 'certificate_default_theme') {
            settingsMap.certificate_default_theme = (s.setting_value as TemplateType) || 'modern';
          } else if (s.setting_key in settingsMap) {
            (settingsMap as any)[s.setting_key] = s.setting_value;
          }
        });
        setSiteSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
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
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2 py-2.5">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="flex items-center gap-2 py-2.5">
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Navigation</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2 py-2.5">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2 py-2.5">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2 py-2.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
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
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
                {/* Company Logo */}
                <div className="space-y-3">
                  <Label>Company Logo</Label>
                  <p className="text-sm text-muted-foreground">This logo will appear on certificates and the dashboard</p>
                  <div className="flex items-center gap-4">
                    {siteSettings.company_logo_url ? (
                      <div className="relative">
                        <img
                          src={siteSettings.company_logo_url}
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
                          src={siteSettings.signature_url}
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
                          src={siteSettings.favicon_url}
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

                <Separator />

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
                            backgroundImage: `url(${siteSettings.certificate_pattern_url})`,
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="max-w-4xl">
            <NavMenuManager />
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="max-w-4xl">
            {user && <SMTPSettingsCard userId={user.id} />}
          </TabsContent>

          {/* SMS Tab */}
          <TabsContent value="sms" className="max-w-4xl">
            {user && <SMSSettingsCard userId={user.id} />}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="max-w-4xl">
            <NotificationTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
