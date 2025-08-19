import React, { useState, useCallback } from 'react';
import { WebcamCapture } from '../shared/components/WebcamCapture';
import { RecognitionResults, RecognitionResult } from '../shared/components/RecognitionResults';
import { RecognitionFeed } from '../shared/components/feed/RecognitionFeed';
import { GeneratedSentence } from '../shared/components/GeneratedSentence';
import { SettingsDrawer } from '../shared/components/SettingsDrawer';
import { ThemeToggle } from '../shared/components/ThemeToggle';
import { recognizeSign, composeSentence } from '../shared/services/api';
import { settingsManager } from '../shared/services/settings';
import { useFeedStore } from '../shared/store/feed-store';
import { useToast } from '../shared/hooks/use-toast';
import { Hand, Sparkles } from 'lucide-react';

const Index = () => {
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([]);
  const [generatedSentence, setGeneratedSentence] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toast } = useToast();
  const { addItem, items } = useFeedStore();

  const handleCapture = useCallback(async (imageSrc: string, faceImageSrc?: string) => {
    setIsRecognizing(true);
    try {
      // Convert imageSrc (data URL) to Blob
      const imageResponse = await fetch(imageSrc);
      const imageBlob = await imageResponse.blob();
      
      const response = await recognizeSign(imageBlob);
      
      // Create results array from single response
      const results: RecognitionResult[] = [{
        word: response.text,
        confidence: response.confidence,
        emotion: response.emotion,
        face_detected: response.modelStatus.face === 'ready',
        expression: response.emotion
      }];
      
      setRecognitionResults(results);
      
      // Add to feed if confidence is high enough (but not for "Unknown")
      if (results[0] && results[0].confidence > 0.3 && results[0].word !== "Unknown") {
        // Create thumbnail from imageSrc
        const thumbUrl = imageSrc; // Use the original imageSrc as thumbnail
        
        // Add to feed
        addItem({
          thumbUrl,
          blob: imageBlob,
          used_label: results[0].word,
          top3: [{
            label: results[0].word,
            prob: results[0].confidence
          }],
          confidence: results[0].confidence,
          ts: new Date().toISOString(),
        });

        toast({
          title: "จับคำได้แล้ว!",
          description: `เพิ่ม "${results[0].word}" ลงในรายการแล้ว`,
        });
      } else if (results[0]?.word === "Unknown") {
        toast({
          title: "ไม่สามารถจดจำได้",
          description: "ยังไม่มีโมเดลหรือไม่สามารถจดจำคำสัญญาณได้ กรุณาลองใหม่",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Recognition error:', error);
      toast({
        title: "เกิดข้อผิดพลาดในการจดจำ",
        description: "ไม่สามารถจดจำคำสัญญาณได้ กรุณาลองใหม่",
        variant: "destructive",
      });
    } finally {
      setIsRecognizing(false);
    }
  }, [toast, addItem]);

  // Feed-based sentence generation
  const feedWords = [...items].reverse().map(item => item.used_label);

  const handleGenerateSentence = useCallback(async () => {
    if (feedWords.length === 0) {
      toast({
        title: "No Words",
        description: "Please capture some words first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const emotion = items.find(item => item.confidence && item.confidence > 0.8)?.used_label;
      
      const response = await composeSentence({
        words: feedWords,
        tone: "neutral",
        emotion
      });
      
      setGeneratedSentence(response.sentence);
      toast({
        title: "Sentence Generated!",
        description: "AI has composed your sentence",
      });
    } catch (error) {
      console.error('Composition error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate sentence. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [feedWords, items, toast]);

  const handleRegenerate = useCallback(() => {
    handleGenerateSentence();
  }, [handleGenerateSentence]);

  // Settings handlers
  const handleMirrorPreviewChange = useCallback((enabled: boolean) => {
    // The webcam component handles this internally
  }, []);

  const handleMirrorCaptureChange = useCallback((enabled: boolean) => {
    // Settings are updated in the SettingsDrawer
  }, []);

  const handleStabilityMsChange = useCallback((ms: number) => {
    // Settings are updated in the SettingsDrawer
  }, []);

  const handleCooldownMsChange = useCallback((ms: number) => {
    // Settings are updated in the SettingsDrawer
  }, []);

  return (
    <div className="min-h-screen bg-bg transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-brand to-accent">
                <Hand className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text">HandMat</h1>
                <p className="text-sm text-muted-foreground">Sign Language to Text Recognition</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SettingsDrawer
                isOpen={settingsOpen}
                onOpenChange={setSettingsOpen}
                onMirrorPreviewChange={handleMirrorPreviewChange}
                onMirrorCaptureChange={handleMirrorCaptureChange}
                onStabilityMsChange={handleStabilityMsChange}
                onCooldownMsChange={handleCooldownMsChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Camera and Results */}
          <div className="space-y-6">
            <WebcamCapture
              onCapture={handleCapture}
              isCapturing={isRecognizing}
              holdDuration={2000}
            />
            
            <RecognitionResults
              results={recognitionResults}
              isLoading={isRecognizing}
            />
          </div>

          {/* Right Column - Recognition Feed and Generated Sentence */}
          <div className="space-y-6">
            <RecognitionFeed
              onGenerateSentence={handleGenerateSentence}
              isGenerating={isGenerating}
            />
            
            <GeneratedSentence
              sentence={generatedSentence}
              isGenerating={isGenerating}
              onRegenerate={handleRegenerate}
              emotion={items.find(item => item.confidence && item.confidence > 0.8)?.used_label}
            />
          </div>
        </div>

        {/* Features Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/50 border border-border text-sm">
            <Sparkles className="h-4 w-4 text-brand" />
            <span className="text-text">AI-powered sign recognition with real-time processing</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
