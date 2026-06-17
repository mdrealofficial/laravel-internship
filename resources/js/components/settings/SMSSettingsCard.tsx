import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Loader2, Save, TestTube, Eye, EyeOff, CheckCircle, XCircle, Wallet, Globe } from 'lucide-react';

interface SMSConfig {
  api_key: string;
  sender_id: string;
  api_url: string;
  method: string;
}

interface Props {
  userId: string;
}

export const SMSSettingsCard: React.FC<Props> = ({ userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [config, setConfig] = useState<SMSConfig>({
    api_key: '',
    sender_id: '',
    api_url: 'https://api.sms.net.bd/sendsms',
    method: 'POST',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('setting_type', 'sms')
        .single();

      if (data) {
        setIsEnabled(data.is_enabled || false);
        setTestMode(data.test_mode || false);
        const savedConfig = data.config as SMSConfig;
        if (savedConfig) {
          setConfig({
            api_key: savedConfig.api_key || '',
            sender_id: savedConfig.sender_id || '',
            api_url: savedConfig.api_url || 'https://api.sms.net.bd/sendsms',
            method: savedConfig.method || 'POST',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
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
          setting_type: 'sms',
          config: config,
          is_enabled: isEnabled,
          test_mode: testMode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_type' });

      if (error) throw error;
      toast({ title: 'Success', description: 'SMS settings saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const checkBalance = async () => {
    if (!config.api_key) {
      toast({ title: 'Error', description: 'Please enter API key first', variant: 'destructive' });
      return;
    }
    
    setCheckingBalance(true);
    try {
      const response = await fetch(`https://api.sms.net.bd/user/balance?api_key=${config.api_key}`);
      const result = await response.json();
      
      if (result.error === 0) {
        setBalance(result.balance);
        toast({ title: 'Balance Retrieved', description: `Current balance: ${result.balance} BDT` });
      } else {
        throw new Error(result.msg || 'Failed to check balance');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCheckingBalance(false);
    }
  };

  const sendTestSMS = async () => {
    if (!testPhone) {
      toast({ title: 'Error', description: 'Please enter a test phone number', variant: 'destructive' });
      return;
    }

    if (!config.api_key) {
      toast({ title: 'Error', description: 'Please enter API key first', variant: 'destructive' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // First save settings to ensure edge function has latest config
      await saveSettings();
      
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'test_sms',
          recipient_phone: testPhone,
          data: {
            test_message: 'This is a test SMS from DIGI5 LTD. If you received this, your SMS gateway is configured correctly!',
          },
        },
      });

      console.log('Test SMS Response:', data, error);

      if (error) throw error;
      
      if (data?.results?.sms?.success) {
        setTestResult({ success: true, message: 'SMS sent successfully!' });
        toast({ title: 'Test Sent', description: `Test SMS sent to ${testPhone}` });
      } else {
        const errorMsg = data?.results?.sms?.error || data?.error || 'Unknown error';
        setTestResult({ success: false, message: errorMsg });
        toast({ title: 'Test Failed', description: errorMsg, variant: 'destructive' });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
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
            <div className="p-2 rounded-lg bg-green-500/10">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>SMS Gateway Settings</CardTitle>
              <CardDescription>Configure any SMS gateway for sending notifications</CardDescription>
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
        <div className="p-4 rounded-lg bg-muted/50 border">
          <p className="text-sm text-muted-foreground">
            Configure any SMS gateway that supports REST API. Default is <a href="https://sms.net.bd/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sms.net.bd</a>. 
            Parameters sent: <code className="bg-muted px-1 rounded">api_key</code>, <code className="bg-muted px-1 rounded">msg</code>, <code className="bg-muted px-1 rounded">to</code>, <code className="bg-muted px-1 rounded">sender_id</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sms-api-url">API URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="sms-api-url"
                value={config.api_url}
                onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                placeholder="https://api.sms.net.bd/sendsms"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-method">HTTP Method</Label>
            <Select value={config.method} onValueChange={(value) => setConfig({ ...config, method: value })}>
              <SelectTrigger id="sms-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST (Form Data)</SelectItem>
                <SelectItem value="GET">GET (URL Parameters)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sms-api-key">API Key</Label>
          <div className="relative">
            <Input
              id="sms-api-key"
              type={showApiKey ? 'text' : 'password'}
              value={config.api_key}
              onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
              placeholder="Enter your SMS gateway API key"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sender-id">Sender ID (Optional)</Label>
          <Input
            id="sender-id"
            value={config.sender_id}
            onChange={(e) => setConfig({ ...config, sender_id: e.target.value })}
            placeholder="DIGI5"
          />
          <p className="text-xs text-muted-foreground">Leave empty to use default. Must be approved by your SMS provider.</p>
        </div>

        {balance !== null && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <Wallet className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-600">Account Balance</p>
              <p className="text-2xl font-bold">{balance} BDT</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div>
            <Label htmlFor="sms-test-mode" className="text-amber-600">Test Mode</Label>
            <p className="text-sm text-muted-foreground">Log SMS instead of sending (for debugging)</p>
          </div>
          <Switch
            id="sms-test-mode"
            checked={testMode}
            onCheckedChange={setTestMode}
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg border bg-card">
          <Label>Send Test SMS</Label>
          <div className="flex gap-2">
            <Input
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="01XXXXXXXXX or 8801XXXXXXXXX"
              className="flex-1"
            />
            <Button variant="outline" onClick={sendTestSMS} disabled={testing || !config.api_key}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
              Send Test
            </Button>
          </div>
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                {testResult.message}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={checkBalance} disabled={checkingBalance || !config.api_key}>
            {checkingBalance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
            Check Balance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
