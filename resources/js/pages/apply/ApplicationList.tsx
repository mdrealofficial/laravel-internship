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
  Gift,
  Briefcase,
  BookOpen,
} from 'lucide-react';
import { format, isPast, formatDistanceToNow } from 'date-fns';

/* ─── Skeleton Loader ──────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4 animate-pulse shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="h-10 w-10 rounded-xl bg-gray-100" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
        <div className="h-6 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-4 bg-gray-100 rounded w-full" />
      <div className="h-4 bg-gray-100 rounded w-4/5" />
      <div className="flex gap-2 mt-2">
        <div className="h-5 w-24 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      <div className="h-10 bg-gray-100 rounded-xl w-28" />
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function ApplicationList() {
  const [forms, setForms] = useState<ApplicationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [companyName, setCompanyName] = useState('DIGI5 LTD');

  useEffect(() => {
    fetchForms();
    fetchCompanyName();
  }, []);

  const fetchCompanyName = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'company_name')
        .maybeSingle();
      if (data?.setting_value) {
        setCompanyName(data.setting_value);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchForms = async () => {
    const { data } = await supabase
      .from('application_forms')
      .select('*, department:departments(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) setForms(data);
    setLoading(false);
  };

  const isDeadlinePassed = (deadline: string | null) => {
    if (!deadline) return false;
    return isPast(new Date(deadline));
  };

  const filtered = forms.filter((f) => {
    const q = search.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q) ||
      (f.department?.name || '').toLowerCase().includes(q) ||
      (f.batch_name || '').toLowerCase().includes(q)
    );
  });

  const open = filtered.filter((f) => !isDeadlinePassed(f.deadline));
  const closed = filtered.filter((f) => isDeadlinePassed(f.deadline));

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-100 shadow-sm">
        {/* Faint grid overlay on hero only */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Gradient fade from top */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Now Hiring — Join Our Team
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
            Internship{' '}
            <span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Opportunities
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-500 max-w-xl mx-auto mb-10">
            Explore our open positions and take the first step toward a rewarding
            professional journey with us.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by role, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 outline-none shadow-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>
        </div>
      </section>

      {/* ── Cards Section ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* ── Empty State ─────────────────────────────────────────────── */
          <div className="rounded-2xl border border-gray-100 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
              <Briefcase className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium text-sm">
              {search
                ? 'No positions match your search.'
                : 'No open positions right now. Check back soon!'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-indigo-500 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-12">
            {/* Open Positions */}
            {open.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Open Positions
                  </h2>
                  <span className="rounded-full bg-green-50 border border-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-600">
                    {open.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {open.map((form) => (
                    <InternshipCard key={form.id} form={form} closed={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Closed Positions */}
            {closed.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  <h2 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                    Closed
                  </h2>
                  <span className="rounded-full bg-gray-50 border border-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-400">
                    {closed.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 opacity-60">
                  {closed.map((form) => (
                    <InternshipCard key={form.id} form={form} closed={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </footer>
    </div>
  );
}

/* ─── Internship Card ────────────────────────────────────────────────────────
   Grid-friendly card: fills a 2-col grid cell on lg screens,
   single-col on mobile. Internal layout is fully responsive.
──────────────────────────────────────────────────────────────────────────── */
function InternshipCard({
  form,
  closed,
}: {
  form: ApplicationForm;
  closed: boolean;
}) {
  const facilities: string[] = form.facilities || [];
  const hasFacilities = facilities.length > 0;
  const isPaid = form.is_paid ?? false;

  const deadlineText = form.deadline
    ? closed
      ? `Closed ${formatDistanceToNow(new Date(form.deadline), { addSuffix: true })}`
      : `Closes ${formatDistanceToNow(new Date(form.deadline), { addSuffix: true })}`
    : null;

  const deadlineFormatted = form.deadline
    ? format(new Date(form.deadline), 'MMM d, yyyy')
    : null;

  return (
    <article
      className={`group relative rounded-2xl border bg-white flex flex-col overflow-hidden transition-all duration-300 ${
        closed
          ? 'border-gray-100 shadow-sm cursor-default'
          : 'border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-200 hover:-translate-y-0.5'
      }`}
    >
      {/* Top accent stripe */}
      {!closed && (
        <div
          className="h-1 w-full"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)',
          }}
        />
      )}
      {closed && <div className="h-1 w-full bg-gray-100" />}

      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-4">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          {/* Icon + title */}
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 rounded-xl p-2.5 mt-0.5 ${
                closed
                  ? 'bg-gray-50 text-gray-300'
                  : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors'
              }`}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3
                className={`font-bold text-base leading-snug ${
                  closed ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {form.title}
              </h3>
              {form.batch_name && (
                <p className="text-xs text-gray-400 mt-0.5">{form.batch_name}</p>
              )}
            </div>
          </div>

          {/* Status pill */}
          {closed ? (
            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
              Closed
            </span>
          ) : (
            <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-2.5 py-1 text-xs font-semibold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Open
            </span>
          )}
        </div>

        {/* ── Description ─────────────────────────────────────────────── */}
        {form.description && (
          <p
            className={`text-sm leading-relaxed line-clamp-2 ${
              closed ? 'text-gray-300' : 'text-gray-500'
            }`}
          >
            {form.description}
          </p>
        )}

        {/* ── Meta chips ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Paid / Unpaid */}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${
              isPaid
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : 'bg-gray-50 text-gray-400 border-gray-100'
            }`}
          >
            <BadgeDollarSign className="h-3 w-3" />
            {isPaid
              ? form.stipend_amount
                ? `BDT ${Number(form.stipend_amount).toLocaleString()}/mo`
                : 'Paid'
              : 'Unpaid'}
          </span>

          {/* Department */}
          {form.department && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-gray-500">
              <Building2 className="h-3 w-3" />
              {form.department.name}
            </span>
          )}
          {form.is_multi_department && !form.department && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-gray-500">
              <Building2 className="h-3 w-3" />
              Multi-Dept
            </span>
          )}

          {/* Deadline */}
          {deadlineFormatted && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border ${
                closed
                  ? 'bg-gray-50 text-gray-300 border-gray-100'
                  : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}
              title={deadlineFormatted}
            >
              <Clock className="h-3 w-3" />
              {deadlineText || deadlineFormatted}
            </span>
          )}
          {!form.deadline && !closed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              No deadline
            </span>
          )}
        </div>

        {/* ── Facilities ──────────────────────────────────────────────── */}
        {hasFacilities && !closed && (
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-gray-400 mb-2">
              <Gift className="h-3.5 w-3.5" />
              Perks & Benefits
            </p>
            <div className="flex flex-wrap gap-1.5">
              {facilities.slice(0, 4).map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs text-indigo-600 font-medium"
                >
                  {f}
                </span>
              ))}
              {facilities.length > 4 && (
                <span className="rounded-full bg-gray-50 border border-gray-100 px-2.5 py-0.5 text-xs text-gray-400">
                  +{facilities.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── CTA (pushed to bottom) ───────────────────────────────────── */}
        <div className="mt-auto pt-2">
          {closed ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed select-none">
              Application Closed
            </span>
          ) : (
            <Link
              to={`/apply/${form.slug}`}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:gap-3 hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
            >
              Apply Now
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
