// Titan/src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

// Accent palettes — each maps to the 400/500/600/700 CSS variables consumed by
// the Tailwind `accent-*` utilities defined in index.css.
export const ACCENT_PALETTES = {
  Cyan: { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490' },
  Blue: { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
  Green: { 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857' },
  Purple: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce' },
  Amber: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
};

const STORAGE_KEY = 'titan-appearance';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const applyAccent = (accentColor) => {
  const palette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.Cyan;
  const root = document.documentElement;
  root.style.setProperty('--accent-400', palette[400]);
  root.style.setProperty('--accent-500', palette[500]);
  root.style.setProperty('--accent-600', palette[600]);
  root.style.setProperty('--accent-700', palette[700]);
};

const applyCompact = (compact) => {
  document.documentElement.classList.toggle('compact', !!compact);
};

export const ThemeProvider = ({ children }) => {
  const stored = readStored();
  const [accentColor, setAccentColorState] = useState(stored.accentColor || 'Cyan');
  const [compactMode, setCompactModeState] = useState(Boolean(stored.compactMode));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(Boolean(stored.collapsedSidebar));

  // Apply + persist whenever a preference changes.
  useEffect(() => {
    applyAccent(accentColor);
  }, [accentColor]);

  useEffect(() => {
    applyCompact(compactMode);
  }, [compactMode]);

  useEffect(() => {
    const next = { accentColor, compactMode, collapsedSidebar: sidebarCollapsed };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  }, [accentColor, compactMode, sidebarCollapsed]);

  const setAccentColor = useCallback((color) => {
    if (ACCENT_PALETTES[color]) setAccentColorState(color);
  }, []);

  const setCompactMode = useCallback((value) => setCompactModeState(Boolean(value)), []);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((c) => !c), []);

  // Push a full appearance object (e.g. loaded from the server settings doc)
  // into the live theme. Falsy fields fall back to current values.
  const applyAppearance = useCallback((appearance) => {
    if (!appearance) return;
    if (appearance.accentColor) setAccentColorState(appearance.accentColor);
    if (typeof appearance.compactMode === 'boolean') setCompactModeState(appearance.compactMode);
    if (typeof appearance.collapsedSidebar === 'boolean') setSidebarCollapsed(appearance.collapsedSidebar);
  }, []);

  const value = {
    accentColor,
    setAccentColor,
    compactMode,
    setCompactMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    applyAppearance,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
