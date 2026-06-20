import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  History, 
  Mail, 
  MessageSquare, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  RefreshCw,
  FileText,
  ExternalLink,
  User
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

export default function NotificationLogs() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [previewLog, setPreviewLog] = useState<NotificationLog | null>(null);

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
    } catch (err: any) {
      console.error('Error fetching logs:', err);
      toast.error('Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  // Get unique campaigns from logs for filtering
  const getUniqueCampaigns = () => {
    const campaigns = logs
      .map(l => l.campaign_name)
      .filter((c): c is string => !!c);
    return Array.from(new Set(campaigns)).sort();
  };

  const uniqueCampaigns = getUniqueCampaigns();

  // Filter logs based on search query, type, status, and campaign
  const filteredLogs = logs.filter(log => {
    const recipientMatch = log.recipient.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = (log.metadata?.recipient_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const subjectMatch = (log.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const searchMatch = recipientMatch || nameMatch || subjectMatch;

    const typeMatch = typeFilter === 'all' || log.notification_type === typeFilter;
    
    let statusMatch = true;
    if (statusFilter !== 'all') {
      const isDelivered = log.status === 'sent' || log.status === 'delivered';
      if (statusFilter === 'delivered') {
        statusMatch = isDelivered;
      } else if (statusFilter === 'failed') {
        statusMatch = !isDelivered;
      }
    }

    const campaignMatch = 
      campaignFilter === 'all' || 
      log.campaign_name === campaignFilter ||
      (campaignFilter === 'none' && !log.campaign_name);

    return searchMatch && typeMatch && statusMatch && campaignMatch;
  });

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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto animate-fade-in relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none -z-10 rounded-xl" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Notification Logs</h1>
            <p className="text-slate-500 mt-1">Audit log records of all outbound emails and SMS sent through the application.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 self-start md:self-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Logs
          </Button>
        </div>

        {/* Filters Panel */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-slate-600 font-medium">Search Recipient</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="search"
                    placeholder="Search by name, email or phone..." 
                    className="pl-9" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Channel Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="email">Email Only</SelectItem>
                    <SelectItem value="sms">SMS Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Delivery Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="delivered">Delivered Successfully</SelectItem>
                    <SelectItem value="failed">Failed / Undelivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-600 font-medium">Campaign</Label>
                <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Campaigns" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Campaigns</SelectItem>
                    <SelectItem value="none">Direct (No Campaign)</SelectItem>
                    {uniqueCampaigns.map(camp => (
                      <SelectItem key={camp} value={camp}>{camp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-24">
                <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mr-2" />
                <span className="text-sm text-slate-500 font-medium">Loading log entries...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-20">
                <History className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-600">No log entries found</p>
                <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/70">
                    <TableRow>
                      <TableHead className="pl-6">Recipient Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Opens / Clicks</TableHead>
                      <TableHead className="text-right pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const name = log.metadata?.recipient_name || '—';
                      const isEmail = log.notification_type === 'email';
                      const isDelivered = log.status === 'sent' || log.status === 'delivered';
                      
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/50">
                          <TableCell className="pl-6 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
                                {name !== '—' ? name.charAt(0).toUpperCase() : <User size={14} />}
                              </div>
                              {name}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-600">{log.recipient}</TableCell>
                          <TableCell>
                            {isEmail ? (
                              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1 w-fit">
                                <Mail size={12} /> Email
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-100 flex items-center gap-1 w-fit">
                                <MessageSquare size={12} /> SMS
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-500 font-medium max-w-[140px] truncate">
                            {log.campaign_name || <span className="text-slate-400 italic text-xs">Direct</span>}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm font-medium">{formatDate(log.sent_at)}</TableCell>
                          <TableCell>
                            {isDelivered ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-medium">Delivered</Badge>
                            ) : (
                              <div className="space-y-0.5">
                                <Badge className="bg-red-50 text-red-700 border-red-100 font-medium">Failed</Badge>
                                {log.error_message && (
                                  <p className="text-[10px] text-red-500 max-w-[150px] truncate" title={log.error_message}>{log.error_message}</p>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEmail ? (
                              <div className="flex gap-2">
                                <Badge className={log.opened ? "bg-sky-50 text-sky-700 border-sky-100 font-medium" : "bg-slate-50 text-slate-400 border-slate-200"}>
                                  {log.opened ? 'Opened' : 'Unopened'}
                                </Badge>
                                {log.clicked && (
                                  <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-medium">
                                    Clicked
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPreviewLog(log)}
                              className="h-8 text-indigo-600 hover:text-indigo-800"
                            >
                              Inspect
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

        {/* Message preview Dialog */}
        <Dialog open={!!previewLog} onOpenChange={(open) => { if (!open) setPreviewLog(null); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} />
                Notification Inspector
              </DialogTitle>
              <DialogDescription>
                Detailed audit and payload review for notification dispatch event.
              </DialogDescription>
            </DialogHeader>
            {previewLog && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm border-b pb-3 text-slate-600">
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Recipient Name / Contact</Label>
                    <p className="mt-1 font-semibold text-slate-700">{previewLog.metadata?.recipient_name || '—'}</p>
                    <p className="font-mono text-xs mt-0.5 text-slate-500">{previewLog.recipient}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Dispatched Time</Label>
                    <p className="mt-1 font-mono">{formatDate(previewLog.sent_at)}</p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Campaign & Template</Label>
                    <p className="mt-1">
                      <Badge className="bg-slate-100 text-slate-800 border-none capitalize font-medium">{previewLog.campaign_name || 'Direct / Transactional'}</Badge>
                      <span className="font-mono text-xs text-slate-400 block mt-1">Key: {previewLog.template_key}</span>
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-slate-800 text-xs uppercase tracking-wider">Browser WebView URL</Label>
                    <p className="mt-1">
                      {previewLog.notification_type === 'email' ? (
                        <a 
                          href={`/api/mail-track/webview/${previewLog.id}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline text-xs font-semibold flex items-center gap-1.5"
                        >
                          Open Web Version <ExternalLink size={12} />
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
                  <Label className="text-xs uppercase tracking-wider font-semibold text-slate-700">Compiled Body Content</Label>
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

                {previewLog.error_message && (
                  <div className="space-y-1.5 p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <Label className="text-xs uppercase tracking-wider font-semibold text-red-800">Dispatch Error log</Label>
                    <p className="text-xs font-mono text-red-600 mt-1 leading-relaxed">{previewLog.error_message}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
