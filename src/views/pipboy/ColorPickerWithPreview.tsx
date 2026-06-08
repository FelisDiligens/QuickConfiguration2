import { FlexCol, FlexRow } from "@/components/common/Flex";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import useDebouncedState from "@/hooks/useDebouncedState";
import { css } from "@emotion/react";
import { InputGroup, ListGroup } from "react-bootstrap";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { useTranslation } from "react-i18next";
import ColoredPreviewImage, { ImportedImage } from "./ColoredPreviewImage";

export default function ColorPickerWithPreview(props: {
  name: string;
  color: string;
  setColor: (hexColor: string) => void;
  mask: ImportedImage;
  screen: ImportedImage;
}) {
  const { t } = useTranslation();
  const [color, setColor] = useDebouncedState(
    props.color,
    props.setColor,
    1000,
  );
  return (
    <>
      <PreferencesGroup title={props.name}>
        <ListGroup.Item>
          <FlexRow
            wrap
            gap="20px"
            css={css`
              margin-bottom: 8px;
            `}
          >
            <FlexCol grow>
              <ColoredPreviewImage
                color={color}
                mask={props.mask}
                screen={props.screen}
              />
            </FlexCol>
            <FlexCol shrink>
              <h4
                css={css`
                  margin-top: 5px;
                  margin-bottom: 19px;
                `}
              >
                {t("pipboy.colorPicker")}
              </h4>
              <HexColorPicker color={color} onChange={setColor} />
              <InputGroup
                css={css`
                  width: 200px;
                  margin-top: 19px;
                `}
              >
                <InputGroup.Text>#</InputGroup.Text>
                <HexColorInput
                  color={color}
                  onChange={setColor}
                  className="form-control"
                />
              </InputGroup>
            </FlexCol>
          </FlexRow>
        </ListGroup.Item>
      </PreferencesGroup>
    </>
  );
}
