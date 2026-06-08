import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { hexToRgb, rgbToHex } from "@/utils/math";

async function getColor(defaultHexColor: string): Promise<string> {
  const defaultColor = hexToRgb(defaultHexColor);

  const get = (suffix: string, defaultValue: number) =>
    ini.findFloatWithDefault(
      ["Custom", "Prefs"],
      "Interface",
      "fEasyReadBackgroundColor" + suffix,
      defaultValue,
    );

  return rgbToHex({
    r: await get("R", defaultColor.r),
    g: await get("G", defaultColor.g),
    b: await get("B", defaultColor.b),
  });
}

async function setColor(hexColor: string) {
  const color = hexToRgb(hexColor);
  await ini.setFloat(
    "Prefs",
    "Interface",
    "fEasyReadBackgroundColorR",
    color.r,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadBackgroundColorR",
    color.r,
  );
  await ini.setFloat(
    "Prefs",
    "Interface",
    "fEasyReadBackgroundColorG",
    color.g,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadBackgroundColorG",
    color.g,
  );
  await ini.setFloat(
    "Prefs",
    "Interface",
    "fEasyReadBackgroundColorB",
    color.b,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Interface",
    "fEasyReadBackgroundColorB",
    color.b,
  );
}

export default function useAlternativeNodeViewBackgroundColor() {
  const defaultHexColor = "#101313";

  return useTweak(
    async () => await getColor(defaultHexColor),
    (hexColor) => setColor(hexColor),
    defaultHexColor,
  );
}
