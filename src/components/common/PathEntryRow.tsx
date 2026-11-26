import { css } from "@emotion/react";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import EntryRow from "./EntryRow";
import { FlexRow } from "./Flex";

type DialogType = "open-file" | "open-folder" | "save-file";

interface Props {
  title?: string;
  floatingLabel?: string;
  value: string;
  onChange: (path: string) => void;
  onChosen?: (path: string) => void;
  onValidate: (path: string) => Promise<boolean> | boolean;
  /// Defaults to "open-folder"
  type?: DialogType;
  filters?: {
    name: string;
    extensions: string[];
  }[];
  afterTitleSlot?: React.ReactNode;
  suffix?: React.ReactNode;
}

export default function PathEntryRow(props: Props) {
  const { t } = useTranslation();
  const [isInvalid, setInvalid] = useState(false);

  async function choosePathDialog() {
    const type: DialogType = props.type == null ? "open-folder" : props.type;
    let selected = null;
    switch (type) {
      case "open-file":
        selected = await dialog.open({
          directory: false,
          multiple: false,
          filters: props.filters,
          defaultPath: props.value,
        });
        break;
      case "open-folder":
        selected = await dialog.open({
          directory: true,
          multiple: false,
          filters: props.filters,
          defaultPath: props.value,
        });
        break;
      case "save-file":
        selected = await dialog.save({
          filters: props.filters,
          defaultPath: props.value,
        });
        break;
    }
    if (selected != null) {
      if (props.onChosen) props.onChosen(selected as string);
      else props.onChange(selected as string);
    }
  }

  useEffect(() => {
    if (!props.onValidate) return;
    Promise.resolve(props.onValidate(props.value))
      .then((result) => {
        setInvalid(!result);
      })
      .catch((reason) => {
        console.error(`Couldn't validate value for PathEntryRow: ${reason}`);
      });
  }, [props.value]);

  return (
    <EntryRow
      title={props.title}
      floatingLabel={props.floatingLabel}
      value={props.value}
      onChange={props.onChange}
      isInvalid={isInvalid}
      afterTitleSlot={props.afterTitleSlot}
      suffix={
        <FlexRow
          gap="0.5rem"
          css={css`
            align-self: center;
            max-height: 38px;
          `}
        >
          <Button
            variant="outline-primary"
            title={
              props.type === "open-file" || props.type === "save-file"
                ? t("common.chooseFileButton")
                : t("common.chooseFolderButton")
            }
            onClick={choosePathDialog}
          >
            <FontAwesomeIcon icon={faFolder} />
          </Button>
          {props.suffix}
        </FlexRow>
      }
    />
  );
}
