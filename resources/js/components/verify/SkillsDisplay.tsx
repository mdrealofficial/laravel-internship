import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SkillAssessment {
  id: string;
  skill_name: string;
  skill_description: string | null;
  rating: number;
  notes: string | null;
}

interface SkillsDisplayProps {
  skills: SkillAssessment[];
  departmentName?: string;
}

const SkillsDisplay: React.FC<SkillsDisplayProps> = ({ skills, departmentName }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (skills.length === 0) return null;

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'bg-emerald-500';
    if (rating >= 60) return 'bg-blue-500';
    if (rating >= 40) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 90) return 'Exceptional';
    if (rating >= 80) return 'Excellent';
    if (rating >= 70) return 'Very Good';
    if (rating >= 60) return 'Good';
    if (rating >= 50) return 'Satisfactory';
    return 'Developing';
  };

  const averageRating = Math.round(skills.reduce((sum, s) => sum + s.rating, 0) / skills.length);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-muted/30 border">
        {/* Header - Always visible */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-sm">Skills & Competencies</h3>
                {departmentName && (
                  <p className="text-xs text-muted-foreground">{departmentName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Award className="h-3 w-3 mr-1" />
                {averageRating}% Overall
              </Badge>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Skills Grid - Collapsible */}
        <CollapsibleContent className="pt-4">
          <div className="grid gap-3">
            {skills.map((skill) => (
              <div key={skill.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{skill.skill_name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      {getRatingLabel(skill.rating)}
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                      {skill.rating}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getRatingColor(skill.rating)}`}
                    style={{ width: `${skill.rating}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default SkillsDisplay;
