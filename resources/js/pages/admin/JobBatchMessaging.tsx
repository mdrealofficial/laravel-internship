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
  FileText
} from 'lucide-react';
import { Department, ApplicationForm, Application } from '@/types/database';

interface LogEntry {
  name: string;
  email: string;
  phone: string;
  emailStatus: string;
  smsStatus: string;
  error?: string;
}

export default function JobBatchMessaging() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering States
  const [selectedForm, setSelectedForm] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Channels and Body States
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsBody, setSmsBody] = useState('');
  
  // Sending Process States
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ total: 0, sent: 0, success: 0, failed: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appsRes, formsRes, deptsRes] = await Promise.all([
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
          .from('departments')
          .select('*')
          .order('name')
      ]);

      if (appsRes.data) setApplications(appsRes.data);
      if (formsRes.data) setForms(formsRes.data);
      if (deptsRes.data) setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching messaging data:', error);
      toast.error('Failed to load job applicant data');
    } finally {
      setLoading(false);
    }
  };

  // Filter applications based on selected parameters
  const getSelectedRecipients = () => {
    return applications.filter(app => {
      const formMatch = selectedForm === 'all' || app.form_id === selectedForm;
      const deptMatch = selectedDepartment === 'all' || (app.department_id || app.form?.department_id) === selectedDepartment;
      const statusMatch = selectedStatus === 'all' || app.status === selectedStatus;
      return formMatch && deptMatch && statusMatch;
    });
  };

  const recipients = getSelectedRecipients();

  const handleSendBroadcast = async () => {
    if (recipients.length === 0) {
      toast.error('No matching job applicants found for the selected targets.');
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
      const app = recipients[i];
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
    toast.success('Job broadcast transmission completed!');
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
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none -z-10 rounded-xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Job Batch Messaging</h1>
            <p className="text-slate-500 mt-1">Send bulk personalized Updates/Emails/SMS to job candidates.</p>
          </div>
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-medium">
            <Users size={18} />
            <span>Target Audience: {loading ? '...' : `${recipients.length} Candidates`}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Filters panel */}
            <div className="space-y-6 lg:col-span-1">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">1. Target Filter</CardTitle>
                  <CardDescription>Select filters to narrow down targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Position</Label>
                    <Select value={selectedForm} onValueChange={setSelectedForm}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Positions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        {forms.map(form => (
                          <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label>Select Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
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

                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipients ({recipients.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-sm">
                      {recipients.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No matching candidates found.</p>
                      ) : (
                        recipients.map(r => (
                          <div key={r.id} className="flex justify-between items-center bg-white p-2 border border-slate-200/60 rounded">
                            <span className="font-medium text-slate-700 truncate max-w-[130px]">{r.applicant_name}</span>
                            <span className="text-xs text-indigo-600 truncate max-w-[120px] capitalize font-medium">{r.status}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tokens */}
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <HelpCircle size={18} className="text-indigo-500" />
                    Personalization Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Click a variable to insert it at the cursor. They will be auto-replaced for each candidate.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'position', 'department', 'status'].map(token => (
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

            {/* Composer */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-800">2. Compose Message</CardTitle>
                  <CardDescription>Configure message details and channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  {sendEmail && (
                    <div className="space-y-4 animate-fade-in">
                      <h3 className="font-semibold text-sm text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail size={16} /> Email Channel Details
                      </h3>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input 
                          id="subject" 
                          placeholder="e.g. Interview Schedule - DIGI5 LTD" 
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
                          placeholder="Dear {{name}},\n\nThis is to update you regarding your application for the {{position}} role..." 
                          className="min-h-[220px]" 
                          value={emailBody} 
                          onChange={(e) => setEmailBody(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

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
                          placeholder="Hi {{name}}, update on your application for {{position}}: {{status}}. - DIGI5 LTD" 
                          className="min-h-[100px]" 
                          value={smsBody} 
                          onChange={(e) => setSmsBody(e.target.value)} 
                        />
                      </div>
                    </div>
                  )}

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

              {/* Summary Logs */}
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

        {/* Progress Dialog */}
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
}
