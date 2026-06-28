import { useResourceListActions } from "@/hooks/mods/useResourceListActions";
import { modsEventBus } from "@/services/mods";
import { useEffect, useState } from "react";
import AddResourceModal from "./AddResourceModal";
import RemoveResourceModal from "./RemoveResourceModal";

export default function ResourceListModals() {
  const {
    addArchive,
    removeArchive,
    addUnlistedArchives,
    removeNonExistantArchives,
    addGameVoicesArchives,
    removeGameArchives,
  } = useResourceListActions();

  const [showAddModal, setShowAddModal] = useState(false);

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeModalArchiveName, setRemoveModalArchiveName] = useState("");

  // React to messages:
  useEffect(
    () =>
      modsEventBus.onUIActionEvent((message) => {
        switch (message.type) {
          case "resourcelist-add-archive":
            setShowAddModal(true);
            break;
          case "resourcelist-add-unlisted-archives":
            addUnlistedArchives().catch(console.error);
            break;
          case "resourcelist-remove-non-existant-archives":
            removeNonExistantArchives().catch(console.error);
            break;
          case "resourcelist-add-game-voices-archives":
            addGameVoicesArchives().catch(console.error);
            break;
          case "resourcelist-remove-game-archives":
            removeGameArchives().catch(console.error);
            break;
          case "resourcelist-remove-archive":
            setShowRemoveModal(true);
            setRemoveModalArchiveName(message.name);
            break;
          // no default
        }
      }),
    [],
  );

  return (
    <>
      <AddResourceModal
        show={showAddModal}
        onConfirm={(name) => {
          addArchive(name);
          setShowAddModal(false);
        }}
        onAbort={() => setShowAddModal(false)}
      />
      <RemoveResourceModal
        show={showRemoveModal}
        archiveName={removeModalArchiveName}
        onConfirm={(name) => {
          removeArchive(name);
          setShowRemoveModal(false);
        }}
        onAbort={() => setShowRemoveModal(false)}
      />
    </>
  );
}
