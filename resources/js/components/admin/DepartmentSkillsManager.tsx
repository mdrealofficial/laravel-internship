import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2, GripVertical, Pencil } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Department, DepartmentSkill } from '@/types/database';

interface DepartmentSkillsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

const DepartmentSkillsManager: React.FC<DepartmentSkillsManagerProps> = ({ open, onOpenChange, department }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState<DepartmentSkill[]>([]);
  const [editingSkill, setEditingSkill] = useState<DepartmentSkill | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({ skill_name: '', skill_description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && department) {
      fetchSkills();
    }
  }, [open, department]);

  const fetchSkills = async () => {
    if (!department) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('department_skills')
        .select('*')
        .eq('department_id', department.id)
        .order('display_order');

      if (error) throw error;
      setSkills(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department) return;
    setSubmitting(true);

    try {
      if (editingSkill) {
        const { error } = await supabase
          .from('department_skills')
          .update({
            skill_name: formData.skill_name,
            skill_description: formData.skill_description || null,
          })
          .eq('id', editingSkill.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Skill updated' });
      } else {
        const maxOrder = Math.max(...skills.map(s => s.display_order), 0);
        const { error } = await supabase.from('department_skills').insert({
          department_id: department.id,
          skill_name: formData.skill_name,
          skill_description: formData.skill_description || null,
          display_order: maxOrder + 1,
        });

        if (error) throw error;
        toast({ title: 'Success', description: 'Skill added' });
      }

      setFormData({ skill_name: '', skill_description: '' });
      setEditingSkill(null);
      fetchSkills();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (skill: DepartmentSkill) => {
    setEditingSkill(skill);
    setFormData({
      skill_name: skill.skill_name,
      skill_description: skill.skill_description || '',
    });
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);

    try {
      const { error } = await supabase.from('department_skills').delete().eq('id', deletingId);
      if (error) throw error;
      toast({ title: 'Success', description: 'Skill deleted' });
      fetchSkills();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingSkill(null);
    setFormData({ skill_name: '', skill_description: '' });
  };

  if (!department) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Skills - {department.name}</DialogTitle>
          <DialogDescription>Add, edit, or remove skills for this department</DialogDescription>
        </DialogHeader>

        {/* Add/Edit Skill Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <h4 className="font-medium">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h4>
          <div className="space-y-2">
            <Label htmlFor="skill_name">Skill Name</Label>
            <Input
              id="skill_name"
              value={formData.skill_name}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
              placeholder="e.g., React/Vue/Angular"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill_description">Description (optional)</Label>
            <Textarea
              id="skill_description"
              value={formData.skill_description}
              onChange={(e) => setFormData({ ...formData, skill_description: e.target.value })}
              placeholder="Brief description of the skill..."
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingSkill ? 'Update Skill' : 'Add Skill'}
            </Button>
            {editingSkill && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Skills List */}
        <div className="space-y-2">
          <h4 className="font-medium">Current Skills ({skills.length})</h4>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : skills.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No skills defined yet</p>
          ) : (
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div
                  key={skill.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{skill.skill_name}</p>
                    {skill.skill_description && (
                      <p className="text-sm text-muted-foreground truncate">{skill.skill_description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(skill)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setDeletingId(skill.id);
                      setDeleteDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this skill. Any existing intern assessments evaluated for this skill will also be deleted forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Skill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default DepartmentSkillsManager;
