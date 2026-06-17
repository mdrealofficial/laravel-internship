import { useDraggable } from '@dnd-kit/core';
import { 
  Type, 
  AlignLeft, 
  Mail, 
  Phone, 
  Hash, 
  Calendar, 
  List, 
  Circle, 
  CheckSquare, 
  Upload 
} from 'lucide-react';
import { FormFieldType } from '@/types/database';

interface FieldTypeConfig {
  type: FormFieldType;
  label: string;
  icon: React.ReactNode;
}

const fieldTypes: FieldTypeConfig[] = [
  { type: 'text', label: 'Text Input', icon: <Type className="h-4 w-4" /> },
  { type: 'textarea', label: 'Text Area', icon: <AlignLeft className="h-4 w-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { type: 'phone', label: 'Phone', icon: <Phone className="h-4 w-4" /> },
  { type: 'number', label: 'Number', icon: <Hash className="h-4 w-4" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="h-4 w-4" /> },
  { type: 'select', label: 'Dropdown', icon: <List className="h-4 w-4" /> },
  { type: 'radio', label: 'Radio Group', icon: <Circle className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="h-4 w-4" /> },
  { type: 'file', label: 'File Upload', icon: <Upload className="h-4 w-4" /> },
];

interface DraggableFieldProps {
  type: FormFieldType;
  label: string;
  icon: React.ReactNode;
}

function DraggableField({ type, label, icon }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, isNew: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 p-3 bg-card border border-border rounded-lg cursor-grab hover:border-primary hover:bg-accent transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function FieldPalette() {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        Drag Fields
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {fieldTypes.map((field) => (
          <DraggableField
            key={field.type}
            type={field.type}
            label={field.label}
            icon={field.icon}
          />
        ))}
      </div>
    </div>
  );
}

export { fieldTypes };
