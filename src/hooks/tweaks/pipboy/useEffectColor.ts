import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";
import { RGBColor, hexToRgb, rgbToHex } from "@/utils/math";

async function getEffectColor(
  part: "Pipboy" | "QuickBoy" | "PA",
  defaultColor: RGBColor,
): Promise<string> {
  const get = (colorComponent: "R" | "G" | "B", defaultValue: number) =>
    ini.findFloatWithDefault(
      ["Custom", "Prefs"],
      "Pipboy",
      `f${part}EffectColor${colorComponent}`,
      defaultValue,
    );

  return rgbToHex({
    r: await get("R", defaultColor.r),
    g: await get("G", defaultColor.g),
    b: await get("B", defaultColor.b),
  });
}

async function setEffectColor(
  part: "Pipboy" | "QuickBoy" | "PA",
  color: RGBColor,
) {
  await ini.setFloat("Prefs", "Pipboy", `f${part}EffectColorR`, color.r);
  await ini.setFloat("Prefs", "Pipboy", `f${part}EffectColorG`, color.g);
  await ini.setFloat("Prefs", "Pipboy", `f${part}EffectColorB`, color.b);
  await ini.setFloatIfPresent(
    "Custom",
    "Pipboy",
    `f${part}EffectColorR`,
    color.r,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Pipboy",
    `f${part}EffectColorG`,
    color.g,
  );
  await ini.setFloatIfPresent(
    "Custom",
    "Pipboy",
    `f${part}EffectColorB`,
    color.b,
  );
}

function useEffectColor(
  part: "Pipboy" | "QuickBoy" | "PA",
  defaultHexColor: string,
) {
  return useTweak(
    () => getEffectColor(part, hexToRgb(defaultHexColor)),
    (hexColor) => setEffectColor(part, hexToRgb(hexColor)),
    defaultHexColor,
  );
}

export function usePipBoyColor() {
  return useEffectColor("Pipboy", "#1AFF80");
}

export function useQuickBoyColor() {
  return useEffectColor("QuickBoy", "#F7F3B9");
}

export function usePowerArmorColor() {
  return useEffectColor("PA", "#FFD166");
}
