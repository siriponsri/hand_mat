import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SignClass } from '@/types/dataset';
import { CONFIG } from '@/config';
import { Plus, Edit2, Trash2, Move, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClassManagerProps {
  classes: SignClass[];
  selectedClassId: string | null;
  sampleCounts: Record<string, number>;
  onAddClass: (signClass: Omit<SignClass, 'id'>) => void;
  onEditClass: (id: string, updates: Partial<SignClass>) => void;
  onDeleteClass: (id: string) => void;
  onSelectClass: (id: string | null) => void;
  onReorderClasses: (reorderedIds: string[]) => void;
}

const DEFAULT_COLORS = [
  '#00a89d', '#f4ce14', '#e74c3c', '#3498db', '#9b59b6',
  '#e67e22', '#1abc9c', '#34495e', '#f39c12', '#2ecc71'
];

export function ClassManager({
  classes,
  selectedClassId,
  sampleCounts,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onSelectClass,
  onReorderClasses,
}: ClassManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SignClass | null>(null);
  const [newClass, setNewClass] = useState({
    slug: '',
    label_th: '',
    label_en: '',
    color: DEFAULT_COLORS[0],
  });
  const { toast } = useToast();

  const handleAddClass = useCallback(() => {
    if (!newClass.slug.trim() || !newClass.label_en.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate slugs
    if (classes.some(cls => cls.slug === newClass.slug)) {
      toast({
        title: "Duplicate Slug",
        description: "A class with this slug already exists",
        variant: "destructive",
      });
      return;
    }

    onAddClass({
      ...newClass,
      color: newClass.color || DEFAULT_COLORS[classes.length % DEFAULT_COLORS.length],
    });

    setNewClass({
      slug: '',
      label_th: '',
      label_en: '',
      color: DEFAULT_COLORS[(classes.length + 1) % DEFAULT_COLORS.length],
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Class Added",
      description: `"${newClass.label_en}" has been added to your dataset`,
    });
  }, [newClass, classes, onAddClass, toast]);

  const handleEditClass = useCallback(() => {
    if (!editingClass) return;

    onEditClass(editingClass.id, {
      slug: editingClass.slug,
      label_th: editingClass.label_th,
      label_en: editingClass.label_en,
      color: editingClass.color,
    });

    setEditingClass(null);
    toast({
      title: "Class Updated",
      description: `"${editingClass.label_en}" has been updated`,
    });
  }, [editingClass, onEditClass, toast]);

  const handleDeleteClass = useCallback((classId: string) => {
    const classToDelete = classes.find(cls => cls.id === classId);
    if (!classToDelete) return;

    const sampleCount = sampleCounts[classId] || 0;
    if (sampleCount > 0) {
      if (!confirm(`Delete "${classToDelete.label_en}" and its ${sampleCount} samples?`)) {
        return;
      }
    }

    onDeleteClass(classId);
    if (selectedClassId === classId) {
      onSelectClass(null);
    }

    toast({
      title: "Class Deleted",
      description: `"${classToDelete.label_en}" and its samples have been removed`,
    });
  }, [classes, sampleCounts, selectedClassId, onDeleteClass, onSelectClass, toast]);

  const getProgressPercentage = (classId: string) => {
    const count = sampleCounts[classId] || 0;
    return Math.min((count / CONFIG.TARGET_SAMPLES_PER_CLASS) * 100, 100);
  };

  const getProgressStatus = (classId: string) => {
    const count = sampleCounts[classId] || 0;
    if (count >= CONFIG.TARGET_SAMPLES_PER_CLASS) return 'good';
    if (count >= CONFIG.TARGET_SAMPLES_PER_CLASS * 0.5) return 'warning';
    return 'poor';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-brand" />
            Sign Classes ({classes.length})
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-brand hover:bg-brand-strong text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sign Class</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="slug">Slug (for filenames) *</Label>
                  <Input
                    id="slug"
                    value={newClass.slug}
                    onChange={(e) => setNewClass(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="hello-world"
                  />
                </div>
                <div>
                  <Label htmlFor="label_en">English Label *</Label>
                  <Input
                    id="label_en"
                    value={newClass.label_en}
                    onChange={(e) => setNewClass(prev => ({ ...prev, label_en: e.target.value }))}
                    placeholder="Hello World"
                  />
                </div>
                <div>
                  <Label htmlFor="label_th">Thai Label</Label>
                  <Input
                    id="label_th"
                    value={newClass.label_th}
                    onChange={(e) => setNewClass(prev => ({ ...prev, label_th: e.target.value }))}
                    placeholder="สวัสดีโลก"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${newClass.color === color ? 'border-text' : 'border-border'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewClass(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddClass} className="w-full bg-brand hover:bg-brand-strong text-white">
                  Add Class
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {classes.map((cls) => {
            const count = sampleCounts[cls.id] || 0;
            const percentage = getProgressPercentage(cls.id);
            const status = getProgressStatus(cls.id);
            const isSelected = selectedClassId === cls.id;

            return (
              <div
                key={cls.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-brand bg-surface shadow-md' 
                    : 'border-border hover:border-brand/50 hover:bg-surface/50'
                }`}
                onClick={() => onSelectClass(isSelected ? null : cls.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: cls.color || DEFAULT_COLORS[0] }}
                    />
                    <span className="font-medium text-text">{cls.label_en}</span>
                    {cls.label_th && (
                      <span className="text-sm text-muted-foreground">({cls.label_th})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={status === 'good' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}>
                      {count} / {CONFIG.TARGET_SAMPLES_PER_CLASS}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClass(cls);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status === 'good' ? 'bg-green-500' : 
                      status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(0)}% complete • {cls.slug}
                </div>
              </div>
            );
          })}
          {classes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No sign classes yet</p>
              <p className="text-sm">Add a class to start collecting samples</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sign Class</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-slug">Slug (for filenames)</Label>
                <Input
                  id="edit-slug"
                  value={editingClass.slug}
                  onChange={(e) => setEditingClass(prev => prev ? { ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-label_en">English Label</Label>
                <Input
                  id="edit-label_en"
                  value={editingClass.label_en}
                  onChange={(e) => setEditingClass(prev => prev ? { ...prev, label_en: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-label_th">Thai Label</Label>
                <Input
                  id="edit-label_th"
                  value={editingClass.label_th}
                  onChange={(e) => setEditingClass(prev => prev ? { ...prev, label_th: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {DEFAULT_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${editingClass.color === color ? 'border-text' : 'border-border'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingClass(prev => prev ? { ...prev, color } : null)}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleEditClass} className="w-full bg-brand hover:bg-brand-strong text-white">
                Update Class
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}