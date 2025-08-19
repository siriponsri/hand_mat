import { DETECT, STORAGE_KEYS, MIRROR } from '@/config';

export class SettingsManager {
  private static instance: SettingsManager;
  private settings: Map<string, any> = new Map();

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  private loadSettings(): void {
    // Load from localStorage with defaults
    this.settings.set(STORAGE_KEYS.MIRROR_PREVIEW, 
      this.getStoredBoolean(STORAGE_KEYS.MIRROR_PREVIEW, MIRROR.PREVIEW));
    
    this.settings.set(STORAGE_KEYS.MIRROR_CAPTURE, 
      this.getStoredBoolean(STORAGE_KEYS.MIRROR_CAPTURE, MIRROR.CAPTURE));
    
    this.settings.set(STORAGE_KEYS.STABILITY_MS, 
      this.getStoredNumber(STORAGE_KEYS.STABILITY_MS, DETECT.STABILITY_MS));
    
    this.settings.set(STORAGE_KEYS.COOLDOWN_MS, 
      this.getStoredNumber(STORAGE_KEYS.COOLDOWN_MS, DETECT.COOLDOWN_MS));

    this.settings.set(STORAGE_KEYS.AUTO_CAPTURE_DELAY_MS, 
      this.getStoredNumber(STORAGE_KEYS.AUTO_CAPTURE_DELAY_MS, DETECT.AUTO_CAPTURE_DELAY_MS));
    
    this.settings.set(STORAGE_KEYS.REQUIRE_FACE, 
      this.getStoredBoolean(STORAGE_KEYS.REQUIRE_FACE, DETECT.REQUIRE_FACE_FOR_CAPTURE));
  }

  private getStoredBoolean(key: string, defaultValue: boolean): boolean {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === 'true' : defaultValue;
  }

  private getStoredNumber(key: string, defaultValue: number): number {
    const stored = localStorage.getItem(key);
    return stored !== null ? parseInt(stored, 10) : defaultValue;
  }

  get<T>(key: string): T {
    return this.settings.get(key) as T;
  }

  set(key: string, value: any): void {
    this.settings.set(key, value);
    localStorage.setItem(key, value.toString());
  }

  // Convenience getters
  get mirrorPreview(): boolean {
    return this.get<boolean>(STORAGE_KEYS.MIRROR_PREVIEW);
  }

  set mirrorPreview(value: boolean) {
    this.set(STORAGE_KEYS.MIRROR_PREVIEW, value);
  }

  get mirrorCapture(): boolean {
    return this.get<boolean>(STORAGE_KEYS.MIRROR_CAPTURE);
  }

  set mirrorCapture(value: boolean) {
    this.set(STORAGE_KEYS.MIRROR_CAPTURE, value);
  }

  get stabilityMs(): number {
    return this.get<number>(STORAGE_KEYS.STABILITY_MS);
  }

  set stabilityMs(value: number) {
    this.set(STORAGE_KEYS.STABILITY_MS, value);
  }

  get cooldownMs(): number {
    return this.get<number>(STORAGE_KEYS.COOLDOWN_MS);
  }

  set cooldownMs(value: number) {
    this.set(STORAGE_KEYS.COOLDOWN_MS, value);
  }

  get autoCaptureDelay(): number {
    return this.get<number>(STORAGE_KEYS.AUTO_CAPTURE_DELAY_MS);
  }

  set autoCaptureDelay(value: number) {
    this.set(STORAGE_KEYS.AUTO_CAPTURE_DELAY_MS, value);
  }

  get requireFace(): boolean {
    return this.get<boolean>(STORAGE_KEYS.REQUIRE_FACE);
  }

  set requireFace(value: boolean) {
    this.set(STORAGE_KEYS.REQUIRE_FACE, value);
  }
}

export const settingsManager = SettingsManager.getInstance();