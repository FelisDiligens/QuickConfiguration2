import ComboRow from "@/components/common/ComboRow";
import {
  InfoOverlayTrigger,
  useOverlayContainerRef,
} from "@/components/common/InfoOverlayTrigger";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import SwitchRow from "@/components/common/SwitchRow";
import useFixHUD4to3Ratio from "@/hooks/tweaks/interface/useFixHUD4to3Ratio";
import useDisplayMode, {
  DisplayMode,
} from "@/hooks/tweaks/video/useDisplayMode";
import usePresentInterval from "@/hooks/tweaks/video/usePresentInterval";
import useTopMostWindow from "@/hooks/tweaks/video/useTopMostWindow";
import { css } from "@emotion/react";
import { Trans, useTranslation } from "react-i18next";
import ResolutionRows from "./ResolutionRows";

export default function DisplayOptions() {
  const { t } = useTranslation();

  const [displayMode, setDisplayMode] = useDisplayMode();
  const [presentInterval, setPresentInterval] = usePresentInterval();
  const [topMostWindow, setTopMostWindow] = useTopMostWindow();
  const [fixHUD4to3Ratio, setFixHUD4to3Ratio] = useFixHUD4to3Ratio();

  const overlayContainerRef = useOverlayContainerRef();

  return (
    <>
      <PreferencesGroup
        title={t("tweaks.video.displayGroup")}
        ref={overlayContainerRef}
      >
        <ComboRow
          title={t("tweaks.video.displayMode")}
          value={displayMode}
          onChange={(value) => setDisplayMode(value as DisplayMode)}
          afterTitleSlot={
            <InfoOverlayTrigger container={overlayContainerRef}>
              <ul css={css`margin-left: 8px;`}>
                <Trans
                  t={t}
                  i18nKey="tweaks.video.displayModeTip.list"
                  components={{ b: <b />, li: <li /> }}
                  tOptions={{ joinArrays: "" }}
                />
              </ul>
            </InfoOverlayTrigger>
          }
        >
          <option value="fullscreen">
            {t("tweaks.video.displayModeOptions.fullscreen")}
          </option>
          <option value="windowed">
            {t("tweaks.video.displayModeOptions.windowed")}
          </option>
          <option value="borderlessWindowed">
            {t("tweaks.video.displayModeOptions.borderlessWindowed")}
          </option>
          <option value="borderlessFullscreen">
            {t("tweaks.video.displayModeOptions.borderlessFullscreen")}
          </option>
        </ComboRow>
        <ResolutionRows />
      </PreferencesGroup>

      <PreferencesGroup>
        <SwitchRow
          title={t("tweaks.video.vsync")}
          checked={presentInterval}
          onChange={setPresentInterval}
        />
      </PreferencesGroup>

      <PreferencesGroup>
        <SwitchRow
          title={t("tweaks.video.topMostWindow")}
          checked={topMostWindow}
          onChange={setTopMostWindow}
        />
        <SwitchRow
          title={t("tweaks.video.fixHudAspectRatio")}
          checked={fixHUD4to3Ratio}
          onChange={setFixHUD4to3Ratio}
        />
      </PreferencesGroup>
    </>
  );
}
