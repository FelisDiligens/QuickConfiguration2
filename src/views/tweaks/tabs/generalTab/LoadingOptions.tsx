import { PreferencesGroup, SwitchRow } from "@/components/common";
import {
  useFasterFadeIn,
  usePlayIntroVideo,
  useSkipStartupSplash,
} from "@/hooks/tweaks/general";
import { useTranslation } from "react-i18next";

export default function LoadingOptions() {
  const { t } = useTranslation();

  const [playIntroVideo, setPlayIntroVideo] = usePlayIntroVideo();
  const [skipStartupSplash, setSkipStartupSplash] = useSkipStartupSplash();
  const [fasterFadeIn, setFasterFadeIn] = useFasterFadeIn();

  return (
    <PreferencesGroup title={t("tweaks.general.loadingGroup")}>
      <SwitchRow
        title={t("tweaks.general.skipIntroVideos")}
        checked={!playIntroVideo}
        onChange={(value) => setPlayIntroVideo(!value)}
      />
      <SwitchRow
        title={t("tweaks.general.skipStartupSplash")}
        subtitle={t("tweaks.general.skipStartupSplashSubtitle")}
        checked={skipStartupSplash}
        onChange={setSkipStartupSplash}
      />
      <SwitchRow
        title={t("tweaks.general.fasterFadeIn")}
        subtitle={t("tweaks.general.fasterFadeInSubtitle")}
        checked={fasterFadeIn}
        onChange={setFasterFadeIn}
      />
    </PreferencesGroup>
  );
}
