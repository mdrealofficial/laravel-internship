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

interface FieldConfigModalProps {
  field: CanvasField | null;
  open: boolean;
  onClose: () => void;
  onSave: (field: CanvasField) => void;
}

export function FieldConfigModal({ field, open, onClose, onSave }: FieldConfigModalProps) {
  const [config, setConfig] = useState<CanvasField | null>(null);
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (field) {
      setConfig({ ...field });
    }
  }, [field]);

  if (!config) return null;

  const needsOptions = ['select', 'radio', 'checkbox'].includes(config.type);

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
