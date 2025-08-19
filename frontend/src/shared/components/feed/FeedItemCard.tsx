import React, { useState, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Copy, 
  Download, 
  Pin,
  PinOff,
  Check
} from 'lucide-react';
import { FeedItem } from '../../types/feed';
import { FEED } from '../../config/app';
import { useToast } from '../../hooks/use-toast';

interface FeedItemCardProps {
  item: FeedItem;
  showThumbnail: boolean;
  onRemove: (id: string) => void;
  onUpdateLabel: (id: string, newLabel: string) => void;
  onTogglePin: (id: string) => void;
}

export const FeedItemCard: React.FC<FeedItemCardProps> = ({
  item,
  showThumbnail,
  onRemove,
  onUpdateLabel,
  onTogglePin,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(item.used_label);
      toast({
        title: "Copied!",
        description: `"${item.used_label}" copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  }, [item.used_label, toast]);

  const downloadImage = useCallback(() => {
    if (!item.blob) return;
    
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.used_label}_${new Date().getTime()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "รูปภาพถูกดาวน์โหลดแล้ว",
      description: "ดาวน์โหลดรูปภาพเรียบร้อยแล้ว",
    });
  }, [item.blob, item.used_label, toast]);

  const handleAlternativeSelect = useCallback((alternative: string) => {
    onUpdateLabel(item.id, alternative);
    setIsExpanded(false);
  }, [item.id, onUpdateLabel]);

  const formatTime = (ts: string): string => {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400';
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <Card className="p-3 transition-all duration-200 hover:shadow-md border border-border">
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        {showThumbnail && (
          <div 
            className="flex-shrink-0 rounded-lg overflow-hidden bg-muted"
            style={{ width: FEED.THUMB_SIZE, height: FEED.THUMB_SIZE }}
          >
            <img
              src={item.thumbUrl}
              alt={`Thumbnail for ${item.used_label}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-lg text-text truncate">
                  {item.used_label}
                </span>
                {item.corrected && (
                  <Badge variant="secondary" className="text-xs">
                    Corrected
                  </Badge>
                )}
                {item.pinned && (
                  <Badge variant="outline" className="text-xs">
                    Pinned
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span title={new Date(item.ts).toISOString()}>
                  {formatTime(item.ts)}
                </span>
                {FEED.SHOW_CONFIDENCE && item.confidence && (
                  <span className={getConfidenceColor(item.confidence)}>
                    {Math.round(item.confidence * 100)}%
                  </span>
                )}
                {item.top3 && item.top3.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-auto p-1 text-xs"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    Alternatives
                  </Button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy word"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Download image"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTogglePin(item.id)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                title={item.pinned ? "Unpin" : "Pin"}
              >
                {item.pinned ? (
                  <PinOff className="h-3 w-3" />
                ) : (
                  <Pin className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                title="Delete"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Expanded Alternatives */}
          {isExpanded && item.top3 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                Select alternative:
              </p>
              <div className="space-y-1">
                {item.top3.slice(0, 3).map((alt, index) => (
                  <button
                    key={index}
                    onClick={() => handleAlternativeSelect(alt.label)}
                    className="flex items-center justify-between w-full p-2 text-sm rounded-md hover:bg-muted transition-colors text-left"
                    disabled={alt.label === item.used_label}
                  >
                    <span className="flex items-center gap-2">
                      {alt.label === item.used_label && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                      {alt.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(alt.prob * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};