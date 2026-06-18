import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { CanvasField } from './FormCanvas';
import { supabase } from '@/integrations/supabase/client';

interface FieldConfigModalProps {
  field: CanvasField | null;
  open: boolean;
  onClose: () => void;
  onSave: (field: CanvasField) => void;
  isMultiDepartment?: boolean;
  allowedDepartments?: string[];
  formDepartmentId?: string;
}

export function FieldConfigModal({ 
  field, 
  open, 
  onClose, 
  onSave,
  isMultiDepartment = false,
  allowedDepartments = [],
  formDepartmentId = '',
}: FieldConfigModalProps) {
  const [config, setConfig] = useState<CanvasField | null>(null);
  const [newOption, setNewOption] = useState('');

  interface SkillItem {
    id: string;
    name: string;
    enabled: boolean;
    points: number;
  }
  interface SkillsConfig {
    departmentId: string;
    skills: SkillItem[];
    departments?: Record<string, SkillItem[]>;
  }

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [skillsConfig, setSkillsConfig] = useState<SkillsConfig>({ departmentId: '', skills: [], departments: {} });

  useEffect(() => {
    const fetchDepts = async () => {
      const { data } = await supabase.from('departments').select('id, name').order('name');
      if (data) setDepartments(data);
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (field) {
      setConfig({ ...field });
      if (field.type === 'skills') {
        try {
          let parsed: SkillsConfig = { departmentId: '', skills: [], departments: {} };
          if (field.options) {
            const raw = Array.isArray(field.options) ? field.options[0] : field.options;
            if (raw) {
              parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            }
          }
          if (!parsed.departments) {
            parsed.departments = {};
          }
          if (parsed.departmentId && parsed.skills.length > 0 && !parsed.departments[parsed.departmentId]) {
            parsed.departments[parsed.departmentId] = parsed.skills;
          }
          if (isMultiDepartment && parsed.departmentId && !allowedDepartments.includes(parsed.departmentId)) {
            parsed.departmentId = '';
            parsed.skills = [];
          }
          setSkillsConfig(parsed);
        } catch (e) {
          setSkillsConfig({ departmentId: '', skills: [], departments: {} });
        }
      }
    }
  }, [field, isMultiDepartment, allowedDepartments]);

  const handleDeptChange = async (deptId: string) => {
    if (!deptId) {
      const newConfig = {
        ...skillsConfig,
        departmentId: '',
        skills: []
      };
      setSkillsConfig(newConfig);
      setConfig(prev => prev ? {
        ...prev,
        options: [JSON.stringify(newConfig)]
      } : null);
      return;
    }

    const existingSkills = skillsConfig.departments?.[deptId];
    if (existingSkills) {
      const newConfig = {
        ...skillsConfig,
        departmentId: deptId,
        skills: existingSkills
      };
      setSkillsConfig(newConfig);
      setConfig(prev => prev ? {
        ...prev,
        options: [JSON.stringify(newConfig)]
      } : null);
      return;
    }

    const { data: skillsData } = await supabase
      .from('department_skills')
      .select('id, skill_name')
      .eq('department_id', deptId)
      .order('display_order');
    
    const skillsList: SkillItem[] = (skillsData || []).map((s) => ({
      id: s.id,
      name: s.skill_name,
      enabled: true,
      points: skillsData && skillsData.length > 0 ? Math.round(100 / skillsData.length) : 20
    }));

    const newConfig = {
      ...skillsConfig,
      departmentId: deptId,
      skills: skillsList,
      departments: {
        ...(skillsConfig.departments || {}),
        [deptId]: skillsList
      }
    };
    
    setSkillsConfig(newConfig);
    setConfig(prev => prev ? {
      ...prev,
      options: [JSON.stringify(newConfig)]
    } : null);
  };

  const handleSkillToggle = (skillId: string, enabled: boolean) => {
    const newSkills = skillsConfig.skills.map((s) => 
      s.id === skillId ? { ...s, enabled } : s
    );
    const activeDeptId = skillsConfig.departmentId;
    const newConfig = {
      ...skillsConfig,
      skills: newSkills,
      departments: activeDeptId ? {
        ...(skillsConfig.departments || {}),
        [activeDeptId]: newSkills
      } : skillsConfig.departments
    };
    setSkillsConfig(newConfig);
    setConfig(prev => prev ? {
      ...prev,
      options: [JSON.stringify(newConfig)]
    } : null);
  };

  const handleSkillPointsChange = (skillId: string, points: number) => {
    const newSkills = skillsConfig.skills.map((s) => 
      s.id === skillId ? { ...s, points } : s
    );
    const activeDeptId = skillsConfig.departmentId;
    const newConfig = {
      ...skillsConfig,
      skills: newSkills,
      departments: activeDeptId ? {
        ...(skillsConfig.departments || {}),
        [activeDeptId]: newSkills
      } : skillsConfig.departments
    };
    setSkillsConfig(newConfig);
    setConfig(prev => prev ? {
      ...prev,
      options: [JSON.stringify(newConfig)]
    } : null);
  };

  if (!config) return null;

  const needsOptions = ['select', 'radio', 'checkbox'].includes(config.type);
  const isRange = config.type === 'range';
  const rangeMin = config.options?.[0] || '0';
  const rangeMax = config.options?.[1] || '100';
  const rangeStep = config.options?.[2] || '1';

  const handleRangeChange = (key: 'min' | 'max' | 'step', val: string) => {
    const newOptions = [...(config.options || [])];
    while (newOptions.length < 3) newOptions.push('');
    if (key === 'min') newOptions[0] = val;
    else if (key === 'max') newOptions[1] = val;
    else if (key === 'step') newOptions[2] = val;
    setConfig({
      ...config,
      options: newOptions,
    });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setConfig({
        ...config,
        options: [...config.options, newOption.trim()],
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setConfig({
      ...config,
      options: config.options.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Field</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={config.label}
              onChange={(e) => setConfig({ ...config, label: e.target.value })}
              placeholder="Field label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={config.placeholder}
              onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="required">Required</Label>
            <Switch
              id="required"
              checked={config.isRequired}
              onCheckedChange={(checked) => setConfig({ ...config, isRequired: checked })}
            />
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="space-y-2">
                {config.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={option} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isRange && (
            <div className="space-y-4">
              <Label>Range Configurations</Label>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="range-min" className="text-xs">Min</Label>
                  <Input
                    id="range-min"
                    type="number"
                    value={rangeMin}
                    onChange={(e) => handleRangeChange('min', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="range-max" className="text-xs">Max</Label>
                  <Input
                    id="range-max"
                    type="number"
                    value={rangeMax}
                    onChange={(e) => handleRangeChange('max', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="range-step" className="text-xs">Step</Label>
                  <Input
                    id="range-step"
                    type="number"
                    value={rangeStep}
                    onChange={(e) => handleRangeChange('step', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {config.type === 'skills' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="skills-dept">Department</Label>
                <select 
                  id="skills-dept"
                  value={skillsConfig.departmentId}
                  onChange={(e) => handleDeptChange(e.target.value)}
                  className="w-full p-2 border border-input rounded-md bg-background text-sm cursor-pointer"
                >
                  <option value="">Select a department</option>
                  {departments
                    .filter((dept) => {
                      if (isMultiDepartment) {
                        return allowedDepartments.includes(dept.id);
                      }
                      if (formDepartmentId) {
                        return dept.id === formDepartmentId;
                      }
                      return true;
                    })
                    .map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                </select>
              </div>

              {skillsConfig.departmentId && (
                <div className="space-y-2">
                  <Label>Skills Configuration</Label>
                  <div className="border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                          <th className="p-2">Skill</th>
                          <th className="p-2 w-20 text-center">Enable</th>
                          <th className="p-2 w-24">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {skillsConfig.skills.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-xs text-muted-foreground italic">
                              No skills found in this department. Go to Departments tab to add skills.
                            </td>
                          </tr>
                        ) : (
                          skillsConfig.skills.map((skill) => (
                            <tr key={skill.id} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="p-2 font-medium">{skill.name}</td>
                              <td className="p-2 text-center">
                                <Switch
                                  checked={skill.enabled}
                                  onCheckedChange={(checked) => handleSkillToggle(skill.id, checked)}
                                />
                              </td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={skill.points}
                                  onChange={(e) => handleSkillPointsChange(skill.id, Number(e.target.value))}
                                  disabled={!skill.enabled}
                                  className="h-8"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Tip: Score is calculated dynamically relative to total points of enabled skills. Current total: {skillsConfig.skills.reduce((sum, s) => sum + (s.enabled ? s.points : 0), 0)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
