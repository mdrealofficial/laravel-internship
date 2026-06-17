import React, { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Award, Download, Loader2, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CertificateTemplate, TemplateType } from '@/components/certificates/CertificateTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SiteSettings {
  company_logo_url: string | null;
  signature_url: string | null;
}

const InternCertificate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ company_logo_url: null, signature_url: null });
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [internRes, profileRes, deptsRes, settingsRes] = await Promise.all([
        supabase.from('interns').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('profiles').select('user_id, full_name, email').eq('user_id', user?.id).maybeSingle(),
        supabase.from('departments').select('*'),
        supabase.from('site_settings').select('setting_key, setting_value'),
      ]);

      // Map site settings
      const settings = settingsRes.data || [];
      const settingsMap: SiteSettings = { company_logo_url: null, signature_url: null };
      settings.forEach(s => {
        if (s.setting_key === 'company_logo_url') settingsMap.company_logo_url = s.setting_value;
        if (s.setting_key === 'signature_url') settingsMap.signature_url = s.setting_value;
      });
      setSiteSettings(settingsMap);

      if (internRes.data) {
        const dept = deptsRes.data?.find(d => d.id === internRes.data.department_id);
        const intern = {
          ...internRes.data,
          departments: dept || null,
          profiles: profileRes.data || null,
        };

        const { data: cert } = await supabase.from('certificates').select('*').eq('intern_id', intern.id).eq('status', 'issued').maybeSingle();
        if (cert) setData({ intern, certificate: cert });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerifyUrl = () => `${window.location.origin}/verify?id=${data?.certificate?.certificate_id}`;

  const copyVerifyLink = () => {
    navigator.clipboard.writeText(getVerifyUrl());
    setCopied(true);
    toast({ title: 'Copied!', description: 'Verification link copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPdf = async () => {
    if (!certificateRef.current || !data) return;
    
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

      const sanitizedName = (data.intern.profiles?.full_name || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Certificate_${sanitizedName}_${data.certificate.certificate_id}.pdf`);
      
      toast({ title: 'Success', description: 'Certificate downloaded as PDF' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to download certificate', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return <DashboardLayout><div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Award className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Certificate Yet</h2>
          <p className="text-muted-foreground">Complete your internship to receive your certificate.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Certificate</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyVerifyLink}>
              {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button onClick={downloadPdf} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Download PDF
            </Button>
          </div>
        </div>

        <Card className="overflow-auto">
          <CardContent className="pt-6">
            <div ref={certificateRef} className="inline-block">
              <CertificateTemplate
                template={(data.certificate.template_type as TemplateType) || 'royal'}
                data={{
                  recipientName: data.intern.profiles?.full_name || 'Unknown',
                  roleTitle: data.intern.role_title || 'Intern',
                  departmentName: data.intern.departments?.name || 'DIGI5 LTD',
                  startDate: formatDate(data.intern.start_date || ''),
                  endDate: data.intern.end_date ? formatDate(data.intern.end_date) : 'Present',
                  certificateId: data.certificate.certificate_id,
                  issuedDate: formatDate(data.certificate.issued_date || ''),
                  qrCodeUrl: getVerifyUrl(),
                  companyLogoUrl: siteSettings.company_logo_url,
                  signatureUrl: siteSettings.signature_url,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Certificate ID: <span className="font-mono">{data.certificate.certificate_id}</span>
        </p>
      </div>
    </DashboardLayout>
  );
};

export default InternCertificate;
