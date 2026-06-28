import { commands } from "@/commands/bindings";
import { updaterService } from "@/services/updater";
import { useSettingsStore } from "@/stores/settings";
import { useToastsStore } from "@/stores/toasts";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

let checked = false;

export function useUpdateCheckOnStart() {
  const { t } = useTranslation();
  const checkForUpdatesOnStart = useSettingsStore(
    (s) => s.checkForUpdatesOnStart,
  );

  useEffect(() => {
    if (!checkForUpdatesOnStart) return;
    if (checked) return;
    checked = true;
    async function checkForUpdates() {
      if (await commands.isDebug()) return;
      const update = await updaterService.check();
      if (update) {
        useToastsStore.getState().addToast(
          t("updates.toasts.updateAvailable"),
          t("updates.toasts.updateAvailableText", {
            version: update?.version,
          }),
        );
      }
    }
    checkForUpdates().catch(console.error);
  }, []);
}
