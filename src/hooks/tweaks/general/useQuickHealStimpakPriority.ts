import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { clamp } from "@/utils/math";

export enum QuickHealStimpakPriority {
  UseWeakestFirst = 0,
  UseStrongestFirst = 1,
}

/** Determines if Quick Heal will use your weakest or strongest Stimpaks first. */
export default function useQuickHealStimpakPriority() {
  const defaultValue = QuickHealStimpakPriority.UseStrongestFirst;

  return useTweak<QuickHealStimpakPriority>(
    async () => {
      let value = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "MAIN",
        "uiQuickHealPriority",
        defaultValue,
      );
      value = clamp(value, 0, 1);
      return value as QuickHealStimpakPriority;
    },
    async (value) => {
      await ini.setInt("Prefs", "MAIN", "uiQuickHealPriority", value);
      await ini.setIntIfPresent("Custom", "MAIN", "uiQuickHealPriority", value);
    },
    defaultValue,
  );
}
