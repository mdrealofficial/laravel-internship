import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, FileText } from 'lucide-react';
import { Department } from '@/types/database';
import { format } from 'date-fns';

export default function Reports() {
  const [interns, setInterns] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Intern Filters
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Job Filters & States
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [jobForms, setJobForms] = useState<any[]>([]);
  const [filterJobForm, setFilterJobForm] = useState<string>('all');
  const [filterJobStatus, setFilterJobStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsRes, deptsRes, profilesRes, certsRes, jobAppsRes, jobFormsRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('certificates').select('intern_id, certificate_id, status'),
        supabase.from('applications').select('*, form:application_forms(*), department:departments(*)').eq('form_type', 'job').order('created_at', { ascending: false }),
        supabase.from('application_forms').select('*').eq('form_type', 'job').order('title'),
      ]);

      const profiles = profilesRes.data || [];
      const departments = deptsRes.data || [];
      const certificates = certsRes.data || [];
      
      const profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      const deptsMap = new Map(departments.map(d => [d.id, d]));
      const certsMap = new Map(certificates.map(c => [c.intern_id, c]));

      const mappedInterns = (internsRes.data || []).map(intern => ({
        ...intern,
        profiles: profilesMap.get(intern.user_id) || null,
        departments: deptsMap.get(intern.department_id) || null,
        certificates: certsMap.get(intern.id) ? [certsMap.get(intern.id)] : [],
      }));

      setInterns(mappedInterns);
      setDepartments(departments);
      setJobApplications(jobAppsRes.data || []);
      setJobForms(jobFormsRes.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterns = interns.filter(intern => {
    if (filterDept !== 'all' && intern.department_id !== filterDept) return false;
    if (filterStatus !== 'all' && intern.status !== filterStatus) return false;
    return true;
  });

  const filteredJobApplications = jobApplications.filter(app => {
    if (filterJobForm !== 'all' && app.form_id !== filterJobForm) return false;
    if (filterJobStatus !== 'all' && app.status !== filterJobStatus) return false;
    return true;
  });

  const exportInternCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Start Date', 'End Date', 'Certificate'];
    const rows = filteredInterns.map(i => [
      i.profiles?.full_name || '',
      i.profiles?.email || '',
      i.role_title,
      i.departments?.name || '',
      i.status,
      i.start_date,
      i.end_date || '',
      i.certificates?.[0]?.certificate_id || '',
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interns-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportJobCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Department', 'Status', 'Skill Score', 'Applied Date'];
    const rows = filteredJobApplications.map(j => [
      j.applicant_name,
      j.applicant_email,
      j.applicant_phone || '',
      j.form?.title || '',
      j.department?.name || j.form?.department?.name || '',
      j.status,
      j.skill_score !== null && j.skill_score !== undefined ? String(j.skill_score) : '',
      format(new Date(j.created_at), 'yyyy-MM-dd'),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-applicants-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const internStats = {
    total: filteredInterns.length,
    active: filteredInterns.filter(i => i.status === 'active').length,
    completed: filteredInterns.filter(i => i.status === 'completed').length,
    withCert: filteredInterns.filter(i => i.certificates?.some((c: any) => c.status === 'issued')).length,
  };

  const jobStats = {
    total: filteredJobApplications.length,
    submitted: filteredJobApplications.filter(j => j.status === 'submitted').length,
    reviewing: filteredJobApplications.filter(j => j.status === 'reviewing').length,
    shortlisted: filteredJobApplications.filter(j => j.status === 'shortlisted').length,
    approved: filteredJobApplications.filter(j => j.status === 'approved').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground font-medium mt-1">Generate metrics and export reports for candidates and team members.</p>
        </div>

        <Tabs defaultValue="interns" className="space-y-6">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="interns">Interns Report</TabsTrigger>
            <TabsTrigger value="jobs">Job Hirings Report</TabsTrigger>
          </TabsList>

          <TabsContent value="interns" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-48">
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={exportInternCSV} disabled={filteredInterns.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{internStats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-emerald-600">{internStats.active}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-sky-500">{internStats.completed}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-primary">{internStats.withCert}</p><p className="text-sm text-muted-foreground">Certified</p></CardContent></Card>
            </div>

            {/* Data Table */}
            <Card>
              <CardHeader><CardTitle>Intern Data</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredInterns.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No data matches your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Certificate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInterns.map((intern) => (
                          <TableRow key={intern.id}>
                            <TableCell>{intern.profiles?.full_name}</TableCell>
                            <TableCell>{intern.role_title}</TableCell>
                            <TableCell>{intern.departments?.name || '-'}</TableCell>
                            <TableCell className="capitalize">{intern.status}</TableCell>
                            <TableCell>
                              {intern.start_date} - {intern.end_date || 'Present'}
                            </TableCell>
                            <TableCell>
                              {intern.certificates?.find((c: any) => c.status === 'issued')?.certificate_id || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-52">
                  <Select value={filterJobForm} onValueChange={setFilterJobForm}>
                    <SelectTrigger><SelectValue placeholder="Position" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {jobForms.map(form => (
                        <SelectItem key={form.id} value={form.id}>{form.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-48">
                  <Select value={filterJobStatus} onValueChange={setFilterJobStatus}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={exportJobCSV} disabled={filteredJobApplications.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{jobStats.total}</p><p className="text-sm text-muted-foreground">Total Applicants</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-sky-600">{jobStats.submitted}</p><p className="text-sm text-muted-foreground">Submitted</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-amber-500">{jobStats.reviewing}</p><p className="text-sm text-muted-foreground">Under Review</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-purple-600">{jobStats.shortlisted}</p><p className="text-sm text-muted-foreground">Shortlisted</p></CardContent></Card>
              <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-emerald-600">{jobStats.approved}</p><p className="text-sm text-muted-foreground">Approved</p></CardContent></Card>
            </div>

            {/* Job Applicants Table */}
            <Card>
              <CardHeader><CardTitle>Job Applicant Details</CardTitle></CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredJobApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No job applicants match your filters</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Job Position</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Skill Score</TableHead>
                          <TableHead>Applied Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobApplications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">{app.applicant_name}</TableCell>
                            <TableCell>{app.applicant_email}</TableCell>
                            <TableCell>{app.form?.title || '-'}</TableCell>
                            <TableCell>{app.department?.name || app.form?.department?.name || '-'}</TableCell>
                            <TableCell className="capitalize">{app.status}</TableCell>
                            <TableCell>{app.skill_score !== null && app.skill_score !== undefined ? `${app.skill_score}/100` : '-'}</TableCell>
                            <TableCell>{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
