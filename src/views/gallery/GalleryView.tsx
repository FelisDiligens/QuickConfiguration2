import { commands, Screenshot } from "@/commands/bindings";
import { commandErrorToString } from "@/commands/errors";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import { Flex } from "@/components/common/Flex";
import { PageLoadingAlert } from "@/components/common/LoadingAlert";
import PageAlert from "@/components/common/PageAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle, { Title } from "@/components/common/PageTitle";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { useAsync } from "@/hooks/async";
import { useProfilesStore } from "@/stores/profiles";
import { css } from "@emotion/react";
import {
  faArrowUpRightFromSquare,
  faFolderOpen,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faTrash,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { convertFileSrc } from "@tauri-apps/api/core";
import * as path from "@tauri-apps/api/path";
import * as dialog from "@tauri-apps/plugin-dialog";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

function ToolBarButton(props: {
  title?: string;
  icon: IconDefinition;
  onClick?: () => void;
}) {
  return (
    <Button
      title={props.title}
      variant="link"
      onClick={props.onClick}
      className="PhotoView-Slider__toolbarIcon"
      css={css`
        color: white;
        &:hover, &:active {
          color: white;
        }
      `}
    >
      <FontAwesomeIcon icon={props.icon} />
    </Button>
  );
}

function ConfirmDeleteDialog(props: {
  screenshotPath: string;
  show: boolean;
  onConfirm: () => void;
  onAbort: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      title={t("gallery.deleteScreenshot.title")}
      show={props.show}
      onConfirm={props.onConfirm}
      onAbort={props.onAbort}
    >
      <span css={css`overflow-wrap: anywhere;`}>
        {t("gallery.deleteScreenshot.text", { path: props.screenshotPath })}
      </span>
    </ConfirmModal>
  );
}

export default function GalleryView() {
  const { t } = useTranslation();

  const [screenshotToDelete, setScreenshotToDelete] = useState<
    Screenshot | undefined
  >(undefined);

  // Get the game installation path and ini parent path from the profile:
  const gamePath =
    useProfilesStore((store) => store.getSelectedProfile()?.installationPath) ||
    null;
  const iniPath =
    useProfilesStore((store) => store.getSelectedProfile()?.iniPath) || null;

  // Get game and Steam screenshots:
  const {
    data: screenshots,
    isPending,
    error,
    reload,
  } = useAsync({
    promiseFn: () => commands.getScreenshots(gamePath, iniPath),
    watch: [gamePath, iniPath],
  });

  function showErrorMessage(reason: Error | string) {
    const formattedReason = commandErrorToString(reason);
    dialog
      .message(`${t("errors.anErrorOccurred")}: ${formattedReason}`, {
        title: t("common.error"),
        kind: "error",
      })
      .catch((reason) =>
        console.error(`Couldn't show Tauri message dialog: ${reason}`),
      );
  }

  function openFolder(index: number) {
    const screenshotPath = screenshots?.at(index)?.path;
    if (!screenshotPath) {
      console.warn(
        `GalleryView -> openFolder: couldn't determine path from index ${index}`,
      );
      return;
    }
    path
      .dirname(screenshotPath)
      .then((parentPath) => commands.openPathInFileExplorer(parentPath))
      .catch(showErrorMessage);
  }

  function openScreenshot(index: number) {
    const screenshotPath = screenshots?.at(index)?.path;
    if (!screenshotPath) {
      console.warn(
        `GalleryView -> openScreenshot: couldn't determine path from index ${index}`,
      );
      return;
    }
    commands.openPathInFileExplorer(screenshotPath).catch(showErrorMessage);
  }

  function showDeleteScreenshotConfirmDialog(index: number) {
    const screenshot = screenshots?.at(index);
    if (!screenshot) {
      console.warn(
        `GalleryView -> showDeleteScreenshotConfirmDialog: couldn't determine screenshot from index ${index}`,
      );
      return;
    }
    setScreenshotToDelete(screenshot);
  }

  function deleteScreenshot(screenshot: Screenshot) {
    commands
      .removeFile(screenshot.path)
      .then(() => {
        commands
          .removeFile(screenshot.thumbnailPath)
          .catch((reason) =>
            console.error(
              `Couldn't remove thumbnail of screenshot ${screenshot.path}: ${reason}`,
            ),
          );
        reload();
      })
      .catch(showErrorMessage);
  }

  function confirmDeleteScreenshot() {
    const screenshot = screenshotToDelete;
    setScreenshotToDelete(undefined);
    if (!screenshot) {
      console.warn(
        "GalleryView -> confirmDeleteScreenshot: couldn't determine screenshot to delete",
      );
      return;
    }
    deleteScreenshot(screenshot);
  }

  if (error) {
    return (
      <PageContainer>
        <PageTitle>{t("gallery.title")}</PageTitle>
        <PageErrorAlert reason={error} />
      </PageContainer>
    );
  } else if (isPending) {
    return (
      <PageContainer>
        <PageTitle>{t("gallery.title")}</PageTitle>
        <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>
      </PageContainer>
    );
  } else if (!screenshots || screenshots.length == 0) {
    return (
      <PageContainer>
        <PageTitle>{t("gallery.title")}</PageTitle>
        <PageAlert>{t("gallery.noImagesFound")}</PageAlert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Title>{t("gallery.title")}</Title>
      <Flex
        wrap
        gap="0.5rem"
        css={css`
            margin: 10px auto 0 auto;
            width: 100%;
            text-align: center;
            justify-content: center;
            
            & img {
              max-width: 200px;
            }
          `}
      >
        <PhotoProvider
          toolbarRender={({ index, onScale, scale, onClose }) => {
            return (
              <>
                <ToolBarButton
                  title={t("gallery.toolbar.deleteScreenshot")}
                  icon={faTrash}
                  onClick={() => {
                    onClose();
                    showDeleteScreenshotConfirmDialog(index);
                  }}
                />
                <ToolBarButton
                  title={t("gallery.toolbar.openScreenshot")}
                  icon={faArrowUpRightFromSquare}
                  onClick={() => openScreenshot(index)}
                />
                <ToolBarButton
                  title={t("gallery.toolbar.openContainingFolder")}
                  icon={faFolderOpen}
                  onClick={() => openFolder(index)}
                />
                <ToolBarButton
                  title={t("gallery.toolbar.zoomIn")}
                  icon={faMagnifyingGlassPlus}
                  onClick={() => onScale(scale + 1)}
                />
                <ToolBarButton
                  title={t("gallery.toolbar.zoomOut")}
                  icon={faMagnifyingGlassMinus}
                  onClick={() => onScale(scale - 1)}
                />
              </>
            );
          }}
        >
          {screenshots.map((image) => (
            <PhotoView key={image.path} src={convertFileSrc(image.path)}>
              <img src={convertFileSrc(image.thumbnailPath)} />
            </PhotoView>
          ))}
        </PhotoProvider>
      </Flex>

      <ConfirmDeleteDialog
        screenshotPath={screenshotToDelete?.path || ""}
        show={screenshotToDelete != undefined}
        onConfirm={confirmDeleteScreenshot}
        onAbort={() => setScreenshotToDelete(undefined)}
      />
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = GalleryView;
Component.displayName = "GalleryView";
