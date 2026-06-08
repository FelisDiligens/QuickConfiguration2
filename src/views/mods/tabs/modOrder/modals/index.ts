import { atom } from "jotai";

// Common modals
export const isLoadingModalShownAtom = atom(false);
export const isErrorModalShownAtom = atom(false);

// Mod actions modals
export const isModDeletionModalShownAtom = atom(false);
export const isModConflictingFilesModalShownAtom = atom(false);

// Mod download modals
export const isCdnModalShownAtom = atom(false);

// Mod installation modals
export const isModInstallationDetailsModalShownAtom = atom(false);
export const isModArchiveImportModalShownAtom = atom(false);

// NexusMods modals
export const isOutdatedModsModalShownAtom = atom(false);
export const isLoggedOutModalShownAtom = atom(false);

// Archive2 modals
export const isArchive2InfoModalShownAtom = atom(false);
export const isArchive2CreateModalShownAtom = atom(false);
export const isArchive2ExtractModalShownAtom = atom(false);
export const isArchive2AutoPackModalShownAtom = atom(false);
export const isArchive2ErrorModalShownAtom = atom(false);

export const isAnyModalShownAtom = atom(
  (get) =>
    get(isLoadingModalShownAtom) ||
    get(isErrorModalShownAtom) ||
    get(isCdnModalShownAtom) ||
    get(isModDeletionModalShownAtom) ||
    get(isModConflictingFilesModalShownAtom) ||
    get(isModInstallationDetailsModalShownAtom) ||
    get(isModArchiveImportModalShownAtom) ||
    get(isOutdatedModsModalShownAtom) ||
    get(isLoggedOutModalShownAtom) ||
    get(isArchive2InfoModalShownAtom) ||
    get(isArchive2CreateModalShownAtom) ||
    get(isArchive2ExtractModalShownAtom) ||
    get(isArchive2AutoPackModalShownAtom) ||
    get(isArchive2ErrorModalShownAtom),
);
