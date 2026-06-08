import { AnyError, commandErrorToString } from "@/commands/errors";
import { useTranslationsStore } from "@/lib/i18n/store";
import * as i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { backend } from "./backend";

async function initI18n() {
  try {
    await useTranslationsStore.getState().loadTranslations();
  } catch (error) {
    console.error(
      "Loading translations store failed:",
      commandErrorToString(error as AnyError),
    );
  }
  await i18n
    .use(backend) // lazy load translations using custom backend
    .use(LanguageDetector) // detect user language based on browser API
    .use(initReactI18next) // pass instance to react-i18next
    .init({
      fallbackLng: "en",
      debug: true,
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      react: {
        bindI18n: "loaded languageChanged", // rerender when calling i18next.reloadResources
        // https://github.com/i18next/react-i18next/issues/1171#issuecomment-689234418
      },
    });
  useTranslationsStore.setState({ isI18nextInitialized: true });
}

initI18n().catch((error) => console.error(`i18n init error: ${error}`));
