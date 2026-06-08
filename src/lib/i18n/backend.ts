import { commands } from "@/commands/bindings";
import { BackendModule, InitOptions, ReadCallback, Services } from "i18next";
import { builtinTranslations } from "./translations";

/**
 * Custom i18next backend to load translations from disk using Tauri commands.
 * Built-in translations are preferred: "en", "de"
 */
export const backend: BackendModule<object> = {
  type: "backend",
  init: function (
    _services: Services,
    _backendOptions: object,
    _i18nextOptions: InitOptions,
  ): void {
    // init has to be implemented for the interface BackendModule
  },
  read: function (
    language: string,
    namespace: string,
    callback: ReadCallback,
  ): void {
    if (namespace !== "translation")
      throw new Error("Namespaces are not supported");

    // Prefer built-in translations:
    const translation = builtinTranslations.find((t) => t.key === language);
    if (translation) {
      callback(null, translation.translation as object);
      return;
    }

    // Load translation from disk:
    commands
      .loadTranslation(language)
      .then((t) => callback(null, t.translation as object))
      .catch((error) => callback(error, null));
  },
};
