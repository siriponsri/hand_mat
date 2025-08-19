import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { settingsManager } from '@/services/settings';
import { EXPORT } from '@/config';
import { Settings, Sun, Moon, Computer, RotateCcw } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMirrorPreviewChange: (enabled: boolean) => void;
  onMirrorCaptureChange: (enabled: boolean) => void;
  onStabilityMsChange: (ms: number) => void;
  onCooldownMsChange: (ms: number) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onOpenChange,
  onMirrorPreviewChange,
  onMirrorCaptureChange,
  onStabilityMsChange,
  onCooldownMsChange,
}) => {
  const [mirrorPreview, setMirrorPreview] = useState(settingsManager.mirrorPreview);
  const [mirrorCapture, setMirrorCapture] = useState(settingsManager.mirrorCapture);
  const [stabilityMs, setStabilityMs] = useState(settingsManager.stabilityMs);
  const [cooldownMs, setCooldownMs] = useState(settingsManager.cooldownMs);
  const [autoCaptureDelay, setAutoCaptureDelay] = useState(settingsManager.autoCaptureDelay);
  const [requireFace, setRequireFace] = useState(settingsManager.requireFace);
  const [splitSeed, setSplitSeed] = useState(
    localStorage.getItem('handmat_split_seed') || EXPORT.SEED_DEFAULT
  );

  const { theme, setTheme } = useTheme();

  const handleMirrorPreviewChange = (checked: boolean) => {
    setMirrorPreview(checked);
    settingsManager.mirrorPreview = checked;
    onMirrorPreviewChange(checked);
  };

  const handleMirrorCaptureChange = (checked: boolean) => {
    setMirrorCapture(checked);
    settingsManager.mirrorCapture = checked;
    onMirrorCaptureChange(checked);
  };

  const handleStabilityMsChange = (value: number[]) => {
    const ms = value[0];
    setStabilityMs(ms);
    settingsManager.stabilityMs = ms;
    onStabilityMsChange(ms);
  };

  const handleCooldownMsChange = (value: number[]) => {
    const ms = value[0];
    setCooldownMs(ms);
    settingsManager.cooldownMs = ms;
    onCooldownMsChange(ms);
  };

  const handleAutoCaptureDelayChange = (value: number[]) => {
    const ms = value[0];
    setAutoCaptureDelay(ms);
    settingsManager.autoCaptureDelay = ms;
  };

  const handleRequireFaceChange = (checked: boolean) => {
    setRequireFace(checked);
    settingsManager.requireFace = checked;
  };

  const handleSplitSeedChange = (value: string) => {
    setSplitSeed(value);
    localStorage.setItem('handmat_split_seed', value);
  };

  const resetToDefaults = () => {
    handleMirrorPreviewChange(true);
    handleMirrorCaptureChange(false);
    handleStabilityMsChange([300]);
    handleCooldownMsChange([1500]);
    handleAutoCaptureDelayChange([2000]);
    handleRequireFaceChange(true);
    setSplitSeed(EXPORT.SEED_DEFAULT);
    
    // Update settings manager
    settingsManager.mirrorPreview = true;
    settingsManager.mirrorCapture = false;
    settingsManager.stabilityMs = 300;
    settingsManager.cooldownMs = 1500;
    settingsManager.autoCaptureDelay = 2000;
    settingsManager.requireFace = true;
    localStorage.setItem('handmat_split_seed', EXPORT.SEED_DEFAULT);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-surface border-border">
        <SheetHeader>
          <SheetTitle className="text-text">HandMat Settings</SheetTitle>
          <SheetDescription>
            Configure theme, camera mirroring and face detection behavior
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Theme Settings */}
          <Card className="p-4 bg-surface border-border">
            <h3 className="text-lg font-semibold mb-4 text-text">Theme</h3>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                <Computer className="h-4 w-4 mr-2" />
                System
              </Button>
            </div>
          </Card>

          {/* Camera Settings */}
          <Card className="p-4 bg-surface border-border">
            <h3 className="text-lg font-semibold mb-4 text-text">Camera Settings</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mirror-preview" className="text-text">Mirror Preview</Label>
                  <p className="text-sm text-muted-foreground">
                    Horizontally flip the camera preview (like a mirror)
                  </p>
                </div>
                <Switch
                  id="mirror-preview"
                  checked={mirrorPreview}
                  onCheckedChange={handleMirrorPreviewChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mirror-capture" className="text-text">Mirror Captured Frames</Label>
                  <p className="text-sm text-muted-foreground">
                    Also flip images sent to the backend for recognition
                  </p>
                </div>
                <Switch
                  id="mirror-capture"
                  checked={mirrorCapture}
                  onCheckedChange={handleMirrorCaptureChange}
                />
              </div>
            </div>
          </Card>

          {/* Auto-Capture Settings */}
          <Card className="p-4 bg-surface border-border">
            <h3 className="text-lg font-semibold mb-4 text-text">Auto-Capture</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require-face" className="text-text">Require Face for Capture</Label>
                  <p className="text-sm text-muted-foreground">
                    Require both face and hand detection for auto-capture
                  </p>
                </div>
                <Switch
                  id="require-face"
                  checked={requireFace}
                  onCheckedChange={handleRequireFaceChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-capture-delay" className="text-text">
                  Auto-Capture Delay: {autoCaptureDelay}ms
                </Label>
                <p className="text-sm text-muted-foreground">
                  Countdown duration before automatic capture
                </p>
                <Slider
                  id="auto-capture-delay"
                  min={1000}
                  max={5000}
                  step={250}
                  value={[autoCaptureDelay]}
                  onValueChange={handleAutoCaptureDelayChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stability-ms" className="text-text">
                  Stability Duration: {stabilityMs}ms
                </Label>
                <p className="text-sm text-muted-foreground">
                  How long detection must be stable before countdown
                </p>
                <Slider
                  id="stability-ms"
                  min={100}
                  max={1000}
                  step={50}
                  value={[stabilityMs]}
                  onValueChange={handleStabilityMsChange}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown-ms" className="text-text">
                  Cooldown Duration: {cooldownMs}ms
                </Label>
                <p className="text-sm text-muted-foreground">
                  Delay between auto-captures to prevent rapid firing
                </p>
                <Slider
                  id="cooldown-ms"
                  min={500}
                  max={5000}
                  step={250}
                  value={[cooldownMs]}
                  onValueChange={handleCooldownMsChange}
                  className="w-full"
                />
                </div>
              </div>
            </Card>

            {/* Export Settings */}
            <Card className="p-4 bg-surface border-border">
              <h3 className="text-lg font-semibold mb-4 text-text">Export Settings</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="split-seed">Split Seed</Label>
                  <Input
                    id="split-seed"
                    value={splitSeed}
                    onChange={(e) => handleSplitSeedChange(e.target.value)}
                    placeholder="Enter seed for reproducible splits"
                  />
                  <p className="text-xs text-muted-foreground">
                    Same seed produces identical train/val/test splits
                  </p>
                </div>
              </div>
            </Card>

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};