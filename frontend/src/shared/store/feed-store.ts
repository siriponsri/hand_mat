import { create } from 'zustand';
import { FeedItem, FeedState, FeedActions } from '../types/feed';
import { FEED } from '../config/app';

interface FeedStore extends FeedState, FeedActions {}

// Utility to estimate blob memory usage
const estimateBlobSize = (blob: Blob): number => {
  return blob.size / (1024 * 1024); // MB
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useFeedStore = create<FeedStore>((set, get) => ({
  // Initial state
  items: [],
  showThumbnails: FEED.ENABLE_THUMBS,
  memoryUsage: 0,

  // Actions
  addItem: (itemData) => {
    const item: FeedItem = {
      ...itemData,
      id: generateId(),
    };

    set((state) => {
      const newItems = [item, ...state.items];
      const newMemoryUsage = item.blob 
        ? state.memoryUsage + estimateBlobSize(item.blob)
        : state.memoryUsage;

      // Trim if exceeding max items
      let trimmedItems = newItems;
      let trimmedMemoryUsage = newMemoryUsage;

      if (newItems.length > FEED.MAX_ITEMS) {
        const itemsToRemove = newItems.slice(FEED.MAX_ITEMS);
        itemsToRemove.forEach(item => {
          if (item.thumbUrl) {
            URL.revokeObjectURL(item.thumbUrl);
          }
          if (item.blob) {
            trimmedMemoryUsage -= estimateBlobSize(item.blob);
          }
        });
        trimmedItems = newItems.slice(0, FEED.MAX_ITEMS);
      }

      return {
        items: trimmedItems,
        memoryUsage: trimmedMemoryUsage,
      };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const itemIndex = state.items.findIndex(item => item.id === id);
      if (itemIndex === -1) return state;

      const item = state.items[itemIndex];
      if (item.thumbUrl) {
        URL.revokeObjectURL(item.thumbUrl);
      }

      const newItems = state.items.filter(item => item.id !== id);
      const newMemoryUsage = item.blob 
        ? state.memoryUsage - estimateBlobSize(item.blob)
        : state.memoryUsage;

      return {
        items: newItems,
        memoryUsage: Math.max(0, newMemoryUsage),
      };
    });
  },

  updateItemLabel: (id, newLabel) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === id
          ? { ...item, used_label: newLabel, corrected: true }
          : item
      ),
    }));
  },

  togglePin: (id) => {
    set((state) => ({
      items: state.items.map(item =>
        item.id === id
          ? { ...item, pinned: !item.pinned }
          : item
      ),
    }));
  },

  clearFeed: () => {
    const { items } = get();
    items.forEach(item => {
      if (item.thumbUrl) {
        URL.revokeObjectURL(item.thumbUrl);
      }
    });

    set({
      items: [],
      memoryUsage: 0,
    });
  },

  setShowThumbnails: (show) => {
    set({ showThumbnails: show });
  },

  trimOldItems: () => {
    set((state) => {
      const unpinnedItems = state.items.filter(item => !item.pinned);
      const pinnedItems = state.items.filter(item => item.pinned);

      if (unpinnedItems.length <= FEED.MAX_ITEMS) return state;

      const itemsToKeep = Math.max(0, FEED.MAX_ITEMS - pinnedItems.length);
      const keptUnpinned = unpinnedItems.slice(0, itemsToKeep);
      const itemsToRemove = unpinnedItems.slice(itemsToKeep);

      // Revoke object URLs for removed items
      itemsToRemove.forEach(item => {
        if (item.thumbUrl) {
          URL.revokeObjectURL(item.thumbUrl);
        }
      });

      const newItems = [...keptUnpinned, ...pinnedItems].sort((a, b) => 
        new Date(b.ts).getTime() - new Date(a.ts).getTime()
      );

      const newMemoryUsage = itemsToRemove.reduce((total, item) => {
        return item.blob ? total - estimateBlobSize(item.blob) : total;
      }, state.memoryUsage);

      return {
        items: newItems,
        memoryUsage: Math.max(0, newMemoryUsage),
      };
    });
  },
}));