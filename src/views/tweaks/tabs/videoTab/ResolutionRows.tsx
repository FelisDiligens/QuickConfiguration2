import ButtonRow from "@/components/common/ButtonRow";
import ComboRow from "@/components/common/ComboRow";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import useDisplaySize, { Size } from "@/hooks/tweaks/video/useDisplaySize";
import { css } from "@emotion/react";
import { faMagicWandSparkles } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Form, ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";

const resolutions = [
  { value: "custom", label: "Custom" },
  {
    label: "4:3",
    options: [
      { value: "640x480", label: "640 x 480 (VGA)" },
      { value: "800x600", label: "800 x 600 (SVGA)" },
      { value: "960x720", label: "960 x 720" },
      { value: "1024x768", label: "1024 x 768 (XGA)" },
      { value: "1152x864", label: "1152 x 864" },
      { value: "1280x960", label: "1280 x 960" },
      { value: "1400x1050", label: "1400 x 1050" },
      { value: "1440x1080", label: "1440 x 1080" },
      { value: "1600x1200", label: "1600 x 1200" },
      { value: "1920x1440", label: "1920 x 1440" },
      { value: "2048x1536", label: "2048 x 1536" },
      { value: "2880x2160", label: "2880 x 2160" },
    ],
  },
  {
    label: "5:3",
    options: [
      { value: "800x480", label: "800 x 480" },
      { value: "1280x768", label: "1280 x 768 (WXGA)" },
    ],
  },
  {
    label: "5:4",
    options: [
      { value: "1152x960", label: "1152 x 960" },
      { value: "1280x1024", label: "1280 x 1024" },
      { value: "2560x2048", label: "2560 x 2048" },
      { value: "5120x4096", label: "5120 x 4096" },
    ],
  },
  {
    label: "16:9",
    options: [
      { value: "1024x576", label: "1024 x 576" },
      { value: "1152x648", label: "1152 x 648" },
      { value: "1280x720", label: "1280 x 720 (HD)" },
      { value: "1360x768", label: "1360 x 768" },
      { value: "1365x768", label: "1365 x 768" },
      { value: "1366x768", label: "1366 x 768" },
      { value: "1536x864", label: "1536 x 864" },
      { value: "1600x900", label: "1600 x 900" },
      { value: "1920x1080", label: "1920 x 1080 (Full HD)" },
      { value: "2560x1440", label: "2560 x 1440 (WQHD)" },
      { value: "3200x1800", label: "3200 x 1800" },
      { value: "3840x2160", label: "3840 x 2160 (4K UHD1)" },
      { value: "5120x2880", label: "5120 x 2880 (5K)" },
      { value: "7680x4320", label: "7680 x 4320 (8K UHD2)" },
    ],
  },
  {
    label: "16:10",
    options: [
      { value: "640x400", label: "640 x 400" },
      { value: "1280x800", label: "1280 x 800" },
      { value: "1440x900", label: "1440 x 900" },
      { value: "1680x1050", label: "1680 x 1050" },
      { value: "1920x1200", label: "1920 x 1200" },
      { value: "2560x1600", label: "2560 x 1600" },
      { value: "3840x2400", label: "3840 x 2400" },
    ],
  },
  {
    label: "17:9",
    options: [{ value: "2048x1080", label: "2048 x 1080" }],
  },
  {
    label: "21:9",
    options: [
      { value: "1920x800", label: "1920 x 800" },
      { value: "2560x1080", label: "2560 x 1080" },
      { value: "3440x1440", label: "3440 x 1440" },
      { value: "3840x1600", label: "3840 x 1600" },
      { value: "5120x2160", label: "5120 x 2160" },
    ],
  },
];

function findMatchingResolution(size: Size) {
  const targetResolution = `${size.width}x${size.height}`;

  // Iterate through optgroups to find a match
  for (const group of resolutions) {
    if (group.options) {
      const foundOption = group.options.find(
        (option) => option.value === targetResolution,
      );
      if (foundOption) {
        return foundOption.value;
      }
    }
  }

  // If no match is found, set it to "custom"
  return "custom";
}

export default function ResolutionRows() {
  const { t } = useTranslation();

  const [displaySize, setDisplaySize] = useDisplaySize();
  const [displaySizeOption, setDisplaySizeOption] = useState("custom");

  useEffect(() => {
    setDisplaySizeOption(findMatchingResolution(displaySize));
  }, [displaySize]);

  const handleDisplaySizeOptionChange = (value: string) => {
    setDisplaySizeOption(value);
    if (value !== "custom") {
      const [width, height] = value.split("x").map(Number);
      setDisplaySize({
        width,
        height,
      });
    }
  };

  const autoDetectResolution = () => {
    // TODO: implement auto detect resolution in Rust as a Tauri command
    // It works fine for a single display, I guess?
    // (It doesn't take DPI scaling into account though, so e.g. 1920x1080 with 1.25 scale would result in 1536x864)
    setDisplaySize({
      width: window.screen.width,
      height: window.screen.height,
    });
  };

  return (
    <>
      <ComboRow
        title={t("tweaks.video.resolution")}
        value={displaySizeOption}
        onChange={handleDisplaySizeOptionChange}
      >
        {resolutions.map((group, index) => {
          if (group.options) {
            // This is an optgroup
            return (
              <optgroup key={index} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            );
          } else {
            // This is a standalone option (like "Custom")
            return (
              <option key={group.value} value={group.value}>
                {group.value === "custom"
                  ? t("tweaks.video.customResolutionOption")
                  : group.label}
              </option>
            );
          }
        })}
      </ComboRow>
      {displaySizeOption === "custom" && (
        <ListGroup.Item>
          <FlexRow>
            <FlexCol grow>{t("tweaks.video.customResolution")}</FlexCol>
            <FlexCol>
              <Form.Control
                type="number"
                value={displaySize.width}
                onChange={(event) =>
                  setDisplaySize({
                    width: parseInt(event.target.value),
                    height: displaySize.height,
                  })
                }
                css={css`
                  width: 100px;
                `}
              />
            </FlexCol>
            <FlexCol>x</FlexCol>
            <FlexCol>
              <Form.Control
                type="number"
                value={displaySize.height}
                onChange={(event) =>
                  setDisplaySize({
                    width: displaySize.width,
                    height: parseInt(event.target.value),
                  })
                }
                css={css`
                  width: 100px;
                `}
              />
            </FlexCol>
          </FlexRow>
        </ListGroup.Item>
      )}
      <ButtonRow center onClick={autoDetectResolution}>
        <FontAwesomeIcon icon={faMagicWandSparkles} />
        <span
          css={css`
            margin-left: 10px;
          `}
        >
          {t("tweaks.video.autoDetectResolutionButton")}
        </span>
      </ButtonRow>
    </>
  );
}
