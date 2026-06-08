import MyThemeProvider from "@/components/MyThemeProvider";
import { css } from "@emotion/react";
import { faFileArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsBoundary } from "../../components/boundaries";

const dndWindow = getCurrentWebviewWindow();

function Dropzone() {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    function handleFileDragover(e: DragEvent) {
      setActive(true);
      e.preventDefault();
    }

    function handleFileDragend(e: DragEvent) {
      setActive(false);
      e.preventDefault();
    }

    function handleFileDrop(e: DragEvent) {
      setActive(false);
      e.preventDefault();
    }

    window.addEventListener("dragover", handleFileDragover);
    window.addEventListener("dragend", handleFileDragend);
    window.addEventListener("drop", handleFileDrop);
    return () => {
      window.removeEventListener("dragover", handleFileDragover);
      window.removeEventListener("dragend", handleFileDragend);
      window.removeEventListener("drop", handleFileDrop);
    };
  }, []);

  useEffect(() => {
    const unlisten = dndWindow.onDragDropEvent((e) => {
      switch (e.payload.type) {
        case "enter":
        case "over":
          setActive(true);
          break;
        case "leave":
        case "drop":
          setActive(false);
          break;
      }
    });
    return () => {
      unlisten.then((f) => f()).catch(console.error);
    };
  }, []);

  return (
    <div css={css`padding: 20px; height: 100%;`}>
      <div
        css={css`
          border: 2px dashed var(--bs-secondary);
          opacity: 0.7;
          border-radius: 4px;
          padding: 20px;
          text-align: center;
          transition: border-color 0.3s ease;
          width: 100%;
          height: 100%;
          &:hover {
            opacity: 1;
          }
          ${
            active &&
            css`
              border-color: var(--bs-primary);
              opacity: 1;
            `
          }
        `}
      >
        <FontAwesomeIcon icon={faFileArrowDown} size="xl" />
        <div css={css`padding: 6px;`}>
          {t("dragAndDropWindow.dragAndDropFilesHere")}
        </div>
      </div>
    </div>
  );
}

export default function View() {
  return (
    <MyThemeProvider>
      <SettingsBoundary>
        <Dropzone />
      </SettingsBoundary>
    </MyThemeProvider>
  );
}
