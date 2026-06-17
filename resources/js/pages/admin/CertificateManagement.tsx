import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Award, Loader2, CheckCircle, XCircle, Eye, Palette, Layers, RotateCcw, Download, Send } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Certificate, Intern } from '@/types/database';
import { CertificateTemplate, templateOptions, TemplateType } from '@/components/certificates/CertificateTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SiteSettings {
  company_logo_url: string | null;
  signature_url: string | null;
  certificate_default_theme: TemplateType;
}

const CertificateManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligibleInterns, setEligibleInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [previewCert, setPreviewCert] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ company_logo_url: null, signature_url: null, certificate_default_theme: 'modern' });
  const [downloading, setDownloading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [actionCertId, setActionCertId] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!certificateRef.current || !previewCert) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      // Use JPEG with 0.8 quality for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Use custom page size matching 16:9 aspect ratio
      const pageWidth = 297;
      const pageHeight = pageWidth / (16/9);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [pageWidth, pageHeight],
        compress: true,
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

      const sanitizedName = (previewCert.intern?.profile?.full_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Certificate_${sanitizedName}_${previewCert.certificate_id}.pdf`);
      
      toast({ title: 'Success', description: 'Certificate downloaded as PDF' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to download certificate', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all data separately including site settings
      const [certsRes, internsRes, profilesRes, deptsRes, settingsRes] = await Promise.all([
        supabase.from('certificates').select('*').order('created_at', { ascending: false }),
        supabase.from('interns').select('*'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('departments').select('*'),
        supabase.from('site_settings').select('setting_key, setting_value'),
      ]);

      const profiles = profilesRes.data || [];
      const departments = deptsRes.data || [];
      const interns = internsRes.data || [];
      const certs = certsRes.data || [];
      const settings = settingsRes.data || [];

      // Map site settings
      const settingsMap: SiteSettings = { company_logo_url: null, signature_url: null, certificate_default_theme: 'modern' };
      settings.forEach(s => {
        if (s.setting_key === 'company_logo_url') settingsMap.company_logo_url = s.setting_value;
        if (s.setting_key === 'signature_url') settingsMap.signature_url = s.setting_value;
        if (s.setting_key === 'certificate_default_theme') settingsMap.certificate_default_theme = (s.setting_value as TemplateType) || 'modern';
      });
      setSiteSettings(settingsMap);
      
      // Set selected template to the default theme from settings
      if (settingsMap.certificate_default_theme) {
        setSelectedTemplate(settingsMap.certificate_default_theme);
      }

      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      const deptsMap = new Map(departments.map(d => [d.id, d]));
      const internsMap = new Map(interns.map(i => [i.id, {
        ...i,
        profile: profilesMap.get(i.user_id) || null,
        department: deptsMap.get(i.department_id) || null,
      }]));

      // Map certificates with intern data
      const mappedCerts = certs.map(c => ({
        ...c,
        intern: internsMap.get(c.intern_id) || null,
      }));

      // Find completed interns without certificates
      const existingInternIds = certs.map(c => c.intern_id);
      const eligible = interns
        .filter(i => i.status === 'completed' && !existingInternIds.includes(i.id))
        .map(i => ({
          ...i,
          profile: profilesMap.get(i.user_id) || null,
          department: deptsMap.get(i.department_id) || null,
        }));

      setCertificates(mappedCerts);
      setEligibleInterns(eligible);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateId = () => {
    const prefix = 'DIGI5';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const issueCertificate = async (internId: string, templateType: string) => {
    try {
      const certId = generateCertificateId();
      const verifyUrl = `${window.location.origin}/verify?id=${certId}`;

      const { error } = await supabase.from('certificates').insert({
        intern_id: internId,
        certificate_id: certId,
        status: 'issued',
        issued_date: new Date().toISOString().split('T')[0],
        issued_by: user?.id,
        qr_code_data: verifyUrl,
        template_type: templateType,
      });

      if (error) throw error;

      // Find the intern to get their details for notification
      const intern = eligibleInterns.find(i => i.id === internId);
      if (intern && intern.profile?.email) {
        // Send notification (email and SMS if configured)
        try {
          const { data } = await supabase.functions.invoke('send-notification', {
            body: {
              template_key: 'certificate_issued',
              recipient_email: intern.profile.email,
              recipient_phone: intern.phone || null,
              data: {
                intern_name: intern.profile.full_name || 'Intern',
                certificate_id: certId,
                department_name: intern.department?.name || 'DIGI5 LTD',
                role_title: intern.role_title || 'Intern',
                verification_url: verifyUrl,
              },
            },
          });

          let deliveryStatus = 'failed';
          if (data && data.success) {
            const emailSuccess = data.results?.email?.success;
            const smsSuccess = data.results?.sms?.success;
            if (emailSuccess && smsSuccess) {
              deliveryStatus = 'sent (Email & SMS)';
            } else if (emailSuccess) {
              deliveryStatus = 'sent (Email)';
            } else if (smsSuccess) {
              deliveryStatus = 'sent (SMS)';
            } else {
              deliveryStatus = 'sent';
            }
          }
          
          await supabase.from('certificates').update({ delivery_status: deliveryStatus }).eq('certificate_id', certId);
          console.log('Certificate notification sent successfully');
        } catch (notifyError) {
          console.error('Failed to send notification:', notifyError);
          // Don't fail the certificate issuance if notification fails
          await supabase.from('certificates').update({ delivery_status: 'failed' }).eq('certificate_id', certId);
        }
      }

      const templateName = templateOptions.find(t => t.id === templateType)?.name || templateType;
      toast({ title: 'Success', description: `Certificate ${certId} issued with ${templateName} template` });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleRevoke = async () => {
    if (!actionCertId) return;
    setActing(true);

    try {
      const { error } = await supabase.from('certificates').update({
        status: 'revoked',
        updated_at: new Date().toISOString(),
      }).eq('id', actionCertId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Certificate revoked' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActing(false);
      setRevokeConfirmOpen(false);
      setActionCertId(null);
    }
  };

  const handleRestore = async () => {
    if (!actionCertId) return;
    setActing(true);

    try {
      const { error } = await supabase.from('certificates').update({
        status: 'issued',
        updated_at: new Date().toISOString(),
      }).eq('id', actionCertId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Certificate restored' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setActing(false);
      setRestoreConfirmOpen(false);
      setActionCertId(null);
    }
  };

  const sendCertificateNotification = async (cert: any) => {
    if (!cert.intern?.profile?.email) {
      toast({ title: 'Error', description: 'No email found for this intern', variant: 'destructive' });
      return;
    }

    setSendingNotification(cert.id);
    try {
      const verifyUrl = `${window.location.origin}/verify?id=${cert.certificate_id}`;
      
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          template_key: 'certificate_issued',
          recipient_email: cert.intern.profile.email,
          recipient_phone: cert.intern.phone || null,
          data: {
            intern_name: cert.intern.profile.full_name || 'Intern',
            certificate_id: cert.certificate_id,
            department_name: cert.intern.department?.name || 'DIGI5 LTD',
            role_title: cert.intern.role_title || 'Intern',
            verification_url: verifyUrl,
          },
        },
      });

      if (error) throw error;

      let deliveryStatus = 'failed';
      if (data && data.success) {
        const emailSuccess = data.results?.email?.success;
        const smsSuccess = data.results?.sms?.success;
        if (emailSuccess && smsSuccess) {
          deliveryStatus = 'sent (Email & SMS)';
        } else if (emailSuccess) {
          deliveryStatus = 'sent (Email)';
        } else if (smsSuccess) {
          deliveryStatus = 'sent (SMS)';
        } else {
          deliveryStatus = 'sent';
        }
      }

      await supabase
        .from('certificates')
        .update({ delivery_status: deliveryStatus })
        .eq('id', cert.id);

      toast({ 
        title: 'Notification Sent', 
        description: `Certificate info sent to ${cert.intern.profile.email}${cert.intern.phone ? ' and ' + cert.intern.phone : ''}` 
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      await supabase
        .from('certificates')
        .update({ delivery_status: 'failed' })
        .eq('id', cert.id);
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
      fetchData();
    } finally {
      setSendingNotification(null);
    }
  };

  const openPreview = (cert: any) => {
    setPreviewCert(cert);
    setPreviewOpen(true);
  };

  const toggleSelectCert = (certId: string) => {
    setSelectedCerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(certId)) {
        newSet.delete(certId);
      } else {
        newSet.add(certId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCerts.size === certificates.length) {
      setSelectedCerts(new Set());
    } else {
      setSelectedCerts(new Set(certificates.map(c => c.id)));
    }
  };

  const bulkUpdateTemplate = async (templateType: TemplateType) => {
    if (selectedCerts.size === 0) {
      toast({ title: 'No Selection', description: 'Please select certificates to update', variant: 'destructive' });
      return;
    }

    setBulkUpdating(true);
    try {
      const { error } = await supabase
        .from('certificates')
        .update({ template_type: templateType, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedCerts));

      if (error) throw error;

      const templateName = templateOptions.find(t => t.id === templateType)?.name || templateType;
      toast({ title: 'Success', description: `Updated ${selectedCerts.size} certificate(s) to ${templateName} template` });
      setSelectedCerts(new Set());
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBulkUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      issued: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      revoked: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const getTemplateBadge = (template: string) => {
    const option = templateOptions.find(t => t.id === template);
    return <Badge variant="outline" className="text-xs">{option?.name || 'Royal Gold'}</Badge>;
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Certificate Management</h1>
          <p className="text-muted-foreground">Issue and manage certificates with premium templates</p>
        </div>

        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Certificate Template
            </CardTitle>
            <CardDescription>Select a template style for new certificates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {templateOptions.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedTemplate === template.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Eligible Interns */}
        {eligibleInterns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Ready for Certificate ({eligibleInterns.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {eligibleInterns.map((intern) => (
                  <div key={intern.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{intern.profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{intern.role_title} - {intern.department?.name}</p>
                    </div>
                    <Button onClick={() => issueCertificate(intern.id, selectedTemplate)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Issue Certificate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Issued Certificates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Certificates</CardTitle>
              {selectedCerts.size > 0 && (
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">
                    <Layers className="h-3 w-3 mr-1" />
                    {selectedCerts.size} selected
                  </Badge>
                  <div className="flex gap-1">
                    {templateOptions.map((template) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        size="sm"
                        disabled={bulkUpdating}
                        onClick={() => bulkUpdateTemplate(template.id)}
                        className="text-xs"
                      >
                        {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No certificates issued yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCerts.size === certificates.length && certificates.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Intern</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Issued Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Delivery Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.map((cert) => (
                      <TableRow key={cert.id} className={selectedCerts.has(cert.id) ? 'bg-primary/5' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCerts.has(cert.id)}
                            onCheckedChange={() => toggleSelectCert(cert.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{cert.certificate_id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cert.intern?.profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{cert.intern?.role_title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTemplateBadge(cert.template_type || 'royal')}</TableCell>
                        <TableCell>{cert.issued_date ? new Date(cert.issued_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{getStatusBadge(cert.status)}</TableCell>
                        <TableCell>
                          {cert.delivery_status ? (
                            <Badge variant="outline" className={
                              cert.delivery_status.includes('failed') 
                                ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                                : cert.delivery_status.includes('sent')
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }>
                              {cert.delivery_status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => openPreview(cert)} title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => sendCertificateNotification(cert)}
                            disabled={sendingNotification === cert.id}
                            title="Send Email & SMS"
                          >
                            {sendingNotification === cert.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 text-blue-600" />
                            )}
                          </Button>
                          {cert.status === 'issued' && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              setActionCertId(cert.id);
                              setRevokeConfirmOpen(true);
                            }} title="Revoke">
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                          {cert.status === 'revoked' && (
                            <Button variant="ghost" size="sm" onClick={() => {
                              setActionCertId(cert.id);
                              setRestoreConfirmOpen(true);
                            }} title="Restore">
                              <RotateCcw className="h-4 w-4 text-emerald-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Certificate Preview</DialogTitle>
              <Button onClick={downloadPdf} disabled={downloading} size="sm">
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Download PDF
              </Button>
            </DialogHeader>
            {previewCert && (
              <div className="overflow-auto">
                <div ref={certificateRef} className="inline-block">
                  <CertificateTemplate
                    template={(previewCert.template_type as TemplateType) || 'royal'}
                    data={{
                      recipientName: previewCert.intern?.profile?.full_name || 'Unknown',
                      roleTitle: previewCert.intern?.role_title || 'Intern',
                      departmentName: previewCert.intern?.department?.name || 'DIGI5 LTD',
                      startDate: formatDate(previewCert.intern?.start_date || ''),
                      endDate: previewCert.intern?.end_date ? formatDate(previewCert.intern.end_date) : 'Present',
                      certificateId: previewCert.certificate_id,
                      issuedDate: formatDate(previewCert.issued_date || ''),
                      qrCodeUrl: `${window.location.origin}/verify?id=${previewCert.certificate_id}`,
                      companyLogoUrl: siteSettings.company_logo_url,
                      signatureUrl: siteSettings.signature_url,
                    }}
                  />
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={revokeConfirmOpen} onOpenChange={setRevokeConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the certificate as revoked. Verification pages will display it as invalid, but you can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRevoke();
              }}
              disabled={acting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will restore the certificate to "issued" status, making it valid and verifiable on the public validation portal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRestore();
              }}
              disabled={acting}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {acting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CertificateManagement;
