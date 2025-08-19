export interface FeedItem {
  id: string;
  thumbUrl: string;         // created via URL.createObjectURL(blob)
  blob?: Blob;              // optional, for download
  used_label: string;       // final label in use
  top3?: { label: string; prob: number }[];
  confidence?: number;      // 0..1
  ts: string;               // ISO
  corrected?: boolean;      // true if user picked alternative
  pinned?: boolean;         // prevents trimming
}

export interface FeedState {
  items: FeedItem[];
  showThumbnails: boolean;
  memoryUsage: number;      // estimated MB
}

export interface FeedActions {
  addItem: (item: Omit<FeedItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItemLabel: (id: string, newLabel: string) => void;
  togglePin: (id: string) => void;
  clearFeed: () => void;
  setShowThumbnails: (show: boolean) => void;
  trimOldItems: () => void;
}