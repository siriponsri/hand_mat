import React, { useEffect, useCallback, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { 
  Camera, 
  Trash2, 
  MessageSquare, 
  Image, 
  AlertCircle 
} from 'lucide-react';
import { FeedItemCard } from './FeedItemCard';
import { useFeedStore } from '../../../store/feedStore';
import { FEED } from '../../config/app';
import { useToast } from '../../hooks/use-toast';

interface RecognitionFeedProps {
  onGenerateSentence: () => void;
  isGenerating: boolean;
}

export const RecognitionFeed: React.FC<RecognitionFeedProps> = ({
  onGenerateSentence,
  isGenerating,
}) => {
  const { 
    items, 
    showThumbnails, 
    memoryUsage,
    removeItem, 
    updateItemLabel, 
    togglePin, 
    clearFeed, 
    setShowThumbnails,
    trimOldItems
  } = useFeedStore();

  const { toast } = useToast();

  // Memory warning threshold (300MB)
  const MEMORY_WARNING_MB = 300;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (items.length === 0) return;

      switch (e.key) {
        case '1':
        case '2':
        case '3': {
          e.preventDefault();
          const mostRecent = items[0];
          if (mostRecent.top3) {
            const index = parseInt(e.key) - 1;
            if (mostRecent.top3[index]) {
              updateItemLabel(mostRecent.id, mostRecent.top3[index].label);
            }
          }
          break;
        }
        case 'Backspace':
          e.preventDefault();
          removeItem(items[0].id);
          break;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, updateItemLabel, removeItem]);

  // Memory monitoring
  useEffect(() => {
    if (memoryUsage > MEMORY_WARNING_MB) {
      toast({
        title: "High Memory Usage",
        description: `${Math.round(memoryUsage)}MB used. Consider exporting or clearing the feed.`,
        variant: "destructive",
      });
    }
  }, [memoryUsage, toast]);

  // Get words for sentence generation (chronological order)
  const wordsForSentence = useMemo(() => {
    return [...items]
      .reverse() // Reverse to get chronological order
      .map(item => item.used_label);
  }, [items]);

  const handleClearAll = useCallback(() => {
    clearFeed();
    toast({
      title: "Feed Cleared",
      description: "All recognition items have been removed",
    });
  }, [clearFeed, toast]);

  const handleTrimOld = useCallback(() => {
    trimOldItems();
    toast({
      title: "Feed Trimmed",
      description: "Oldest items have been removed",
    });
  }, [trimOldItems, toast]);

  if (items.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No captures yet</p>
          <p className="text-sm mt-1">Recognized signs will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Recognition Feed</h3>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {memoryUsage > 100 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(memoryUsage)}MB
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={showThumbnails}
              onCheckedChange={setShowThumbnails}
              id="show-thumbnails"
            />
            <label 
              htmlFor="show-thumbnails" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Show thumbnails
            </label>
          </div>
          
          {items.length > FEED.MAX_ITEMS * 0.8 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTrimOld}
              className="text-xs"
            >
              Trim old
            </Button>
          )}
        </div>

        {/* Memory warning */}
        {memoryUsage > MEMORY_WARNING_MB && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive">
              High memory usage: {Math.round(memoryUsage)}MB
            </span>
          </div>
        )}
      </div>

      {/* Feed Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="group"
              tabIndex={0}
              role="listitem"
              aria-label={`Recognition result: ${item.used_label}`}
            >
              <FeedItemCard
                item={item}
                showThumbnail={showThumbnails}
                onRemove={removeItem}
                onUpdateLabel={updateItemLabel}
                onTogglePin={togglePin}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Generate Sentence */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onGenerateSentence}
          disabled={items.length === 0 || isGenerating}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary-hover hover:to-accent"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {isGenerating ? 'Generating...' : 'Generate Sentence'}
        </Button>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          {items.length} items ready • AI will compose from your captures
        </p>
        
        {items.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            Keys: 1-3 to select alternatives, Backspace to delete last
          </p>
        )}
      </div>
    </Card>
  );
};