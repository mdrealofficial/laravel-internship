import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building2, User, Award, Loader2, Clock, CheckCircle, ArrowRight, Briefcase } from 'lucide-react';

const InternDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [intern, setIntern] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch intern, profile, and department data separately
      const [internRes, profileRes, deptsRes] = await Promise.all([
        supabase.from('interns').select('*').eq('user_id', user?.id).maybeSingle(),
        supabase.from('profiles').select('user_id, full_name, email').eq('user_id', user?.id).maybeSingle(),
        supabase.from('departments').select('*'),
      ]);

      if (internRes.data) {
        const dept = deptsRes.data?.find(d => d.id === internRes.data.department_id);
        const internData = {
          ...internRes.data,
          departments: dept || null,
          profiles: profileRes.data || null,
        };
        setIntern(internData);
        
        const { data: certData } = await supabase
          .from('certificates')
          .select('*')
          .eq('intern_id', internRes.data.id)
          .maybeSingle();
        setCertificate(certData);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!intern?.start_date) return 0;
    const start = new Date(intern.start_date).getTime();
    const end = intern.end_date ? new Date(intern.end_date).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getDaysRemaining = () => {
    if (!intern?.end_date) return null;
    const end = new Date(intern.end_date).getTime();
    const now = Date.now();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { class: string; icon: any }> = {
      pending: { class: 'bg-amber-500/20 text-amber-600 dark:text-amber-400', icon: Clock },
      active: { class: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', icon: CheckCircle },
      completed: { class: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: Award },
      terminated: { class: 'bg-red-500/20 text-red-600 dark:text-red-400', icon: null },
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.class} flex items-center gap-1`}>
        {Icon && <Icon className="h-3 w-3" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const progress = calculateProgress();
  const daysRemaining = getDaysRemaining();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {intern?.profiles?.full_name?.split(' ')[0] || 'Intern'}!</h1>
              <p className="text-muted-foreground">Here's an overview of your internship journey</p>
            </div>
            {intern && getStatusBadge(intern.status)}
          </div>
        </div>

        {/* Progress Card */}
        {intern?.status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" /> Internship Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Started: {new Date(intern.start_date).toLocaleDateString()}</span>
                {daysRemaining !== null && (
                  <span className="font-medium text-primary">{daysRemaining} days remaining</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Your Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Position</span>
                <span className="font-medium">{intern?.role_title || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Supervisor</span>
                <span className="font-medium">{intern?.supervisor_name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Status</span>
                {intern && getStatusBadge(intern.status)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" /> Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Department</span>
                <span className="font-medium">{intern?.departments?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">{intern?.start_date ? new Date(intern.start_date).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{intern?.end_date ? new Date(intern.end_date).toLocaleDateString() : 'Ongoing'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Status */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" /> Certificate Status
            </CardTitle>
            <CardDescription>Your internship completion certificate</CardDescription>
          </CardHeader>
          <CardContent>
            {certificate && certificate.status === 'issued' ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">Certificate Issued!</p>
                    <p className="text-sm text-muted-foreground">ID: {certificate.certificate_id}</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/intern/certificate')} className="gap-2">
                  View Certificate <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-muted/50 text-center">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium mb-2">Certificate Not Yet Available</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {intern?.status === 'completed' 
                    ? 'Your internship is complete. Your certificate is being processed.'
                    : 'Complete your internship to receive your certificate of completion.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {intern?.description && (
          <Card>
            <CardHeader>
              <CardTitle>Internship Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{intern.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InternDashboard;
