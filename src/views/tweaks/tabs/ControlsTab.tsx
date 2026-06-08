import { useOverlayContainerRef } from "@/components/common/InfoOverlayTrigger";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SliderRow from "@/components/common/SliderRow";
import SwitchRow from "@/components/common/SwitchRow";
import useAimAssist from "@/hooks/tweaks/controls/useAimAssist";
import useGamepadEnable from "@/hooks/tweaks/controls/useGamepadEnable";
import useGamepadRumble from "@/hooks/tweaks/controls/useGamepadRumble";
import useGamepadSensitivity from "@/hooks/tweaks/controls/useGamepadSensitivity";
import useMouseInvert from "@/hooks/tweaks/controls/useMouseInvert";
import useMouseSensitivity from "@/hooks/tweaks/controls/useMouseSensitivity";
import useToggleAim from "@/hooks/tweaks/controls/useToggleAim";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function ControlsTab() {
  const { t } = useTranslation();

  const [mouseSensitivity, setMouseSensitivity] = useMouseSensitivity();
  const setMouseVerticalSensitivity = useCallback(
    (y: number) => setMouseSensitivity({ x: mouseSensitivity.x, y }),
    [mouseSensitivity],
  );
  const setMouseHorizontalSensitivity = useCallback(
    (x: number) => setMouseSensitivity({ x, y: mouseSensitivity.y }),
    [mouseSensitivity],
  );
  const [gamepadSensitivity, setGamepadSensitivity] = useGamepadSensitivity();
  const setGamepadVerticalSensitivity = useCallback(
    (y: number) => setGamepadSensitivity({ x: gamepadSensitivity.x, y }),
    [gamepadSensitivity],
  );
  const setGamepadHorizontalSensitivity = useCallback(
    (x: number) => setGamepadSensitivity({ x, y: gamepadSensitivity.y }),
    [gamepadSensitivity],
  );

  const [invertXAxis, setInvertXAxis] = useMouseInvert("X");
  const [invertYAxis, setInvertYAxis] = useMouseInvert("Y");
  const [toggleAim, setToggleAim] = useToggleAim();

  const [gamepadRumble, setGamepadRumble] = useGamepadRumble();
  const [aimAssist, setAimAssist] = useAimAssist();
  const [gamepadEnable, setGamepadEnable] = useGamepadEnable();

  const overlayContainerRef = useOverlayContainerRef();

  return (
    <>
      <PreferencesGroup
        title={t("tweaks.controls.mouse")}
        ref={overlayContainerRef}
      >
        <SliderRow
          title={t("tweaks.controls.horizontalSensitivity")}
          value={mouseSensitivity.x}
          onChange={setMouseHorizontalSensitivity}
          min={0.005}
          max={0.06}
          step={0.001}
        />
        <SliderRow
          title={t("tweaks.controls.verticalSensitivity")}
          value={mouseSensitivity.y}
          onChange={setMouseVerticalSensitivity}
          min={0.005}
          max={0.06}
          step={0.001}
        />
        <SwitchRow
          title={t("tweaks.controls.invertYAxis")}
          checked={invertYAxis}
          onChange={setInvertYAxis}
        />
        <SwitchRow
          title={t("tweaks.controls.invertXAxis")}
          checked={invertXAxis}
          onChange={setInvertXAxis}
        />
        <SwitchRow
          title={t("tweaks.controls.toggleAim")}
          checked={toggleAim}
          onChange={setToggleAim}
        />
      </PreferencesGroup>

      <PreferencesGroup title={t("tweaks.controls.gamepad")}>
        <SliderRow
          title={t("tweaks.controls.horizontalSensitivity")}
          value={gamepadSensitivity.x}
          onChange={setGamepadHorizontalSensitivity}
          min={0}
          max={1}
          step={0.001}
        />
        <SliderRow
          title={t("tweaks.controls.verticalSensitivity")}
          value={gamepadSensitivity.y}
          onChange={setGamepadVerticalSensitivity}
          min={0}
          max={1}
          step={0.001}
        />
        <SwitchRow
          title={t("tweaks.controls.gamepadRumble")}
          checked={gamepadRumble}
          onChange={setGamepadRumble}
        />
        <SwitchRow
          title={t("tweaks.controls.aimAssist")}
          checked={aimAssist}
          onChange={setAimAssist}
        />
        <SwitchRow
          title={t("tweaks.controls.enableGamepad")}
          subtitle={t("tweaks.controls.enableGamepadSubtitle")}
          checked={gamepadEnable}
          onChange={setGamepadEnable}
        />
      </PreferencesGroup>
    </>
  );
}
