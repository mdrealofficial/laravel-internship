import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Star, User, Briefcase } from 'lucide-react';
import { DepartmentSkill, Intern, InternSkillAssessment } from '@/types/database';

interface SkillAssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intern: Intern | null;
  onSaved: () => void;
}

const SkillAssessmentModal: React.FC<SkillAssessmentModalProps> = ({ open, onOpenChange, intern, onSaved }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<DepartmentSkill[]>([]);
  const [assessments, setAssessments] = useState<Record<string, { rating: number; notes: string }>>({});

  useEffect(() => {
    if (open && intern?.department_id) {
      fetchSkillsAndAssessments();
    }
  }, [open, intern]);

  const fetchSkillsAndAssessments = async () => {
    if (!intern?.department_id) return;
    setLoading(true);

    try {
      // Fetch skills for the department
      const { data: skillsData, error: skillsError } = await supabase
        .from('department_skills')
        .select('*')
        .eq('department_id', intern.department_id)
        .order('display_order');

      if (skillsError) throw skillsError;
      setSkills(skillsData || []);

      // Fetch existing assessments for this intern
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('intern_skill_assessments')
        .select('*')
        .eq('intern_id', intern.id);

      if (assessmentsError) throw assessmentsError;

      // Build assessments map
      const assessmentsMap: Record<string, { rating: number; notes: string }> = {};
      (skillsData || []).forEach(skill => {
        const existing = assessmentsData?.find(a => a.skill_id === skill.id);
        assessmentsMap[skill.id] = {
          rating: existing?.rating || 0,
          notes: existing?.notes || '',
        };
      });
      setAssessments(assessmentsMap);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!intern) return;
    setSaving(true);

    try {
      // Upsert all assessments
      const upsertData = Object.entries(assessments).map(([skillId, data]) => ({
        intern_id: intern.id,
        skill_id: skillId,
        rating: data.rating,
        notes: data.notes || null,
      }));

      for (const assessment of upsertData) {
        const { error } = await supabase
          .from('intern_skill_assessments')
          .upsert(assessment, { onConflict: 'intern_id,skill_id' });
        
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Skill assessments saved successfully' });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateAssessment = (skillId: string, field: 'rating' | 'notes', value: number | string) => {
    setAssessments(prev => ({
      ...prev,
      [skillId]: { ...prev[skillId], [field]: value },
    }));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'bg-emerald-500';
    if (rating >= 60) return 'bg-blue-500';
    if (rating >= 40) return 'bg-amber-500';
    if (rating >= 20) return 'bg-orange-500';
    return 'bg-muted';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 90) return 'Exceptional';
    if (rating >= 80) return 'Excellent';
    if (rating >= 70) return 'Very Good';
    if (rating >= 60) return 'Good';
    if (rating >= 50) return 'Satisfactory';
    if (rating >= 40) return 'Fair';
    if (rating >= 20) return 'Needs Improvement';
    if (rating > 0) return 'Beginner';
    return 'Not Assessed';
  };

  if (!intern) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Skill Assessment
          </DialogTitle>
          <DialogDescription>
            Assess skills for this intern (0-100%)
          </DialogDescription>
        </DialogHeader>

        {/* Intern Info Header */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{intern.profile?.full_name || 'Unknown'}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-3 w-3" />
              {intern.role_title}
            </p>
          </div>
          <Badge variant="outline">{intern.department?.name || 'No Department'}</Badge>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !intern.department_id ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>This intern is not assigned to a department.</p>
            <p className="text-sm mt-2">Please assign a department first to assess skills.</p>
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No skills defined for this department.</p>
            <p className="text-sm mt-2">Add skills to the department first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {skills.map((skill) => {
              const assessment = assessments[skill.id] || { rating: 0, notes: '' };
              return (
                <div key={skill.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{skill.skill_name}</h4>
                      {skill.skill_description && (
                        <p className="text-sm text-muted-foreground">{skill.skill_description}</p>
                      )}
                    </div>
                    <Badge className={`${getRatingColor(assessment.rating)} text-white`}>
                      {assessment.rating}% - {getRatingLabel(assessment.rating)}
                    </Badge>
                  </div>

                  {/* Rating Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <Label>Rating</Label>
                      <span className="font-mono text-muted-foreground">{assessment.rating}%</span>
                    </div>
                    <Slider
                      value={[assessment.rating]}
                      onValueChange={([value]) => updateAssessment(skill.id, 'rating', value)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      placeholder="Add feedback or notes..."
                      value={assessment.notes}
                      onChange={(e) => updateAssessment(skill.id, 'notes', e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save All Assessments
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SkillAssessmentModal;
