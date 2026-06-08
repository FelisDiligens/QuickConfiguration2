import { commandErrorToString } from "@/commands/errors";
import { useToastsStore } from "@/stores/toasts";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { errorAtom } from "./useTweak";

export default function useShowToastOnIniSaveError() {
  const { t } = useTranslation();
  const addToast = useToastsStore((store) => store.addToast);
  const saveError = useAtomValue(errorAtom);
  useEffect(() => {
    if (saveError) {
      addToast(
        t("errors.iniSaveFailed"),
        commandErrorToString(saveError),
        "danger",
      );
    }
  }, [saveError]);
}
