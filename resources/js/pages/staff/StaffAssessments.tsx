import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Department, Intern, Profile } from '@/types/database';
import SkillAssessmentModal from '@/components/admin/SkillAssessmentModal';
import { Loader2, ClipboardCheck, Users, Filter } from 'lucide-react';
import { format } from 'date-fns';

const StaffAssessments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [interns, setInterns] = useState<(Intern & { profile?: Profile })[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);

  useEffect(() => {
    if (user) {
      fetchDepartments();
    }
  }, [user]);

  useEffect(() => {
    if (departments.length > 0) {
      fetchInterns();
    }
  }, [departments, selectedDept]);

  const fetchDepartments = async () => {
    try {
      // Fetch staff's assigned departments
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select(`
          department_id,
          department:departments(*)
        `)
        .eq('user_id', user!.id);

      const depts = (assignments || [])
        .map(a => {
          const dept = a.department;
          return Array.isArray(dept) ? dept[0] : dept;
        })
        .filter(Boolean) as Department[];

      setDepartments(depts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const departmentIds = selectedDept === 'all' 
        ? departments.map(d => d.id)
        : [selectedDept];

      if (departmentIds.length === 0) {
        setInterns([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('interns')
        .select(`
          *,
          department:departments(*),
          profile:profiles!interns_user_id_fkey(*)
        `)
        .in('department_id', departmentIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map data to include profile
      const internsWithProfile = (data || []).map(intern => ({
        ...intern,
        profile: Array.isArray(intern.profile) ? intern.profile[0] : intern.profile,
        department: intern.department as Department,
      }));

      setInterns(internsWithProfile);
    } catch (error) {
      console.error('Error fetching interns:', error);
      toast({ title: 'Error', description: 'Failed to load interns', variant: 'destructive' });
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'terminated': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Intern Assessments</h1>
            <p className="text-muted-foreground mt-1">
              Assess interns in your assigned departments
            </p>
          </div>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Interns Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Interns ({interns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : departments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No departments assigned</p>
                <p className="text-sm">Contact an admin to assign you to departments</p>
              </div>
            ) : interns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No interns found</p>
                <p className="text-sm">No interns in your assigned departments</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interns.map((intern) => (
                    <TableRow key={intern.id}>
                      <TableCell className="font-medium">
                        {intern.profile?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>{intern.role_title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {intern.department?.name || 'Unassigned'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(intern.status || 'pending')}>
                          {intern.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(intern.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedIntern(intern);
                            setAssessmentModalOpen(true);
                          }}
                        >
                          <ClipboardCheck className="h-4 w-4 mr-1" />
                          Assess
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assessment Modal */}
      {selectedIntern && (
        <SkillAssessmentModal
          open={assessmentModalOpen}
          onOpenChange={setAssessmentModalOpen}
          intern={selectedIntern}
          onSaved={fetchInterns}
        />
      )}
    </DashboardLayout>
  );
};

export default StaffAssessments;
