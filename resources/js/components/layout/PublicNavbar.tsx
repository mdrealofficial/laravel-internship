import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import * as Icons from 'lucide-react';

// Helper component to render Lucide icons dynamically from their string names
export function LucideIcon({ name, className = 'h-4 w-4' }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// List of recommended/available icons that admins can select in the Settings panel
export const AVAILABLE_ICONS = [
  { name: 'Award', label: 'Award / Certificate' },
  { name: 'Search', label: 'Search' },
  { name: 'ShieldCheck', label: 'Verification / Shield' },
  { name: 'Briefcase', label: 'Briefcase / Jobs' },
  { name: 'Mail', label: 'Mail' },
  { name: 'LogIn', label: 'Sign In / Login' },
  { name: 'User', label: 'User' },
  { name: 'HelpCircle', label: 'Help / Question' },
  { name: 'Info', label: 'Info' },
  { name: 'FileText', label: 'Document / File' },
  { name: 'Home', label: 'Home' },
  { name: 'Globe', label: 'Website / Globe' },
];

interface MenuItem {
  id: string;
  label: string;
  url: string;
  icon: string | null;
  is_external: boolean;
  is_active: boolean;
}

export function PublicNavbar() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [companyName, setCompanyName] = useState(() => {
    return (window as any).__SITE_SETTINGS__?.companyName || 'DIGI5 LTD';
  });
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(() => {
    return (window as any).__SITE_SETTINGS__?.companyLogoUrl || null;
  });

  useEffect(() => {
    fetchSiteSettings();
    fetchMenuItems();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      
      if (data) {
        data.forEach((s) => {
          if (s.setting_key === 'company_name' && s.setting_value) {
            setCompanyName(s.setting_value);
          }
          if (s.setting_key === 'company_logo_url' && s.setting_value) {
            setCompanyLogoUrl(s.setting_value);
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data } = await supabase
        .from('nav_menu_items')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (data) setMenuItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getAssetUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `/storage/${path}`;
  };

  return (
    <header className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4 flex items-center justify-between gap-x-4">
        <Link to="/" className="flex items-center gap-3">
          {companyLogoUrl ? (
            <img
              src={getAssetUrl(companyLogoUrl)}
              alt="Company Logo"
              className="h-9 w-auto object-contain rounded"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-sm">
              D5
            </div>
          )}
          <span className="font-bold text-slate-900 text-lg tracking-wider">
            {companyName}
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2 md:gap-4 lg:gap-6">
          {menuItems.map((item) => {
            const isExternal = item.is_external;
            const linkClass = "flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition px-2.5 py-1.5 rounded-lg hover:bg-slate-50";
            
            if (isExternal) {
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  <LucideIcon name={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </a>
              );
            }
            
            return (
              <Link
                key={item.id}
                to={item.url}
                className={linkClass}
              >
                <LucideIcon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex md:hidden items-center justify-center p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
          aria-label="Toggle mobile menu"
        >
          {isMenuOpen ? (
            <Icons.X className="h-6 w-6" />
          ) : (
            <Icons.Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Expandable Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 shadow-inner animate-fade-in">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isExternal = item.is_external;
              const linkClass = "flex items-center gap-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition px-3 py-2 rounded-lg hover:bg-slate-50";

              if (isExternal) {
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LucideIcon name={item.icon} className="h-4 w-4 text-slate-500" />
                    <span>{item.label}</span>
                  </a>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.url}
                  className={linkClass}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LucideIcon name={item.icon} className="h-4 w-4 text-slate-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
