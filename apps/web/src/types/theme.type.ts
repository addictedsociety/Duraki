export type ThemeId =
  | "default"
  | "violet-bloom"
  | "vercel"
  | "twitter"
  | "tangerine"
  | "t3-chat"
  | "supabase"
  | "solar-dusk"
  | "mono"
  | "doom-64";

export type ColorMode = "light" | "dark" | "system";

export type ResolvedMode = "light" | "dark";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  swatch: string;
}

export const THEMES: ThemeOption[] = [
  { id: "violet-bloom", name: "Violet Bloom", swatch: "#8c5cff" },
  { id: "default", name: "Neutral", swatch: "#18181b" },
  { id: "vercel", name: "Vercel", swatch: "#000000" },
  { id: "twitter", name: "Twitter", swatch: "#1e9df1" },
  { id: "tangerine", name: "Tangerine", swatch: "#e05d38" },
  { id: "t3-chat", name: "T3 Chat", swatch: "#a84370" },
  { id: "supabase", name: "Supabase", swatch: "#3ecf8e" },
  { id: "solar-dusk", name: "Solar Dusk", swatch: "#b45309" },
  { id: "mono", name: "Mono", swatch: "#737373" },
  { id: "doom-64", name: "Doom 64", swatch: "#b71c1c" },
];

export const THEME_IDS: ThemeId[] = THEMES.map((theme) => theme.id);

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === "string" && THEME_IDS.includes(value as ThemeId);

export const isColorMode = (value: unknown): value is ColorMode =>
  value === "light" || value === "dark" || value === "system";
