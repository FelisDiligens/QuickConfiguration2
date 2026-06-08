import { commands, Translation, TranslationMeta } from "@/commands/bindings";
import {
  AnyError,
  commandErrorIsTranslationParseError,
  TranslationParseError,
} from "@/commands/errors";
import deepmerge from "deepmerge";
import { default as i18next } from "i18next";
import _ from "lodash";
import { create } from "zustand";
import { builtinTranslations } from "./translations";

export interface TranslationsStore {
  translations: TranslationMeta[];
  parseErrors: TranslationParseError[];
  isPending: boolean;
  isI18nextInitialized: boolean;
  error: AnyError;
  /** Get metadata about a translation by key. */
  getTranslation: (key: string) => TranslationMeta | undefined;
  /** Load translations from disk and reload i18next. */
  loadTranslations: () => Promise<TranslationMeta[]>;
  /** Save a translation template to disk where new keys from English are merged into the old translation. */
  createTranslationTemplate: (key: string) => Promise<string>;
}

/** The translations store keeps metadata about built-in and dynamically loaded translations. */
export const useTranslationsStore = create<TranslationsStore>()((set, get) => ({
  translations: [],
  parseErrors: [],
  isPending: false,
  isI18nextInitialized: false,
  error: null,
  getTranslation: (key) => get().translations.find((lng) => lng.key === key),
  loadTranslations: async () => {
    if (get().isPending) return get().translations;
    set({
      isPending: true,
      error: null,
      parseErrors: [],
    });
    try {
      const results = await commands.loadAllTranslationMetadata();
      const translations = [];
      for (const result of results) {
        if (result.status === "ok") {
          translations.push(result.value);
        } else if (commandErrorIsTranslationParseError(result.value)) {
          set({ parseErrors: [...get().parseErrors, result.value] });
        } else {
          throw result.value;
        }
      }
      useTranslationsStore.setState({
        translations: _(translations)
          .concat(
            builtinTranslations.map(({ translation: _, ...metadata }) => ({
              ...metadata,
            })),
          )
          .concat(get().translations)
          .uniqBy("key")
          .value(),
      });
      if (get().isI18nextInitialized) {
        await i18next.reloadResources();
      }
    } catch (error) {
      set({ error: error as AnyError });
      throw error;
    } finally {
      set({ isPending: false });
    }
    return get().translations;
  },
  createTranslationTemplate: async (key) => {
    const english = builtinTranslations.find((t) => t.key === "en");
    const currentMetadata = get().getTranslation(key);
    const currentResource = i18next.getDataByLanguage(key);
    if (!english) throw new Error("Couldn't get English translation");
    if (!currentMetadata)
      throw new Error(`Couldn't get metadata for translation ${key}`);

    const template: Translation = {
      ...currentMetadata,
      translation: deepmerge(
        english.translation as object,
        currentResource?.translation as object,
        {
          arrayMerge: (_dst, src, _opt) => src,
        },
      ) as Translation["translation"],
    };
    const fileName = `${key}.template.json`;

    await commands.saveTranslation(fileName, template);
    return fileName;
  },
}));
