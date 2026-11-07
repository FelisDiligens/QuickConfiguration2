import DialogueOptions from "./generalTab/DialogueOptions";
import FloatingQuestMarkersOptions from "./generalTab/FloatingQuestMarkersOptions";
import GameplayOptions from "./generalTab/GameplayOptions";
import HUDOptions from "./generalTab/HUDOptions";
import ItemScrappingOptions from "./generalTab/ItemScrappingOptions";
import LoadingOptions from "./generalTab/LoadingOptions";
import LockedItemsOptions from "./generalTab/LockedItemsOptions";
import QuestsOptions from "./generalTab/QuestsOptions";

export default function GeneralTab() {
  return (
    <>
      <LoadingOptions />
      <GameplayOptions />
      <DialogueOptions />
      <HUDOptions />
      <FloatingQuestMarkersOptions />
      <ItemScrappingOptions />
      <LockedItemsOptions />
      <QuestsOptions />
    </>
  );
}
