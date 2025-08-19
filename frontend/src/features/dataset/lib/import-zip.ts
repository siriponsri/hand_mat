// Dataset import functionality

import JSZip from 'jszip';
import { SignClass, Sample } from '@/types/dataset';

export interface ImportResult {
  classes: SignClass[];
  samples: Sample[];
  success: boolean;
  error?: string;
}

export async function importDataset(file: File): Promise<ImportResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    
    // Read class_map.json
    const classMapFile = zip.file('class_map.json');
    if (!classMapFile) {
      return { classes: [], samples: [], success: false, error: 'No class_map.json found' };
    }
    
    const classMapContent = await classMapFile.async('text');
    const classMap = JSON.parse(classMapContent);
    const classes: SignClass[] = classMap.classes;
    
    // Read images and reconstruct samples
    const samples: Sample[] = [];
    
    for (const cls of classes) {
      // Check train, val, and test folders
      for (const split of ['train', 'val', 'test']) {
        const folderPath = `dataset/${split}/${cls.slug}/`;
        
        // Get all files in the class folder
        const classFiles = Object.keys(zip.files).filter(path => 
          path.startsWith(folderPath) && 
          path.endsWith('.jpg') && 
          !zip.files[path].dir
        );
        
        for (const filePath of classFiles) {
          const file = zip.file(filePath);
          if (!file) continue;
          
          try {
            const arrayBuffer = await file.async('arraybuffer');
            const blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
            
            // Create sample with default values (metadata will be incomplete)
            const sample: Sample = {
              id: generateSampleId(),
              classId: cls.id,
              blob,
              w: 640, // Default values - we can't get actual dimensions without loading
              h: 480,
              ts: new Date().toISOString(),
              mirrored: false,
              blurVar: 100, // Default decent quality
              brightness: 128,
              motionScore: 5,
            };
            
            samples.push(sample);
          } catch (error) {
            console.warn(`Failed to import ${filePath}:`, error);
          }
        }
      }
    }
    
    return { classes, samples, success: true };
  } catch (error) {
    return { 
      classes: [], 
      samples: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

function generateSampleId(): string {
  return `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateZipFile(file: File): { valid: boolean; error?: string } {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    return { valid: false, error: 'File must be a ZIP archive' };
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB limit
    return { valid: false, error: 'ZIP file too large (max 100MB)' };
  }
  
  return { valid: true };
}