import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { hexToRgb, rgbToHex } from "@/utils/math";

async function getColor(defaultHexColor: string): Promise<string> {
  const defaultColor = hexToRgb(defaultHexColor);

  const get = (suffix: string, defaultValue: number) =>
    ini.findFloatWithDefault(
      ["Custom", "Prefs"],
      "Interface",
      "fEasyReadTextColor" + suffix,
      defaultValue,
    );

  return rgbToHex({
    r: await get("R", defaultColor.r),
    g: await get("UniqueG", defaultColor.g),
    b: await get("B", defaultColor.b),
  });
}

async function setColor(hexColor: string) {
  const color = hexToRgb(hexColor);
  await ini.setFloat("Prefs", "Interface", "fEasyReadTextColorR", color.r);
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadTextColorR",
    color.r,
  );
  // For some reason, green has an additional "Unique" in it's ini key:
  await ini.setFloat(
    "Prefs",
    "Interface",
    "fEasyReadTextColorUniqueG",
    color.g,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadTextColorUniqueG",
    color.g,
  );
  await ini.setFloat("Prefs", "Interface", "fEasyReadTextColorB", color.b);
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadTextColorB",
    color.b,
  );
}

export default function useAlternativeNodeViewTextColor() {
  const defaultHexColor = "#f7f2b7";

  return useTweak(
    async () => await getColor(defaultHexColor),
    (hexColor) => setColor(hexColor),
    defaultHexColor,
  );
}
