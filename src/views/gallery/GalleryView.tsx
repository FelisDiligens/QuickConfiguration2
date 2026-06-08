import { commands } from "@/commands/bindings";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import { Flex } from "@/components/common/Flex";
import { PageLoadingAlert } from "@/components/common/LoadingAlert";
import PageAlert from "@/components/common/PageAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle, { Title } from "@/components/common/PageTitle";
import { useAsync } from "@/hooks/async";
import { useProfilesStore } from "@/stores/profiles";
import { css } from "@emotion/react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

export default function GalleryView() {
  const { t } = useTranslation();

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
  } = useAsync({
    promiseFn: () => commands.getScreenshots(gamePath, iniPath),
    watch: [gamePath, iniPath],
  });

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
        <PhotoProvider>
          {screenshots.map((image) => (
            <PhotoView key={image.path} src={convertFileSrc(image.path)}>
              <img src={convertFileSrc(image.thumbnailPath)} />
            </PhotoView>
          ))}
        </PhotoProvider>
      </Flex>
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = GalleryView;
Component.displayName = "GalleryView";
