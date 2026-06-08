import { useSettingsStore } from "@/stores/settings";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Theme } from "@tauri-apps/api/window";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo } from "react";
const appWindow = getCurrentWebviewWindow();

const systemThemeAtom = atom<Theme | null>(null);

export default function useTheme(): Theme {
  const theme = useSettingsStore((state) => state.theme);
  const [systemTheme, setSystemTheme] = useAtom(systemThemeAtom);

  const calculatedTheme = useMemo(
    () => (theme == "system" ? systemTheme || "light" : theme) as Theme,
    [theme, systemTheme],
  );

  useEffect(() => {
    if (systemTheme === null) {
      appWindow
        .theme()
        .then((theme) => {
          if (theme) setSystemTheme(theme);
        })
        .catch((reason) => {
          console.error("Failed to determine system theme.");
          console.error(reason);
        });
    }
  }, []);

  return calculatedTheme;
}
