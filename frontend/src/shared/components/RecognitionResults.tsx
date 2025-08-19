import React from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, Award, Target, Smile, Hand } from 'lucide-react';

export interface RecognitionResult {
  word: string;
  confidence: number;
  emotion?: string;
  face_detected?: boolean;
  expression?: string;
}

interface RecognitionResultsProps {
  results: RecognitionResult[];
  isLoading: boolean;
}

export const RecognitionResults: React.FC<RecognitionResultsProps> = ({
  results,
  isLoading
}) => {
  const getConfidenceLevel = (confidence: number): 'low' | 'medium' | 'high' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-destructive';
    }
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

  const topResult = results[0];
  const otherResults = results.slice(1, 3);

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
                <div className="confidence-bar">
                  <div className="h-full bg-muted rounded-full w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
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
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">ผลการจดจำ</h3>
        </div>

        {/* Top Result */}
        {topResult && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Hand className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="text-2xl font-bold text-primary">
                    {topResult.word === "Unknown" ? "ไม่ทราบ" : topResult.word}
                  </h4>
                  <Badge variant="secondary" className="mt-1">
                    คำที่มีโอกาสสูงสุด
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {topResult.word === "Unknown" ? "10" : Math.round(topResult.confidence * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">ความมั่นใจ</div>
              </div>
            </div>
            
            <div className="confidence-bar mb-3">
              <div 
                className={`confidence-fill ${getConfidenceColor(getConfidenceLevel(topResult.confidence))}`}
                style={{ width: `${topResult.word === "Unknown" ? 10 : topResult.confidence * 100}%` }}
              />
            </div>

            {/* Face Expression Display */}
            {(topResult.expression || topResult.face_detected) && (
              <div className="flex items-center gap-2 mt-3">
                <Smile className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">สีหน้า:</span>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getEmotionColor(topResult.expression)}`}>
                  <span className="text-lg">{getEmotionIcon(topResult.expression)}</span>
                  <span>
                    {topResult.expression === "Unknown" ? "ไม่ทราบ" : 
                     topResult.expression === "neutral" ? "เป็นกลาง" :
                     topResult.expression === "happy" ? "มีความสุข" :
                     topResult.expression === "sad" ? "เศร้า" :
                     topResult.expression === "surprised" ? "ประหลาดใจ" :
                     topResult.expression === "angry" ? "โกรธ" :
                     topResult.expression === "focused" ? "ตั้งใจ" :
                     topResult.expression === "calm" ? "สงบ" :
                     topResult.expression || "ไม่ทราบ"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other Results */}
        {otherResults.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">ตัวเลือกอื่น</h5>
            {otherResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-lg">
                    {result.word === "Unknown" ? "ไม่ทราบ" : result.word}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {result.word === "Unknown" ? "10" : Math.round(result.confidence * 100)}%
                  </span>
                </div>
                <div className="w-24">
                  <div className="confidence-bar">
                    <div 
                      className={`confidence-fill ${getConfidenceColor(getConfidenceLevel(result.confidence))}`}
                      style={{ width: `${result.word === "Unknown" ? 10 : result.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Model Status Info */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Hand className="h-3 w-3" />
              <span>Hand Model: {topResult?.word === "Unknown" ? "ไม่พร้อมใช้งาน" : "พร้อมใช้งาน"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Smile className="h-3 w-3" />
              <span>Face Model: {topResult?.expression === "Unknown" || !topResult?.face_detected ? "ไม่พร้อมใช้งาน" : "พร้อมใช้งาน"}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
