import React, { useState, useCallback, useEffect } from 'react';
import { ClassManager } from '@/components/classes/ClassManager';
import { CapturePanel } from '@/components/capture/CapturePanel';
import { SampleGallery } from '@/components/capture/SampleGallery';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { SignClass, Sample } from '@/types/dataset';
import { exportDataset, downloadBlob } from '@/lib/dataset/export-zip';
import { importDataset, validateZipFile } from '@/lib/dataset/import-zip';
import { Hand, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Dataset() {
  const [classes, setClasses] = useState<SignClass[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const selectedClass = classes.find(cls => cls.id === selectedClassId) || null;
  const sampleCounts = samples.reduce((acc, sample) => {
    acc[sample.classId] = (acc[sample.classId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleAddClass = useCallback((newClass: Omit<SignClass, 'id'>) => {
    const signClass: SignClass = {
      ...newClass,
      id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setClasses(prev => [...prev, signClass]);
  }, []);

  const handleDeleteSamples = useCallback((sampleIds: string[]) => {
    setSamples(prev => prev.filter(sample => !sampleIds.includes(sample.id)));
  }, []);

  const handleSampleCaptured = useCallback((newSamples: Sample[]) => {
    setSamples(prev => [...prev, ...newSamples]);
  }, []);

  const handleExport = useCallback(async () => {
    if (classes.length === 0) {
      toast({
        title: "No Data",
        description: "Add some classes and samples first",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const splitSeed = localStorage.getItem('handmat_split_seed') || 'handmat-2025';
      const blob = await exportDataset(classes, samples, splitSeed);
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `handmat_dataset_${timestamp}.zip`);
      
      toast({
        title: "Export Complete",
        description: `Dataset exported with ${samples.length} samples (seed: ${splitSeed})`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [classes, samples, toast]);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-brand to-accent">
                <Hand className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">HandMat Dataset</h1>
                <p className="text-sm text-muted-foreground">Manual capture & export workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                disabled={isExporting || samples.length === 0}
                className="bg-brand hover:bg-brand-strong text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export ZIP'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Class Manager */}
          <div className="lg:col-span-1">
            <ClassManager
              classes={classes}
              selectedClassId={selectedClassId}
              sampleCounts={sampleCounts}
              onAddClass={handleAddClass}
              onEditClass={(id, updates) => 
                setClasses(prev => prev.map(cls => cls.id === id ? { ...cls, ...updates } : cls))
              }
              onDeleteClass={(id) => {
                setClasses(prev => prev.filter(cls => cls.id !== id));
                setSamples(prev => prev.filter(sample => sample.classId !== id));
                if (selectedClassId === id) setSelectedClassId(null);
              }}
              onSelectClass={setSelectedClassId}
              onReorderClasses={(ids) => {
                const reordered = ids.map(id => classes.find(cls => cls.id === id)!).filter(Boolean);
                setClasses(reordered);
              }}
            />
          </div>

          {/* Center: Capture Panel */}
          <div className="lg:col-span-1">
            <CapturePanel
              selectedClass={selectedClass}
              samplesCollected={selectedClass ? sampleCounts[selectedClass.id] || 0 : 0}
              onSampleCaptured={handleSampleCaptured}
            />
          </div>

          {/* Right: Sample Gallery */}
          <div className="lg:col-span-1">
            <SampleGallery
              selectedClass={selectedClass}
              samples={samples}
              onDeleteSamples={handleDeleteSamples}
              onReplaceSample={(id) => {
                // Start capture mode to replace this sample
                if (selectedClass) {
                  // Find the sample to replace
                  const sampleToReplace = samples.find(s => s.id === id);
                  if (sampleToReplace) {
                    // Delete the old sample first
                    handleDeleteSamples([id]);
                    toast({
                      title: "Sample Deleted",
                      description: "You can now capture a new sample to replace it.",
                    });
                  }
                } else {
                  toast({
                    title: "No Class Selected",
                    description: "Please select a class first.",
                    variant: "destructive"
                  });
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}