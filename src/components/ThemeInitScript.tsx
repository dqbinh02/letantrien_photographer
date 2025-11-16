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

    // Apply default config values
    for (const [key, value] of Object.entries(config)) {
      root.setAttribute(`data-${key}`, value);
    }

    // Ensure light theme is default
    const savedTheme = localStorage.getItem('data-theme');
    if (!savedTheme) {
      localStorage.setItem('data-theme', 'light');
      root.setAttribute('data-theme', 'light');
    } else {
      root.setAttribute('data-theme', savedTheme);
    }

    // Load saved style preferences from localStorage
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
