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
import { MessageSquare, Loader2, Save, TestTube, Eye, EyeOff, CheckCircle, XCircle, Wallet, Globe, Plus, Trash2 } from 'lucide-react';

interface SMSParameter {
  id: string;
  key: string;
  type: 'fixed' | 'destination_number' | 'message_content';
  value: string;
}

interface SMSConfig {
  api_url: string;
  method: string;
  parameters: SMSParameter[];
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
  const [isEnabled, setIsEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [config, setConfig] = useState<SMSConfig>({
    api_url: 'https://api.sms.net.bd/sendsms',
    method: 'POST',
    parameters: [
      { id: '1', key: 'api_key', type: 'fixed', value: '' },
      { id: '2', key: 'sender_id', type: 'fixed', value: '' },
      { id: '3', key: 'to', type: 'destination_number', value: '' },
      { id: '4', key: 'msg', type: 'message_content', value: '' },
    ],
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
        const savedConfig = data.config as any;
        if (savedConfig) {
          let parameters: SMSParameter[] = [];
          if (savedConfig.parameters && Array.isArray(savedConfig.parameters)) {
            parameters = savedConfig.parameters;
          } else {
            parameters = [
              { id: '1', key: 'api_key', type: 'fixed', value: savedConfig.api_key || '' },
              { id: '2', key: 'sender_id', type: 'fixed', value: savedConfig.sender_id || '' },
              { id: '3', key: 'to', type: 'destination_number', value: '' },
              { id: '4', key: 'msg', type: 'message_content', value: '' },
            ];
          }

          setConfig({
            api_url: savedConfig.api_url || 'https://api.sms.net.bd/sendsms',
            method: savedConfig.method || 'POST',
            parameters: parameters,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
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
          setting_type: 'sms',
          config: config,
          is_enabled: isEnabled,
          test_mode: testMode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_type' });

      if (error) throw error;
      if (!silent) {
        toast({ title: 'Success', description: 'SMS settings saved successfully' });
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

  const getApiKey = () => {
    const apiKeyParam = config.parameters?.find(p => p.key === 'api_key' || p.key.toLowerCase().includes('key'));
    return apiKeyParam ? apiKeyParam.value : '';
  };

  const checkBalance = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast({ title: 'Error', description: 'Please enter API key first in your parameters list', variant: 'destructive' });
      return;
    }
    
    setCheckingBalance(true);
    try {
      const response = await fetch(`https://api.sms.net.bd/user/balance?api_key=${apiKey}`);
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

    if (config.parameters.length === 0) {
      toast({ title: 'Error', description: 'Please configure at least one parameter', variant: 'destructive' });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // First save settings to ensure edge function has latest config
      await saveSettings(true);
      
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

  const addParameter = () => {
    setConfig(prev => ({
      ...prev,
      parameters: [
        ...prev.parameters,
        { id: Math.random().toString(36).substring(2, 9), key: '', type: 'fixed', value: '' }
      ]
    }));
  };

  const updateParameter = (id: string, field: keyof SMSParameter, value: string) => {
    setConfig(prev => ({
      ...prev,
      parameters: prev.parameters.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const deleteParameter = (id: string) => {
    setConfig(prev => ({
      ...prev,
      parameters: prev.parameters.filter(p => p.id !== id)
    }));
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
            Configure any SMS gateway that supports REST API. Create key mapping for Fixed values, Destination Number, and Message Content.
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

        {/* Dynamic Key Mapping Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">HTTP Parameters Mapping</Label>
            <Button type="button" variant="outline" size="sm" onClick={addParameter}>
              <Plus className="h-4 w-4 mr-2" /> Add new parameter
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Key</th>
                  <th className="p-3 text-left font-medium text-muted-foreground w-[220px]">Type</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Value</th>
                  <th className="p-3 text-center font-medium text-muted-foreground w-[80px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {config.parameters.map((param) => (
                  <tr key={param.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <Input
                        value={param.key}
                        onChange={(e) => updateParameter(param.id, 'key', e.target.value)}
                        placeholder="e.g. api_key"
                        className="h-9"
                      />
                    </td>
                    <td className="p-3">
                      <Select
                        value={param.type}
                        onValueChange={(value) => updateParameter(param.id, 'type', value as any)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="destination_number">DESTINATION_NUMBER</SelectItem>
                          <SelectItem value="message_content">MESSAGE_CONTENT</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Input
                        value={param.value}
                        onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                        placeholder={param.type === 'fixed' ? 'Enter fixed value' : '(Automatically mapped)'}
                        disabled={param.type !== 'fixed'}
                        className="h-9"
                        type={param.type === 'fixed' && (param.key.toLowerCase().includes('key') || param.key.toLowerCase().includes('token') || param.key.toLowerCase().includes('pass')) ? 'password' : 'text'}
                      />
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteParameter(param.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {config.parameters.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No parameters defined. Add a parameter to send data to the gateway.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
            <Button variant="outline" onClick={sendTestSMS} disabled={testing || config.parameters.length === 0}>
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
          <Button onClick={() => saveSettings(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
          <Button variant="outline" onClick={checkBalance} disabled={checkingBalance || !getApiKey()}>
            {checkingBalance ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
            Check Balance
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
