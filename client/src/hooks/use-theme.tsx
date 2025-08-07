import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { applyTheme, type ThemeName } from "@/lib/themes";
import type { SiteSettings } from "@shared/schema";

/**
 * Hook to automatically apply the current theme from site settings
 */
export function useTheme() {
  const { data: settings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme as ThemeName, {
        headerTextColor: settings.headerTextColor || undefined,
        tabTextColor: settings.tabTextColor || undefined,
        tabActiveTextColor: settings.tabActiveTextColor || undefined,

      });
    }
  }, [settings?.theme, settings?.headerTextColor, settings?.tabTextColor, settings?.tabActiveTextColor]);

  // Update favicon when settings change
  useEffect(() => {
    if (settings?.faviconUrl) {
      const link = document.getElementById('favicon') as HTMLLinkElement;
      if (link) {
        link.href = settings.faviconUrl;
      } else {
        // Create favicon link if it doesn't exist
        const newLink = document.createElement('link');
        newLink.id = 'favicon';
        newLink.rel = 'icon';
        newLink.type = 'image/x-icon';
        newLink.href = settings.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  }, [settings?.faviconUrl]);

  return {
    currentTheme: settings?.theme || "default",
    settings,
  };
}