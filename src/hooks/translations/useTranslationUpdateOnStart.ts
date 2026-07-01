import { commands } from "@/commands/bindings";
import { translationUpdateService } from "@/services/translations";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

let checked = false;

export function useTranslationUpdateOnStart() {
  const { t } = useTranslation();
  const downloadTranslationsOnStart = useSettingsStore(
    (s) => s.downloadTranslationsOnStart,
  );

  useEffect(() => {
    if (!downloadTranslationsOnStart) return;
    if (checked) return;
    checked = true;
    async function checkAndUpdate() {
      if (await commands.isDebug()) return;
      const newTranslationsAvailable = await translationUpdateService.check();
      if (!newTranslationsAvailable) return;
      const newTranslations = await translationUpdateService.update();
      if (newTranslations == null || newTranslations.length == 0) return;
      useToastsStore.getState().addToast(
        t("updates.toasts.translationsDownloaded"),
        t("updates.toasts.translationsDownloadedText", {
          count: newTranslations.length,
          files: newTranslations.join(", "),
        }),
      );
    }
    checkAndUpdate().catch(console.error);
  }, []);
}
