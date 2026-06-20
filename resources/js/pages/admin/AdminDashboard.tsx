import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Building2, 
  Award, 
  Clock, 
  TrendingUp, 
  UserCheck, 
  Plus, 
  FileText, 
  BarChart3, 
  Mail, 
  MessageSquare, 
  Briefcase, 
  UserPlus, 
  Star,
  ClipboardCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStats {
  totalInterns: number;
  activeInterns: number;
  completedInterns: number;
  pendingInterns: number;
  totalDepartments: number;
  issuedCertificates: number;
  pendingCertificates: number;
  totalJobs: number;
  totalJobApps: number;
  shortlistedJobApps: number;
  hiredJobApps: number;
  totalAssessments: number;
  avgAssessmentRating: number;
}

interface DepartmentData {
  name: string;
  count: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalInterns: 0,
    activeInterns: 0,
    completedInterns: 0,
    pendingInterns: 0,
    totalDepartments: 0,
    issuedCertificates: 0,
    pendingCertificates: 0,
    totalJobs: 0,
    totalJobApps: 0,
    shortlistedJobApps: 0,
    hiredJobApps: 0,
    totalAssessments: 0,
    avgAssessmentRating: 0,
  });
  const [recentInterns, setRecentInterns] = useState<any[]>([]);
  const [recentJobApplications, setRecentJobApplications] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [jobStatusData, setJobStatusData] = useState<any[]>([]);
  const [campaignStats, setCampaignStats] = useState({
    totalCampaigns: 0,
    totalEmails: 0,
    emailOpenRate: 0,
    emailClickRate: 0,
    totalSMS: 0,
    smsDeliveryRate: 0,
  });
  const [campaignChartData, setCampaignChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const CHART_COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)'];
  const JOB_COLORS = ['hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(280, 76%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data separately to avoid FK issues
      const [internsRes, deptsRes, certsRes, profilesRes, logsRes, appsRes, formsRes, assessmentsRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
        supabase.from('certificates').select('status'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('notification_logs').select('campaign_name, notification_type, status, opened, clicked'),
        supabase.from('applications').select('*, form:application_forms(*)').order('created_at', { ascending: false }),
        supabase.from('application_forms').select('*'),
        supabase.from('intern_skill_assessments').select('rating'),
      ]);

      const interns = internsRes.data || [];
      const departments = deptsRes.data || [];
      const certificates = certsRes.data || [];
      const profiles = profilesRes.data || [];
      const applications = appsRes.data || [];
      const forms = formsRes.data || [];
      const assessments = assessmentsRes.data || [];

      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      const deptsMap = new Map(departments.map(d => [d.id, d]));

      const totalInterns = interns.length;
      const activeInterns = interns.filter(i => i.status === 'active').length;
      const completedInterns = interns.filter(i => i.status === 'completed').length;
      const pendingInterns = interns.filter(i => i.status === 'pending').length;

      // Calculate department distribution
      const deptCounts: Record<string, number> = {};
      interns.forEach(i => {
        const dept = deptsMap.get(i.department_id);
        const deptName = dept?.name || 'Unassigned';
        deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
      });
      setDepartmentData(Object.entries(deptCounts).map(([name, count]) => ({ name, count })));

      const issuedCertificates = certificates.filter(c => c.status === 'issued').length;
      const pendingCertificates = certificates.filter(c => c.status === 'pending').length;

      // Map recent interns with profiles and departments
      const recentInterns = interns.slice(0, 5).map(intern => ({
        ...intern,
        profiles: profilesMap.get(intern.user_id) || null,
        departments: deptsMap.get(intern.department_id) || null,
      }));

      // Calculate Job Recruitment stats
      const jobForms = forms.filter(f => f.form_type === 'job');
      const jobApplications = applications.filter(a => a.form_type === 'job');
      
      const totalJobs = jobForms.length;
      const totalJobApps = jobApplications.length;
      const shortlistedJobApps = jobApplications.filter(a => a.status === 'shortlisted').length;
      const hiredJobApps = jobApplications.filter(a => a.status === 'approved').length;

      // Job Status chart data
      const jobStatusCounts: Record<string, number> = {};
      jobApplications.forEach(a => {
        const statusLabel = a.status.charAt(0).toUpperCase() + a.status.slice(1);
        jobStatusCounts[statusLabel] = (jobStatusCounts[statusLabel] || 0) + 1;
      });
      const JOB_STATUS_COLORS = {
        'Submitted': 'hsl(217, 91%, 60%)',
        'Reviewing': 'hsl(45, 93%, 47%)',
        'Shortlisted': 'hsl(280, 76%, 50%)',
        'Approved': 'hsl(142, 76%, 36%)',
        'Rejected': 'hsl(0, 84%, 60%)'
      } as any;
      setJobStatusData(Object.entries(jobStatusCounts).map(([name, value]) => ({ 
        name, 
        value,
        color: JOB_STATUS_COLORS[name] || 'hsl(215, 16%, 47%)'
      })));

      // Map recent job applications
      const recentJobApps = jobApplications.slice(0, 5);
      setRecentJobApplications(recentJobApps);

      // Calculate Assessment / Evaluation stats
      const totalAssessments = assessments.length;
      const sumRatings = assessments.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      const avgAssessmentRating = totalAssessments > 0 ? Math.round(sumRatings / totalAssessments) : 0;

      setStats({
        totalInterns,
        activeInterns,
        completedInterns,
        pendingInterns,
        totalDepartments: departments.length,
        issuedCertificates,
        pendingCertificates,
        totalJobs,
        totalJobApps,
        shortlistedJobApps,
        hiredJobApps,
        totalAssessments,
        avgAssessmentRating,
      });
      setRecentInterns(recentInterns);

      // Process logs stats
      const logs = logsRes.data || [];
      const uniqueCampaigns = new Set(logs.map(l => l.campaign_name).filter(Boolean));
      const totalCampaigns = uniqueCampaigns.size;

      const emailLogs = logs.filter(l => l.notification_type === 'email');
      const smsLogs = logs.filter(l => l.notification_type === 'sms');

      const totalEmails = emailLogs.length;
      const sentEmails = emailLogs.filter(l => l.status !== 'failed' && l.status !== 'scheduled').length;
      const openedEmails = emailLogs.filter(l => l.opened || l.status === 'opened' || l.status === 'clicked').length;
      const clickedEmails = emailLogs.filter(l => l.clicked || l.status === 'clicked').length;

      const totalSMS = smsLogs.length;
      const sentSMS = smsLogs.filter(l => l.status !== 'failed' && l.status !== 'scheduled').length;

      const emailOpenRate = totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0;
      const emailClickRate = totalEmails > 0 ? Math.round((clickedEmails / totalEmails) * 100) : 0;
      const smsDeliveryRate = totalSMS > 0 ? Math.round((sentSMS / totalSMS) * 100) : 0;

      setCampaignStats({
        totalCampaigns,
        totalEmails,
        emailOpenRate,
        emailClickRate,
        totalSMS: totalSMS,
        smsDeliveryRate,
      });

      const campaignMetrics: Record<string, { name: string; sent: number; opened: number; clicked: number }> = {};
      logs.forEach(l => {
        if (!l.campaign_name) return;
        if (!campaignMetrics[l.campaign_name]) {
          campaignMetrics[l.campaign_name] = { name: l.campaign_name, sent: 0, opened: 0, clicked: 0 };
        }
        const m = campaignMetrics[l.campaign_name];
        m.sent += 1;
        if (l.opened || l.status === 'opened' || l.status === 'clicked') m.opened += 1;
        if (l.clicked || l.status === 'clicked') m.clicked += 1;
      });

      const chartData = Object.values(campaignMetrics).slice(-5);
      setCampaignChartData(chartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusChartData = [
    { name: 'Active', value: stats.activeInterns, color: CHART_COLORS[0] },
    { name: 'Completed', value: stats.completedInterns, color: CHART_COLORS[1] },
    { name: 'Pending', value: stats.pendingInterns, color: CHART_COLORS[2] },
  ].filter(d => d.value > 0);

  const internStatCards = [
    { title: 'Total Interns', value: stats.totalInterns, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active Interns', value: stats.activeInterns, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Completed Interns', value: stats.completedInterns, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Total Departments', value: stats.totalDepartments, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { title: 'Total Evaluations', value: stats.totalAssessments, icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
    { title: 'Avg Eval Rating', value: stats.avgAssessmentRating > 0 ? `${stats.avgAssessmentRating}%` : '0%', icon: Award, color: 'text-rose-600', bg: 'bg-rose-500/10' },
  ];

  const recruitmentStatCards = [
    { title: 'Active Jobs', value: stats.totalJobs, icon: Briefcase, color: 'text-slate-800 dark:text-slate-200', bg: 'bg-slate-200/50 dark:bg-slate-800' },
    { title: 'Total Job Apps', value: stats.totalJobApps, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Shortlisted Apps', value: stats.shortlistedJobApps, icon: Star, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { title: 'Hired Candidates', value: stats.hiredJobApps, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-none',
      active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none',
      completed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-none',
      terminated: 'bg-red-500/20 text-red-600 dark:text-red-400 border-none',
      // Job application statuses
      submitted: 'bg-blue-500/10 text-blue-500 border-none',
      reviewing: 'bg-amber-500/10 text-amber-500 border-none',
      shortlisted: 'bg-purple-500/10 text-purple-500 border-none',
      approved: 'bg-emerald-500/10 text-emerald-500 border-none',
      rejected: 'bg-rose-500/10 text-rose-500 border-none',
    };
    return <Badge className={`${variants[status] || ''} capitalize`}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your internship program and recruitment pipeline</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-200" onClick={() => navigate('/admin/job-forms')}>
              <Plus className="mr-2 h-4 w-4" /> Add Job Opening
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/admin/interns')}>
              <Plus className="mr-2 h-4 w-4" /> Add Intern
            </Button>
          </div>
        </div>

        {/* SECTION 1: Internship Program */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Internship Program</h2>
          </div>
          
          {/* Interns Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {internStatCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="hover:shadow-md transition-shadow border-slate-150">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center">
                      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                        <Icon size={22} className="shrink-0" />
                      </div>
                      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.title}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Interns Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Intern Status Distribution</CardTitle>
                <CardDescription>Current status breakdown of interns</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground italic text-sm">
                    No active/completed/pending intern records found
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Interns by Department</CardTitle>
                <CardDescription>Headcount distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(215, 16%, 92%)" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} name="Interns" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground italic text-sm">
                    No department assignment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 2: Recruitment & Hiring Pipeline */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Recruitment & Hiring Pipeline</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left side: Stats grid */}
            <div className="md:col-span-1 grid grid-cols-2 gap-4">
              {recruitmentStatCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow border-slate-150 flex flex-col justify-center">
                    <CardContent className="pt-6 pb-6 px-4">
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                          <Icon size={20} className="shrink-0" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.title}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Right side: Application status chart */}
            <Card className="md:col-span-2 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Job Application Statuses</CardTitle>
                <CardDescription>Funnel breakdown of candidates applying for job roles</CardDescription>
              </CardHeader>
              <CardContent>
                {jobStatusData.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                    <div className="sm:col-span-2">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={jobStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {jobStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || JOB_COLORS[index % JOB_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="sm:col-span-1 space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Legend</p>
                      {jobStatusData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="font-medium">{entry.name}:</span>
                          <span className="font-bold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground italic text-sm">
                    No job applications submitted yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 3: Campaign & Outbound Communications */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Campaign & Message Analytics</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 mb-3">
                    <BarChart3 size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : campaignStats.totalCampaigns}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Total Campaigns</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 mb-3">
                    <Mail size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : campaignStats.totalEmails}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Emails Sent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 mb-3">
                    <TrendingUp size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : `${campaignStats.emailOpenRate}%`}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Email Open Rate</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 mb-3">
                    <TrendingUp size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : `${campaignStats.emailClickRate}%`}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Email Click Rate</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 mb-3">
                    <MessageSquare size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : campaignStats.totalSMS}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">SMS Sent</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-slate-150">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-600 mb-3">
                    <UserCheck size={22} className="shrink-0" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '...' : `${campaignStats.smsDeliveryRate}%`}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">SMS Success Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Chart Card */}
          {campaignChartData.length > 0 ? (
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Recent Campaigns Performance</CardTitle>
                <CardDescription>Performance metric breakdown for recent broadcasts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(215, 16%, 92%)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sent" name="Total Sent" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opened" name="Opened" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicked" name="Clicked" fill="hsl(280, 76%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-200 p-6 flex items-center justify-center text-muted-foreground italic text-sm">
              No named broadcast campaigns sent yet. Send a broadcast to view performance charts.
            </Card>
          )}
        </div>

        {/* SECTION 4: Split lists - Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Recent Interns */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Interns</CardTitle>
                <CardDescription>Latest additions to the internship program</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/interns')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm italic">Loading...</p>
              ) : recentInterns.length === 0 ? (
                <p className="text-muted-foreground text-sm italic py-4">No interns found in database.</p>
              ) : (
                <div className="space-y-3">
                  {recentInterns.map((intern) => (
                    <div key={intern.id} className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/55 dark:hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm">
                          {intern.profiles?.full_name?.charAt(0) || 'I'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{intern.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{intern.role_title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-slate-400 hidden sm:block">
                          {intern.departments?.name || 'No Dept'}
                        </span>
                        {getStatusBadge(intern.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Job Applications */}
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Job Applications</CardTitle>
                <CardDescription>Latest candidates applying for open jobs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/job-applications')}>
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm italic">Loading...</p>
              ) : recentJobApplications.length === 0 ? (
                <p className="text-muted-foreground text-sm italic py-4">No job applications submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentJobApplications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/55 dark:hover:bg-slate-800/80 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-sm">
                          {app.applicant_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{app.applicant_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{app.form?.title || 'Job Position'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <span className="text-xs text-slate-400 hidden sm:block">
                          Score: {app.skill_score !== null ? `${app.skill_score}` : 'N/A'}
                        </span>
                        {getStatusBadge(app.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
