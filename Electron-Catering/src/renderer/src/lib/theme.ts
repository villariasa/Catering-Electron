export interface ThemePalette {
  id: string;
  name: string;
  category: string;
  mode: 'dark' | 'light';
  primary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  inputBg: string;
}

export const THEME_CATEGORIES = [
  "Mood/Tone-based",
  "Nature-inspired",
  "Color-driven",
  "Vibe-based",
  "Seasonal"
];

export const THEME_PALETTES: Record<string, ThemePalette> = {
  // Mood / Tone
  dark_mode: { id: "dark_mode", name: "Dark Mode", category: "Mood/Tone-based", mode: "dark", primary: "#E11D48", background: "#0F172A", surface: "#1E293B", textPrimary: "#F8FAFC", textSecondary: "#94A3B8", border: "#334155", inputBg: "#0F172A" },
  light_mode: { id: "light_mode", name: "Light Mode", category: "Mood/Tone-based", mode: "light", primary: "#E11D48", background: "#F1F5F9", surface: "#FFFFFF", textPrimary: "#0F172A", textSecondary: "#64748B", border: "#CBD5E1", inputBg: "#FFFFFF" },
  midnight: { id: "midnight", name: "Midnight Deep Dark", category: "Mood/Tone-based", mode: "dark", primary: "#6366F1", background: "#05070E", surface: "#0C101D", textPrimary: "#F8FAFC", textSecondary: "#818CF8", border: "#1E293B", inputBg: "#070A12" },
  daylight: { id: "daylight", name: "Daylight Bright", category: "Mood/Tone-based", mode: "light", primary: "#0284C7", background: "#F0F9FF", surface: "#FFFFFF", textPrimary: "#0C4A6E", textSecondary: "#0284C7", border: "#BAE6FD", inputBg: "#FFFFFF" },
  twilight: { id: "twilight", name: "Twilight", category: "Mood/Tone-based", mode: "dark", primary: "#A855F7", background: "#120E1E", surface: "#1E1830", textPrimary: "#FAF5FF", textSecondary: "#C084FC", border: "#3B2D54", inputBg: "#140F21" },
  high_contrast: { id: "high_contrast", name: "High Contrast", category: "Mood/Tone-based", mode: "dark", primary: "#FACC15", background: "#000000", surface: "#0A0A0A", textPrimary: "#FFFFFF", textSecondary: "#FDE047", border: "#FACC15", inputBg: "#000000" },

  // Nature
  ocean_blue: { id: "ocean_blue", name: "Ocean Blue", category: "Nature-inspired", mode: "dark", primary: "#0EA5E9", background: "#0A192F", surface: "#112240", textPrimary: "#F0F9FF", textSecondary: "#7DD3FC", border: "#233D60", inputBg: "#0C1B33" },
  forest_green: { id: "forest_green", name: "Forest Green", category: "Nature-inspired", mode: "dark", primary: "#10B981", background: "#061A14", surface: "#0C2E24", textPrimary: "#ECFDF5", textSecondary: "#6EE7B7", border: "#1A4D3E", inputBg: "#08211A" },
  sunset_orange: { id: "sunset_orange", name: "Sunset Orange", category: "Nature-inspired", mode: "dark", primary: "#F97316", background: "#1A0F0A", surface: "#2D1B13", textPrimary: "#FFF7ED", textSecondary: "#FDBA74", border: "#4D2F22", inputBg: "#1F120C" },
  aurora: { id: "aurora", name: "Aurora Teal", category: "Nature-inspired", mode: "dark", primary: "#2DD4BF", background: "#04151B", surface: "#0C2932", textPrimary: "#F0FDFA", textSecondary: "#5EEAD4", border: "#1B4F5E", inputBg: "#071D25" },
  coral_reef: { id: "coral_reef", name: "Coral Reef", category: "Nature-inspired", mode: "dark", primary: "#FB7185", background: "#1A0E14", surface: "#2C1722", textPrimary: "#FFF1F2", textSecondary: "#FDA4AF", border: "#4E2B3C", inputBg: "#201119" },

  // Color Driven
  royal_purple: { id: "royal_purple", name: "Royal Purple", category: "Color-driven", mode: "dark", primary: "#9333EA", background: "#130A24", surface: "#20123A", textPrimary: "#FAF5FF", textSecondary: "#D8B4FE", border: "#3E246C", inputBg: "#180D2D" },
  ruby_red: { id: "ruby_red", name: "Ruby Red", category: "Color-driven", mode: "dark", primary: "#DC2626", background: "#180A0A", surface: "#2A1212", textPrimary: "#FEF2F2", textSecondary: "#FCA5A5", border: "#4F2121", inputBg: "#1F0D0D" },
  emerald: { id: "emerald", name: "Emerald Catering", category: "Color-driven", mode: "dark", primary: "#059669", background: "#061A14", surface: "#0F2E23", textPrimary: "#ECFDF5", textSecondary: "#6EE7B7", border: "#1E5844", inputBg: "#0A221A" },
  amber_gold: { id: "amber_gold", name: "Amber Gold", category: "Color-driven", mode: "dark", primary: "#F59E0B", background: "#1A1408", surface: "#2C220E", textPrimary: "#FFFBEB", textSecondary: "#FCD34D", border: "#523F1A", inputBg: "#21190A" },
  rose_gold: { id: "rose_gold", name: "Rose Gold Light", category: "Color-driven", mode: "light", primary: "#E11D48", background: "#FFF5F7", surface: "#FFE4E8", textPrimary: "#881337", textSecondary: "#BE123C", border: "#FDA4AF", inputBg: "#FFFFFF" },

  // Vibe Based
  cyberpunk: { id: "cyberpunk", name: "Cyberpunk Neon", category: "Vibe-based", mode: "dark", primary: "#00F0FF", background: "#050510", surface: "#0C0C24", textPrimary: "#00F0FF", textSecondary: "#FF007F", border: "#00F0FF", inputBg: "#08081A" },
  minimalist: { id: "minimalist", name: "Minimalist Light", category: "Vibe-based", mode: "light", primary: "#18181B", background: "#FAFAFA", surface: "#FFFFFF", textPrimary: "#18181B", textSecondary: "#71717A", border: "#E4E4E7", inputBg: "#F4F4F5" },
  pastel: { id: "pastel", name: "Pastel Lavender", category: "Vibe-based", mode: "light", primary: "#818CF8", background: "#FAF5FF", surface: "#F3E8FF", textPrimary: "#3B0764", textSecondary: "#7E22CE", border: "#D8B4FE", inputBg: "#FFFFFF" },

  // Seasonal
  spring_bloom: { id: "spring_bloom", name: "Spring Bloom", category: "Seasonal", mode: "light", primary: "#EC4899", background: "#FDF2F8", surface: "#FCE7F3", textPrimary: "#831843", textSecondary: "#DB2777", border: "#F9A8D4", inputBg: "#FFFFFF" },
  summer_breeze: { id: "summer_breeze", name: "Summer Breeze", category: "Seasonal", mode: "light", primary: "#06B6D4", background: "#ECFEFF", surface: "#CFFAFE", textPrimary: "#164E63", textSecondary: "#0891B2", border: "#67E8F9", inputBg: "#FFFFFF" },
  winter_frost: { id: "winter_frost", name: "Winter Frost", category: "Seasonal", mode: "dark", primary: "#67E8F9", background: "#071724", surface: "#0E2A3E", textPrimary: "#F0FDFA", textSecondary: "#A5F3FC", border: "#215378", inputBg: "#091D2E" }
};

export function applyThemePalette(paletteId: string) {
  const pal = THEME_PALETTES[paletteId] || THEME_PALETTES.dark_mode;
  const root = document.documentElement;

  root.style.setProperty('--bg-primary', pal.background);
  root.style.setProperty('--bg-surface', pal.surface);
  root.style.setProperty('--color-primary', pal.primary);
  root.style.setProperty('--text-primary', pal.textPrimary);
  root.style.setProperty('--text-secondary', pal.textSecondary);
  root.style.setProperty('--border-color', pal.border);
  root.style.setProperty('--input-bg', pal.inputBg);
  root.style.setProperty('--icon-filter', pal.mode === 'dark' ? 'invert(0.9)' : 'invert(0.2)');

  if (pal.mode === 'light') {
    root.classList.add('theme-light');
    root.classList.remove('theme-dark');
  } else {
    root.classList.add('theme-dark');
    root.classList.remove('theme-light');
  }

  localStorage.setItem('selected_theme_id', paletteId);
}
