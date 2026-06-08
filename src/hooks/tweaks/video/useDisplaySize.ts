import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export interface Size {
  width: number;
  height: number;
}

export default function useDisplaySize() {
  const defaultValue: Size = { width: 1920, height: 1080 };
  return useTweak<Size>(
    async () => {
      const w = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iSize W",
        defaultValue.width,
      );
      const h = await ini.findIntWithDefault(
        ["Custom", "Prefs"],
        "Display",
        "iSize H",
        defaultValue.height,
      );
      return { width: w, height: h };
    },
    async (value) => {
      await ini.setInt("Prefs", "Display", "iSize W", value.width);
      await ini.setIntIfPresent("Custom", "Display", "iSize W", value.width);
      await ini.setInt("Prefs", "Display", "iSize H", value.height);
      await ini.setIntIfPresent("Custom", "Display", "iSize H", value.height);
    },
    defaultValue,
  );
}
