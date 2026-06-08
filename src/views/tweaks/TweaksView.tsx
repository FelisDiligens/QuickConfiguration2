import { IniBoundary } from "@/components/boundaries";
import { css } from "@emotion/react";
import {
  faDesktop,
  faGlobe,
  faKeyboard,
  faUniversalAccess,
  faVideo,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { Tab, Tabs } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import AccessibilityTab from "./tabs/AccessibilityTab";
import AudioTab from "./tabs/AudioTab";
import CameraTab from "./tabs/CameraTab";
import ControlsTab from "./tabs/ControlsTab";
import GeneralTab from "./tabs/GeneralTab";
import VideoTab from "./tabs/VideoTab";

type Tabs =
  | "general"
  | "video"
  | "audio"
  | "controls"
  | "camera"
  | "accessibility";
export const activeTabAtom = atom<Tabs>("general");

function TweaksPageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;

        & .tab-content {
          overflow-y: auto;
        }
      `}
    >
      {children}
    </div>
  );
}

export default function TweaksView() {
  const { t } = useTranslation();
  return (
    <IniBoundary title={t("tweaks.title")}>
      <SuspendedTweaksView />
    </IniBoundary>
  );
}

function SuspendedTweaksView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  return (
    <TweaksPageContainer>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as Tabs)}>
        <Tab
          eventKey="general"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faGlobe} /> {t("tweaks.general.title")}
            </div>
          }
        >
          <GeneralTab />
        </Tab>
        <Tab
          eventKey="video"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faDesktop} /> {t("tweaks.video.title")}
            </div>
          }
        >
          <VideoTab />
        </Tab>
        <Tab
          eventKey="audio"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faVolumeHigh} /> {t("tweaks.audio.title")}
            </div>
          }
        >
          <AudioTab />
        </Tab>
        <Tab
          eventKey="controls"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faKeyboard} /> {t("tweaks.controls.title")}
            </div>
          }
        >
          <ControlsTab />
        </Tab>
        <Tab
          eventKey="camera"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faVideo} /> {t("tweaks.camera.title")}
            </div>
          }
        >
          <CameraTab />
        </Tab>
        <Tab
          eventKey="accessibility"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faUniversalAccess} />{" "}
              {t("tweaks.accessibility.title")}
            </div>
          }
        >
          <AccessibilityTab />
        </Tab>
      </Tabs>
    </TweaksPageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = TweaksView;
Component.displayName = "TweaksView";
