import ComboRow from "@/components/common/ComboRow";
import {
  InfoOverlayTrigger,
  useOverlayContainerRef,
} from "@/components/common/InfoOverlayTrigger";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useAntiAliasing, {
  AntiAliasing,
} from "@/hooks/tweaks/graphics/antialiasing/useAntiAliasing";
import useTAAPostOverlay from "@/hooks/tweaks/graphics/antialiasing/useTAAPostOverlay";
import useTAAPostSharpen from "@/hooks/tweaks/graphics/antialiasing/useTAAPostSharpen";
import useVolumetricLighting from "@/hooks/tweaks/graphics/lighting/useVolumetricLighting";
import useVolumetricLightingQuality, {
  VolumetricLightingQuality,
} from "@/hooks/tweaks/graphics/lighting/useVolumetricLightingQuality";
import useAmbientOcclusion from "@/hooks/tweaks/graphics/postprocessing/useAmbientOcclusion";
import useDepthOfFieldEnabled from "@/hooks/tweaks/graphics/postprocessing/useDepthOfFieldEnabled";
import useDepthOfFieldStrength from "@/hooks/tweaks/graphics/postprocessing/useDepthOfFieldStrength";
import useLensFlare from "@/hooks/tweaks/graphics/postprocessing/useLensFlare";
import useRadialBlur from "@/hooks/tweaks/graphics/postprocessing/useRadialBlur";
import useShadowBlurriness from "@/hooks/tweaks/graphics/shadows/useShadowBlurriness";
import useShadowDistance from "@/hooks/tweaks/graphics/shadows/useShadowDistance";
import useShadowMapResolution from "@/hooks/tweaks/graphics/shadows/useShadowMapResolution";
import useShadowQualityPreset, {
  ShadowQuality,
} from "@/hooks/tweaks/graphics/shadows/useShadowQualityPreset";
import useAnisotropicFiltering from "@/hooks/tweaks/graphics/textures/useAnisotropicFiltering";
import useTextureQualityPreset, {
  TextureQuality,
} from "@/hooks/tweaks/graphics/textures/useTextureQualityPreset";
import useBloodSplatterEnabled from "@/hooks/tweaks/graphics/useBloodSplatterEnabled";
import useDisableAllGore from "@/hooks/tweaks/graphics/useDisableAllGore";
import useEnableIntenseWeatherEffects from "@/hooks/tweaks/graphics/useEnableIntenseWeatherEffects";
import useEnableMuzzleFlashes from "@/hooks/tweaks/graphics/useEnableMuzzleFlashes";
import useEnableWeaponImpactEffects from "@/hooks/tweaks/graphics/useEnableWeaponImpactEffects";
import useGraphicsQuality from "@/hooks/tweaks/graphics/useGraphicsQuality";
import useGrassFadeDistance from "@/hooks/tweaks/graphics/useGrassFadeDistance";
import useLODFadeOutMultActors from "@/hooks/tweaks/graphics/useLODFadeOutMultActors";
import useLODFadeOutMultItems from "@/hooks/tweaks/graphics/useLODFadeOutMultItems";
import useLODFadeOutMultObjects from "@/hooks/tweaks/graphics/useLODFadeOutMultObjects";
import useShowGrass from "@/hooks/tweaks/graphics/useShowGrass";
import useWaterDisplacements from "@/hooks/tweaks/graphics/water/useWaterDisplacements";
import useWaterReflections from "@/hooks/tweaks/graphics/water/useWaterReflections";
import useWaterShadowFilter from "@/hooks/tweaks/graphics/water/useWaterShadowFilter";
import useWaterSSRGlitchFix from "@/hooks/tweaks/graphics/water/useWaterSSRGlitchFix";
import { Trans, useTranslation } from "react-i18next";

export default function GraphicsOptions() {
  const { t } = useTranslation();

  // Graphics:
  const [graphicsQuality, setGraphicsQuality] = useGraphicsQuality();
  const [antiAliasing, setAntiAliasing] = useAntiAliasing();
  const [anisotropicFiltering, setAnisotropicFiltering] =
    useAnisotropicFiltering();

  // Textures:
  const [textureQualityPreset, setTextureQualityPreset] =
    useTextureQualityPreset();

  // Water:
  const [waterDisplacements, setWaterDisplacements] = useWaterDisplacements();
  const [waterShadowFilter, setWaterShadowFilter] = useWaterShadowFilter();
  const [waterSSRFix, setWaterSSRFix] = useWaterSSRGlitchFix();
  const [waterReflections, setWaterReflections] = useWaterReflections();

  // Lighting:
  const [volumetricLighting, setVolumetricLighting] = useVolumetricLighting();
  const [volumetricLightingQuality, setVolumetricLightingQuality] =
    useVolumetricLightingQuality();

  // Post-processing:
  const [depthOfFieldEnabled, setDepthOfFieldEnabled] =
    useDepthOfFieldEnabled();
  const [depthOfFieldStrength, setDepthOfFieldStrength] =
    useDepthOfFieldStrength();
  const [radialBlur, setRadialBlur] = useRadialBlur();
  const [lensFlare, setLensFlare] = useLensFlare();
  const [ambientOcclusion, setAmbientOcclusion] = useAmbientOcclusion();

  // Effects:
  const [disableAllGore, setDisableAllGore] = useDisableAllGore();
  const [bloodSplatterEnabled, setBloodSplatterEnabled] =
    useBloodSplatterEnabled();
  const [enableMuzzleFlashes, setEnableMuzzleFlashes] =
    useEnableMuzzleFlashes();
  const [enableWeaponImpactEffects, setEnableWeaponImpactEffects] =
    useEnableWeaponImpactEffects();
  const [enableIntenseWeatherEffects, setEnableIntenseWeatherEffects] =
    useEnableIntenseWeatherEffects();

  // Shadows:
  const [shadowQualityPreset, setShadowQualityPreset] =
    useShadowQualityPreset();
  const [shadowMapResolution, setShadowMapResolution] =
    useShadowMapResolution();
  const [shadowBlurriness, setShadowBlurriness] = useShadowBlurriness();
  const [shadowDistance, setShadowDistance] = useShadowDistance();

  // LOD:
  const [lodFadeOutMultObjects, setLODFadeOutMultObjects] =
    useLODFadeOutMultObjects();
  const [lodFadeOutMultItems, setLODFadeOutMultItems] =
    useLODFadeOutMultItems();
  const [lodFadeOutMultActors, setLODFadeOutMultActors] =
    useLODFadeOutMultActors();

  // Grass:
  const [showGrass, setShowGrass] = useShowGrass();
  const [grassFadeDistance, setGrassFadeDistance] = useGrassFadeDistance();

  // TAA Sharpening:
  const [taaPostOverlay, setTAAPostOverlay] = useTAAPostOverlay();
  const [taaPostSharpen, setTAAPostSharpen] = useTAAPostSharpen();

  const overlayContainerRef = useOverlayContainerRef();

  return (
    <>
      <PreferencesGroup title={t("tweaks.video.graphicsGroup")}>
        <ComboRow
          title={t("tweaks.video.graphicsQualityPreset")}
          subtitle={t("tweaks.video.graphicsQualityPresetSubtitle")}
          value={graphicsQuality.toString()}
          onChange={(value) => setGraphicsQuality(parseInt(value))}
        >
          <option value="5">
            {t("tweaks.video.graphicsQualityPresetOptions.custom")}
          </option>
          <option value="1">
            {t("tweaks.video.graphicsQualityPresetOptions.low")}
          </option>
          <option value="2">
            {t("tweaks.video.graphicsQualityPresetOptions.medium")}
          </option>
          <option value="3">
            {t("tweaks.video.graphicsQualityPresetOptions.high")}
          </option>
          <option value="4">
            {t("tweaks.video.graphicsQualityPresetOptions.ultra")}
          </option>
        </ComboRow>
        <SwitchRow
          title={t("tweaks.video.enableAntiAliasing")}
          subtitle={t("tweaks.video.enableAntiAliasingSubtitle")}
          checked={antiAliasing == AntiAliasing.TAA}
          onChange={(value) =>
            setAntiAliasing(value ? AntiAliasing.TAA : AntiAliasing.Disabled)
          }
        />
        <ComboRow
          title={t("tweaks.video.anisotropicFiltering")}
          value={anisotropicFiltering.toString()}
          onChange={(value) => setAnisotropicFiltering(parseInt(value))}
        >
          <option value="0">
            {t("tweaks.video.anisotropicFilteringOptions.0x")}
          </option>
          <option value="2">
            {t("tweaks.video.anisotropicFilteringOptions.2x")}
          </option>
          <option value="4">
            {t("tweaks.video.anisotropicFilteringOptions.4x")}
          </option>
          <option value="8">
            {t("tweaks.video.anisotropicFilteringOptions.8x")}
          </option>
          <option value="16">
            {t("tweaks.video.anisotropicFilteringOptions.16x")}
          </option>
        </ComboRow>
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.texturesGroup")}>
        <ComboRow
          title={t("tweaks.video.textureQualityPreset")}
          value={textureQualityPreset.toString()}
          onChange={(value) => setTextureQualityPreset(parseInt(value))}
        >
          <option value={TextureQuality.Custom}>
            {t("tweaks.video.textureQualityPresetOptions.custom")}
          </option>
          <option value={TextureQuality.Low}>
            {t("tweaks.video.textureQualityPresetOptions.low")}
          </option>
          <option value={TextureQuality.Medium}>
            {t("tweaks.video.textureQualityPresetOptions.medium")}
          </option>
          <option value={TextureQuality.High}>
            {t("tweaks.video.textureQualityPresetOptions.high")}
          </option>
          <option value={TextureQuality.Ultra}>
            {t("tweaks.video.textureQualityPresetOptions.ultra")}
          </option>
        </ComboRow>
      </PreferencesGroup>

      <PreferencesGroup
        title={t("tweaks.video.waterGroup")}
        ref={overlayContainerRef}
      >
        <SwitchRow
          title={t("tweaks.video.waterDisplacement")}
          subtitle={t("tweaks.video.waterDisplacementSubtitle")}
          checked={waterDisplacements}
          onChange={setWaterDisplacements}
        />
        <ComboRow
          title={t("tweaks.video.waterShadowFilter")}
          value={waterShadowFilter.toString()}
          onChange={(value) => setWaterShadowFilter(parseInt(value))}
        >
          <option value="1">
            {t("tweaks.video.waterShadowFilterOptions.low")}
          </option>
          <option value="2">
            {t("tweaks.video.waterShadowFilterOptions.medium")}
          </option>
          <option value="3">
            {t("tweaks.video.waterShadowFilterOptions.high")}
          </option>
        </ComboRow>
        <SwitchRow
          title={t("tweaks.video.waterSSRFix")}
          subtitle={t("tweaks.video.waterSSRFixSubtitle")}
          checked={waterSSRFix}
          onChange={setWaterSSRFix}
          afterTitleSlot={
            <InfoOverlayTrigger container={overlayContainerRef}>
              <Trans
                t={t}
                i18nKey="tweaks.video.waterSSRFixTip"
                components={{
                  p: <p />,
                  code: <code />,
                  ul: <ul />,
                  li: <li />,
                }}
                tOptions={{ joinArrays: "" }}
              />
            </InfoOverlayTrigger>
          }
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.lightingGroup")}>
        <SwitchRow
          title={t("tweaks.video.volumetricLighting")}
          subtitle={t("tweaks.video.volumetricLightingSubtitle")}
          checked={volumetricLighting}
          onChange={setVolumetricLighting}
        />
        <ComboRow
          title={t("tweaks.video.volumetricLightingQuality")}
          value={volumetricLightingQuality.toString()}
          onChange={(value) => setVolumetricLightingQuality(parseInt(value))}
        >
          <option value={VolumetricLightingQuality.Low}>
            {t("tweaks.video.volumetricLightingQualityOptions.low")}
          </option>
          <option value={VolumetricLightingQuality.Medium}>
            {t("tweaks.video.volumetricLightingQualityOptions.medium")}
          </option>
          <option value={VolumetricLightingQuality.High}>
            {t("tweaks.video.volumetricLightingQualityOptions.high")}
          </option>
        </ComboRow>
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.postProcessingGroup")}>
        <SwitchRow
          title={t("tweaks.video.depthOfField")}
          checked={depthOfFieldEnabled}
          onChange={setDepthOfFieldEnabled}
        />
        <SliderRow
          title={t("tweaks.video.depthOfFieldStrength")}
          value={depthOfFieldStrength}
          min={0}
          max={10}
          step={1}
          onChange={setDepthOfFieldStrength}
        />
        <SwitchRow
          title={t("tweaks.video.radialBlur")}
          subtitle={t("tweaks.video.radialBlurSubtitle")}
          checked={radialBlur}
          onChange={setRadialBlur}
        />
        <SwitchRow
          title={t("tweaks.video.lensFlare")}
          checked={lensFlare}
          onChange={setLensFlare}
        />
        <SwitchRow
          title={t("tweaks.video.ambientOcclusion")}
          subtitle={t("tweaks.video.ambientOcclusionSubtitle")}
          checked={ambientOcclusion}
          onChange={setAmbientOcclusion}
        />
        <SwitchRow
          title={t("tweaks.video.reflections")}
          subtitle={t("tweaks.video.reflectionsSubtitle")}
          checked={waterReflections}
          onChange={setWaterReflections}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.effectsGroup")}>
        <SwitchRow
          title={t("tweaks.video.enableGore")}
          subtitle={t("tweaks.video.enableGoreSubtitle")}
          checked={!disableAllGore}
          onChange={(value) => setDisableAllGore(!value)}
        />
        <SwitchRow
          title={t("tweaks.video.enableBloodSplatter")}
          checked={bloodSplatterEnabled}
          onChange={setBloodSplatterEnabled}
        />
        <SwitchRow
          title={t("tweaks.video.enableMuzzleFlashes")}
          checked={enableMuzzleFlashes}
          onChange={setEnableMuzzleFlashes}
        />
        <SwitchRow
          title={t("tweaks.video.enableWeaponImpactEffects")}
          checked={enableWeaponImpactEffects}
          onChange={setEnableWeaponImpactEffects}
        />
        <SwitchRow
          title={t("tweaks.video.enableIntenseWeatherEffects")}
          checked={enableIntenseWeatherEffects}
          onChange={setEnableIntenseWeatherEffects}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.shadowsGroup")}>
        <ComboRow
          title={t("tweaks.video.shadowQualityPreset")}
          value={shadowQualityPreset.toString()}
          onChange={(value) => setShadowQualityPreset(parseInt(value))}
        >
          <option value={ShadowQuality.Custom}>
            {t("tweaks.video.shadowQualityPresetOptions.custom")}
          </option>
          <option value={ShadowQuality.Low}>
            {t("tweaks.video.shadowQualityPresetOptions.low")}
          </option>
          <option value={ShadowQuality.Medium}>
            {t("tweaks.video.shadowQualityPresetOptions.medium")}
          </option>
          <option value={ShadowQuality.High}>
            {t("tweaks.video.shadowQualityPresetOptions.high")}
          </option>
          <option value={ShadowQuality.Ultra}>
            {t("tweaks.video.shadowQualityPresetOptions.ultra")}
          </option>
        </ComboRow>
        <ComboRow
          title={t("tweaks.video.shadowMapResolution")}
          subtitle={t("tweaks.video.shadowMapResolutionSubtitle")}
          value={shadowMapResolution.toString()}
          onChange={(value) => setShadowMapResolution(parseInt(value))}
        >
          <option value="512">
            {t("tweaks.video.shadowMapResolutionOptions.512")}
          </option>
          <option value="1024">
            {t("tweaks.video.shadowMapResolutionOptions.1024")}
          </option>
          <option value="2048">
            {t("tweaks.video.shadowMapResolutionOptions.2048")}
          </option>
          <option value="4096">
            {t("tweaks.video.shadowMapResolutionOptions.4096")}
          </option>
          <option value="8192">
            {t("tweaks.video.shadowMapResolutionOptions.8192")}
          </option>
        </ComboRow>
        <ComboRow
          title={t("tweaks.video.shadowBlurriness")}
          subtitle={t("tweaks.video.shadowBlurrinesSubtitle")}
          value={shadowBlurriness.toString()}
          onChange={(value) => setShadowBlurriness(parseInt(value))}
        >
          <option value="0">
            {t("tweaks.video.shadowBlurrinessOptions.0")}
          </option>
          <option value="1">
            {t("tweaks.video.shadowBlurrinessOptions.1")}
          </option>
          <option value="2">
            {t("tweaks.video.shadowBlurrinessOptions.2")}
          </option>
          <option value="3">
            {t("tweaks.video.shadowBlurrinessOptions.3")}
          </option>
        </ComboRow>
        <SliderRow
          title={t("tweaks.video.shadowFadeDistance")}
          value={shadowDistance}
          min={1}
          max={200000}
          step={1000}
          onChange={setShadowDistance}
        />
      </PreferencesGroup>

      <PreferencesGroup
        title={t("tweaks.video.lodFadeDistanceGroup")}
        subtitle={t("tweaks.video.lodFadeDistanceGroupSubtitle")}
      >
        <SliderRow
          title={t("tweaks.video.lodFadeDistanceObjects")}
          value={lodFadeOutMultObjects}
          min={0}
          max={60}
          step={0.5}
          onChange={setLODFadeOutMultObjects}
        />
        <SliderRow
          title={t("tweaks.video.lodFadeDistanceItems")}
          value={lodFadeOutMultItems}
          min={0}
          max={60}
          step={0.5}
          onChange={setLODFadeOutMultItems}
        />
        <SliderRow
          title={t("tweaks.video.lodFadeDistanceActors")}
          value={lodFadeOutMultActors}
          min={0}
          max={60}
          step={0.5}
          onChange={setLODFadeOutMultActors}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.video.grassGroup")}>
        <SwitchRow
          title={t("tweaks.video.enableGrass")}
          checked={showGrass}
          onChange={setShowGrass}
        />
        <SliderRow
          title={t("tweaks.video.grassFadeDistance")}
          value={grassFadeDistance}
          min={0}
          max={14000}
          step={500}
          onChange={setGrassFadeDistance}
        />
      </PreferencesGroup>

      <PreferencesGroup
        title={t("tweaks.video.taaSharpeningGroup")}
        subtitle={t("tweaks.video.taaSharpeningGroupSubtitle")}
      >
        <SliderRow
          title={t("tweaks.video.taaSharpeningPostOverlay")}
          value={taaPostOverlay}
          min={0}
          max={1}
          step={0.01}
          onChange={setTAAPostOverlay}
        />
        <SliderRow
          title={t("tweaks.video.taaSharpeningPostSharpen")}
          value={taaPostSharpen}
          min={0}
          max={2}
          step={0.01}
          onChange={setTAAPostSharpen}
        />
      </PreferencesGroup>
    </>
  );
}
