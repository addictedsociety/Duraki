export type ThemeId = "default" | "emerald" | "crimson" | "royal";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  swatch: string;
}

export const THEMES: ThemeOption[] = [
  { id: "default", name: "Mitternacht", swatch: "oklch(0.62 0.19 265)" },
  { id: "emerald", name: "Smaragd", swatch: "oklch(0.7 0.16 160)" },
  { id: "crimson", name: "Karmesin", swatch: "oklch(0.62 0.22 20)" },
  { id: "royal", name: "Royal", swatch: "oklch(0.66 0.16 285)" },
];
