import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, RefreshCw, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedSentenceProps {
  sentence: string | null;
  isGenerating: boolean;
  onRegenerate: () => void;
  tone?: string;
  emotion?: string;
}

export const GeneratedSentence: React.FC<GeneratedSentenceProps> = ({
  sentence,
  isGenerating,
  onRegenerate,
  tone,
  emotion
}) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    if (sentence) {
      try {
        await navigator.clipboard.writeText(sentence);
        toast({
          title: "Copied!",
          description: "Sentence copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Please copy manually",
          variant: "destructive",
        });
      }
    }
  };

  const handleSpeak = () => {
    if (sentence && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (isGenerating) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">Generating Sentence...</h3>
          </div>
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!sentence) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No sentence generated yet</p>
          <p className="text-sm mt-1">Capture some words and click "Generate Sentence"</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Generated Sentence</h3>
          </div>
          <div className="flex gap-2">
            {tone && (
              <Badge variant="outline">Tone: {tone}</Badge>
            )}
            {emotion && (
              <Badge variant="outline">Emotion: {emotion}</Badge>
            )}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border-l-4 border-primary">
          <p className="text-lg leading-relaxed">{sentence}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSpeak}
            className="flex-1"
          >
            <Volume2 className="h-4 w-4 mr-2" />
            Speak
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>
    </Card>
  );
};