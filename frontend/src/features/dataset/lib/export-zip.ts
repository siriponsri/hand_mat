// Dataset export functionality using JSZip

import JSZip from 'jszip';
import { SignClass, Sample, DatasetMetadata, DatasetSplit } from '@/types/dataset';
import { EXPORT } from '@/config';
import { createSplitIndices } from './seededShuffle';

export async function exportDataset(
  classes: SignClass[],
  samples: Sample[],
  splitSeed: string = EXPORT.SEED_DEFAULT
): Promise<Blob> {
  const zip = new JSZip();
  
  // Create deterministic dataset split using seed
  const splits = createDatasetSplit(samples, splitSeed);
  
  // Group samples by class
  const samplesByClass = groupSamplesByClass(samples);
  
  // Create folder structure and add images
  const metadata: DatasetMetadata[] = [];
  
  for (const [classId, classSamples] of Object.entries(samplesByClass)) {
    const signClass = classes.find(c => c.id === classId);
    if (!signClass) continue;
    
    // Get deterministic split indices for this class
    const splitIndices = createSplitIndices(classSamples.length, EXPORT.SPLIT, `${splitSeed}_${classId}`);
    
    const trainSamples = splitIndices.train.map(i => classSamples[i]);
    const valSamples = splitIndices.val.map(i => classSamples[i]);
    const testSamples = splitIndices.test.map(i => classSamples[i]);
    
    // Add train samples
    await addSamplesToZip(zip, 'train', signClass, trainSamples, metadata, splitSeed);
    
    // Add validation samples
    await addSamplesToZip(zip, 'val', signClass, valSamples, metadata, splitSeed);
    
    // Add test samples
    await addSamplesToZip(zip, 'test', signClass, testSamples, metadata, splitSeed);
  }
  
  // Add metadata.csv
  const csvContent = generateMetadataCSV(metadata, splitSeed);
  zip.file('metadata.csv', csvContent);
  
  // Add class_map.json
  const classMap = {
    classes: classes.map((cls, index) => ({
      id: cls.id,
      slug: cls.slug,
      label_th: cls.label_th,
      label_en: cls.label_en,
      index,
      color: cls.color,
      icon: cls.icon,
    })),
    total_classes: classes.length,
  };
  zip.file('class_map.json', JSON.stringify(classMap, null, 2));
  
  // Add README.txt
  const readme = generateReadme(classes, samples.length, splitSeed);
  zip.file('README.txt', readme);
  
  // Generate and return zip
  return await zip.generateAsync({ type: 'blob' });
}

function createDatasetSplit(samples: Sample[], splitSeed: string): Record<string, { train: number; val: number; test: number }> {
  // Note: This function is kept for compatibility but actual splitting 
  // is now done deterministically in the main export function
  const samplesByClass = groupSamplesByClass(samples);
  const splits: Record<string, { train: number; val: number; test: number }> = {};
  
  for (const [classId, classSamples] of Object.entries(samplesByClass)) {
    const total = classSamples.length;
    const trainCount = Math.floor(total * EXPORT.SPLIT.train);
    const valCount = Math.floor(total * EXPORT.SPLIT.val);
    const testCount = total - trainCount - valCount;
    
    splits[classId] = {
      train: trainCount,
      val: valCount,
      test: testCount,
    };
  }
  
  return splits;
}

function groupSamplesByClass(samples: Sample[]): Record<string, Sample[]> {
  return samples.reduce((acc, sample) => {
    if (!acc[sample.classId]) {
      acc[sample.classId] = [];
    }
    acc[sample.classId].push(sample);
    return acc;
  }, {} as Record<string, Sample[]>);
}

async function addSamplesToZip(
  zip: JSZip,
  split: string,
  signClass: SignClass,
  samples: Sample[],
  metadata: DatasetMetadata[],
  splitSeed: string
): Promise<void> {
  const folder = zip.folder(`dataset/${split}/${signClass.slug}`);
  if (!folder) return;
  
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const filename = `${signClass.slug}_${i.toString().padStart(4, '0')}.jpg`;
    const filePath = `dataset/${split}/${signClass.slug}/${filename}`;
    
    // Convert blob to array buffer
    const arrayBuffer = await sample.blob.arrayBuffer();
    folder.file(filename, arrayBuffer);
    
    // Add to metadata
    metadata.push({
      file_path: filePath,
      class_id: sample.classId,
      class_slug: signClass.slug,
      label_th: signClass.label_th,
      label_en: signClass.label_en,
      ts_utc: sample.ts,
      blur_var: sample.blurVar,
      brightness: sample.brightness,
      mirrored: sample.mirrored,
      width: sample.w,
      height: sample.h,
      device_info: navigator.userAgent,
      split_seed: splitSeed,
    });
  }
}

function generateMetadataCSV(metadata: DatasetMetadata[], splitSeed: string): string {
  const headers = [
    'file_path',
    'class_id',
    'class_slug',
    'label_th',
    'label_en',
    'ts_utc',
    'blur_var',
    'brightness',
    'mirrored',
    'width',
    'height',
    'device_info',
    'split_seed',
  ];
  
  const rows = metadata.map(row => [
    row.file_path,
    row.class_id,
    row.class_slug,
    row.label_th,
    row.label_en,
    row.ts_utc,
    row.blur_var.toString(),
    row.brightness.toString(),
    row.mirrored.toString(),
    row.width.toString(),
    row.height.toString(),
    `"${row.device_info}"`, // Quote device info to handle commas
    row.split_seed,
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function generateReadme(classes: SignClass[], totalSamples: number, splitSeed: string): string {
  return `# Sign Language Dataset

This dataset was created using HandMat, a privacy-first sign language data collection tool.

## Dataset Structure

\`\`\`
dataset/
├── train/          # Training data (${Math.round(EXPORT.SPLIT.train * 100)}%)
├── val/            # Validation data (${Math.round(EXPORT.SPLIT.val * 100)}%)
└── test/           # Test data (${Math.round(EXPORT.SPLIT.test * 100)}%)

Each split contains folders named by class slug:
${classes.map(cls => `├── ${cls.slug}/     # ${cls.label_en} (${cls.label_th})`).join('\n')}
\`\`\`

## Files

- **metadata.csv**: Complete metadata for all samples
- **class_map.json**: Class definitions and mappings
- **README.txt**: This file

## Statistics

- **Total Classes**: ${classes.length}
- **Total Samples**: ${totalSamples}
- **Average per Class**: ${Math.round(totalSamples / classes.length)}

## Training with Teachable Machine

1. Visit https://teachablemachine.withgoogle.com/train/image
2. Create a new image project
3. For each class, click "Upload" and select all images from that class folder
4. Train your model
5. Export for your platform (TensorFlow.js, TensorFlow Lite, etc.)

## Training with TensorFlow/Keras

This dataset follows standard computer vision folder structure. You can use:

- **tf.keras.preprocessing.image.ImageDataGenerator**
- **tf.data.Dataset.from_directory**
- **torchvision.datasets.ImageFolder** (PyTorch)

## Reproducibility

This dataset was created with deterministic splitting using seed: \`${splitSeed}\`
Exporting with the same seed will produce identical train/validation/test splits.

## Data Quality

All samples include quality metrics:
- **Blur variance**: Higher values indicate sharper images
- **Brightness**: Luminance value (0-255)
- **Motion score**: Lower values indicate less motion blur

## Privacy

This dataset was created entirely client-side. No images were sent to servers during collection.

Generated by HandMat v1.0
${new Date().toISOString()}
`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}