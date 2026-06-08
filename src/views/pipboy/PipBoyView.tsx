import {
  PipBoyPreviewMask,
  PipBoyPreviewScreen,
  PowerArmorPreviewMask,
  PowerArmorPreviewScreen,
  QuickBoyPreviewMask,
  QuickBoyPreviewScreen,
} from "@/assets/img";
import { IniBoundary } from "@/components/boundaries";
import ButtonRow from "@/components/common/ButtonRow";
import PageContainer from "@/components/common/PageContainer";
import PageContent from "@/components/common/PageContent";
import PageTitle from "@/components/common/PageTitle";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import RadioRow from "@/components/common/RadioRow";
import RadioRowGroup from "@/components/common/RadioRowGroup";
import {
  usePipBoyColor,
  usePowerArmorColor,
  useQuickBoyColor,
} from "@/hooks/tweaks/pipboy/useEffectColor";
import usePipboyTargetResolution from "@/hooks/tweaks/pipboy/usePipboyTargetResolution";
import useQuickBoyModeEnabled from "@/hooks/tweaks/pipboy/useQuickBoyModeEnabled";
import { css } from "@emotion/react";
import { atom, useAtom } from "jotai";
import { Form, InputGroup, ListGroup, Tab, Tabs } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ColorPickerWithPreview from "./ColorPickerWithPreview";
import ColorPresets from "./ColorPresets";

type Tabs = "pip-boy" | "quick-boy" | "power-armor";
export const activeTabAtom = atom<Tabs>("pip-boy");

export default function PipBoyView() {
  const { t } = useTranslation();
  return (
    <IniBoundary title={t("pipboy.title")}>
      <SuspendedPipBoyView />
    </IniBoundary>
  );
}

function SuspendedPipBoyView() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useAtom(activeTabAtom); // Do not change to useState, see ColoredPreviewImage.tsx

  const [pipBoyColor, setPipBoyColor] = usePipBoyColor();
  const [quickBoyColor, setQuickBoyColor] = useQuickBoyColor();
  const [powerArmorColor, setPowerArmorColor] = usePowerArmorColor();
  const [quickBoyModeEnabled, setQuickBoyModeEnabled] =
    useQuickBoyModeEnabled();
  const [pipboyTargetResolution, setPipboyTargetResolution] =
    usePipboyTargetResolution();

  function setColor(hexColor: string) {
    switch (activeTab) {
      case "pip-boy":
        setPipBoyColor(hexColor);
        break;
      case "quick-boy":
        setQuickBoyColor(hexColor);
        break;
      case "power-armor":
        setPowerArmorColor(hexColor);
        break;
    }
  }

  return (
    <PageContainer>
      <PageTitle>{t("pipboy.title")}</PageTitle>
      <PageContent>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k as Tabs)}
          css={css`
            max-width: 660px;
            margin: 0 auto;
            margin-top: 4px;
          `}
        >
          <Tab eventKey="pip-boy" title={t("pipboy.pipboy")}>
            <ColorPickerWithPreview
              name={t("pipboy.pipboyColor")}
              color={pipBoyColor}
              setColor={setPipBoyColor}
              mask={PipBoyPreviewMask}
              screen={PipBoyPreviewScreen}
            />
          </Tab>
          <Tab eventKey="quick-boy" title={t("pipboy.quickboy")}>
            <ColorPickerWithPreview
              name={t("pipboy.quickboyColor")}
              color={quickBoyColor}
              setColor={setQuickBoyColor}
              mask={QuickBoyPreviewMask}
              screen={QuickBoyPreviewScreen}
            />
          </Tab>
          <Tab eventKey="power-armor" title={t("pipboy.powerArmor")}>
            <ColorPickerWithPreview
              name={t("pipboy.powerArmorColor")}
              color={powerArmorColor}
              setColor={setPowerArmorColor}
              mask={PowerArmorPreviewMask}
              screen={PowerArmorPreviewScreen}
            />
          </Tab>
        </Tabs>

        <ColorPresets setColor={setColor} />

        <PreferencesGroup title={t("pipboy.mode")}>
          <RadioRowGroup
            name="pip-boy-mode"
            value={quickBoyModeEnabled ? "quick-boy" : "pip-boy"}
            onChange={(value) => setQuickBoyModeEnabled(value == "quick-boy")}
          >
            <RadioRow title={t("pipboy.usePipboy")} id="pip-boy" />
            <RadioRow title={t("pipboy.useQuickboy")} id="quick-boy" />
          </RadioRowGroup>
        </PreferencesGroup>

        <PreferencesGroup
          title={t("pipboy.resolution")}
          subtitle={t("pipboy.resolutionSubtitle")}
        >
          <ListGroup.Item>
            <InputGroup>
              <Form.Control
                type="number"
                value={pipboyTargetResolution.width}
                onChange={(e) =>
                  setPipboyTargetResolution({
                    ...pipboyTargetResolution,
                    width: parseInt(e.target.value),
                  })
                }
                css={css`
                    min-width: 100px;
                  `}
              />
              <InputGroup.Text>x</InputGroup.Text>
              <Form.Control
                type="number"
                value={pipboyTargetResolution.height}
                onChange={(e) =>
                  setPipboyTargetResolution({
                    ...pipboyTargetResolution,
                    height: parseInt(e.target.value),
                  })
                }
                css={css`
                    min-width: 100px;
                  `}
              />
            </InputGroup>
          </ListGroup.Item>
          <ButtonRow
            center
            onClick={() =>
              setPipboyTargetResolution({ width: 1752, height: 1200 })
            }
          >
            {t("pipboy.setRecommendedResolution")}
          </ButtonRow>
          <ButtonRow
            center
            variant="danger"
            onClick={() =>
              setPipboyTargetResolution({ width: 876, height: 600 })
            }
          >
            {t("pipboy.resetToDefault")}
          </ButtonRow>
        </PreferencesGroup>
      </PageContent>
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = PipBoyView;
Component.displayName = "PipBoyView";
