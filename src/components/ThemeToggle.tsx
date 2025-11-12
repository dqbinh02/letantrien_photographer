"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { ToggleButton, useTheme } from "@once-ui-system/core";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [currentTheme, setCurrentTheme] = useState("light");

  useEffect(() => {
    const htmlTheme = document.documentElement.getAttribute("data-theme") || "light";
    setCurrentTheme(htmlTheme);
  }, [theme]);

  const icon = currentTheme === "dark" ? "light" : "dark";
  const nextTheme = currentTheme === "light" ? "dark" : "light";

  return (
    <ToggleButton
      prefixIcon={icon}
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
    />
  );
};
