import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Users } from 'lucide-react';
import { Department, DepartmentSkill } from '@/types/database';

interface InternWithProfile {
  id: string;
  user_id: string;
  department_id: string | null;
  profile?: { full_name: string | null; email: string } | null;
}

interface BulkSkillAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const BulkSkillAssessmentModal: React.FC<BulkSkillAssessmentModalProps> = ({
  open,
  onOpenChange,
  onSaved,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<DepartmentSkill[]>([]);
  const [interns, setInterns] = useState<InternWithProfile[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchSkillsAndInterns();
    } else {
      setSkills([]);
      setInterns([]);
      setSelectedSkill('');
      setRatings({});
    }
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedSkill && interns.length > 0) {
      fetchExistingRatings();
    }
  }, [selectedSkill, interns]);

  const fetchDepartments = async () => {
    const { data } = await supabase.from('departments').select('*').order('name');
    if (data) setDepartments(data);
  };

  const fetchSkillsAndInterns = async () => {
    setLoading(true);
    try {
      const [skillsRes, internsRes, profilesRes] = await Promise.all([
        supabase
          .from('department_skills')
          .select('*')
          .eq('department_id', selectedDepartment)
          .order('display_order'),
        supabase
          .from('interns')
          .select('id, user_id, department_id')
          .eq('department_id', selectedDepartment)
          .in('status', ['active', 'completed']),
        supabase.from('profiles').select('user_id, full_name, email'),
      ]);

      if (skillsRes.data) setSkills(skillsRes.data);
      
      if (internsRes.data && profilesRes.data) {
        const profilesMap = new Map(profilesRes.data.map(p => [p.user_id, p]));
        setInterns(
          internsRes.data.map(i => ({
            ...i,
            profile: profilesMap.get(i.user_id) || null,
          }))
        );
      }
      setSelectedSkill('');
      setRatings({});
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingRatings = async () => {
    const internIds = interns.map(i => i.id);
    const { data } = await supabase
      .from('intern_skill_assessments')
      .select('intern_id, rating')
      .eq('skill_id', selectedSkill)
      .in('intern_id', internIds);

    if (data) {
      const existingRatings: Record<string, number> = {};
      data.forEach(a => {
        existingRatings[a.intern_id] = a.rating || 0;
      });
      // Initialize all interns with 0 if no rating exists
      const allRatings: Record<string, number> = {};
      interns.forEach(i => {
        allRatings[i.id] = existingRatings[i.id] ?? 0;
      });
      setRatings(allRatings);
    }
  };

  const handleRatingChange = (internId: string, value: number[]) => {
    setRatings(prev => ({ ...prev, [internId]: value[0] }));
  };

  const handleSave = async () => {
    if (!selectedSkill) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const upserts = Object.entries(ratings).map(([internId, rating]) => ({
        intern_id: internId,
        skill_id: selectedSkill,
        rating,
        assessed_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('intern_skill_assessments')
        .upsert(upserts, { onConflict: 'intern_id,skill_id' });

      if (error) throw error;

      toast({ title: 'Success', description: `Assessed ${upserts.length} interns` });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedSkillName = skills.find(s => s.id === selectedSkill)?.skill_name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Skill Assessment
          </DialogTitle>
          <DialogDescription>
            Rate multiple interns at once for the same skill
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Department Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Skill</Label>
              <Select 
                value={selectedSkill} 
                onValueChange={setSelectedSkill}
                disabled={!selectedDepartment || skills.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={skills.length === 0 ? 'No skills available' : 'Select skill'} />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.skill_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Interns List */}
          {!loading && selectedSkill && interns.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Rating: {selectedSkillName}
                </Label>
                <span className="text-sm text-muted-foreground">
                  {interns.length} intern{interns.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {interns.map(intern => (
                  <div 
                    key={intern.id} 
                    className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">{intern.profile?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">{intern.profile?.email}</p>
                      </div>
                      <span className="text-lg font-bold text-primary min-w-[60px] text-right">
                        {ratings[intern.id] ?? 0}%
                      </span>
                    </div>
                    <Slider
                      value={[ratings[intern.id] ?? 0]}
                      onValueChange={(v) => handleRatingChange(intern.id, v)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save All Assessments
              </Button>
            </div>
          )}

          {/* Empty States */}
          {!loading && selectedDepartment && interns.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No active interns in this department
            </p>
          )}

          {!loading && selectedSkill && !interns.length && skills.length > 0 && (
            <p className="text-center text-muted-foreground py-8">
              Select a skill to begin rating
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkSkillAssessmentModal;
