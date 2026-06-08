import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export enum TextureQuality {
  Low = 0,
  Medium = 1,
  High = 2,
  Ultra = 3,
  Custom = 4,
}

interface Values {
  iTextureQualityLevel: number;
  iLargeTextureArrayMipSkip: number;
  iTextureMipSkipBC1UNormSrgb: number;
  iTextureMipSkipBC3UNormSrgb: number;
  iTextureMipSkipBC1UNorm: number;
  iTextureMipSkipBC5SNorm: number;
  iTextureMipSkipBC4UNorm: number;
  iTextureMipSkipMinDimension: number;
  iLargeTextureArrayDim: number;
}

const valueMap: Record<
  Exclude<TextureQuality, TextureQuality.Custom>,
  Values
> = {
  [TextureQuality.Low]: {
    iTextureQualityLevel: 0,
    iLargeTextureArrayMipSkip: 2,
    iTextureMipSkipBC1UNormSrgb: 2,
    iTextureMipSkipBC3UNormSrgb: 2,
    iTextureMipSkipBC1UNorm: 2,
    iTextureMipSkipBC5SNorm: 2,
    iTextureMipSkipBC4UNorm: 2,
    iTextureMipSkipMinDimension: 256,
    iLargeTextureArrayDim: 1024,
  },
  [TextureQuality.Medium]: {
    iTextureQualityLevel: 1,
    iLargeTextureArrayMipSkip: 1,
    iTextureMipSkipBC1UNormSrgb: 1,
    iTextureMipSkipBC3UNormSrgb: 1,
    iTextureMipSkipBC1UNorm: 1,
    iTextureMipSkipBC5SNorm: 1,
    iTextureMipSkipBC4UNorm: 1,
    iTextureMipSkipMinDimension: 256,
    iLargeTextureArrayDim: 1024,
  },
  [TextureQuality.High]: {
    iTextureQualityLevel: 2,
    iLargeTextureArrayMipSkip: 0,
    iTextureMipSkipBC1UNormSrgb: 1,
    iTextureMipSkipBC3UNormSrgb: 1,
    iTextureMipSkipBC1UNorm: 1,
    iTextureMipSkipBC5SNorm: 1,
    iTextureMipSkipBC4UNorm: 1,
    iTextureMipSkipMinDimension: 1024,
    iLargeTextureArrayDim: 2048,
  },
  [TextureQuality.Ultra]: {
    iTextureQualityLevel: 3,
    iLargeTextureArrayMipSkip: 0,
    iTextureMipSkipBC1UNormSrgb: 0,
    iTextureMipSkipBC3UNormSrgb: 0,
    iTextureMipSkipBC1UNorm: 0,
    iTextureMipSkipBC5SNorm: 0,
    iTextureMipSkipBC4UNorm: 0,
    iTextureMipSkipMinDimension: 1024,
    iLargeTextureArrayDim: 2048,
  },
};

export default function useTextureQualityPreset() {
  const defaultValue = TextureQuality.High;
  const reloadNecessary = true;

  return useTweak<TextureQuality>(
    async () => {
      // In the old C# codebase, this value in the legacy "config.ini" was checked:
      // if (
      //   await ini.getBooleanWithDefault(
      //     "Config",
      //     "Tweaks",
      //     "bDontChangeTextureQuality",
      //     false,
      //   )
      // ) {
      //   return TextureQuality.Custom;
      // }

      // Get values from ini file:
      const iLargeTextureArrayMipSkip = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iLargeTextureArrayMipSkip",
      );
      const iTextureMipSkipBC1UNormSrgb = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipBC1UNormSrgb",
      );
      const iTextureMipSkipBC3UNormSrgb = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipBC3UNormSrgb",
      );
      const iTextureMipSkipBC1UNorm = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipBC1UNorm",
      );
      const iTextureMipSkipBC5SNorm = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipBC5SNorm",
      );
      const iTextureMipSkipBC4UNorm = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipBC4UNorm",
      );
      const iTextureMipSkipMinDimension = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureMipSkipMinDimension",
      );
      const iLargeTextureArrayDim = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iLargeTextureArrayDim",
      );
      const iTextureQualityLevel = await ini.findInt(
        ["Custom", "Prefs"],
        "Texture",
        "iTextureQualityLevel",
      );

      // Determine which preset was applied:
      for (const preset of [
        TextureQuality.Low,
        TextureQuality.Medium,
        TextureQuality.High,
        TextureQuality.Ultra,
      ]) {
        const values =
          valueMap[preset as Exclude<TextureQuality, TextureQuality.Custom>];

        if (
          values.iLargeTextureArrayMipSkip === iLargeTextureArrayMipSkip &&
          values.iTextureMipSkipBC1UNormSrgb === iTextureMipSkipBC1UNormSrgb &&
          values.iTextureMipSkipBC3UNormSrgb === iTextureMipSkipBC3UNormSrgb &&
          values.iTextureMipSkipBC1UNorm === iTextureMipSkipBC1UNorm &&
          values.iTextureMipSkipBC5SNorm === iTextureMipSkipBC5SNorm &&
          values.iTextureMipSkipBC4UNorm === iTextureMipSkipBC4UNorm &&
          values.iTextureMipSkipMinDimension === iTextureMipSkipMinDimension &&
          values.iLargeTextureArrayDim === iLargeTextureArrayDim &&
          values.iTextureQualityLevel === iTextureQualityLevel
        ) {
          return preset;
        }
      }

      // If no exact match was found, return "Custom":
      return TextureQuality.Custom;
    },
    async (value) => {
      // In the old C# codebase, this was written to the legacy "config.ini":
      // await ini.setBoolean(
      //   "Config",
      //   "Tweaks",
      //   "bDontChangeTextureQuality",
      //   false,
      // );

      if (value === TextureQuality.Custom) return; // Do nothing as to not overwrite any settings, when "Custom" is set.
      const values = valueMap[value]; // Get the values that correspond to the preset.

      // Set all ini values according to the preset:
      await ini.setInt(
        "Prefs",
        "Texture",
        "iLargeTextureArrayMipSkip",
        values.iLargeTextureArrayMipSkip,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iLargeTextureArrayMipSkip",
        values.iLargeTextureArrayMipSkip,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipBC1UNormSrgb",
        values.iTextureMipSkipBC1UNormSrgb,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipBC1UNormSrgb",
        values.iTextureMipSkipBC1UNormSrgb,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipBC3UNormSrgb",
        values.iTextureMipSkipBC3UNormSrgb,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipBC3UNormSrgb",
        values.iTextureMipSkipBC3UNormSrgb,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipBC1UNorm",
        values.iTextureMipSkipBC1UNorm,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipBC1UNorm",
        values.iTextureMipSkipBC1UNorm,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipBC5SNorm",
        values.iTextureMipSkipBC5SNorm,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipBC5SNorm",
        values.iTextureMipSkipBC5SNorm,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipBC4UNorm",
        values.iTextureMipSkipBC4UNorm,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipBC4UNorm",
        values.iTextureMipSkipBC4UNorm,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureMipSkipMinDimension",
        values.iTextureMipSkipMinDimension,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureMipSkipMinDimension",
        values.iTextureMipSkipMinDimension,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iLargeTextureArrayDim",
        values.iLargeTextureArrayDim,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iLargeTextureArrayDim",
        values.iLargeTextureArrayDim,
      );
      await ini.setInt(
        "Prefs",
        "Texture",
        "iTextureQualityLevel",
        values.iTextureQualityLevel,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Texture",
        "iTextureQualityLevel",
        values.iTextureQualityLevel,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
