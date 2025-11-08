"use client";

import { useEffect } from "react";
import { style, dataStyle } from "@/resources";

export function ThemeInitScript() {
  useEffect(() => {
    const root = document.documentElement;
    
    const config = {
      brand: style.brand,
      accent: style.accent,
      neutral: style.neutral,
      solid: style.solid,
      "solid-style": style.solidStyle,
      border: style.border,
      surface: style.surface,
      transition: style.transition,
      scaling: style.scaling,
      "viz-style": dataStyle.variant,
    };

    for (const [key, value] of Object.entries(config)) {
      root.setAttribute(`data-${key}`, value);
    }

    const resolveTheme = (themeValue: string | null) => {
      if (!themeValue || themeValue === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return themeValue;
    };

    const savedTheme = localStorage.getItem('data-theme');
    const resolvedTheme = resolveTheme(savedTheme);
    root.setAttribute('data-theme', resolvedTheme);

    const styleKeys = Object.keys(config);
    for (const key of styleKeys) {
      const value = localStorage.getItem(`data-${key}`);
      if (value) {
        root.setAttribute(`data-${key}`, value);
      }
    }
  }, []);

  return null;
}
