import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ApplicationForm } from '@/types/database';
import {
  Calendar,
  Building2,
  BadgeDollarSign,
  Clock,
  ChevronRight,
  Sparkles,
  Search,
  Briefcase,
  Award,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 animate-pulse shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-100 rounded-full" />
      </div>
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-4/5" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-24 bg-slate-100 rounded-full" />
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="h-10 bg-slate-100 rounded-xl w-28" />
    </div>
  );
}

export default function Home() {
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'internship' | 'job'>('all');
  const [companyName, setCompanyName] = useState(() => {
    return (window as any).__SITE_SETTINGS__?.companyName || 'DIGI5 LTD';
  });
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(() => {
    return (window as any).__SITE_SETTINGS__?.companyLogoUrl || null;
  });

  useEffect(() => {
    fetchForms();
    fetchSiteSettings();
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

  const fetchForms = async () => {
    try {
      const { data } = await supabase
        .from('application_forms')
        .select('*, department:departments(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) setForms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return isPast(new Date(deadline));
  };

  const getAssetUrl = (path: string) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `/storage/${path}`;
  };

  // Filter based on search & tab
  const filtered = forms.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      f.title.toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      (f.department?.name || '').toLowerCase().includes(q) ||
      (f.batch_name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'job') return f.form_type === 'job';
    // Internship is form_type !== 'job' (e.g. 'internship' or null/undefined default)
    return f.form_type !== 'job';
  });

  const openPositions = filtered.filter((f) => !isDeadlinePassed(f.deadline));
  const closedPositions = filtered.filter((f) => isDeadlinePassed(f.deadline));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white border-b border-slate-100 py-16 sm:py-24">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-indigo-50/50 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-cyan-50/50 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-6">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            Explore Career Opportunities
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-none tracking-tight mb-6">
            Find Your Next{' '}
            <span className="relative inline-block bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
              Opportunity
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Join {companyName}. Explore our active internship programs and full-time career roles designed to build real-world skills and accelerate your path.
          </p>

          {/* Combined Search bar */}
          <div className="relative max-w-md mx-auto shadow-sm rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles, departments, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
            />
          </div>
        </div>
      </section>

      {/* Main Content: Tabs and Grid */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-12">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 pb-6 mb-8 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial text-center px-5 py-2 text-sm font-semibold rounded-lg transition duration-200 ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Roles ({forms.length})
            </button>
            <button
              onClick={() => setActiveTab('internship')}
              className={`flex-1 sm:flex-initial text-center px-5 py-2 text-sm font-semibold rounded-lg transition duration-200 ${
                activeTab === 'internship'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Internships ({forms.filter(f => f.form_type !== 'job').length})
            </button>
            <button
              onClick={() => setActiveTab('job')}
              className={`flex-1 sm:flex-initial text-center px-5 py-2 text-sm font-semibold rounded-lg transition duration-200 ${
                activeTab === 'job'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Careers ({forms.filter(f => f.form_type === 'job').length})
            </button>
          </div>
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Showing {filtered.length} positions
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm max-w-xl mx-auto">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100">
              <Briefcase className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold text-base mb-1">
              No matching positions found
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Try adjusting your keyword filter or switching tabs.
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-sm font-semibold text-indigo-600 hover:underline"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Active Open Positions */}
            {openPositions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                    Open Applications
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {openPositions.map((form) => {
                    const isJob = form.form_type === 'job';
                    const targetLink = isJob ? `/apply/job/${form.slug}` : `/apply/${form.slug}`;
                    
                    return (
                      <div
                        key={form.id}
                        className="group relative rounded-2xl border border-slate-100 bg-white p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-200 transition duration-300 overflow-hidden"
                      >
                        {/* Upper info */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${
                              isJob 
                                ? 'bg-indigo-50 text-indigo-700' 
                                : 'bg-cyan-50 text-cyan-700'
                            }`}>
                              {isJob ? 'Career Role' : 'Internship'}
                            </span>
                            {form.department?.name && (
                              <span className="text-xs text-slate-400 font-medium">
                                {form.department.name}
                              </span>
                            )}
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition">
                            {form.title}
                          </h3>
                          
                          <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                            {form.description || 'No description provided. Click apply to read full requirements.'}
                          </p>
                        </div>

                        {/* Lower Specs */}
                        <div className="border-t border-slate-50 pt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <BadgeDollarSign className="h-4 w-4 text-slate-400" />
                              <span>
                                {isJob 
                                  ? (form.salary_range || 'Competitive')
                                  : (form.is_paid ? `${form.stipend_amount || 'Paid'}` : 'Unpaid')}
                              </span>
                            </div>
                            {form.deadline && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span>
                                  Until {format(new Date(form.deadline), 'MMM dd')}
                                </span>
                              </div>
                            )}
                          </div>

                          <Link
                            to={targetLink}
                            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 group-hover:bg-indigo-600 group-hover:text-white transition duration-300"
                          >
                            Apply Now
                            <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Closed Positions */}
            {closedPositions.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-400 uppercase tracking-wider">
                    Recently Closed (Deadlines Passed)
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                  {closedPositions.map((form) => (
                    <div
                      key={form.id}
                      className="rounded-2xl border border-slate-100 bg-white p-6 flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 uppercase">
                            Closed
                          </span>
                          {form.department?.name && (
                            <span className="text-xs text-slate-400 font-medium">
                              {form.department.name}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">
                          {form.title}
                        </h3>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-6">
                          {form.description}
                        </p>
                      </div>
                      <div className="border-t border-slate-50 pt-4 flex justify-between items-center text-xs text-slate-400">
                        <span>Deadline was: {form.deadline ? format(new Date(form.deadline), 'PP') : 'N/A'}</span>
                        <span className="font-semibold text-slate-300">Closed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 text-center text-xs text-slate-500 border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/verify" className="hover:underline hover:text-slate-700 transition">Verify</Link>
            <Link to="/status" className="hover:underline hover:text-slate-700 transition">Status Check</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
