import {
  AnyError,
  commandErrorIsArchive2Error,
  commandErrorToString,
} from "@/commands/errors";
import { MessageModal } from "@/components/modals/MessageModal";
import { urls } from "@/info";
import { open } from "@tauri-apps/plugin-shell";
import { Trans, useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onHide: () => void;
  reason: AnyError;
}

export default function Archive2ErrorModal(props: Props) {
  const { t } = useTranslation();

  const formatErrorMessage = (error: AnyError) => {
    if (commandErrorIsArchive2Error(error)) {
      switch (error.variant) {
        case "Archive2RequirementsNotMet":
          return (
            <Trans
              t={t}
              i18nKey="mods.modOrderTab.modals.archive2.error.archive2RequirementsNotMet"
              values={{
                errorMessage:
                  'Could not load file or assembly "Archive2Interop.dll".',
              }}
              components={{
                i: <i />,
                br: <br />,
                a: (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      open(urls.requirements.visualCppRedist).catch(
                        console.error,
                      );
                    }}
                  />
                ),
              }}
              tOptions={{ joinArrays: " " }}
            />
          );
        case "WineNotFound":
          return (
            <Trans
              t={t}
              i18nKey="mods.modOrderTab.modals.archive2.error.wineNotFound"
              values={{
                command: "sudo apt install wine",
              }}
              components={{ code: <code />, br: <br /> }}
            />
          );
        case "WineMonoNotInstalled":
          return (
            <Trans
              t={t}
              i18nKey="mods.modOrderTab.modals.archive2.error.wineMonoNotInstalled"
              values={{
                fileName: "wine-mono.msi",
                fileExtension: ".msi",
                command: "wine uninstaller",
              }}
              components={{
                a: (
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      open(urls.requirements.wineMono).catch(console.error);
                    }}
                  />
                ),
                code: <code />,
              }}
            />
          );
        case "Archive2NotFound":
          return (
            <Trans
              t={t}
              i18nKey="mods.modOrderTab.modals.archive2.error.archive2NotFound"
              values={{
                archive2File: "resources/Archive2/Archive2.exe",
                programFile: "f76qc2.exe",
              }}
              components={{ code: <code /> }}
            />
          );
      }
    }
    return <span>{commandErrorToString(error)}</span>;
  };

  return (
    <MessageModal
      title={t("errors.anErrorOccurred")}
      show={props.show}
      onHide={props.onHide}
    >
      <p>{formatErrorMessage(props.reason)}</p>
    </MessageModal>
  );
}
