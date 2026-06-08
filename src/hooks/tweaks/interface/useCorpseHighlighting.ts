import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum CorpseHighlighting {
  Disabled = 0,
  ClearOnInspect = 1,
  ClearOnRemove = 2,
}

export default function useCorpseHighlighting() {
  const defaultValue = CorpseHighlighting.ClearOnRemove;
  return useTweak<CorpseHighlighting>(
    async () => {
      const val = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "uiShowCorpseHighlighting",
        defaultValue,
      );
      return clamp(val, 0, 2);
    },
    async (value) => {
      await ini.setInt("Prefs", "Display", "uiShowCorpseHighlighting", value);
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uiShowCorpseHighlighting",
        value,
      );
    },
    defaultValue,
  );
}
