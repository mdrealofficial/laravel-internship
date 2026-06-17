import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormFieldType } from '@/types/database';

export interface CanvasField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder: string;
  isRequired: boolean;
  options: string[];
}

interface SortableFieldProps {
  field: CanvasField;
  onEdit: (field: CanvasField) => void;
  onDelete: (id: string) => void;
}

function SortableField({ field, onEdit, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getFieldPreview = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || 'Enter text...'}
            className="w-full p-2 border border-input rounded-md bg-background text-sm resize-none"
            rows={3}
            disabled
          />
        );
      case 'select':
        return (
          <select className="w-full p-2 border border-input rounded-md bg-background text-sm" disabled>
            <option>{field.placeholder || 'Select an option...'}</option>
            {field.options.map((opt, i) => (
              <option key={i}>{opt}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.length > 0 ? (
              field.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input type="radio" disabled />
                  {opt}
                </label>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">No options added</span>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.length > 0 ? (
              field.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" disabled />
                  {opt}
                </label>
              ))
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled />
                {field.label}
              </label>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="border-2 border-dashed border-input rounded-md p-4 text-center text-sm text-muted-foreground">
            Click or drag to upload file
          </div>
        );
      default:
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.type}...`}
            className="w-full p-2 border border-input rounded-md bg-background text-sm"
            disabled
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border border-border rounded-lg p-4 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-sm">
              {field.label}
              {field.isRequired && <span className="text-destructive ml-1">*</span>}
            </label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(field)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onDelete(field.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {getFieldPreview()}
        </div>
      </div>
    </div>
  );
}

interface FormCanvasProps {
  fields: CanvasField[];
  onEditField: (field: CanvasField) => void;
  onDeleteField: (id: string) => void;
}

export function FormCanvas({ fields, onEditField, onDeleteField }: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'form-canvas' });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-border'
      }`}
    >
      {fields.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Drag fields here to build your form
        </div>
      ) : (
        <SortableContext items={fields} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {fields.map((field) => (
              <SortableField
                key={field.id}
                field={field}
                onEdit={onEditField}
                onDelete={onDeleteField}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}
