import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Award, Clock, TrendingUp, UserCheck, Plus, FileText } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardStats {
  totalInterns: number;
  activeInterns: number;
  completedInterns: number;
  pendingInterns: number;
  totalDepartments: number;
  issuedCertificates: number;
  pendingCertificates: number;
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
  });
  const [recentInterns, setRecentInterns] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  const CHART_COLORS = ['hsl(142, 76%, 36%)', 'hsl(217, 91%, 60%)', 'hsl(45, 93%, 47%)', 'hsl(0, 84%, 60%)'];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data separately to avoid FK issues
      const [internsRes, deptsRes, certsRes, profilesRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
        supabase.from('certificates').select('status'),
        supabase.from('profiles').select('user_id, full_name, email'),
      ]);

      const interns = internsRes.data || [];
      const departments = deptsRes.data || [];
      const certificates = certsRes.data || [];
      const profiles = profilesRes.data || [];

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

      setStats({
        totalInterns,
        activeInterns,
        completedInterns,
        pendingInterns,
        totalDepartments: departments.length,
        issuedCertificates,
        pendingCertificates,
      });
      setRecentInterns(recentInterns);
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

  const statCards = [
    { title: 'Total Interns', value: stats.totalInterns, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Active', value: stats.activeInterns, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Completed', value: stats.completedInterns, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-500/10' },
    { title: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    { title: 'Certificates Issued', value: stats.issuedCertificates, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
    { title: 'Pending Certificates', value: stats.pendingCertificates, icon: Clock, color: 'text-red-600', bg: 'bg-red-500/10' },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
      active: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      completed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
      terminated: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your internship program</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/interns')}>
              <Plus className="mr-2 h-4 w-4" /> Add Intern
            </Button>
            <Button onClick={() => navigate('/admin/reports')}>
              <FileText className="mr-2 h-4 w-4" /> View Reports
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                      <Icon size={24} />
                    </div>
                    <p className="text-2xl font-bold">{loading ? '...' : stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Intern Status Distribution</CardTitle>
              <CardDescription>Current status breakdown</CardDescription>
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
                      outerRadius={100}
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
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No intern data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Interns by Department</CardTitle>
              <CardDescription>Distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              {departmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={departmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No department data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Interns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Interns</CardTitle>
              <CardDescription>Latest additions to the internship program</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/interns')}>
              View All →
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : recentInterns.length === 0 ? (
              <p className="text-muted-foreground">No interns yet. Add your first intern to get started.</p>
            ) : (
              <div className="space-y-3">
                {recentInterns.map((intern) => (
                  <div key={intern.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-medium">
                          {intern.profiles?.full_name?.charAt(0) || 'I'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{intern.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{intern.role_title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground hidden md:block">
                        {intern.departments?.name || 'No Department'}
                      </span>
                      {getStatusBadge(intern.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
