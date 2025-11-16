"use client";

import { useEffect, useRef } from "react";
import type { AlbumTheme } from "@/types";

interface AlbumThemeManagerProps {
  theme: AlbumTheme;
}

export function AlbumThemeManager({ theme }: AlbumThemeManagerProps) {
  const previousThemeRef = useRef<string | null>(null);

  useEffect(() => {
    // Save current theme to restore later
    const savedTheme = localStorage.getItem('data-theme');
    previousThemeRef.current = savedTheme;

    // Apply album-specific theme
    const resolveTheme = (albumTheme: AlbumTheme): string => {
      if (albumTheme === 'auto') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return albumTheme;
    };

    const resolvedTheme = resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Listen for system theme changes if theme is 'auto'
    let mediaQueryList: MediaQueryList | null = null;
    let handleChange: ((e: MediaQueryListEvent) => void) | null = null;

    if (theme === 'auto') {
      mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
      };
      mediaQueryList.addEventListener('change', handleChange);
    }

    // Cleanup: restore previous theme when leaving the album page
    return () => {
      if (mediaQueryList && handleChange) {
        mediaQueryList.removeEventListener('change', handleChange);
      }

      // Restore previous theme
      if (previousThemeRef.current) {
        document.documentElement.setAttribute('data-theme', previousThemeRef.current);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };
  }, [theme]);

  return null;
}
