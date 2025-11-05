"use client";

import React from 'react';
import { useTheme } from '@/contexts/theme-context';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StyleToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="text-muted-foreground hover:bg-transparent hover:text-foreground focus:ring-0 focus:ring-offset-0"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}