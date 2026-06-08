import { useToastsStore } from "@/stores/toasts";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** Block file drag and drop, so it doesn't open the file in the web view. */
export function useBlockFileDragAndDrop() {
  const { t } = useTranslation();
  const addToast = useToastsStore((s) => s.addToast);

  useEffect(() => {
    function handleFileDragover(e: DragEvent) {
      e.preventDefault();
    }

    function handleFileDrop(e: DragEvent) {
      // On Windows, it returns either [] or ["Files"]
      // On Linux, it returns a list of mimetypes.
      const types = e.dataTransfer?.types ? [...e.dataTransfer.types] : [];
      // Ignore "text/plain" as it is likely handled by @formkit/drag-and-drop.
      if (
        types.length === 0 ||
        (types.length === 1 && types[0] === "text/plain")
      )
        return;
      e.preventDefault();
      addToast(
        t("errors.dndWarning.title"),
        t("errors.dndWarning.text"),
        "warning",
      );
    }

    window.addEventListener("dragover", handleFileDragover);
    window.addEventListener("drop", handleFileDrop);
    return () => {
      window.removeEventListener("dragover", handleFileDragover);
      window.removeEventListener("drop", handleFileDrop);
    };
  }, []);
}
