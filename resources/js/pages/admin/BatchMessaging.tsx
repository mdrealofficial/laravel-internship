import React, { useState, useEffect } from 'react';
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
  XCircle,
  FileText
} from 'lucide-react';
import { Department, Intern } from '@/types/database';

interface LogEntry {
  name: string;
  email: string;
  phone: string;
  emailStatus: string;
  smsStatus: string;
  error?: string;
}

const BatchMessaging = () => {
  const [interns, setInterns] = useState<Intern[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [targetType, setTargetType] = useState<'batch' | 'department'>('batch');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  
  // Execution State
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ total: 0, sent: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsRes, deptsRes, profilesRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('user_id, full_name, email')
      ]);

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

      if (deptsRes.data) {
        setDepartments(deptsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load messaging target data');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique batches from interns
  const getUniqueBatches = () => {
    const batches = interns
      .map(i => i.batch_name)
      .filter((b): b is string => !!b);
    return Array.from(new Set(batches)).sort();
  };

  // Filter interns based on target parameters
  const getSelectedRecipients = () => {
    return interns.filter(intern => {
      // Filter by Batch
      const batchMatch = 
        selectedBatch === 'all' || 
        intern.batch_name === selectedBatch ||
        (selectedBatch === 'Unassigned' && !intern.batch_name);

      // Filter by Department (if department mode)
      const deptMatch = 
        targetType === 'batch' || 
        selectedDepartment === 'all' || 
        intern.department_id === selectedDepartment;

      // Only send to active interns
      const statusMatch = intern.status === 'active';

      return batchMatch && deptMatch && statusMatch;
    });
  };

  const recipients = getSelectedRecipients();
  const uniqueBatches = getUniqueBatches();

  const handleSendBroadcast = async () => {
    if (recipients.length === 0) {
      toast.error('No active interns found for the selected targets.');
      return;
    }
    if (!sendEmail && !sendSMS) {
      toast.error('Please select at least one channel (Email or SMS).');
      return;
    }
    if (sendEmail && (!emailSubject.trim() || !emailBody.trim())) {
      toast.error('Email Subject and Body are required.');
      return;
    }
    if (sendSMS && !smsBody.trim()) {
      toast.error('SMS Message Body is required.');
      return;
    }

    setSending(true);
    setProgress({ total: recipients.length, sent: 0, success: 0, failed: 0 });
    setLogs([]);
    setShowProgressDialog(true);

    const tempLogs: LogEntry[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const intern = recipients[i];
      const name = intern.profile?.full_name || 'Intern';
      const email = intern.profile?.email || '';
      const phone = intern.phone || '';
      const role = intern.role_title || 'Intern';
      const batch = intern.batch_name || 'Unassigned';
      const department = intern.department?.name || 'Unassigned';

      // Setup replacement variables
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
        company_name: 'DIGI5 LTD'
      };

      let emailStatus = 'skipped';
      let smsStatus = 'skipped';
      let errorMessage = '';

      try {
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            template_key: 'custom_broadcast',
            recipient_email: sendEmail && email ? email : undefined,
            recipient_phone: sendSMS && phone ? phone : undefined,
            subject: emailSubject,
            body: emailBody,
            sms_body: smsBody,
            data: personalizationData,
            force_send: true
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data && data.success) {
          if (sendEmail && email) {
            emailStatus = data.results?.email?.success ? 'success' : 'failed';
            if (emailStatus === 'failed') errorMessage += `Email: ${data.results?.email?.error || 'Failed'}; `;
          }
          if (sendSMS && phone) {
            smsStatus = data.results?.sms?.success ? 'success' : 'failed';
            if (smsStatus === 'failed') errorMessage += `SMS: ${data.results?.sms?.error || 'Failed'}; `;
          }
        } else {
          throw new Error(data?.error || 'Failed to dispatch broadcast');
        }
      } catch (err: any) {
        if (sendEmail) emailStatus = 'failed';
        if (sendSMS) smsStatus = 'failed';
        errorMessage = err.message || 'Unknown error occurred';
      }

      const isSuccess = 
        (!sendEmail || !email || emailStatus === 'success') && 
        (!sendSMS || !phone || smsStatus === 'success');

      const entry: LogEntry = {
        name,
        email: email || 'No Email',
        phone: phone || 'No Phone',
        emailStatus,
        smsStatus,
        error: isSuccess ? undefined : (errorMessage || 'Some channels failed')
      };

      tempLogs.push(entry);
      setLogs([...tempLogs]);

      setProgress(prev => ({
        ...prev,
        sent: i + 1,
        success: prev.success + (isSuccess ? 1 : 0),
        failed: prev.failed + (isSuccess ? 0 : 1)
      }));
    }

    setSending(false);
    toast.success('Broadcast transmission completed!');
  };

  const insertVariable = (variable: string, channel: 'email' | 'sms') => {
    if (channel === 'email') {
      setEmailBody(prev => prev + ` {{${variable}}}`);
    } else {
      setSmsBody(prev => prev + ` {{${variable}}}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto animate-fade-in relative">
        {/* Subtle grid background accent */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none -z-10 rounded-xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Batch Messaging</h1>
            <p className="text-slate-500 mt-1">Send personalized Email and SMS updates to active batches or departments.</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium">
            <Users size={18} />
            <span>Target Audience: {loading ? '...' : `${recipients.length} Active Intern(s)`}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Target Selectors Panel */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">1. Target Audience</CardTitle>
                  <CardDescription>Select the batch and department to filter recipients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter Type</Label>
                    <Select value={targetType} onValueChange={(v: 'batch' | 'department') => setTargetType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batch">Full Batch Wise</SelectItem>
                        <SelectItem value="department">Department & Batch Wise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Batch</Label>
                    <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                      <SelectTrigger>
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

                  {targetType === 'department' && (
                    <div className="space-y-2">
                      <Label>Select Department</Label>
                      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
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

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipients List ({recipients.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-sm">
                      {recipients.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No matching active interns found.</p>
                      ) : (
                        recipients.map(r => (
                          <div key={r.id} className="flex justify-between items-center bg-white p-2 border border-slate-200/60 rounded">
                            <span className="font-medium text-slate-700 truncate max-w-[130px]">{r.profile?.full_name}</span>
                            <span className="text-xs text-slate-400 truncate max-w-[120px]">{r.department?.name || 'Unassigned'}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variable Placeholders Guide */}
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <HelpCircle size={18} className="text-indigo-500" />
                    Personalization Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Click a variable below to insert it at the cursor of the email or SMS body. They will be auto-replaced for each intern.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'role', 'batch', 'department'].map(token => (
                      <Badge 
                        key={token} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-indigo-100 hover:text-indigo-800 transition-colors py-1 px-2 text-xs font-mono"
                        onClick={() => insertVariable(token, sendEmail ? 'email' : 'sms')}
                      >
                        {`{{${token}}}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Composer panel */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">2. Compose Message</CardTitle>
                  <CardDescription>Configure message details and channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Channels Selector */}
                  <div className="flex items-center gap-6 border-b pb-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="emailChannel" 
                        checked={sendEmail} 
                        onCheckedChange={(checked) => setSendEmail(!!checked)} 
                      />
                      <Label htmlFor="emailChannel" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <Mail size={16} className="text-slate-500" /> Send Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="smsChannel" 
                        checked={sendSMS} 
                        onCheckedChange={(checked) => setSendSMS(!!checked)} 
                      />
                      <Label htmlFor="smsChannel" className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                        <MessageSquare size={16} className="text-slate-500" /> Send SMS
                      </Label>
                    </div>
                  </div>

                  {/* Email Compose Form */}
                  {sendEmail && (
                    <div className="space-y-4 animate-fade-in">
                      <h3 className="font-semibold text-sm text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={16} /> Email Channel Details
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input 
                          id="subject" 
                          placeholder="e.g. Weekly Meeting Update - DIGI5 LTD" 
                          value={emailSubject} 
                          onChange={(e) => setEmailSubject(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="emailBody">Email Body</Label>
                          <span className="text-[10px] text-slate-400 font-mono">HTML tags are supported</span>
                        </div>
                        <Textarea 
                          id="emailBody" 
                          placeholder="Dear {{name}},\n\nThis is to remind you about..." 
                          className="min-h-[220px]" 
                          value={emailBody} 
                          onChange={(e) => setEmailBody(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* SMS Compose Form */}
                  {sendSMS && (
                    <div className="space-y-4 animate-fade-in border-t pt-4 border-slate-100">
                      <h3 className="font-semibold text-sm text-violet-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare size={16} /> SMS Channel Details
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="smsBody">SMS Message Body</Label>
                          <span className="text-xs font-mono text-slate-400">
                            {smsBody.length} chars ({Math.ceil(smsBody.length / 160)} SMS parts)
                          </span>
                        </div>
                        <Textarea 
                          id="smsBody" 
                          placeholder="Hi {{name}}, your weekly performance review has been posted. - DIGI5 LTD" 
                          className="min-h-[100px]" 
                          value={smsBody} 
                          onChange={(e) => setSmsBody(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Broadcast Button */}
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    onClick={handleSendBroadcast}
                    disabled={sending}
                  >
                    <Send size={16} />
                    Send Broadcast Message
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Logs (if sent previously) */}
              {logs.length > 0 && !sending && (
                <Card className="border border-slate-200 shadow-sm bg-white animate-fade-in">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                      <FileText size={18} className="text-slate-500" />
                      Broadcast Log Summary
                    </CardTitle>
                    <CardDescription>Results of the last broadcast session.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/20">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Email Status</TableHead>
                            <TableHead>SMS Status</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logs.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium text-slate-800">{log.name}</TableCell>
                              <TableCell>
                                {log.emailStatus === 'success' && <Badge className="bg-emerald-100 text-emerald-800 border-none">Sent</Badge>}
                                {log.emailStatus === 'failed' && <Badge className="bg-red-100 text-red-800 border-none">Failed</Badge>}
                                {log.emailStatus === 'skipped' && <span className="text-xs text-slate-400">Skipped</span>}
                              </TableCell>
                              <TableCell>
                                {log.smsStatus === 'success' && <Badge className="bg-emerald-100 text-emerald-800 border-none">Sent</Badge>}
                                {log.smsStatus === 'failed' && <Badge className="bg-red-100 text-red-800 border-none">Failed</Badge>}
                                {log.smsStatus === 'skipped' && <span className="text-xs text-slate-400">Skipped</span>}
                              </TableCell>
                              <TableCell className="text-xs max-w-[200px] truncate text-slate-500">
                                {log.error ? (
                                  <span className="text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={12} /> {log.error}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Ok</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Progress Dialog during transmission */}
        <Dialog open={showProgressDialog} onOpenChange={(open) => { if (!sending) setShowProgressDialog(open); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {sending ? (
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
                {sending 
                  ? `Transmitting personalized messages. Please do not close this window.`
                  : `Successfully processed broadcast messages for ${progress.total} recipients.`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Sending Progress</span>
                  <span>{progress.sent} / {progress.total}</span>
                </div>
                <Progress value={(progress.sent / progress.total) * 100} className="h-2.5 bg-slate-100" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-sm font-medium mt-2">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-slate-700 mt-0.5">{progress.total}</p>
                </div>
                <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/50">
                  <p className="text-xs text-emerald-600 uppercase tracking-wider">Success</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{progress.success}</p>
                </div>
                <div className="bg-red-50/40 p-2.5 rounded-lg border border-red-100/50">
                  <p className="text-xs text-red-500 uppercase tracking-wider">Failed</p>
                  <p className="text-lg font-bold text-red-700 mt-0.5">{progress.failed}</p>
                </div>
              </div>

              {/* Mini live logger */}
              <div className="bg-slate-900 text-slate-200 text-xs p-3 rounded-lg font-mono h-24 overflow-y-auto space-y-1 scrollbar-thin">
                {logs.length === 0 ? (
                  <p className="text-slate-500 italic">Initializing stream...</p>
                ) : (
                  [...logs].reverse().map((log, index) => {
                    const isSuccess = log.emailStatus !== 'failed' && log.smsStatus !== 'failed';
                    return (
                      <p key={index} className={isSuccess ? 'text-emerald-400' : 'text-red-400'}>
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

            {!sending && (
              <Button 
                className="w-full bg-slate-800 hover:bg-slate-900 text-white mt-2" 
                onClick={() => setShowProgressDialog(false)}
              >
                Close Summary
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default BatchMessaging;
