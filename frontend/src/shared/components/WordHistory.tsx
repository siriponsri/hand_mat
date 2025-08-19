import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, X, MessageSquare } from 'lucide-react';
import { RecognitionResult } from './RecognitionResults';

interface WordHistoryProps {
  words: RecognitionResult[];
  onRemoveWord: (index: number) => void;
  onClearHistory: () => void;
  onGenerateSentence: () => void;
  isGenerating: boolean;
}

export const WordHistory: React.FC<WordHistoryProps> = ({
  words,
  onRemoveWord,
  onClearHistory,
  onGenerateSentence,
  isGenerating
}) => {
  if (words.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No words captured yet</p>
          <p className="text-sm mt-1">Recognized words will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Captured Words</h3>
            <Badge variant="secondary">{words.length}</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearHistory}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {words.map((word, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 group hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">{word.word}</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                >
                  {Math.round(word.confidence * 100)}%
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveWord(index)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={onGenerateSentence}
          disabled={words.length === 0 || isGenerating}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Sentence'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          AI will compose a natural sentence from your captured words
        </p>
      </div>
    </Card>
  );
};