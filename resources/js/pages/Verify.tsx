import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Search, CheckCircle, XCircle, Loader2, Award, Share2, Shield, Eye, X, Zap, Download } from 'lucide-react';
import { CertificateTemplate, TemplateType } from '@/components/certificates/CertificateTemplate';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import SkillsDisplay from '@/components/verify/SkillsDisplay';
import { getAssetUrl } from '@/lib/utils';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

interface SkillAssessment {
  id: string;
  skill_name: string;
  skill_description: string | null;
  rating: number;
  notes: string | null;
}

interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  is_external: boolean;
}

const Verify = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState(searchParams.get('id') || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [siteSettings, setSiteSettings] = useState<{ 
    company_logo_url: string | null; 
    signature_url: string | null;
    certificate_pattern_enabled: boolean;
    certificate_pattern_url: string | null;
    certificate_pattern_opacity: number;
    company_name: string | null;
    certificate_download_format?: 'pdf' | 'png' | 'jpeg';
  }>(() => {
    const globalSettings = (window as any).__SITE_SETTINGS__ || {};
    return {
      company_logo_url: globalSettings.companyLogoUrl || null,
      signature_url: null,
      certificate_pattern_enabled: false,
      certificate_pattern_url: null,
      certificate_pattern_opacity: 5,
      company_name: globalSettings.companyName || 'DIGI5 LTD',
      certificate_download_format: 'pdf'
    };
  });
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  // Auto-verify when id param is present - runs on mount and when URL changes
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setCertId(idParam);
      verifyCertificate(idParam);
    }
  }, [searchParams.get('id')]);



  const fetchSiteSettings = async () => {
    const { data: settings } = await supabase.from('site_settings').select('setting_key, setting_value');
    if (settings) {
      const map: { 
        company_logo_url: string | null; 
        signature_url: string | null;
        certificate_pattern_enabled: boolean;
        certificate_pattern_url: string | null;
        certificate_pattern_opacity: number;
        company_name: string | null;
        certificate_download_format?: 'pdf' | 'png' | 'jpeg';
      } = { company_logo_url: null, signature_url: null, certificate_pattern_enabled: false, certificate_pattern_url: null, certificate_pattern_opacity: 5, company_name: 'DIGI5 LTD', certificate_download_format: 'pdf' };
      settings.forEach(s => {
        if (s.setting_key === 'company_logo_url') map.company_logo_url = s.setting_value;
        if (s.setting_key === 'signature_url') map.signature_url = s.setting_value;
        if (s.setting_key === 'certificate_pattern_enabled') map.certificate_pattern_enabled = s.setting_value === 'true';
        if (s.setting_key === 'certificate_pattern_url') map.certificate_pattern_url = s.setting_value;
        if (s.setting_key === 'certificate_pattern_opacity') map.certificate_pattern_opacity = parseInt(s.setting_value || '5', 10);
        if (s.setting_key === 'company_name') map.company_name = s.setting_value;
        if (s.setting_key === 'certificate_download_format') map.certificate_download_format = (s.setting_value as 'pdf' | 'png' | 'jpeg') || 'pdf';
      });
      setSiteSettings(map);
    }
  };

  const verifyCertificate = async (id: string) => {
    setLoading(true);
    setSearched(true);
    setShowCertificate(false);
    setSkillAssessments([]);
    try {
      const { data: cert } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_id', id)
        .maybeSingle();

      if (cert) {
        const { data: intern } = await supabase
          .from('interns')
          .select('*')
          .eq('id', cert.intern_id)
          .maybeSingle();

        if (intern) {
          const [profileRes, deptRes] = await Promise.all([
            supabase.from('profiles').select('user_id, full_name, email').eq('user_id', intern.user_id).maybeSingle(),
            supabase.from('departments').select('*').eq('id', intern.department_id).maybeSingle(),
          ]);

          // Fetch skill assessments for this intern
          const { data: assessments } = await supabase
            .from('intern_skill_assessments')
            .select('id, rating, notes, skill_id')
            .eq('intern_id', intern.id);

          if (assessments && assessments.length > 0) {
            // Fetch skill details
            const skillIds = assessments.map(a => a.skill_id);
            const { data: skills } = await supabase
              .from('department_skills')
              .select('id, skill_name, skill_description')
              .in('id', skillIds)
              .order('display_order');

            if (skills) {
              const skillsMap = new Map(skills.map(s => [s.id, s]));
              const formattedAssessments: SkillAssessment[] = assessments
                .map(a => {
                  const skill = skillsMap.get(a.skill_id);
                  if (!skill) return null;
                  return {
                    id: a.id,
                    skill_name: skill.skill_name,
                    skill_description: skill.skill_description,
                    rating: a.rating,
                    notes: a.notes,
                  };
                })
                .filter((a): a is SkillAssessment => a !== null);
              setSkillAssessments(formattedAssessments);
            }
          }

          setResult({
            ...cert,
            interns: {
              ...intern,
              profiles: profileRes.data,
              departments: deptRes.data,
            },
          });
          return;
        }
      }
      setResult(cert);
    } catch (error) {
      console.error('Error:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) verifyCertificate(certId.trim());
  };

  const shareUrl = () => {
    const url = `${window.location.origin}/verify?id=${result?.certificate_id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link Copied', description: 'Verification link copied to clipboard' });
  };

  const downloadPdf = async () => {
    if (!certificateRef.current || !result) return;
    
    setDownloading(true);
    try {
      const element = certificateRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const format = siteSettings.certificate_download_format || 'pdf';

      if (format === 'png') {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Certificate-${result.certificate_id}.png`;
        link.href = imgData;
        link.click();
        toast({ title: 'Success', description: 'Certificate downloaded as PNG image' });
      } else if (format === 'jpeg') {
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `Certificate-${result.certificate_id}.jpg`;
        link.href = imgData;
        link.click();
        toast({ title: 'Success', description: 'Certificate downloaded as JPEG image' });
      } else {
        // PDF default
        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pageWidth = 297;
        const pageHeight = pageWidth / (16/9);

        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [pageWidth, pageHeight],
          compress: true,
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        pdf.save(`Certificate-${result.certificate_id}.pdf`);
        toast({ title: 'Success', description: 'Certificate downloaded successfully as PDF' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: 'Error', description: 'Failed to download certificate', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (date?: string | null) => {
    if (!date) return 'N/A';
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const logoUrl = siteSettings.company_logo_url;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* Main Content - Left to Right Layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Panel - Search Card */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] p-6 sm:p-8 bg-gradient-to-br from-primary/5 via-background to-muted/20 rounded-2xl border border-border/50 flex flex-col shrink-0 shadow-sm animate-fade-in">
          <div className="w-full">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl mb-6">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Verify Certificate</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Enter a certificate ID to verify its authenticity
            </p>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div className="relative">
                <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Certificate ID (e.g., DIGI5-XXX-XXX)" 
                  value={certId} 
                  onChange={(e) => setCertId(e.target.value)} 
                  className="pl-12 h-12 bg-background border border-input focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={loading} size="lg" className="w-full h-11">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Verify</>}
              </Button>
            </form>

            {/* Features List */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground">Cryptographically secured & tamper-proof</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Award className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground">Official {siteSettings.company_name || 'DIGI5 LTD'} recognition</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-muted-foreground">Instant verification results</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel - Results */}
        <section className="flex-1 w-full min-h-[400px] flex items-center justify-center bg-muted/5 rounded-2xl border border-border/30 p-6 sm:p-8">
          <div className="w-full max-w-xl">
            {loading ? (
              <Card className="shadow-lg">
                <CardContent className="py-16 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Verifying certificate...</p>
                </CardContent>
              </Card>
            ) : searched && result && result.status === 'issued' ? (
              <Card className="shadow-xl overflow-hidden animate-fade-in">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center text-white">
                  <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30 mb-2">VERIFIED AUTHENTIC</Badge>
                  <h2 className="text-2xl font-bold">{result.interns?.profiles?.full_name}</h2>
                  <p className="text-emerald-100">{result.interns?.role_title}</p>
                </div>

                {/* Details */}
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Department</p>
                      <p className="font-medium text-sm">{result.interns?.departments?.name || siteSettings.company_name || 'DIGI5 LTD'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Certificate ID</p>
                      <p className="font-mono text-xs font-medium">{result.certificate_id}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Period</p>
                      <p className="font-medium text-sm">
                        {formatDate(result.interns?.start_date)} - {result.interns?.end_date ? formatDate(result.interns.end_date) : 'Present'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Issued</p>
                      <p className="font-medium text-sm">{formatDate(result.issued_date)}</p>
                    </div>
                  </div>

                  {/* Skills Display */}
                  {skillAssessments.length > 0 && (
                    <SkillsDisplay 
                      skills={skillAssessments} 
                      departmentName={result.interns?.departments?.name}
                    />
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={shareUrl}>
                      <Share2 className="h-4 w-4 mr-2" /> Share
                    </Button>
                    <Button className="flex-1" onClick={() => setShowCertificate(true)}>
                      <Eye className="h-4 w-4 mr-2" /> View Certificate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : searched ? (
              <Card className="shadow-lg animate-fade-in">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="h-12 w-12 text-red-500" />
                  </div>
                  <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 mb-4">
                    {result?.status === 'revoked' ? 'CERTIFICATE REVOKED' : 'NOT FOUND'}
                  </Badge>
                  <h2 className="text-xl font-bold mb-2">Verification Failed</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {result?.status === 'revoked' 
                      ? 'This certificate has been revoked and is no longer valid.'
                      : 'No certificate found with this ID. Please check and try again.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-muted-foreground">Enter a Certificate ID</h3>
                <p className="text-muted-foreground/70 max-w-sm mx-auto">
                  Use the search form to verify the authenticity of any DIGI5 internship certificate
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Certificate Popup Modal */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-4xl p-0 overflow-visible border-0 bg-transparent shadow-none [&>button]:hidden">
          <div className="relative">
            {/* Action Buttons - Positioned outside certificate */}
            <div className="absolute -top-14 right-0 z-50 flex items-center gap-3">
              {/* Download Button */}
              <button
                onClick={downloadPdf}
                disabled={downloading}
                className="h-10 px-4 bg-white rounded-lg shadow-lg flex items-center gap-2 hover:bg-primary/5 transition-all duration-200 group disabled:opacity-50 border border-border/50"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">Download {(siteSettings.certificate_download_format || 'pdf').toUpperCase()}</span>
              </button>
              {/* Close Button */}
              <button
                onClick={() => setShowCertificate(false)}
                className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-red-50 transition-all duration-200 group border border-border/50"
              >
                <X className="h-5 w-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
              </button>
            </div>
            
            {/* Certificate Container - Fixed aspect ratio */}
            <div 
              ref={certificateRef} 
              className="bg-white rounded-xl shadow-2xl overflow-hidden"
              style={{ aspectRatio: '16/9' }}
            >
              {result && (
                <CertificateTemplate
                  template={(result.template_type as TemplateType) || 'modern'}
                  data={{
                    recipientName: result.interns?.profiles?.full_name || 'Unknown',
                    roleTitle: result.interns?.role_title || 'Intern',
                    departmentName: result.interns?.departments?.name || siteSettings.company_name || 'DIGI5 LTD',
                    startDate: formatDate(result.interns?.start_date || ''),
                    endDate: result.interns?.end_date ? formatDate(result.interns.end_date) : 'Present',
                    certificateId: result.certificate_id,
                    issuedDate: formatDate(result.issued_date || ''),
                    qrCodeUrl: `${window.location.origin}/verify?id=${result.certificate_id}`,
                    companyLogoUrl: getAssetUrl(siteSettings.company_logo_url),
                    signatureUrl: getAssetUrl(siteSettings.signature_url),
                    patternEnabled: siteSettings.certificate_pattern_enabled,
                    patternUrl: getAssetUrl(siteSettings.certificate_pattern_url),
                    patternOpacity: siteSettings.certificate_pattern_opacity,
                    companyName: siteSettings.company_name,
                  }}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Verify;