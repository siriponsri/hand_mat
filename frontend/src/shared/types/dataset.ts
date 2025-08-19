// Dataset types for manual capture workflow

export interface Sample {
  id: string;
  classId: string;
  blob: Blob;
  w: number;
  h: number;
  ts: string;
  mirrored: boolean;
  blurVar: number;
  brightness: number;
  motionScore: number;
}

export interface SignClass {
  id: string;
  slug: string;
  label_th: string;
  label_en: string;
  color?: string;
  icon?: string;
}

export interface QualityMetrics {
  blurVar: number;
  brightness: number;
  motionScore: number;
}

export interface DatasetMetadata {
  file_path: string;
  class_id: string;
  class_slug: string;
  label_th: string;
  label_en: string;
  ts_utc: string;
  blur_var: number;
  brightness: number;
  mirrored: boolean;
  width: number;
  height: number;
  device_info: string;
  split_seed: string;
}

export interface DatasetSplit {
  train: number;
  val: number;
  test: number;
}

export interface DatasetExport {
  classes: SignClass[];
  samples: Sample[];
  split: DatasetSplit;
  metadata: DatasetMetadata[];
}

export type QualityStatus = 'good' | 'warning' | 'poor';

export interface QualityThresholds {
  BLUR_MIN: number;
  BRIGHTNESS_MIN: number;
  BRIGHTNESS_MAX: number;
  MOTION_MAX: number;
}