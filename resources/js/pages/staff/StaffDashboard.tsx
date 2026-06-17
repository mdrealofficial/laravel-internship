import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Department, Intern, Profile } from '@/types/database';
import { Loader2, Building2, Users, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StaffStats {
  departments: Department[];
  internCount: number;
  assessmentCount: number;
}

const StaffDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StaffStats>({ departments: [], internCount: 0, assessmentCount: 0 });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch staff assignments
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select(`
          department_id,
          department:departments(*)
        `)
        .eq('user_id', user!.id);

      const departments = (assignments || [])
        .map(a => {
          const dept = a.department;
          return Array.isArray(dept) ? dept[0] : dept;
        })
        .filter(Boolean) as Department[];

      const departmentIds = departments.map(d => d.id);

      // Count interns in assigned departments
      let internCount = 0;
      if (departmentIds.length > 0) {
        const { count } = await supabase
          .from('interns')
          .select('*', { count: 'exact', head: true })
          .in('department_id', departmentIds);
        internCount = count || 0;
      }

      // Count assessments made by this staff
      const { count: assessmentCount } = await supabase
        .from('intern_skill_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('assessed_by', user!.id);

      setStats({
        departments,
        internCount,
        assessmentCount: assessmentCount || 0,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Welcome, {profile?.full_name || 'Staff Member'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage intern assessments for your assigned departments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned Departments
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Interns to Assess
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.internCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assessments Made
              </CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assessmentCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Departments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.departments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No departments assigned yet. Contact an admin.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    <h3 className="font-semibold">{dept.name}</h3>
                    {dept.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {dept.description}
                      </p>
                    )}
                    {dept.head_name && (
                      <Badge variant="outline" className="mt-2">
                        Head: {dept.head_name}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link to="/staff/assessments">
                <Button>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Start Assessments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
