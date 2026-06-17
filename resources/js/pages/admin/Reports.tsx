import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Download, Loader2, FileText } from 'lucide-react';
import { Department } from '@/types/database';

const Reports = () => {
  const [interns, setInterns] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [internsRes, deptsRes, profilesRes, certsRes] = await Promise.all([
        supabase.from('interns').select('*').order('created_at', { ascending: false }),
        supabase.from('departments').select('*'),
        supabase.from('profiles').select('user_id, full_name, email'),
        supabase.from('certificates').select('intern_id, certificate_id, status'),
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
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterns = interns.filter(intern => {
    if (filterDept !== 'all' && intern.department_id !== filterDept) return false;
    if (filterStatus !== 'all' && intern.status !== filterStatus) return false;
    return true;
  });

  const exportCSV = () => {
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

  const stats = {
    total: filteredInterns.length,
    active: filteredInterns.filter(i => i.status === 'active').length,
    completed: filteredInterns.filter(i => i.status === 'completed').length,
    withCert: filteredInterns.filter(i => i.certificates?.some((c: any) => c.status === 'issued')).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and export reports</p>
          </div>
          <Button onClick={exportCSV} disabled={filteredInterns.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold">{stats.total}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-digi5-success">{stats.active}</p><p className="text-sm text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-digi5-light-blue">{stats.completed}</p><p className="text-sm text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><p className="text-2xl font-bold text-primary">{stats.withCert}</p><p className="text-sm text-muted-foreground">Certified</p></CardContent></Card>
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
      </div>
    </DashboardLayout>
  );
};

export default Reports;
