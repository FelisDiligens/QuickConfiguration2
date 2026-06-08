import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export enum GraphicsQuality {
  Low = 1,
  Medium = 2,
  High = 3,
  Ultra = 4,
  Custom = 5,
}

interface Values {
  // [Display]
  iMaxAnisotropy: number;
  fShadowDistance: number;
  fDirShadowDistance: number;
  iShadowMapResolution: number;
  uiShadowFilter: number;
  uiOrthoShadowFilter: number;
  fBlendSplitDirShadow: number;
  iMaxFocusShadows: number;
  iMaxDecalsPerFrame: number;
  iMaxSkinDecalsPerFrame: number;
  bVolumetricLightingEnable: boolean;
  uWaterShadowFilter: number;
  iVolumetricLightingTextureQuality: number;
  iGraphicPreset: number;

  // [Decals]
  bDecals: boolean;
  bSkinnedDecals: boolean;
  uMaxDecals: number;
  uMaxSkinDecals: number;

  // [TerrainManager]
  fBlockMaximumDistance: number;
  fBlockLevel2Distance: number;
  fBlockLevel1Distance: number;
  fBlockLevel0Distance: number;

  // [ImageSpace]
  bDoDepthOfField: boolean;
  bMBEnable: boolean;

  // [LOD]
  fLODFadeOutMultActors: number;
  fLODFadeOutMultItems: number;
  fLODFadeOutMultObjects: number;

  // [Grass]
  fGrassStartFadeDistance: number;

  // [Water]
  bUseWaterHiRes: boolean;
}

const valueMap: Record<
  Exclude<GraphicsQuality, GraphicsQuality.Custom>,
  Values
> = {
  [GraphicsQuality.Low]: {
    iMaxAnisotropy: 0,
    fShadowDistance: 60000,
    fDirShadowDistance: 60000,
    iShadowMapResolution: 1024,
    uiShadowFilter: 1,
    uiOrthoShadowFilter: 1,
    fBlendSplitDirShadow: 0,
    iMaxFocusShadows: 0,
    iMaxDecalsPerFrame: 0,
    iMaxSkinDecalsPerFrame: 0,
    bVolumetricLightingEnable: false,
    uWaterShadowFilter: 1,
    iVolumetricLightingTextureQuality: 0,
    iGraphicPreset: 1,
    bDecals: false,
    bSkinnedDecals: false,
    uMaxDecals: 0,
    uMaxSkinDecals: 0,
    fBlockMaximumDistance: 100000,
    fBlockLevel2Distance: 75000,
    fBlockLevel1Distance: 25000,
    fBlockLevel0Distance: 15000,
    bDoDepthOfField: false,
    bMBEnable: false,
    fLODFadeOutMultActors: 5,
    fLODFadeOutMultItems: 1.5,
    fLODFadeOutMultObjects: 5,
    fGrassStartFadeDistance: 3500,
    bUseWaterHiRes: false,
  },
  [GraphicsQuality.Medium]: {
    iMaxAnisotropy: 16,
    fShadowDistance: 90000,
    fDirShadowDistance: 90000,
    iShadowMapResolution: 2048,
    uiShadowFilter: 2,
    uiOrthoShadowFilter: 2,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 1,
    iMaxDecalsPerFrame: 10,
    iMaxSkinDecalsPerFrame: 3,
    bVolumetricLightingEnable: true,
    uWaterShadowFilter: 2,
    iVolumetricLightingTextureQuality: 1,
    iGraphicPreset: 2,
    bDecals: true,
    bSkinnedDecals: true,
    uMaxDecals: 100,
    uMaxSkinDecals: 35,
    fBlockMaximumDistance: 100000,
    fBlockLevel2Distance: 80000,
    fBlockLevel1Distance: 32000,
    fBlockLevel0Distance: 20000,
    bDoDepthOfField: true,
    bMBEnable: true,
    fLODFadeOutMultActors: 7,
    fLODFadeOutMultItems: 3,
    fLODFadeOutMultObjects: 7,
    fGrassStartFadeDistance: 4500,
    bUseWaterHiRes: false,
  },
  [GraphicsQuality.High]: {
    iMaxAnisotropy: 16,
    fShadowDistance: 120000,
    fDirShadowDistance: 120000,
    iShadowMapResolution: 2048,
    uiShadowFilter: 3,
    uiOrthoShadowFilter: 3,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 4,
    iMaxDecalsPerFrame: 100,
    iMaxSkinDecalsPerFrame: 25,
    bVolumetricLightingEnable: true,
    uWaterShadowFilter: 3,
    iVolumetricLightingTextureQuality: 2,
    iGraphicPreset: 3,
    bDecals: true,
    bSkinnedDecals: true,
    uMaxDecals: 250,
    uMaxSkinDecals: 50,
    fBlockMaximumDistance: 180000,
    fBlockLevel2Distance: 110000,
    fBlockLevel1Distance: 60000,
    fBlockLevel0Distance: 30000,
    bDoDepthOfField: true,
    bMBEnable: true,
    fLODFadeOutMultActors: 9,
    fLODFadeOutMultItems: 6,
    fLODFadeOutMultObjects: 9,
    fGrassStartFadeDistance: 5500,
    bUseWaterHiRes: true,
  },
  [GraphicsQuality.Ultra]: {
    iMaxAnisotropy: 16,
    fShadowDistance: 150000,
    fDirShadowDistance: 150000,
    iShadowMapResolution: 2048,
    uiShadowFilter: 3,
    uiOrthoShadowFilter: 3,
    fBlendSplitDirShadow: 48,
    iMaxFocusShadows: 4,
    iMaxDecalsPerFrame: 100,
    iMaxSkinDecalsPerFrame: 25,
    bVolumetricLightingEnable: true,
    uWaterShadowFilter: 3,
    iVolumetricLightingTextureQuality: 2,
    iGraphicPreset: 4,
    bDecals: true,
    bSkinnedDecals: true,
    uMaxDecals: 1000,
    uMaxSkinDecals: 100,
    fBlockMaximumDistance: 250000,
    fBlockLevel2Distance: 110000,
    fBlockLevel1Distance: 90000,
    fBlockLevel0Distance: 60000,
    bDoDepthOfField: true,
    bMBEnable: true,
    fLODFadeOutMultActors: 15,
    fLODFadeOutMultItems: 10,
    fLODFadeOutMultObjects: 30,
    fGrassStartFadeDistance: 7000,
    bUseWaterHiRes: true,
  },
};

export default function useGraphicsQuality() {
  const defaultValue = GraphicsQuality.High;
  const reloadNecessary = true;

  return useTweak<GraphicsQuality>(
    async () => {
      // Get values from ini file:
      const iMaxAnisotropy = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iMaxAnisotropy",
      );
      const fShadowDistance = await ini.findFloat(
        ["Custom", "Prefs"],
        "Display",
        "fShadowDistance",
      );
      const fDirShadowDistance = await ini.findFloat(
        ["Custom", "Prefs"],
        "Display",
        "fDirShadowDistance",
      );
      const iShadowMapResolution = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iShadowMapResolution",
      );
      const uiShadowFilter = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "uiShadowFilter",
      );
      const uiOrthoShadowFilter = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "uiOrthoShadowFilter",
      );
      const fBlendSplitDirShadow = await ini.findFloat(
        ["Custom", "Prefs"],
        "Display",
        "fBlendSplitDirShadow",
      );
      const iMaxFocusShadows = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iMaxFocusShadows",
      );
      const iMaxDecalsPerFrame = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iMaxDecalsPerFrame",
      );
      const iMaxSkinDecalsPerFrame = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iMaxSkinDecalsPerFrame",
      );
      const bVolumetricLightingEnable = await ini.findBoolean(
        ["Custom", "Prefs"],
        "Display",
        "bVolumetricLightingEnable",
      );
      const uWaterShadowFilter = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "uWaterShadowFilter",
      );
      const iVolumetricLightingTextureQuality = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iVolumetricLightingTextureQuality",
      );
      const iGraphicPreset = await ini.findInt(
        ["Custom", "Prefs"],
        "Display",
        "iGraphicPreset",
      );
      const bDecals = await ini.findBoolean(
        ["Custom", "Prefs"],
        "Decals",
        "bDecals",
      );
      const bSkinnedDecals = await ini.findBoolean(
        ["Custom", "Prefs"],
        "Decals",
        "bSkinnedDecals",
      );
      const uMaxDecals = await ini.findInt(
        ["Custom", "Prefs"],
        "Decals",
        "uMaxDecals",
      );
      const uMaxSkinDecals = await ini.findInt(
        ["Custom", "Prefs"],
        "Decals",
        "uMaxSkinDecals",
      );
      const fBlockMaximumDistance = await ini.findFloat(
        ["Custom", "Prefs"],
        "TerrainManager",
        "fBlockMaximumDistance",
      );
      const fBlockLevel2Distance = await ini.findFloat(
        ["Custom", "Prefs"],
        "TerrainManager",
        "fBlockLevel2Distance",
      );
      const fBlockLevel1Distance = await ini.findFloat(
        ["Custom", "Prefs"],
        "TerrainManager",
        "fBlockLevel1Distance",
      );
      const fBlockLevel0Distance = await ini.findFloat(
        ["Custom", "Prefs"],
        "TerrainManager",
        "fBlockLevel0Distance",
      );
      const bDoDepthOfField = await ini.findBoolean(
        ["Custom", "Prefs"],
        "ImageSpace",
        "bDoDepthOfField",
      );
      const bMBEnable = await ini.findBoolean(
        ["Custom", "Prefs"],
        "ImageSpace",
        "bMBEnable",
      );
      const fLODFadeOutMultActors = await ini.findFloat(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultActors",
      );
      const fLODFadeOutMultItems = await ini.findFloat(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultItems",
      );
      const fLODFadeOutMultObjects = await ini.findFloat(
        ["Custom", "Prefs"],
        "LOD",
        "fLODFadeOutMultObjects",
      );
      const fGrassStartFadeDistance = await ini.findFloat(
        ["Custom", "Prefs"],
        "Grass",
        "fGrassStartFadeDistance",
      );
      const bUseWaterHiRes = await ini.findBoolean(
        ["Custom", "Prefs"],
        "Water",
        "bUseWaterHiRes",
      );

      // Determine which preset was applied:
      for (const preset of [
        GraphicsQuality.Low,
        GraphicsQuality.Medium,
        GraphicsQuality.High,
        GraphicsQuality.Ultra,
      ]) {
        const values =
          valueMap[preset as Exclude<GraphicsQuality, GraphicsQuality.Custom>];

        if (
          values.iMaxAnisotropy === iMaxAnisotropy &&
          values.fShadowDistance === fShadowDistance &&
          values.fDirShadowDistance === fDirShadowDistance &&
          values.iShadowMapResolution === iShadowMapResolution &&
          values.uiShadowFilter === uiShadowFilter &&
          values.uiOrthoShadowFilter === uiOrthoShadowFilter &&
          values.fBlendSplitDirShadow === fBlendSplitDirShadow &&
          values.iMaxFocusShadows === iMaxFocusShadows &&
          values.iMaxDecalsPerFrame === iMaxDecalsPerFrame &&
          values.iMaxSkinDecalsPerFrame === iMaxSkinDecalsPerFrame &&
          values.bVolumetricLightingEnable === bVolumetricLightingEnable &&
          values.uWaterShadowFilter === uWaterShadowFilter &&
          values.iVolumetricLightingTextureQuality ===
            iVolumetricLightingTextureQuality &&
          values.iGraphicPreset === iGraphicPreset &&
          values.bDecals === bDecals &&
          values.bSkinnedDecals === bSkinnedDecals &&
          values.uMaxDecals === uMaxDecals &&
          values.uMaxSkinDecals === uMaxSkinDecals &&
          values.fBlockMaximumDistance === fBlockMaximumDistance &&
          values.fBlockLevel2Distance === fBlockLevel2Distance &&
          values.fBlockLevel1Distance === fBlockLevel1Distance &&
          values.fBlockLevel0Distance === fBlockLevel0Distance &&
          values.bDoDepthOfField === bDoDepthOfField &&
          values.bMBEnable === bMBEnable &&
          values.fLODFadeOutMultActors === fLODFadeOutMultActors &&
          values.fLODFadeOutMultItems === fLODFadeOutMultItems &&
          values.fLODFadeOutMultObjects === fLODFadeOutMultObjects &&
          values.fGrassStartFadeDistance === fGrassStartFadeDistance &&
          values.bUseWaterHiRes === bUseWaterHiRes
        ) {
          return preset;
        }
      }

      // If no exact match was found, return "Custom":
      return GraphicsQuality.Custom;
    },
    async (value) => {
      if (value === GraphicsQuality.Custom) return; // Do nothing as to not overwrite any settings, when "Custom" is set.
      const values = valueMap[value]; // Get the values that correspond to the preset.

      // Set all ini values according to the preset:
      await ini.setInt(
        "Prefs",
        "Display",
        "iMaxAnisotropy",
        values.iMaxAnisotropy,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iMaxAnisotropy",
        values.iMaxAnisotropy,
      );
      await ini.setFloat(
        "Prefs",
        "Display",
        "fShadowDistance",
        values.fShadowDistance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fShadowDistance",
        values.fShadowDistance,
      );
      await ini.setFloat(
        "Prefs",
        "Display",
        "fDirShadowDistance",
        values.fDirShadowDistance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fDirShadowDistance",
        values.fDirShadowDistance,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iShadowMapResolution",
        values.iShadowMapResolution,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iShadowMapResolution",
        values.iShadowMapResolution,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "uiShadowFilter",
        values.uiShadowFilter,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uiShadowFilter",
        values.uiShadowFilter,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "uiOrthoShadowFilter",
        values.uiOrthoShadowFilter,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uiOrthoShadowFilter",
        values.uiOrthoShadowFilter,
      );
      await ini.setFloat(
        "Prefs",
        "Display",
        "fBlendSplitDirShadow",
        values.fBlendSplitDirShadow,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Display",
        "fBlendSplitDirShadow",
        values.fBlendSplitDirShadow,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iMaxFocusShadows",
        values.iMaxFocusShadows,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iMaxFocusShadows",
        values.iMaxFocusShadows,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iMaxDecalsPerFrame",
        values.iMaxDecalsPerFrame,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iMaxDecalsPerFrame",
        values.iMaxDecalsPerFrame,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iMaxSkinDecalsPerFrame",
        values.iMaxSkinDecalsPerFrame,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iMaxSkinDecalsPerFrame",
        values.iMaxSkinDecalsPerFrame,
      );
      await ini.setBoolean(
        "Prefs",
        "Display",
        "bVolumetricLightingEnable",
        values.bVolumetricLightingEnable,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Display",
        "bVolumetricLightingEnable",
        values.bVolumetricLightingEnable,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "uWaterShadowFilter",
        values.uWaterShadowFilter,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "uWaterShadowFilter",
        values.uWaterShadowFilter,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iVolumetricLightingTextureQuality",
        values.iVolumetricLightingTextureQuality,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iVolumetricLightingTextureQuality",
        values.iVolumetricLightingTextureQuality,
      );
      await ini.setInt(
        "Prefs",
        "Display",
        "iGraphicPreset",
        values.iGraphicPreset,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Display",
        "iGraphicPreset",
        values.iGraphicPreset,
      );
      await ini.setBoolean("Prefs", "Decals", "bDecals", values.bDecals);
      await ini.setBooleanIfPresent(
        "Custom",
        "Decals",
        "bDecals",
        values.bDecals,
      );
      await ini.setBoolean(
        "Prefs",
        "Decals",
        "bSkinnedDecals",
        values.bSkinnedDecals,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Decals",
        "bSkinnedDecals",
        values.bSkinnedDecals,
      );
      await ini.setInt("Prefs", "Decals", "uMaxDecals", values.uMaxDecals);
      await ini.setIntIfPresent(
        "Custom",
        "Decals",
        "uMaxDecals",
        values.uMaxDecals,
      );
      await ini.setInt(
        "Prefs",
        "Decals",
        "uMaxSkinDecals",
        values.uMaxSkinDecals,
      );
      await ini.setIntIfPresent(
        "Custom",
        "Decals",
        "uMaxSkinDecals",
        values.uMaxSkinDecals,
      );
      await ini.setFloat(
        "Prefs",
        "TerrainManager",
        "fBlockMaximumDistance",
        values.fBlockMaximumDistance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "TerrainManager",
        "fBlockMaximumDistance",
        values.fBlockMaximumDistance,
      );
      await ini.setFloat(
        "Prefs",
        "TerrainManager",
        "fBlockLevel2Distance",
        values.fBlockLevel2Distance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "TerrainManager",
        "fBlockLevel2Distance",
        values.fBlockLevel2Distance,
      );
      await ini.setFloat(
        "Prefs",
        "TerrainManager",
        "fBlockLevel1Distance",
        values.fBlockLevel1Distance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "TerrainManager",
        "fBlockLevel1Distance",
        values.fBlockLevel1Distance,
      );
      await ini.setFloat(
        "Prefs",
        "TerrainManager",
        "fBlockLevel0Distance",
        values.fBlockLevel0Distance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "TerrainManager",
        "fBlockLevel0Distance",
        values.fBlockLevel0Distance,
      );
      await ini.setBoolean(
        "Prefs",
        "ImageSpace",
        "bDoDepthOfField",
        values.bDoDepthOfField,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "ImageSpace",
        "bDoDepthOfField",
        values.bDoDepthOfField,
      );
      await ini.setBoolean(
        "Prefs",
        "ImageSpace",
        "bMBEnable",
        values.bMBEnable,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "ImageSpace",
        "bMBEnable",
        values.bMBEnable,
      );
      await ini.setFloat(
        "Prefs",
        "LOD",
        "fLODFadeOutMultActors",
        values.fLODFadeOutMultActors,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultActors",
        values.fLODFadeOutMultActors,
      );
      await ini.setFloat(
        "Prefs",
        "LOD",
        "fLODFadeOutMultItems",
        values.fLODFadeOutMultItems,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultItems",
        values.fLODFadeOutMultItems,
      );
      await ini.setFloat(
        "Prefs",
        "LOD",
        "fLODFadeOutMultObjects",
        values.fLODFadeOutMultObjects,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "LOD",
        "fLODFadeOutMultObjects",
        values.fLODFadeOutMultObjects,
      );
      await ini.setFloat(
        "Prefs",
        "Grass",
        "fGrassStartFadeDistance",
        values.fGrassStartFadeDistance,
      );
      await ini.setFloatIfPresent(
        "Custom",
        "Grass",
        "fGrassStartFadeDistance",
        values.fGrassStartFadeDistance,
      );
      await ini.setBoolean(
        "Prefs",
        "Water",
        "bUseWaterHiRes",
        values.bUseWaterHiRes,
      );
      await ini.setBooleanIfPresent(
        "Custom",
        "Water",
        "bUseWaterHiRes",
        values.bUseWaterHiRes,
      );
    },
    defaultValue,
    reloadNecessary,
  );
}
