import { useTranslationsStore } from "@/lib/i18n/store";
import { useSettingsStore } from "@/stores/settings";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Syncs state between i18next and the SettingsStore.
 * If the language is set to `null` (default value),
 * then set it initially to what i18next detected.
 * To change the language, use `setLanguage` from `SettingsStore`.
 */
export default function useSyncTranslation() {
  const { i18n } = useTranslation();
  const { translations, isI18nextInitialized } = useTranslationsStore();
  const languages = useMemo(
    () => translations.map((t) => t.key),
    [translations],
  );
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  function detectLanguage() {
    let detectedLng = undefined;
    for (const lng of navigator.languages) {
      detectedLng = languages.find((supportedLng) =>
        lng.startsWith(supportedLng),
      );
      if (detectedLng) break; // navigator.languages is ordered by preference
    }
    return detectedLng || "en";
  }

  useEffect(() => {
    if (language === null) {
      // TODO: Get i18next-browser-languagedetector to work.
      // Until then, use `detectLanguage` to crudely use `navigator.languages` and get the next best result:
      setLanguage(detectLanguage());
    } else if (isI18nextInitialized) {
      i18n.changeLanguage(language).catch(console.error);
    }
  }, [language, isI18nextInitialized]);
}
