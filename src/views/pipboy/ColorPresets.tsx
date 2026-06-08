import PreferencesGroup from "@/components/common/PreferencesGroup";
import { useRef } from "react";
import { ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import ColorOrb from "./ColorOrb";
import Separator from "./Separator";

interface Props {
  setColor: (color: string) => void;
}

export default function ColorPresets({ setColor }: Props) {
  const { t } = useTranslation();

  // We pass this ref as the Popover container because otherwise it
  // would somehow change the content size and the entire page jerks around. :/
  const ref = useRef<HTMLDivElement>(null);
  return (
    <PreferencesGroup
      ref={ref}
      title={t("pipboy.presets")}
      subtitle={t("pipboy.presetsSubtitle")}
    >
      <ListGroup.Item>
        <ColorOrb
          color="#1AFF80"
          name={t("pipboy.presetColors.fo3.name")}
          description={t("pipboy.presetColors.fo3.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#FFB742"
          name={t("pipboy.presetColors.fonv.name")}
          description={t("pipboy.presetColors.fonv.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#2CD0FF"
          name={t("pipboy.presetColors.fo3blue.name")}
          description={t("pipboy.presetColors.fo3blue.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#C0FFFF"
          name={t("pipboy.presetColors.fo3white.name")}
          description={t("pipboy.presetColors.fo3white.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#12FF14"
          name={t("pipboy.presetColors.fo4.name")}
          description={t("pipboy.presetColors.fo4.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <Separator />
        <ColorOrb
          color="#1AFF80"
          name={t("pipboy.presetColors.fo76.name")}
          description={t("pipboy.presetColors.fo76.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#F7F3B9"
          name={t("pipboy.presetColors.fo76quickboy.name")}
          description={t("pipboy.presetColors.fo76quickboy.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#FFD166"
          name={t("pipboy.presetColors.fo76pa.name")}
          description={t("pipboy.presetColors.fo76pa.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <Separator />
        <ColorOrb
          color="#FFFFFF"
          name={t("pipboy.presetColors.radiantWhite.name")}
          description={t("pipboy.presetColors.radiantWhite.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#BE6EFD"
          name={t("pipboy.presetColors.calmingLavender.name")}
          description={t("pipboy.presetColors.calmingLavender.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
        <ColorOrb
          color="#FF6E5B"
          name={t("pipboy.presetColors.lushTato.name")}
          description={t("pipboy.presetColors.radiantWhite.description")}
          onClick={setColor}
          overlayContainer={ref}
        />
      </ListGroup.Item>
    </PreferencesGroup>
  );
}
