import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  secure: boolean;
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
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    secure: true,
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
        const savedConfig = data.config as SMTPConfig;
        if (savedConfig) {
          setConfig({
            host: savedConfig.host || '',
            port: savedConfig.port || 587,
            username: savedConfig.username || '',
            password: savedConfig.password || '',
            from_email: savedConfig.from_email || '',
            from_name: savedConfig.from_name || '',
            secure: savedConfig.secure !== false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching SMTP settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
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
      toast({ title: 'Success', description: 'SMTP settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      // First save settings
      await saveSettings();
      
      // Then send test email
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'test_email',
          recipient_email: config.from_email,
          data: {
            test_message: 'This is a test email from your SMTP configuration.',
          },
        },
      });

      if (error) throw error;
      
      toast({ 
        title: 'Test Sent', 
        description: `Test email queued. Check ${config.from_email} inbox.` 
      });
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

        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div>
            <Label htmlFor="ssl-tls">Use SSL/TLS</Label>
            <p className="text-sm text-muted-foreground">Enable secure connection</p>
          </div>
          <Switch
            id="ssl-tls"
            checked={config.secure}
            onCheckedChange={(checked) => setConfig({ ...config, secure: checked })}
          />
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

        <div className="flex gap-3 pt-4">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={testConnection} disabled={testing || !config.host}>
            {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
