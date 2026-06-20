import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  BarChart3, 
  Mail, 
  MessageSquare, 
  Search, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  Calendar,
  User,
  ArrowLeft,
  Activity,
  FileText,
  AlertCircle,
  Percent
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface NotificationLog {
  id: string;
  recipient: string;
  notification_type: 'email' | 'sms';
  subject?: string;
  body: string;
  template_key: string;
  status: string;
  error_message?: string;
  metadata?: any;
  sent_at: string;
  campaign_name?: string;
  opened: boolean;
  clicked: boolean;
  opened_at?: string;
  clicked_at?: string;
}

interface CampaignSummary {
  name: string;
  sentAt: string;
  totalSent: number;
  emailsCount: number;
  smsCount: number;
  deliveredCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  emailDeliveredCount: number;
  emailFailedCount: number;
  smsDeliveredCount: number;
  smsFailedCount: number;
  logs: NotificationLog[];
}

export default function NotificationReports() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignSummary | null>(null);
  const [previewLog, setPreviewLog] = useState<NotificationLog | null>(null);
  
  // Recipient filtering tabs
  const [channelTab, setChannelTab] = useState<'all' | 'email' | 'sms'>('all');
  const [recipientSearch, setRecipientSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const typedLogs = (data || []).map(item => ({
        ...item,
        metadata: typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata
      })) as NotificationLog[];

      setLogs(typedLogs);
      processCampaigns(typedLogs);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      toast.error('Failed to load notification reports');
    } finally {
      setLoading(false);
    }
  };

  const processCampaigns = (allLogs: NotificationLog[]) => {
    const grouped = allLogs.reduce((acc, log) => {
      const campaign = log.campaign_name || 'Direct / Transactional';
      if (!acc[campaign]) {
        acc[campaign] = [];
      }
      acc[campaign].push(log);
      return acc;
    }, {} as Record<string, NotificationLog[]>);

    const summaries: CampaignSummary[] = Object.keys(grouped).map(name => {
      const campaignLogs = grouped[name];
      const latestLog = campaignLogs[0];
      const sentAt = latestLog ? latestLog.sent_at : '';

      const emails = campaignLogs.filter(l => l.notification_type === 'email');
      const sms = campaignLogs.filter(l => l.notification_type === 'sms');

      const delivered = campaignLogs.filter(l => l.status === 'sent' || l.status === 'delivered');
      const failed = campaignLogs.filter(l => l.status === 'failed');

      const emailDelivered = emails.filter(l => l.status === 'sent' || l.status === 'delivered').length;
      const emailFailed = emails.filter(l => l.status === 'failed').length;

      const smsDelivered = sms.filter(l => l.status === 'sent' || l.status === 'delivered').length;
      const smsFailed = sms.filter(l => l.status === 'failed').length;

      const opened = emails.filter(l => l.opened);
      const clicked = emails.filter(l => l.clicked);

      return {
        name,
        sentAt,
        totalSent: campaignLogs.length,
        emailsCount: emails.length,
        smsCount: sms.length,
        deliveredCount: delivered.length,
        failedCount: failed.length,
        openedCount: opened.length,
        clickedCount: clicked.length,
        emailDeliveredCount: emailDelivered,
        emailFailedCount: emailFailed,
        smsDeliveredCount: smsDelivered,
        smsFailedCount: smsFailed,
        logs: campaignLogs
      };
    });

    summaries.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    setCampaigns(summaries);
  };

  // Overall statistics
  const totalSentCount = logs.length;
  const totalEmailsCount = logs.filter(l => l.notification_type === 'email').length;
  const totalSMSCount = logs.filter(l => l.notification_type === 'sms').length;
  
  const totalDelivered = logs.filter(l => l.status === 'sent' || l.status === 'delivered').length;
  const totalFailed = logs.filter(l => l.status === 'failed').length;
  
  const totalEmailDelivered = logs.filter(l => l.notification_type === 'email' && (l.status === 'sent' || l.status === 'delivered')).length;
  const totalSMSDelivered = logs.filter(l => l.notification_type === 'sms' && (l.status === 'sent' || l.status === 'delivered')).length;

  const totalOpened = logs.filter(l => l.opened).length;
  const totalClicked = logs.filter(l => l.clicked).length;

  const overallOpenRate = totalEmailsCount > 0 ? Math.round((totalOpened / totalEmailsCount) * 100) : 0;
  const overallClickRate = totalEmailsCount > 0 ? Math.round((totalClicked / totalEmailsCount) * 100) : 0;
  const overallDeliveryRate = totalSentCount > 0 ? Math.round((totalDelivered / totalSentCount) * 100) : 0;

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter campaign logs for details view based on tab and recipient name/info search
  const getFilteredRecipientLogs = () => {
    if (!selectedCampaign) return [];
    return selectedCampaign.logs.filter(log => {
      const channelMatch = channelTab === 'all' || log.notification_type === channelTab;
      
      const name = log.metadata?.recipient_name || '';
      const recipient = log.recipient || '';
      const searchMatch = 
        recipientSearch.trim() === '' ||
        name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
        recipient.toLowerCase().includes(recipientSearch.toLowerCase());

      return channelMatch && searchMatch;
    });
  };

  const currentRecipientLogs = getFilteredRecipientLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none -z-10 rounded-xl" />

        {selectedCampaign ? (
          // Campaign Detail View
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedCampaign(null);
                    setChannelTab('all');
                    setRecipientSearch('');
                  }}
                  className="flex items-center gap-1.5 border-slate-200"
                >
                  <ArrowLeft size={16} /> Back to Campaigns
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800">{selectedCampaign.name}</h1>
                  <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5">
                    <Calendar size={14} /> Campaign started on {formatDate(selectedCampaign.sentAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 py-1 px-2.5">
                  Emails: <span className="font-bold ml-1 text-indigo-600">{selectedCampaign.emailsCount}</span>
                </Badge>
                <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 py-1 px-2.5">
                  SMS: <span className="font-bold ml-1 text-violet-600">{selectedCampaign.smsCount}</span>
                </Badge>
              </div>
            </div>

            {/* Campaign Summary & Dual Channel Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Overall Stat Column */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border border-slate-200/80 shadow-sm bg-white overflow-hidden h-full">
                  <div className="bg-slate-50/50 border-b border-slate-100 p-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Activity size={18} className="text-slate-500" /> Overall Summary
                    </h3>
                  </div>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-400">Total Sent</p>
                        <h4 className="text-3xl font-extrabold text-slate-800 mt-1">{selectedCampaign.totalSent}</h4>
                      </div>
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 text-sm font-bold">100%</Badge>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-400">Delivery Success</p>
                        <h4 className="text-3xl font-extrabold text-emerald-600 mt-1">
                          {selectedCampaign.totalSent > 0 ? Math.round((selectedCampaign.deliveredCount / selectedCampaign.totalSent) * 100) : 0}%
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-700 block">{selectedCampaign.deliveredCount} Delivered</span>
                        <span className="text-xs text-red-500">{selectedCampaign.failedCount} Failed</span>
                      </div>
                    </div>

                    <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between text-xs text-indigo-800 font-semibold">
                        <span>Campaign Mix</span>
                        <span>{selectedCampaign.emailsCount} Emails / {selectedCampaign.smsCount} SMS</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-indigo-600 h-full" 
                          style={{ width: `${selectedCampaign.totalSent > 0 ? (selectedCampaign.emailsCount / selectedCampaign.totalSent) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-violet-500 h-full" 
                          style={{ width: `${selectedCampaign.totalSent > 0 ? (selectedCampaign.smsCount / selectedCampaign.totalSent) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Email Performance Column */}
              <div className="lg:col-span-1">
                <Card className="border border-slate-200/80 shadow-sm bg-white h-full">
                  <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail size={18} className="text-indigo-500" /> Email Performance
                    </h3>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100">Channel</Badge>
                  </div>
                  <CardContent className="pt-6 space-y-4">
                    {selectedCampaign.emailsCount === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm italic">
                        No emails sent in this campaign.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sent</span>
                            <p className="text-lg font-bold text-slate-700 mt-0.5">{selectedCampaign.emailsCount}</p>
                          </div>
                          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivered</span>
                            <p className="text-lg font-bold text-emerald-700 mt-0.5">{selectedCampaign.emailDeliveredCount}</p>
                          </div>
                          <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Failed</span>
                            <p className="text-lg font-bold text-red-700 mt-0.5">{selectedCampaign.emailFailedCount}</p>
                          </div>
                        </div>

                        <div className="space-y-3 pt-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span className="flex items-center gap-1"><Eye size={12} className="text-sky-500" /> Open Rate</span>
                              <span>{selectedCampaign.emailsCount > 0 ? Math.round((selectedCampaign.openedCount / selectedCampaign.emailsCount) * 100) : 0}% ({selectedCampaign.openedCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-sky-500 h-full rounded-full transition-all" 
                                style={{ width: `${selectedCampaign.emailsCount > 0 ? (selectedCampaign.openedCount / selectedCampaign.emailsCount) * 100 : 0}%` }}
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span className="flex items-center gap-1"><MousePointerClick size={12} className="text-amber-500" /> Click Rate</span>
                              <span>{selectedCampaign.emailsCount > 0 ? Math.round((selectedCampaign.clickedCount / selectedCampaign.emailsCount) * 100) : 0}% ({selectedCampaign.clickedCount})</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-500 h-full rounded-full transition-all" 
                                style={{ width: `${selectedCampaign.emailsCount > 0 ? (selectedCampaign.clickedCount / selectedCampaign.emailsCount) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* SMS Performance Column */}
              <div className="lg:col-span-1">
                <Card className="border border-slate-200/80 shadow-sm bg-white h-full">
                  <div className="bg-slate-50/50 border-b border-slate-100 p-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare size={18} className="text-violet-500" /> SMS Performance
                    </h3>
                    <Badge className="bg-violet-50 text-violet-700 border-violet-100">Channel</Badge>
                  </div>
                  <CardContent className="pt-6 space-y-4">
                    {selectedCampaign.smsCount === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm italic">
                        No SMS sent in this campaign.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sent</span>
                            <p className="text-lg font-bold text-slate-700 mt-0.5">{selectedCampaign.smsCount}</p>
                          </div>
                          <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Delivered</span>
                            <p className="text-lg font-bold text-emerald-700 mt-0.5">{selectedCampaign.smsDeliveredCount}</p>
                          </div>
                          <div className="bg-red-50/50 p-2.5 rounded-lg border border-red-100/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Failed</span>
                            <p className="text-lg font-bold text-red-700 mt-0.5">{selectedCampaign.smsFailedCount}</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-600">
                              <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Delivery Success Rate</span>
                              <span>{selectedCampaign.smsCount > 0 ? Math.round((selectedCampaign.smsDeliveredCount / selectedCampaign.smsCount) * 100) : 0}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all" 
                                style={{ width: `${selectedCampaign.smsCount > 0 ? (selectedCampaign.smsDeliveredCount / selectedCampaign.smsCount) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <div className="p-3 bg-slate-50 border rounded-lg text-xs text-slate-500 flex items-start gap-2">
                            <AlertCircle size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                            <span>SMS does not support open or click tracking. Delivery confirmations depend on the SMS gateway API response code.</span>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Recipient breakdown list with channel tabs */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Recipients Delivery Breakdown</CardTitle>
                  <CardDescription>Click tabs below to see which contacts received SMS or Emails.</CardDescription>
                </div>
                
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search recipient name..." 
                      className="pl-9 h-9 text-sm" 
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                    />
                  </div>

                  {/* Channel Filtering Tabs */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border text-sm">
                    <button 
                      onClick={() => setChannelTab('all')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${channelTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      All ({selectedCampaign.totalSent})
                    </button>
                    <button 
                      onClick={() => setChannelTab('email')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${channelTab === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Emails ({selectedCampaign.emailsCount})
                    </button>
                    <button 
                      onClick={() => setChannelTab('sms')}
                      className={`px-3 py-1.5 rounded-md font-medium transition-colors ${channelTab === 'sms' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      SMS ({selectedCampaign.smsCount})
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {currentRecipientLogs.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg border-dashed border-slate-200">
                    <User className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No matching contacts found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/70">
                        <TableRow>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Recipient Info</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Delivery Status</TableHead>
                          <TableHead>Open Status</TableHead>
                          <TableHead>Click Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRecipientLogs.map((log) => {
                          const name = log.metadata?.recipient_name || '—';
                          const isEmail = log.notification_type === 'email';
                          const isDelivered = log.status === 'sent' || log.status === 'delivered';
                          
                          return (
                            <TableRow key={log.id} className="hover:bg-slate-50/50">
                              <TableCell className="font-semibold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                    {name !== '—' ? name.charAt(0).toUpperCase() : <User size={14} />}
                                  </div>
                                  <div>
                                    <span className="block">{name}</span>
                                    {!isEmail && (
                                      <span className="text-[10px] text-slate-400 block font-normal mt-0.5">SMS Recipient</span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm text-slate-600">{log.recipient}</TableCell>
                              <TableCell>
                                {isEmail ? (
                                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1.5 w-fit">
                                    <Mail size={12} /> Email
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-100 flex items-center gap-1.5 w-fit">
                                    <MessageSquare size={12} /> SMS
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {isDelivered ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold flex items-center gap-1 w-fit">
                                    <CheckCircle size={10} /> Delivered
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-50 text-red-700 border-red-100 font-semibold flex items-center gap-1 w-fit">
                                    <XCircle size={10} /> Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {!isEmail ? (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">N/A (SMS)</Badge>
                                ) : log.opened ? (
                                  <div className="space-y-0.5">
                                    <Badge className="bg-sky-50 text-sky-700 border-sky-100 font-semibold flex items-center gap-1 w-fit">
                                      <Eye size={10} /> Opened
                                    </Badge>
                                    {log.opened_at && (
                                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(log.opened_at)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 border-slate-200">Not Opened</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {!isEmail ? (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200">N/A (SMS)</Badge>
                                ) : log.clicked ? (
                                  <div className="space-y-0.5">
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-semibold flex items-center gap-1 w-fit">
                                      <MousePointerClick size={10} /> Clicked
                                    </Badge>
                                    {log.clicked_at && (
                                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(log.clicked_at)}</p>
                                    )}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 border-slate-200">No Click</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setPreviewLog(log)}
                                  className="h-8 text-indigo-600 hover:text-indigo-800"
                                >
                                  View Message
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Campaigns Overview View
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">Notification Reports</h1>
              <p className="text-slate-500 mt-1">Analytics, open rates, and click tracking metrics grouped by campaign.</p>
            </div>

            {/* Overall Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sent</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{totalSentCount}</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Activity size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium">
                    {totalEmailsCount} Emails | {totalSMSCount} SMS
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivery Rate</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{overallDeliveryRate}%</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CheckCircle size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium flex items-center gap-1.5">
                    <span>Email: {Math.round((totalEmailDelivered / Math.max(1, totalEmailsCount)) * 100)}%</span>
                    <span className="text-slate-300">|</span>
                    <span>SMS: {Math.round((totalSMSDelivered / Math.max(1, totalSMSCount)) * 100)}%</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Open Rate</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{overallOpenRate}%</h3>
                    </div>
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                      <Eye size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium">
                    {totalOpened} total email opens recorded
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200/80 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Click Rate</p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{overallClickRate}%</h3>
                    </div>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <MousePointerClick size={18} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-3 font-medium">
                    {totalClicked} total email clicks recorded
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Campaign Selector / List */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800">Campaigns List</CardTitle>
                  <CardDescription>Select a campaign to drill down into delivery details.</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search campaigns..." 
                    className="pl-9 h-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <TrendingUp className="h-6 w-6 animate-pulse text-indigo-500 mr-2" />
                    <span className="text-sm text-slate-500">Processing campaign metrics...</span>
                  </div>
                ) : filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg border-dashed border-slate-200">
                    <BarChart3 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">No campaigns found</p>
                    <p className="text-xs text-slate-400 mt-1">Start broadcasting messages to create email and SMS campaigns.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50/70">
                        <TableRow>
                          <TableHead>Campaign Name</TableHead>
                          <TableHead>Last Broadcast</TableHead>
                          <TableHead className="text-center">Total Sent</TableHead>
                          <TableHead className="text-center">Delivered</TableHead>
                          <TableHead className="text-center">Channels</TableHead>
                          <TableHead className="text-center">Open Rate</TableHead>
                          <TableHead className="text-center">Click Rate</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCampaigns.map((camp) => {
                          const openRate = camp.emailsCount > 0 ? Math.round((camp.openedCount / camp.emailsCount) * 100) : 0;
                          const clickRate = camp.emailsCount > 0 ? Math.round((camp.clickedCount / camp.emailsCount) * 100) : 0;
                          const deliveryRate = camp.totalSent > 0 ? Math.round((camp.deliveredCount / camp.totalSent) * 100) : 0;

                          return (
                            <TableRow key={camp.name} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedCampaign(camp)}>
                              <TableCell className="font-semibold text-slate-800">{camp.name}</TableCell>
                              <TableCell className="text-slate-500 text-sm">{formatDate(camp.sentAt)}</TableCell>
                              <TableCell className="text-center font-bold text-slate-700">{camp.totalSent}</TableCell>
                              <TableCell className="text-center">
                                <Badge className={deliveryRate > 90 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"}>
                                  {deliveryRate}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                                  {camp.emailsCount > 0 && <span className="flex items-center gap-0.5"><Mail size={12} /> {camp.emailsCount}</span>}
                                  {camp.smsCount > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={12} /> {camp.smsCount}</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold text-sky-700">{camp.emailsCount > 0 ? `${openRate}%` : '—'}</TableCell>
                              <TableCell className="text-center font-semibold text-amber-700">{camp.emailsCount > 0 ? `${clickRate}%` : '—'}</TableCell>
                              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setSelectedCampaign(camp)}
                                  className="h-8 text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 ml-auto"
                                >
                                  Details <ChevronRight size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message preview Dialog */}
        <Dialog open={!!previewLog} onOpenChange={(open) => { if (!open) setPreviewLog(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                Message Content Details
              </DialogTitle>
              <DialogDescription>
                Auditing message payload dispatched to {previewLog?.recipient}.
              </DialogDescription>
            </DialogHeader>
            {previewLog && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3 text-slate-600">
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Recipient Contact</Label>
                    <p className="mt-1 font-mono">{previewLog.recipient}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Sent At</Label>
                    <p className="mt-1 font-mono">{formatDate(previewLog.sent_at)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Channel & Key</Label>
                    <p className="mt-1 flex items-center gap-1.5">
                      <Badge className="bg-slate-100 text-slate-800 border-none capitalize">{previewLog.notification_type}</Badge>
                      <span className="font-mono text-xs text-slate-400">[{previewLog.template_key}]</span>
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Browser WebView</Label>
                    <p className="mt-1">
                      {previewLog.notification_type === 'email' ? (
                        <a 
                          href={`/api/mail-track/webview/${previewLog.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline text-xs font-semibold flex items-center gap-1.5"
                        >
                          View Email WebView
                        </a>
                      ) : 'N/A (SMS)'}
                    </p>
                  </div>
                </div>

                {previewLog.notification_type === 'email' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-slate-700">Subject Line</Label>
                    <div className="p-2.5 bg-slate-50 border rounded-lg text-slate-800 font-medium">{previewLog.subject}</div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider font-semibold text-slate-700">Message Body</Label>
                  {previewLog.notification_type === 'email' ? (
                    <div className="border rounded-lg overflow-hidden bg-slate-50">
                      <div className="bg-slate-100 px-3 py-1.5 text-[10px] text-slate-400 font-mono border-b">IFRAME SANDBOX PREVIEW</div>
                      <iframe 
                        srcDoc={previewLog.body} 
                        className="w-full h-80 border-0 bg-white" 
                        title="Email Body Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border rounded-lg text-slate-800 font-mono whitespace-pre-wrap text-sm leading-relaxed">
                      {previewLog.body}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
