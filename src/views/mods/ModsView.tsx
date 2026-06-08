import {
  IniBoundary,
  ModsBoundary,
  ResourceListBoundary,
} from "@/components/boundaries";
import { css } from "@emotion/react";
import {
  faGear,
  faListCheck,
  faPuzzlePiece,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { Tab, Tabs } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import MigrationBoundary from "./legacy/MigrationBoundary";
import ModOrderTab from "./tabs/modOrder/ModOrderTab";
import ResourceListTab from "./tabs/resourceList/ResourceListTab";
import SettingsTab from "./tabs/settings/SettingsTab";

type Tabs = "modorder" | "resourcelist" | "settings";
export const activeTabAtom = atom<Tabs>("modorder");

function ModsPageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        height: 100%;

        & .tab-content {
          height: 100%;
          overflow-y: auto;
        }

        & .tab-content > .active {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
      `}
    >
      {children}
    </div>
  );
}

export default function ModsView() {
  const { t } = useTranslation();
  return (
    <IniBoundary title={t("mods.title")}>
      <MigrationBoundary title={t("mods.title")}>
        <ResourceListBoundary title={t("mods.title")}>
          <ModsBoundary title={t("mods.title")}>
            <SuspendedModsView />
          </ModsBoundary>
        </ResourceListBoundary>
      </MigrationBoundary>
    </IniBoundary>
  );
}

function SuspendedModsView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  return (
    <ModsPageContainer>
      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k as Tabs)}>
        <Tab
          eventKey="modorder"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faPuzzlePiece} />
              &nbsp;{t("mods.modOrderTab.title")}
            </div>
          }
        >
          <ModOrderTab />
        </Tab>
        <Tab
          eventKey="resourcelist"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faListCheck} />
              &nbsp;{t("mods.resourceListTab.title")}
            </div>
          }
        >
          <ResourceListTab />
        </Tab>
        <Tab
          eventKey="settings"
          title={
            <div css={css`white-space: nowrap;`}>
              <FontAwesomeIcon icon={faGear} />
              &nbsp;{t("mods.settingsTab.title")}
            </div>
          }
        >
          <SettingsTab />
        </Tab>
      </Tabs>
    </ModsPageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = ModsView;
Component.displayName = "ModsView";
