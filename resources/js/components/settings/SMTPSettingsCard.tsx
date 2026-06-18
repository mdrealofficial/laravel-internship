import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Save, TestTube, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  encryption: 'ssl' | 'tls' | 'none';
}

interface Props {
  userId: string;
}

export const SMTPSettingsCard: React.FC<Props> = ({ userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    encryption: 'tls',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('setting_type', 'smtp')
        .single();

      if (data) {
        setIsEnabled(data.is_enabled || false);
        setTestMode(data.test_mode || false);
        const savedConfig = data.config as any;
        if (savedConfig) {
          let encryption: 'ssl' | 'tls' | 'none' = 'tls';
          if (savedConfig.encryption) {
            encryption = savedConfig.encryption;
          } else if (savedConfig.secure === false) {
            encryption = 'none';
          }

          setConfig({
            host: savedConfig.host || '',
            port: savedConfig.port || 587,
            username: savedConfig.username || '',
            password: savedConfig.password || '',
            from_email: savedConfig.from_email || '',
            from_name: savedConfig.from_name || '',
            encryption: encryption,
          });

          if (savedConfig.from_email) {
            setTestEmail(savedConfig.from_email);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (silent = false) => {
    if (!silent) setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          setting_type: 'smtp',
          config: config,
          is_enabled: isEnabled,
          test_mode: testMode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_type' });

      if (error) throw error;
      if (!silent) {
        toast({ title: 'Success', description: 'SMTP settings saved successfully' });
      }
    } catch (error: any) {
      if (!silent) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
      throw error;
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!testEmail) {
      toast({ title: 'Error', description: 'Please enter a test recipient email', variant: 'destructive' });
      return;
    }
    setTesting(true);
    try {
      // First save settings
      await saveSettings(true);
      
      // Then send test email
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'test_email',
          recipient_email: testEmail,
          data: {
            test_message: 'This is a test email to verify your SMTP configuration.',
          },
        },
      });

      if (error) throw error;
      
      if (data?.results?.email?.success) {
        toast({ 
          title: 'Test Sent', 
          description: `Test email sent successfully. Check ${testEmail} inbox.` 
        });
      } else {
        const errorMsg = data?.results?.email?.error || 'Failed to send test email';
        toast({ title: 'Test Failed', description: errorMsg, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Test Failed', description: error.message, variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Email (SMTP) Settings</CardTitle>
              <CardDescription>Configure your SMTP server for sending emails</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? <><CheckCircle className="h-3 w-3 mr-1" /> Enabled</> : <><XCircle className="h-3 w-3 mr-1" /> Disabled</>}
            </Badge>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host</Label>
            <Input
              id="smtp-host"
              value={config.host}
              onChange={(e) => setConfig({ ...config, host: e.target.value })}
              placeholder="smtp.example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">Port</Label>
            <Input
              id="smtp-port"
              type="number"
              value={config.port}
              onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 587 })}
              placeholder="587"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-username">Username</Label>
            <Input
              id="smtp-username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="your-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-password">Password</Label>
            <div className="relative">
              <Input
                id="smtp-password"
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email</Label>
            <Input
              id="from-email"
              type="email"
              value={config.from_email}
              onChange={(e) => setConfig({ ...config, from_email: e.target.value })}
              placeholder="noreply@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input
              id="from-name"
              value={config.from_name}
              onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
              placeholder="DIGI5 LTD"
            />
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
          <Label className="text-sm font-medium">Encryption Mode</Label>
          <RadioGroup 
            value={config.encryption} 
            onValueChange={(val) => {
              let port = config.port;
              if (val === 'ssl' && (port === 587 || port === 25)) port = 465;
              if (val === 'tls' && (port === 465 || port === 25)) port = 587;
              if (val === 'none' && (port === 465 || port === 587)) port = 25;
              setConfig({ ...config, encryption: val as any, port });
            }}
            className="flex gap-6 mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="enc-none" />
              <Label htmlFor="enc-none" className="cursor-pointer font-normal">None</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ssl" id="enc-ssl" />
              <Label htmlFor="enc-ssl" className="cursor-pointer font-normal">SSL (Port 465)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tls" id="enc-tls" />
              <Label htmlFor="enc-tls" className="cursor-pointer font-normal">TLS (Port 587)</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div>
            <Label htmlFor="test-mode" className="text-amber-600">Test Mode</Label>
            <p className="text-sm text-muted-foreground">Log emails instead of sending</p>
          </div>
          <Switch
            id="test-mode"
            checked={testMode}
            onCheckedChange={setTestMode}
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <Label className="text-sm font-medium">Send Test Email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1"
            />
            <Button variant="outline" onClick={testConnection} disabled={testing || !config.host || !testEmail}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={() => saveSettings(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
