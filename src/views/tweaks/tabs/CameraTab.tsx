import {
  Fov80,
  FovImages,
  FovViewmodel80,
  FovViewmodelImages,
} from "@/assets/img";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import { AppTheme } from "@/components/MyThemeProvider";
import useFieldOfView from "@/hooks/tweaks/camera/fov/useFieldOfView";
import useViewmodelFOV from "@/hooks/tweaks/camera/fov/useViewmodelFOV";
import useWorkshopFreeCameraControlsHoldToggle from "@/hooks/tweaks/camera/freecam/useWorkshopFreeCameraControlsHoldToggle";
import useWorkshopFreeCameraRotationSpeed from "@/hooks/tweaks/camera/freecam/useWorkshopFreeCameraRotationSpeed";
import useWorkshopFreeCameraTranslationSpeed from "@/hooks/tweaks/camera/freecam/useWorkshopFreeCameraTranslationSpeed";
import useWorkshopStartAtPreviousFreeCameraLocation from "@/hooks/tweaks/camera/freecam/useWorkshopStartAtPreviousFreeCameraLocation";
import useWorkshopStartInFreeCamera from "@/hooks/tweaks/camera/freecam/useWorkshopStartInFreeCamera";
import useSelfieCameraRotationSpeed from "@/hooks/tweaks/camera/photomode/useSelfieCameraRotationSpeed";
import useSelfieCameraTranslationSpeed from "@/hooks/tweaks/camera/photomode/useSelfieCameraTranslationSpeed";
import useSelfieModeRange from "@/hooks/tweaks/camera/photomode/useSelfieModeRange";
import usePitchZoomOutMaxDist from "@/hooks/tweaks/camera/thirdperson/usePitchZoomOutMaxDist";
import useVanityModeMaxDist from "@/hooks/tweaks/camera/thirdperson/useVanityModeMaxDist";
import useVanityModeMinDist from "@/hooks/tweaks/camera/thirdperson/useVanityModeMinDist";
import useEnableCameraShake from "@/hooks/tweaks/camera/useEnableCameraShake";
import { clamp } from "@/utils/math";
import { css } from "@emotion/react";
import _ from "lodash";
import { useEffect, useState } from "react";
import { ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function CameraTab() {
  const { t } = useTranslation();

  const [fieldOfView, setFieldOfView] = useFieldOfView();
  const [viewmodelFov, setViewmodelFov] = useViewmodelFOV();

  const [cameraShake, setCameraShake] = useEnableCameraShake();

  const [photomodeMovementSpeed, setPhotomodeMovementSpeed] =
    useSelfieCameraTranslationSpeed();
  const [photomodeRotationSpeed, setPhotomodeRotationSpeed] =
    useSelfieCameraRotationSpeed();
  const [photomodeRange, setPhotomodeRange] = useSelfieModeRange();

  const [freeCamMovementSpeed, setFreeCamMovementSpeed] =
    useWorkshopFreeCameraTranslationSpeed();
  const [freeCamRotationSpeed, setFreeCamRotationSpeed] =
    useWorkshopFreeCameraRotationSpeed();
  const [startInFreeCam, setStartInFreeCam] = useWorkshopStartInFreeCamera();
  const [freeCamStartAtPrevLocation, setFreeCamStartAtPrevLocation] =
    useWorkshopStartAtPreviousFreeCameraLocation();
  const [freeCamControlsHoldToggle, setFreeCamControlsHoldToggle] =
    useWorkshopFreeCameraControlsHoldToggle();

  const [zoomMinDistance, setZoomMinDistance] = useVanityModeMinDist();
  const [zoomMaxDistance, setZoomMaxDistance] = useVanityModeMaxDist();
  const [zoomLookAtGroundDistance, setZoomLookAtGroundDistance] =
    usePitchZoomOutMaxDist();

  // Set preview picture for field of view:
  const [fovImage, setFovImage] = useState(Fov80);
  useEffect(() => {
    if (!_.isFinite(fieldOfView)) return;
    const index = clamp(Math.floor((fieldOfView - 70) / 5), 0, 10);
    setFovImage(FovImages[index]);
  }, [fieldOfView]);

  // Set preview picture for viewmodel fov:
  const [viewmodelFovImage, setViewmodelFovImage] = useState(FovViewmodel80);
  useEffect(() => {
    if (!_.isFinite(viewmodelFov)) return;
    const index = clamp(Math.floor((viewmodelFov - 70) / 5), 0, 10);
    setViewmodelFovImage(FovViewmodelImages[index]);
  }, [viewmodelFov]);

  return (
    <>
      <PreferencesGroup title={t("tweaks.camera.fieldOfView")}>
        <ListGroup.Item>
          <img
            src={fovImage}
            css={(theme: AppTheme) => css`
              width: 100%;
              border: 1px solid ${theme.card.borderColor};
              border-radius: 4px;
              margin: 8px 0;
            `}
          />
        </ListGroup.Item>
        <SliderRow
          title=""
          value={fieldOfView}
          min={70}
          max={120}
          step={5}
          onChange={setFieldOfView}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.camera.viewmodelFov")}>
        <ListGroup.Item>
          <img
            src={viewmodelFovImage}
            css={(theme: AppTheme) => css`
              width: 100%;
              border: 1px solid ${theme.card.borderColor};
              border-radius: 4px;
              margin: 8px 0;
            `}
          />
        </ListGroup.Item>
        <SliderRow
          title=""
          value={viewmodelFov}
          min={70}
          max={120}
          step={5}
          onChange={setViewmodelFov}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.camera.accessibility")}>
        <SwitchRow
          title={t("tweaks.camera.enableCameraShaking")}
          checked={cameraShake}
          onChange={setCameraShake}
        />
      </PreferencesGroup>

      <PreferencesGroup
        title={t("tweaks.camera.cameraDistance")}
        subtitle={t("tweaks.camera.cameraDistanceSubtitle")}
      >
        <SliderRow
          title={t("tweaks.camera.cameraMinimumDistance")}
          subtitle={t("tweaks.camera.cameraMinimumDistanceSubtitle")}
          value={zoomMinDistance}
          min={0}
          max={500}
          step={10}
          onChange={setZoomMinDistance}
        />
        <SliderRow
          title={t("tweaks.camera.cameraMaximumDistance")}
          subtitle={t("tweaks.camera.cameraMaximumDistanceSubtitle")}
          value={zoomMaxDistance}
          min={100}
          max={500}
          step={10}
          onChange={setZoomMaxDistance}
        />
        <SliderRow
          title={t("tweaks.camera.cameraZoomOutDistance")}
          subtitle={t("tweaks.camera.cameraZoomOutDistanceSubtitle")}
          value={zoomLookAtGroundDistance}
          min={0}
          max={200}
          step={10}
          onChange={setZoomLookAtGroundDistance}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.camera.photomode")}>
        <SliderRow
          title={t("tweaks.camera.movementSpeed")}
          value={photomodeMovementSpeed}
          min={0.5}
          max={20}
          step={0.5}
          onChange={setPhotomodeMovementSpeed}
        />
        <SliderRow
          title={t("tweaks.camera.rotationSpeed")}
          value={photomodeRotationSpeed}
          min={0.5}
          max={5}
          step={0.5}
          onChange={setPhotomodeRotationSpeed}
        />
        <SliderRow
          title={t("tweaks.camera.photomodeRangeLimit")}
          value={photomodeRange}
          min={500}
          max={5000}
          step={100}
          onChange={setPhotomodeRange}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.camera.freeCam")}>
        <SliderRow
          title={t("tweaks.camera.movementSpeed")}
          value={freeCamMovementSpeed}
          min={2}
          max={50}
          step={1}
          onChange={setFreeCamMovementSpeed}
        />
        <SliderRow
          title={t("tweaks.camera.rotationSpeed")}
          value={freeCamRotationSpeed}
          min={1}
          max={5}
          step={1}
          onChange={setFreeCamRotationSpeed}
        />
        <SwitchRow
          title={t("tweaks.camera.startInFreeCam")}
          checked={startInFreeCam}
          onChange={setStartInFreeCam}
        />
        <SwitchRow
          title={t("tweaks.camera.freeCamStartAtLastLocation")}
          checked={freeCamStartAtPrevLocation}
          onChange={setFreeCamStartAtPrevLocation}
        />
        <SwitchRow
          title={t("tweaks.camera.freeCamControlsHoldToggle")}
          checked={freeCamControlsHoldToggle}
          onChange={setFreeCamControlsHoldToggle}
        />
      </PreferencesGroup>
    </>
  );
}
