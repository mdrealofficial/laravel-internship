import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export interface CertificateData {
  recipientName: string;
  roleTitle: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  certificateId: string;
  issuedDate: string;
  qrCodeUrl: string;
  companyLogoUrl?: string | null;
  signatureUrl?: string | null;
  patternUrl?: string | null;
  patternEnabled?: boolean;
  patternOpacity?: number;
  companyName?: string | null;
}

export type TemplateType = 'modern' | 'minimal' | 'minimalist';

export const templateOptions = [
  { id: 'modern' as TemplateType, name: 'Modern Tech', description: 'Contemporary dark theme' },
  { id: 'minimal' as TemplateType, name: 'Minimal Clean', description: 'Simple and professional' },
  { id: 'minimalist' as TemplateType, name: 'Minimalist Sleek', description: 'Modern, asymmetrical layout with clean lines' },
];

interface Props {
  data: CertificateData;
  template: TemplateType;
}

export function CertificateTemplate({ data, template }: Props) {
  if (template === 'minimal') return <MinimalCert data={data} />;
  if (template === 'minimalist') return <MinimalistSleekCert data={data} />;
  return <ModernCert data={data} />;
}

function CompanyLogo({ url, className, fallbackText = 'D5', fallbackClass }: { url?: string | null; className?: string; fallbackText?: string; fallbackClass?: string }) {
  if (url) {
    return (
      <img 
        src={url} 
        className={className} 
        style={{ 
          objectFit: 'contain', 
          width: '100%',
          height: '100%',
          display: 'block'
        }} 
        alt="Company Logo"
      />
    );
  }
  return <span className={fallbackClass}>{fallbackText}</span>;
}

function SignatureImage({ url }: { url?: string | null }) {
  if (url) {
    return (
      <img 
        src={url}
        alt="Signature"
        style={{ 
          height: '2rem',
          width: 'auto',
          maxWidth: '7rem',
          objectFit: 'contain',
          display: 'inline-block'
        }} 
      />
    );
  }
  return null;
}

function ModernCert({ data }: { data: CertificateData }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }} className="relative w-[960px] h-[540px] bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-600/20" />
      <div className="absolute top-0 right-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)' }} />
      <div className="relative h-full flex flex-col items-center justify-center px-20 py-8">
        <div style={{ display: 'flex', alignItems: 'center' }} className="gap-4 mb-4">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl overflow-hidden flex-shrink-0">
            <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-base" />
          </div>
          <div className="h-8 w-[1px] bg-white/20" />
          <span className="text-white font-semibold tracking-widest text-2xl">{data.companyName || 'DIGI5 LTD'}</span>
        </div>
        <h1 className="text-4xl font-extralight text-white tracking-[0.2em] mb-1">CERTIFICATE</h1>
        <p className="text-blue-400 tracking-[0.5em] text-xs mb-6">OF EXCELLENCE</p>
        <p className="text-white/60 text-sm tracking-wide mb-2">PRESENTED TO</p>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 mb-3">{data.recipientName}</h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-blue-500/50" />
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-blue-500/50" />
        </div>
        <p className="text-white/70 text-center max-w-lg leading-relaxed text-sm">
          For completing the internship as <span className="text-blue-400 font-medium">{data.roleTitle}</span> in <span className="text-purple-400 font-medium">{data.departmentName}</span>
        </p>
        <p className="text-white/50 text-xs mt-2">{data.startDate} — {data.endDate}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }} className="w-full mt-auto pt-6">
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{data.issuedDate}</div>
            <div className="w-24 h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent" />
            <p className="text-white/30 text-[10px] mt-1">Issue Date</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <QRCodeCanvas value={data.qrCodeUrl} size={48} level="M" fgColor="#60a5fa" bgColor="transparent" />
            </div>
            <p className="text-blue-400/60 text-[9px] mt-1 font-mono tracking-wider">{data.certificateId}</p>
          </div>
          <div className="text-center">
            <SignatureImage url={data.signatureUrl} />
            <div className="w-24 h-[1px] bg-gradient-to-l from-purple-500/50 to-transparent" />
            <p className="text-white/30 text-[10px] mt-1">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalCert({ data }: { data: CertificateData }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }} className="relative w-[960px] h-[540px] bg-white overflow-hidden">
      {/* Optional Background Pattern */}
      {data.patternEnabled && data.patternUrl && (
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `url(${data.patternUrl})`,
            backgroundSize: '200px',
            backgroundRepeat: 'repeat',
            opacity: (data.patternOpacity || 5) / 100
          }} 
        />
      )}
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
      <div className="h-full flex flex-col items-center justify-center px-24 py-10">
        <div style={{ display: 'flex', alignItems: 'center' }} className="gap-4 mb-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="w-14 h-14 bg-slate-900 rounded overflow-hidden flex-shrink-0">
            <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-base" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="font-bold text-slate-900 text-3xl leading-tight tracking-wider">{data.companyName || 'DIGI5 LTD'}</p>
            <p className="text-slate-500 text-sm leading-none tracking-widest mt-2">INTERNSHIP PROGRAM</p>
          </div>
        </div>
        <h1 className="text-5xl font-extralight text-slate-900 tracking-widest mb-6">CERTIFICATE</h1>
        <p className="text-slate-500 text-sm tracking-wider mb-3">AWARDED TO</p>
        <h2 className="text-3xl font-semibold text-slate-900 mb-4 text-center border-b-2 border-slate-900 pb-2">{data.recipientName}</h2>
        <p className="text-slate-600 text-center max-w-xl leading-relaxed text-sm">
          For completing the internship as <span className="font-medium">{data.roleTitle}</span> in the <span className="font-medium">{data.departmentName}</span> department.
        </p>
        <p className="text-slate-400 text-sm mt-2">{data.startDate} — {data.endDate}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }} className="w-full mt-auto pt-6">
          <div className="text-left">
            <p className="text-slate-900 text-sm font-medium">{data.issuedDate}</p>
            <p className="text-slate-400 text-xs">Date of Issue</p>
          </div>
          <div className="flex flex-col items-center">
            <QRCodeCanvas value={data.qrCodeUrl} size={44} level="M" fgColor="#0f172a" bgColor="transparent" />
            <p className="text-slate-400 text-[8px] mt-1 font-mono">{data.certificateId}</p>
          </div>
          <div className="text-right">
            <SignatureImage url={data.signatureUrl} />
            <div className="w-28 border-b border-slate-900 mb-1" />
            <p className="text-slate-400 text-xs">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalistSleekCert({ data }: { data: CertificateData }) {
  return (
    <div style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif", boxSizing: 'border-box' }} className="relative w-[960px] h-[540px] bg-white overflow-hidden border border-slate-200">
      {/* Optional Background Pattern */}
      {data.patternEnabled && data.patternUrl && (
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `url(${data.patternUrl})`,
            backgroundSize: '200px',
            backgroundRepeat: 'repeat',
            opacity: (data.patternOpacity || 5) / 100
          }} 
        />
      )}
      
      {/* Grid container with 2 columns: left (620px), right (340px) */}
      <div style={{ display: 'flex', flexDirection: 'row', position: 'relative', width: '960px', height: '100%', boxSizing: 'border-box' }}>
        {/* Left Column: Core content */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          backgroundColor: '#ffffff',
          width: '620px',
          height: '100%',
          padding: '48px 32px 48px 48px',
          boxSizing: 'border-box',
          textAlign: 'left'
        }}>
          {/* Company info */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ margin: 0, padding: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a', letterSpacing: '0.05em', lineHeight: '1.1' }}>
              {data.companyName || 'DIGI5 LTD'}
            </h3>
            <p style={{ margin: 0, padding: 0, marginTop: '4px', fontSize: '11px', color: '#64748b', letterSpacing: '0.1em', lineHeight: '1', textTransform: 'uppercase' }}>
              Internship Program
            </p>
          </div>

          {/* Certificate Title & Recipient Details */}
          <div style={{ margin: 'auto 0', padding: '24px 0' }}>
            <h1 style={{ 
              margin: 0, 
              padding: 0, 
              fontSize: '22px', 
              fontWeight: 300, 
              color: '#0f172a', 
              letterSpacing: '0.18em', 
              textTransform: 'uppercase',
              lineHeight: '1.2'
            }}>
              Certificate of Completion
            </h1>
            <div style={{ width: '64px', height: '2px', backgroundColor: '#0f172a', marginTop: '12px', marginBottom: '24px' }} />
            
            <p style={{ margin: 0, padding: 0, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>
              This is to certify that
            </p>
            <h2 style={{ margin: 0, padding: 0, fontSize: '28px', fontWeight: 600, color: '#0f172a', letterSpacing: '0.02em', marginBottom: '16px' }}>
              {data.recipientName}
            </h2>
            
            <p style={{ margin: 0, padding: 0, fontSize: '13px', color: '#475569', lineHeight: '1.6', maxWidth: '520px' }}>
              has successfully fulfilled all requirements and completed the official internship program as a <span style={{ fontWeight: 600, color: '#0f172a' }}>{data.roleTitle}</span> within the <span style={{ fontWeight: 600, color: '#0f172a' }}>{data.departmentName}</span> department.
            </p>
          </div>

          {/* Internship Timeline */}
          <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
            <div>
              <span style={{ display: 'block', color: '#cbd5e1', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px', marginBottom: '2px' }}>Start Date</span>
              <span style={{ color: '#334155', fontWeight: 500, fontSize: '12px' }}>{data.startDate}</span>
            </div>
            <div style={{ height: '24px', width: '0px', borderLeft: '1px solid #e2e8f0', marginLeft: '24px', marginRight: '24px' }} />
            <div>
              <span style={{ display: 'block', color: '#cbd5e1', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '9px', marginBottom: '2px' }}>End Date</span>
              <span style={{ color: '#334155', fontWeight: 500, fontSize: '12px' }}>{data.endDate}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Verification & Signature */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          backgroundColor: '#f8fafc',
          width: '340px',
          height: '100%',
          borderLeft: '1px solid #f1f5f9',
          padding: '48px',
          boxSizing: 'border-box',
          textAlign: 'left'
        }}>
          {/* Top: QR verification */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ margin: 0, padding: 0, color: '#94a3b8', fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Verify Authenticity</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '88px', height: '88px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '16px' }}>
              <QRCodeCanvas value={data.qrCodeUrl} size={64} level="M" fgColor="#0f172a" bgColor="transparent" />
            </div>
            <div style={{ marginTop: '16px' }}>
              <p style={{ margin: 0, padding: 0, fontSize: '10px', color: '#64748b', fontWeight: 500, lineHeight: '1.2' }}>Certificate ID</p>
              <p style={{ margin: 0, padding: 0, fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px', lineHeight: '1.2' }}>{data.certificateId}</p>
            </div>
          </div>

          {/* Bottom: Signature & Date */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div>
              <SignatureImage url={data.signatureUrl} />
              <div style={{ width: '100%', borderBottom: '1px solid #cbd5e1', marginTop: '8px', marginBottom: '6px' }} />
              <p style={{ margin: 0, padding: 0, fontSize: '10px', color: '#64748b', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Authorized Signature</p>
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <p style={{ margin: 0, padding: 0, color: '#1e293b', fontSize: '14px', fontWeight: 600, lineHeight: '1.2' }}>{data.issuedDate}</p>
              <p style={{ margin: 0, padding: 0, fontSize: '10px', color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '4px', lineHeight: '1.2' }}>Date of Issue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
