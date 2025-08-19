import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Award, Target, Smile, Hand, Clock, AlertTriangle } from 'lucide-react';

export interface RecognitionResult {
  word: string;
  confidence: number;
  emotion?: string;
  face_detected?: boolean;
  expression?: string;
  timestamp?: number;
  top3_words?: string[];
  top3_confidences?: number[];
  modelStatus?: {
    hand: string;
    face: string;
    overall: string;
  };
}

interface RecognitionResultsProps {
  results: RecognitionResult[];
  isLoading: boolean;
  realTimeMode?: boolean;
  onWordSelect?: (word: string) => void;
}

export const RecognitionResults: React.FC<RecognitionResultsProps> = ({
  results,
  isLoading,
  realTimeMode = false,
  onWordSelect
}) => {
  const [latestResult, setLatestResult] = useState<RecognitionResult | null>(null);
  
  // Track latest result for real-time updates
  useEffect(() => {
    if (results.length > 0) {
      const newest = results.reduce((latest, current) => 
        (current.timestamp || 0) > (latest.timestamp || 0) ? current : latest
      );
      setLatestResult(newest);
    }
  }, [results]);

  const getConfidenceLevel = (confidence: number): 'low' | 'medium' | 'high' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
    }
  };

  const getModelStatusIcon = (status?: string) => {
    switch (status) {
      case 'ready': return '✅';
      case 'unavailable': return '❌';
      case 'error': return '⚠️';
      case 'partial': return '🔶';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('th-TH');
  };

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'surprised': return '😲';
      case 'angry': return '😠';
      case 'neutral': return '😐';
      case 'focused': return '🤔';
      case 'calm': return '😌';
      case 'Unknown': return '❓';
      default: return '❓';
    }
  };

  const getEmotionColor = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return 'bg-green-100 text-green-800 border-green-200';
      case 'sad': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'surprised': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'angry': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'focused': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'calm': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Unknown': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const topResult = realTimeMode ? latestResult : results[0];
  const displayResults = realTimeMode && topResult ? [topResult] : results;
  const top3Results = topResult?.top3_words && topResult?.top3_confidences ? 
    topResult.top3_words.map((word, index) => ({
      word,
      confidence: topResult.top3_confidences![index] || 0,
      emotion: topResult.emotion,
      expression: topResult.expression,
      face_detected: topResult.face_detected
    })) : displayResults.slice(0, 3);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-lg font-semibold">กำลังประมวลผล...</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-4 bg-muted rounded w-12"></div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-full bg-muted rounded-full w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!topResult) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>ยังไม่พบคำสัญญาณ</p>
          <p className="text-sm mt-1">ถ่ายภาพคำสัญญาณเพื่อดูผลการจดจำ</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header with real-time indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">ผลการจดจำ</h3>
          </div>
          {realTimeMode && topResult.timestamp && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTimestamp(topResult.timestamp)}</span>
            </div>
          )}
        </div>

        {/* Model Status Bar */}
        {topResult.modelStatus && (
          <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-1">
              <span>{getModelStatusIcon(topResult.modelStatus.hand)}</span>
              <span>Hand Model</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{getModelStatusIcon(topResult.modelStatus.face)}</span>
              <span>Face Model</span>
            </div>
            <div className="flex items-center gap-1">
              <span>{getModelStatusIcon(topResult.modelStatus.overall)}</span>
              <span>Overall: {topResult.modelStatus.overall}</span>
            </div>
          </div>
        )}

        {/* Top Result */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Hand className="h-6 w-6 text-primary" />
              <div>
                <h4 
                  className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors"
                  onClick={() => onWordSelect?.(topResult.word)}
                >
                  {topResult.word === "Unknown" ? "ไม่ทราบ" : topResult.word}
                </h4>
                <Badge variant="secondary" className="mt-1">
                  คำที่มีโอกาสสูงสุด
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.round(topResult.confidence * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">ความมั่นใจ</div>
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-3 mb-3">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${getConfidenceColor(getConfidenceLevel(topResult.confidence))}`}
              style={{ width: `${Math.min(topResult.confidence * 100, 100)}%` }}
            />
          </div>

          {/* Face Expression Display */}
          {topResult.face_detected && topResult.expression && (
            <div className="flex items-center gap-2 mt-3">
              <Smile className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">สีหน้า:</span>
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getEmotionColor(topResult.expression)}`}>
                <span className="text-lg">{getEmotionIcon(topResult.expression)}</span>
                <span>
                  {topResult.expression === "neutral" ? "เป็นกลาง" :
                   topResult.expression === "happy" ? "มีความสุข" :
                   topResult.expression === "sad" ? "เศร้า" :
                   topResult.expression === "surprised" ? "ประหลาดใจ" :
                   topResult.expression === "angry" ? "โกรธ" :
                   topResult.expression === "focused" ? "ตั้งใจ" :
                   topResult.expression === "calm" ? "สงบ" :
                   topResult.expression}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Top 3 Predictions */}
        {top3Results.length > 1 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              ตัวเลือกอื่น (Top 3)
            </h5>
            {top3Results.slice(1).map((result, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                onClick={() => onWordSelect?.(result.word)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-lg">
                    {result.word === "Unknown" ? "ไม่ทราบ" : result.word}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <div className="w-24">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${getConfidenceColor(getConfidenceLevel(result.confidence))}`}
                      style={{ width: `${Math.min(result.confidence * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Metrics */}
        {realTimeMode && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">ความแม่นยำ:</span>
                <span className="font-medium">{Math.round(topResult.confidence * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${topResult.confidence >= 0.8 ? 'text-green-500' : topResult.confidence >= 0.6 ? 'text-yellow-500' : 'text-red-500'}`} />
                <span className="text-muted-foreground">คุณภาพ:</span>
                <span className="font-medium">
                  {getConfidenceLevel(topResult.confidence) === 'high' ? 'สูง' : 
                   getConfidenceLevel(topResult.confidence) === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
