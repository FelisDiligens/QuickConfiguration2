import packageInfo from "@/../package.json";
import { Translation } from "@/commands/bindings";
import de from "@/i18n/de.json";
import en from "@/i18n/en.json";

/** Translations that are built-in to the app as opposed to dynamically loaded in from a folder. */
export const builtinTranslations: Translation[] = [
  {
    key: "en",
    name: "English",
    author: packageInfo.author,
    translation: en,
  },
  {
    key: "de",
    name: "Deutsch",
    author: packageInfo.author,
    translation: de,
  },
];
