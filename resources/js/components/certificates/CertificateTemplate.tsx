import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

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

export type TemplateType = 'royal' | 'modern' | 'elegant' | 'gradient' | 'minimal';

export const templateOptions = [
  { id: 'royal' as TemplateType, name: 'Royal Gold', description: 'Classic and prestigious' },
  { id: 'modern' as TemplateType, name: 'Modern Tech', description: 'Contemporary dark theme' },
  { id: 'elegant' as TemplateType, name: 'Elegant Cream', description: 'Sophisticated design' },
  { id: 'gradient' as TemplateType, name: 'Gradient Wave', description: 'Bold and dynamic' },
  { id: 'minimal' as TemplateType, name: 'Minimal Clean', description: 'Simple and professional' },
];

interface Props {
  data: CertificateData;
  template: TemplateType;
}

export function CertificateTemplate({ data, template }: Props) {
  if (template === 'royal') return <RoyalCert data={data} />;
  if (template === 'elegant') return <ElegantCert data={data} />;
  if (template === 'gradient') return <GradientCert data={data} />;
  if (template === 'minimal') return <MinimalCert data={data} />;
  return <ModernCert data={data} />;
}

function CompanyLogo({ url, className, fallbackText = 'D5', fallbackClass }: { url?: string | null; className?: string; fallbackText?: string; fallbackClass?: string }) {
  if (url) {
    return (
      <div 
        className={className} 
        style={{ 
          backgroundImage: `url(${url})`, 
          backgroundSize: 'contain', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: '100%'
        }} 
        aria-label="Company Logo"
      />
    );
  }
  return <span className={fallbackClass}>{fallbackText}</span>;
}

function SignatureImage({ url }: { url?: string | null }) {
  if (url) {
    return (
      <div 
        style={{ 
          backgroundImage: `url(${url})`, 
          backgroundSize: 'contain', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat',
          height: '2rem',
          width: '7rem',
          display: 'inline-block'
        }} 
      />
    );
  }
  return null;
}

function RoyalCert({ data }: { data: CertificateData }) {
  return (
    <div className="relative w-[960px] h-[540px] bg-gradient-to-br from-amber-50 via-white to-amber-50 p-2">
      <div className="absolute inset-0 border-[12px] border-double border-amber-600/30" />
      <div className="absolute inset-3 border-2 border-amber-500/40" />
      <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-amber-600/50 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-amber-600/50 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-amber-600/50 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-amber-600/50 rounded-br-lg" />
      <div className="relative h-full flex flex-col items-center justify-center px-16 py-6">
        <div style={{ display: 'flex', alignItems: 'center' }} className="gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-lg" />
          </div>
          <span className="font-serif text-2xl font-bold text-amber-800 tracking-wide">{data.companyName || 'DIGI5 LTD'}</span>
        </div>
        <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-3" />
        <h1 className="font-serif text-3xl font-bold text-amber-900 tracking-widest mb-1">CERTIFICATE</h1>
        <p className="text-amber-700 tracking-[0.3em] text-xs mb-4">OF COMPLETION</p>
        <p className="text-amber-700 text-base mb-1">This is to certify that</p>
        <h2 className="font-serif text-3xl font-bold text-amber-900 mb-2 text-center">{data.recipientName}</h2>
        <div className="w-72 h-[1px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mb-3" />
        <p className="text-amber-700 text-center max-w-2xl mb-3 leading-relaxed text-sm">
          has successfully completed the internship program as <span className="font-semibold text-amber-900">{data.roleTitle}</span> in the <span className="font-semibold text-amber-900">{data.departmentName}</span> department from {data.startDate} to {data.endDate}
        </p>
        <div className="flex items-end justify-between w-full mt-auto pt-4">
          <div className="text-center">
            <div className="w-28 border-t-2 border-amber-600/50 mb-1" />
            <p className="text-xs text-amber-700">Date: {data.issuedDate}</p>
          </div>
          <div className="flex flex-col items-center">
            <QRCodeSVG value={data.qrCodeUrl} size={50} level="M" fgColor="#92400e" bgColor="transparent" />
            <p className="text-[9px] text-amber-600 mt-1 font-mono">{data.certificateId}</p>
          </div>
          <div className="text-center">
            <SignatureImage url={data.signatureUrl} />
            <div className="w-28 border-t-2 border-amber-600/50 mb-1" />
            <p className="text-xs text-amber-700">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernCert({ data }: { data: CertificateData }) {
  return (
    <div className="relative w-[960px] h-[540px] bg-slate-950 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-600/20" />
      <div className="absolute top-0 right-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80" style={{ background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0) 70%)' }} />
      <div className="relative h-full flex flex-col items-center justify-center px-20 py-8">
        <div style={{ display: 'flex', alignItems: 'center' }} className="gap-4 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-sm" />
          </div>
          <div className="h-6 w-[1px] bg-white/20" />
          <span className="text-white/80 font-light tracking-widest text-sm">{data.companyName || 'DIGI5 LTD'}</span>
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
        <div className="flex items-end justify-between w-full mt-auto pt-6">
          <div className="text-center">
            <div className="text-white/40 text-xs mb-1">{data.issuedDate}</div>
            <div className="w-24 h-[1px] bg-gradient-to-r from-blue-500/50 to-transparent" />
            <p className="text-white/30 text-[10px] mt-1">Issue Date</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <QRCodeSVG value={data.qrCodeUrl} size={48} level="M" fgColor="#60a5fa" bgColor="transparent" />
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

function ElegantCert({ data }: { data: CertificateData }) {
  return (
    <div className="relative w-[960px] h-[540px] bg-gradient-to-b from-stone-100 to-stone-200">
      <div className="absolute inset-5 border border-stone-400/30" />
      <div className="absolute inset-7 border border-stone-400/20" />
      <div className="relative h-full flex flex-col items-center justify-center px-20 py-8">
        <div style={{ display: 'flex', alignItems: 'center' }} className="gap-6 mb-3">
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-stone-500 to-transparent" />
          <div className="w-9 h-9 border border-stone-400 rotate-45 flex items-center justify-center overflow-hidden flex-shrink-0">
            {data.companyLogoUrl ? (
              <div 
                className="w-6 h-6 -rotate-45"
                style={{ 
                  backgroundImage: `url(${data.companyLogoUrl})`, 
                  backgroundSize: 'contain', 
                  backgroundPosition: 'center', 
                  backgroundRepeat: 'no-repeat',
                }}
              />
            ) : (
              <div className="w-5 h-5 bg-stone-700 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold -rotate-45">D5</span>
              </div>
            )}
          </div>
          <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-stone-500 to-transparent" />
        </div>
        <p className="text-stone-500 tracking-[0.4em] text-xs mb-1">{data.companyName || 'DIGI5 LTD'}</p>
        <h1 className="font-serif text-4xl text-stone-800 tracking-wide mb-1">Certificate</h1>
        <p className="text-stone-500 italic text-sm mb-5">of Internship Completion</p>
        <p className="text-stone-600 text-sm mb-2 tracking-wide">This certifies that</p>
        <h2 className="font-serif text-3xl text-stone-900 mb-2">{data.recipientName}</h2>
        <div className="w-36 h-[1px] bg-stone-400 mb-4" />
        <p className="text-stone-600 text-center max-w-xl leading-relaxed text-sm">
          has demonstrated dedication as <span className="font-semibold text-stone-800">{data.roleTitle}</span> in the <span className="font-semibold text-stone-800">{data.departmentName}</span> department, from {data.startDate} to {data.endDate}.
        </p>
        <div className="flex items-end justify-between w-full mt-auto pt-4">
          <div className="text-center">
            <p className="text-stone-600 text-xs mb-2 italic">{data.issuedDate}</p>
            <div className="w-28 border-t border-stone-400" />
            <p className="text-stone-500 text-[10px] mt-1 tracking-wide">DATE</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 bg-white/50 rounded border border-stone-300">
              <QRCodeSVG value={data.qrCodeUrl} size={46} level="M" fgColor="#57534e" bgColor="transparent" />
            </div>
            <p className="text-stone-500 text-[8px] mt-1 font-mono">{data.certificateId}</p>
          </div>
          <div className="text-center">
            <SignatureImage url={data.signatureUrl} />
            <div className="w-28 border-t border-stone-400" />
            <p className="text-stone-500 text-[10px] mt-1 tracking-wide">SIGNATURE</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradientCert({ data }: { data: CertificateData }) {
  return (
    <div className="relative w-[960px] h-[540px] bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-40">
        <svg viewBox="0 0 960 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path fill="url(#grad1)" d="M0,0 L960,0 L960,100 Q720,150 480,115 Q240,80 0,130 Z" opacity="0.9" />
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-20 rotate-180">
        <svg viewBox="0 0 960 80" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="grad2" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <path fill="url(#grad2)" d="M0,0 L960,0 L960,50 Q720,80 480,55 Q240,30 0,70 Z" opacity="0.7" />
        </svg>
      </div>
      <div className="relative h-full flex flex-col items-center justify-center px-20 py-8 z-10">
        <div className="absolute top-5 left-0 right-0 flex justify-center">
          <div style={{ display: 'flex', alignItems: 'center' }} className="gap-3">
            <div className="w-9 h-9 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-sm" />
            </div>
            <span className="text-white font-medium tracking-wider text-sm">{data.companyName || 'DIGI5 LTD'}</span>
          </div>
        </div>
        <div className="mt-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 tracking-tight text-center">CERTIFICATE</h1>
          <p className="text-center text-gray-500 tracking-[0.3em] text-xs mt-1">OF ACHIEVEMENT</p>
        </div>
        <p className="text-gray-600 text-sm mb-1 mt-4">Proudly presented to</p>
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">{data.recipientName}</h2>
        <p className="text-gray-600 text-center max-w-lg leading-relaxed text-sm">
          For outstanding performance as <span className="font-semibold text-purple-600">{data.roleTitle}</span> in <span className="font-semibold text-blue-600">{data.departmentName}</span>
        </p>
        <p className="text-gray-400 text-xs mt-2">{data.startDate} → {data.endDate}</p>
        <div className="flex items-end justify-between w-full mt-auto">
          <div className="text-center">
            <p className="text-gray-600 text-xs mb-1">{data.issuedDate}</p>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
            <p className="text-gray-400 text-[10px] mt-1">Issue Date</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
              <QRCodeSVG value={data.qrCodeUrl} size={50} level="M" fgColor="#7c3aed" bgColor="transparent" />
            </div>
            <p className="text-purple-500 text-[8px] mt-1 font-mono">{data.certificateId}</p>
          </div>
          <div className="text-center">
            <SignatureImage url={data.signatureUrl} />
            <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
            <p className="text-gray-400 text-[10px] mt-1">Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MinimalCert({ data }: { data: CertificateData }) {
  return (
    <div className="relative w-[960px] h-[540px] bg-white overflow-hidden">
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
          <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
            <CompanyLogo url={data.companyLogoUrl} className="w-full h-full" fallbackText="D5" fallbackClass="text-white font-bold text-sm" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <p className="font-bold text-slate-900 text-lg leading-tight tracking-wider">{data.companyName || 'DIGI5 LTD'}</p>
            <p className="text-slate-500 text-xs leading-none tracking-widest mt-1">INTERNSHIP PROGRAM</p>
          </div>
        </div>
        <h1 className="text-5xl font-extralight text-slate-900 tracking-widest mb-6">CERTIFICATE</h1>
        <p className="text-slate-500 text-sm tracking-wider mb-3">AWARDED TO</p>
        <h2 className="text-3xl font-semibold text-slate-900 mb-4 text-center border-b-2 border-slate-900 pb-2">{data.recipientName}</h2>
        <p className="text-slate-600 text-center max-w-xl leading-relaxed text-sm">
          For completing the internship as <span className="font-medium">{data.roleTitle}</span> in the <span className="font-medium">{data.departmentName}</span> department.
        </p>
        <p className="text-slate-400 text-sm mt-2">{data.startDate} — {data.endDate}</p>
        <div className="flex items-end justify-between w-full mt-auto pt-6">
          <div className="text-left">
            <p className="text-slate-900 text-sm font-medium">{data.issuedDate}</p>
            <p className="text-slate-400 text-xs">Date of Issue</p>
          </div>
          <div className="flex flex-col items-center">
            <QRCodeSVG value={data.qrCodeUrl} size={44} level="M" fgColor="#0f172a" bgColor="transparent" />
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
