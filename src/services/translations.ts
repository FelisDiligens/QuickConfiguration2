import { commands } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import { useTranslationsStore } from "@/lib/i18n/store";
import { useSettingsStore } from "@/stores/settings";

interface CheckState {
  newTranslationsAvailable?: boolean | undefined;
  isPending: boolean;
  error: AnyError;
}

interface UpdateState {
  isPending: boolean;
  error: AnyError;
}

export class TranslationUpdateService {
  private subscriber = new Set<(type: "check" | "update") => void>();
  private checkState: CheckState = {
    isPending: false,
    error: null,
  };
  private updateState: UpdateState = {
    isPending: false,
    error: null,
  };

  public async check() {
    if (this.checkState.isPending) return;
    const now = new Date().toISOString();
    console.log("[TranslationUpdateService] Checking for new translations...");
    this.checkState = {
      isPending: true,
      error: null,
    };
    this.emit("check");
    try {
      const translationsLastUpdated =
        await useSettingsStore.getState().translationsLastUpdated;
      const newTranslationsAvailable =
        await commands.checkForTranslationUpdates(translationsLastUpdated);
      if (newTranslationsAvailable)
        console.log("[TranslationUpdateService] New translations were found!");
      else
        console.log("[TranslationUpdateService] Translations are up-to-date.");
      useSettingsStore.setState({ translationsLastUpdated: now });
      this.checkState = {
        newTranslationsAvailable,
        isPending: false,
        error: null,
      };
      this.emit("check");
      return newTranslationsAvailable;
    } catch (error) {
      console.log(
        "[TranslationUpdateService] Error:",
        commandErrorToString(error as AnyError),
      );
      this.checkState = {
        isPending: false,
        error: error as AnyError,
      };
      this.emit("check");
      throw error;
    }
  }

  public async update() {
    if (this.updateState.isPending) return;
    const now = new Date().toISOString();
    console.log(
      "[TranslationUpdateService] Downloading translations from GitHub...",
    );
    this.updateState = {
      isPending: true,
      error: null,
    };
    this.emit("update");
    try {
      const translations = await commands.downloadTranslations();
      console.log(
        "[TranslationUpdateService] Translations downloaded:",
        translations,
      );
      useSettingsStore.setState({ translationsLastUpdated: now });
      this.updateState = {
        isPending: false,
        error: null,
      };
      this.emit("update");
      console.log(
        "[TranslationUpdateService] Reloading translations from disk",
      );
      await useTranslationsStore.getState().loadTranslations();
      return translations;
    } catch (error) {
      console.log(
        "[TranslationUpdateService] Error:",
        commandErrorToString(error as AnyError),
      );
      this.updateState = {
        isPending: false,
        error: error as AnyError,
      };
      this.emit("update");
      throw error;
    }
  }

  /**
   * Subscribes to check and update states.
   *
   * @param listener - Callback function invoked when checkState or updateState change.
   * @returns A function to unsubscribe
   */
  public subscribe(listener: (type: "check" | "update") => void) {
    this.subscriber.add(listener);
    return () => {
      this.subscriber.delete(listener);
    };
  }

  private emit(type: "check" | "update") {
    this.subscriber.forEach((listener) => listener(type));
  }

  public getCheckState() {
    return this.checkState;
  }

  public getUpdateState() {
    return this.updateState;
  }
}

export const translationUpdateService = new TranslationUpdateService();
