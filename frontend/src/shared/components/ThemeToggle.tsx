import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "segmented";
  size?: "sm" | "default";
}

export function ThemeToggle({ variant = "icon", size = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (variant === "segmented") {
    return (
      <div className="flex rounded-lg bg-muted p-1">
        <Button
          variant={theme === "light" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme("light")}
          className="rounded-md px-3"
          aria-label="Switch to light theme"
        >
          <Sun className="h-4 w-4" />
          <span className="ml-2">Light</span>
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme("dark")}
          className="rounded-md px-3"
          aria-label="Switch to dark theme"
        >
          <Moon className="h-4 w-4" />
          <span className="ml-2">Dark</span>
        </Button>
        <Button
          variant={theme === "system" ? "default" : "ghost"}
          size="sm"
          onClick={() => setTheme("system")}
          className="rounded-md px-3"
          aria-label="Switch to system theme"
        >
          <Monitor className="h-4 w-4" />
          <span className="ml-2">System</span>
        </Button>
      </div>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={cycleTheme}
      aria-label="Toggle theme"
      className="relative"
    >
      {getIcon()}
    </Button>
  );
}