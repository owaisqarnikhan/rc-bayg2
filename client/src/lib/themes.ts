// Predefined theme configurations
export const themes = {
  default: {
    name: "Default Blue",
    description: "Classic blue theme",
    primary: "#2563eb",      // Blue 600
    secondary: "#64748b",    // Slate 500
    accent: "#0ea5e9",       // Sky 500
    background: "#ffffff",    // White
    text: "#1e293b",         // Slate 800
    cssVars: {
      '--primary': 'hsl(218, 82%, 58%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(210, 40%, 50%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(199, 89%, 48%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  ocean: {
    name: "Ocean Blue",
    description: "Deep ocean blues and teals",
    primary: "#0f766e",      // Teal 700
    secondary: "#0891b2",    // Cyan 600
    accent: "#06b6d4",       // Cyan 500
    background: "#f0fdfa",   // Teal 50
    text: "#134e4a",         // Teal 800
    cssVars: {
      '--primary': 'hsl(178, 78%, 25%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(192, 85%, 34%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(188, 96%, 43%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  forest: {
    name: "Forest Green",
    description: "Natural greens and earth tones",
    primary: "#15803d",      // Green 700
    secondary: "#65a30d",    // Lime 600
    accent: "#22c55e",       // Green 500
    background: "#f0fdf4",   // Green 50
    text: "#14532d",         // Green 800
    cssVars: {
      '--primary': 'hsl(142, 76%, 29%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(76, 85%, 34%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(142, 71%, 45%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  sunset: {
    name: "Sunset Orange",
    description: "Warm oranges and yellows",
    primary: "#ea580c",      // Orange 600
    secondary: "#f59e0b",    // Amber 500
    accent: "#facc15",       // Yellow 400
    background: "#fffbeb",   // Amber 50
    text: "#92400e",         // Amber 800
    cssVars: {
      '--primary': 'hsl(24, 90%, 48%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(45, 93%, 47%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(50, 98%, 53%)',
      '--accent-foreground': 'hsl(30, 100%, 20%)'
    }
  },
  midnight: {
    name: "Midnight Dark",
    description: "Dark theme with purple accents",
    primary: "#7c3aed",      // Violet 600
    secondary: "#6366f1",    // Indigo 500
    accent: "#a855f7",       // Purple 500
    background: "#0f0f23",   // Very dark blue
    text: "#e2e8f0",         // Slate 200
    cssVars: {
      '--primary': 'hsl(258, 84%, 56%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(239, 84%, 67%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(283, 89%, 64%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  coral: {
    name: "Coral Pink",
    description: "Soft pinks and corals",
    primary: "#ec4899",      // Pink 500
    secondary: "#f97316",    // Orange 500
    accent: "#fb7185",       // Rose 400
    background: "#fef7f7",   // Rose 50
    text: "#881337",         // Rose 900
    cssVars: {
      '--primary': 'hsl(330, 81%, 60%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(27, 96%, 53%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(351, 95%, 71%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  violet: {
    name: "Royal Violet",
    description: "Rich purples and violets",
    primary: "#9333ea",      // Purple 600
    secondary: "#8b5cf6",    // Violet 500
    accent: "#c084fc",       // Purple 400
    background: "#faf5ff",   // Purple 50
    text: "#581c87",         // Purple 900
    cssVars: {
      '--primary': 'hsl(283, 84%, 56%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(258, 90%, 66%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(283, 95%, 76%)',
      '--accent-foreground': 'hsl(283, 100%, 25%)'
    }
  },
  emerald: {
    name: "Emerald Luxury",
    description: "Rich emeralds and gold accents",
    primary: "#059669",      // Emerald 600
    secondary: "#0d9488",    // Teal 600
    accent: "#10b981",       // Emerald 500
    background: "#ecfdf5",   // Emerald 50
    text: "#064e3b",         // Emerald 900
    cssVars: {
      '--primary': 'hsl(158, 94%, 30%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(178, 84%, 32%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(158, 84%, 38%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  ruby: {
    name: "Ruby Red",
    description: "Bold reds with gold highlights",
    primary: "#dc2626",      // Red 600
    secondary: "#b91c1c",    // Red 700
    accent: "#f59e0b",       // Amber 500
    background: "#fef2f2",   // Red 50
    text: "#7f1d1d",         // Red 900
    cssVars: {
      '--primary': 'hsl(0, 84%, 50%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(0, 77%, 42%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(45, 93%, 47%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  sapphire: {
    name: "Sapphire Blue",
    description: "Deep blues with silver accents",
    primary: "#1e40af",      // Blue 800
    secondary: "#3b82f6",    // Blue 500
    accent: "#06b6d4",       // Cyan 500
    background: "#eff6ff",   // Blue 50
    text: "#1e3a8a",         // Blue 900
    cssVars: {
      '--primary': 'hsl(224, 76%, 38%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(217, 91%, 60%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(188, 96%, 43%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  rose: {
    name: "Rose Gold",
    description: "Elegant rose tones with gold",
    primary: "#e11d48",      // Rose 600
    secondary: "#f43f5e",    // Rose 500
    accent: "#f59e0b",       // Amber 500
    background: "#fff1f2",   // Rose 50
    text: "#881337",         // Rose 900
    cssVars: {
      '--primary': 'hsl(346, 77%, 50%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(351, 89%, 60%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(45, 93%, 47%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  bronze: {
    name: "Bronze Elegance",
    description: "Warm bronze and copper tones",
    primary: "#a16207",      // Yellow 700
    secondary: "#ca8a04",    // Yellow 600
    accent: "#f97316",       // Orange 500
    background: "#fefce8",   // Yellow 50
    text: "#713f12",         // Yellow 900
    cssVars: {
      '--primary': 'hsl(45, 93%, 33%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(45, 93%, 40%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(27, 96%, 53%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  slate: {
    name: "Modern Slate",
    description: "Professional gray tones",
    primary: "#475569",      // Slate 600
    secondary: "#64748b",    // Slate 500
    accent: "#0ea5e9",       // Sky 500
    background: "#f8fafc",   // Slate 50
    text: "#0f172a",         // Slate 900
    cssVars: {
      '--primary': 'hsl(215, 19%, 35%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(215, 16%, 47%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(199, 89%, 48%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  mint: {
    name: "Fresh Mint",
    description: "Cool mint greens and blues",
    primary: "#14b8a6",      // Teal 500
    secondary: "#06b6d4",    // Cyan 500
    accent: "#22d3ee",       // Cyan 400
    background: "#f0fdfa",   // Teal 50
    text: "#134e4a",         // Teal 800
    cssVars: {
      '--primary': 'hsl(172, 83%, 40%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(188, 96%, 43%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(187, 85%, 53%)',
      '--accent-foreground': 'hsl(0, 0%, 100%)'
    }
  },
  lavender: {
    name: "Soft Lavender", 
    description: "Gentle purples and soft tones",
    primary: "#8b5cf6",      // Violet 500
    secondary: "#a78bfa",    // Violet 400
    accent: "#c4b5fd",       // Violet 300
    background: "#faf5ff",   // Purple 50
    text: "#581c87",         // Purple 900
    cssVars: {
      '--primary': 'hsl(258, 90%, 66%)',
      '--primary-foreground': 'hsl(0, 0%, 100%)',
      '--secondary': 'hsl(258, 94%, 74%)',
      '--secondary-foreground': 'hsl(0, 0%, 100%)',
      '--accent': 'hsl(266, 87%, 78%)',
      '--accent-foreground': 'hsl(266, 100%, 25%)'
    }
  }
} as const;

export type ThemeName = keyof typeof themes;

// Function to apply theme to CSS variables
export function applyTheme(themeName: ThemeName, customColors?: {
  headerTextColor?: string;
  tabTextColor?: string;
  tabActiveTextColor?: string;

}) {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  
  // Apply custom CSS variables
  Object.entries(theme.cssVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Also set our custom theme color variables
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-secondary', theme.secondary);
  root.style.setProperty('--theme-accent', theme.accent);
  root.style.setProperty('--theme-background', theme.background);
  root.style.setProperty('--theme-text', theme.text);
  
  // Apply custom text colors if provided
  if (customColors?.headerTextColor) {
    root.style.setProperty('--theme-header-text', customColors.headerTextColor);
  }
  if (customColors?.tabTextColor) {
    root.style.setProperty('--theme-tab-text', customColors.tabTextColor);
  }
  if (customColors?.tabActiveTextColor) {
    root.style.setProperty('--theme-tab-active-text', customColors.tabActiveTextColor);
  }

}