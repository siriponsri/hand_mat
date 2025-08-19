import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SignClass, Sample } from '@/types/dataset';
import { CONFIG } from '@/config';
import { Eye, Trash2, RotateCcw, ImageIcon, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SampleGalleryProps {
  selectedClass: SignClass | null;
  samples: Sample[];
  onDeleteSamples: (sampleIds: string[]) => void;
  onReplaceSample: (sampleId: string) => void;
}

export function SampleGallery({
  selectedClass,
  samples,
  onDeleteSamples,
  onReplaceSample,
}: SampleGalleryProps) {
  const [selectedSampleIds, setSelectedSampleIds] = useState<Set<string>>(new Set());
  const [viewingSample, setViewingSample] = useState<Sample | null>(null);
  const { toast } = useToast();

  // Filter samples for selected class
  const classSamples = useMemo(() => {
    if (!selectedClass) return [];
    return samples.filter(sample => sample.classId === selectedClass.id);
  }, [samples, selectedClass]);

  const handleSelectSample = useCallback((sampleId: string, selected: boolean) => {
    setSelectedSampleIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(sampleId);
      } else {
        newSet.delete(sampleId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedSampleIds(new Set(classSamples.map(s => s.id)));
    } else {
      setSelectedSampleIds(new Set());
    }
  }, [classSamples]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedSampleIds.size === 0) return;
    
    const count = selectedSampleIds.size;
    if (!confirm(`Delete ${count} selected sample${count > 1 ? 's' : ''}?`)) return;
    
    onDeleteSamples(Array.from(selectedSampleIds));
    setSelectedSampleIds(new Set());
    
    toast({
      title: "Samples Deleted",
      description: `Removed ${count} sample${count > 1 ? 's' : ''}`,
    });
  }, [selectedSampleIds, onDeleteSamples, toast]);

  const handleDeleteSingle = useCallback((sampleId: string) => {
    onDeleteSamples([sampleId]);
    setSelectedSampleIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(sampleId);
      return newSet;
    });
    
    toast({
      title: "Sample Deleted",
      description: "Sample has been removed",
    });
  }, [onDeleteSamples, toast]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedSampleIds.size > 0) {
      handleDeleteSelected();
    }
  }, [selectedSampleIds.size, handleDeleteSelected]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const getProgressInfo = () => {
    const count = classSamples.length;
    const target = CONFIG.TARGET_SAMPLES_PER_CLASS;
    const percentage = Math.min((count / target) * 100, 100);
    
    return { count, target, percentage };
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getQualityBadge = (sample: Sample) => {
    const blur = sample.blurVar >= CONFIG.QUALITY_THRESHOLDS.BLUR_MIN;
    const brightness = sample.brightness >= CONFIG.QUALITY_THRESHOLDS.BRIGHTNESS_MIN && 
                     sample.brightness <= CONFIG.QUALITY_THRESHOLDS.BRIGHTNESS_MAX;
    const motion = sample.motionScore <= CONFIG.QUALITY_THRESHOLDS.MOTION_MAX;
    
    const goodCount = [blur, brightness, motion].filter(Boolean).length;
    
    if (goodCount === 3) return { label: 'Good', variant: 'default' as const };
    if (goodCount === 2) return { label: 'OK', variant: 'secondary' as const };
    return { label: 'Poor', variant: 'destructive' as const };
  };

  const SampleThumbnail = ({ sample }: { sample: Sample }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const isSelected = selectedSampleIds.has(sample.id);
    const quality = getQualityBadge(sample);

    React.useEffect(() => {
      const url = URL.createObjectURL(sample.blob);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [sample.blob]);

    return (
      <div
        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
          isSelected ? 'border-brand shadow-lg' : 'border-border hover:border-brand/50'
        }`}
        onClick={() => handleSelectSample(sample.id, !isSelected)}
      >
        {/* Image */}
        <div className="aspect-square relative">
          <img
            src={imageUrl}
            alt={`Sample ${sample.id}`}
            className="w-full h-full object-cover"
          />
          
          {/* Selection overlay */}
          {isSelected && (
            <div className="absolute inset-0 bg-brand/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
            </div>
          )}
          
          {/* Quality badge */}
          <Badge 
            variant={quality.variant}
            className="absolute top-2 left-2 text-xs"
          >
            {quality.label}
          </Badge>
          
          {/* Actions overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                setViewingSample(sample);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSingle(sample.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Meta info */}
        <div className="p-2 bg-surface">
          <div className="text-xs text-muted-foreground">
            {formatTimestamp(sample.ts)}
          </div>
          <div className="text-xs text-muted-foreground">
            {sample.w}×{sample.h}
          </div>
        </div>
      </div>
    );
  };

  if (!selectedClass) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a class to view samples</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { count, target, percentage } = getProgressInfo();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedClass.color }}
              />
              {selectedClass.label_en}
              <Badge variant="outline">{count} samples</Badge>
            </CardTitle>
            {selectedSampleIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedSampleIds.size})
              </Button>
            )}
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{count} / {target}</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {percentage.toFixed(0)}% complete
            </div>
          </div>
          
          {/* Bulk selection */}
          {classSamples.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedSampleIds.size === classSamples.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">Select all</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            {classSamples.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {classSamples.map((sample) => (
                  <SampleThumbnail key={sample.id} sample={sample} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No samples yet</p>
                <p className="text-sm">Start capturing to collect samples</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sample Detail Modal */}
      <Dialog open={!!viewingSample} onOpenChange={() => setViewingSample(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sample Details</DialogTitle>
          </DialogHeader>
          {viewingSample && (
            <div className="space-y-4">
              {/* Image */}
              <div className="relative">
                <img
                  src={URL.createObjectURL(viewingSample.blob)}
                  alt="Sample"
                  className="w-full rounded-lg"
                />
              </div>
              
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Timestamp:</strong>
                  <br />
                  {new Date(viewingSample.ts).toLocaleString()}
                </div>
                <div>
                  <strong>Dimensions:</strong>
                  <br />
                  {viewingSample.w} × {viewingSample.h}
                </div>
                <div>
                  <strong>Blur Score:</strong>
                  <br />
                  {viewingSample.blurVar.toFixed(1)}
                </div>
                <div>
                  <strong>Brightness:</strong>
                  <br />
                  {viewingSample.brightness.toFixed(1)}
                </div>
                <div>
                  <strong>Motion Score:</strong>
                  <br />
                  {viewingSample.motionScore.toFixed(1)}
                </div>
                <div>
                  <strong>Mirrored:</strong>
                  <br />
                  {viewingSample.mirrored ? 'Yes' : 'No'}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onReplaceSample(viewingSample.id)}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteSingle(viewingSample.id);
                    setViewingSample(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}