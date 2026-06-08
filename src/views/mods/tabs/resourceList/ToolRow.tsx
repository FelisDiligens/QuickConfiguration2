import { modsEventBus } from "@/services/mods";
import {
  faBroom,
  faMagnifyingGlass,
  faPlusSquare,
} from "@fortawesome/free-solid-svg-icons";
import { useTranslation } from "react-i18next";
import { Toolbar, ToolButton } from "../../common/Toolbar";

export default function ToolRow() {
  const { t } = useTranslation();
  return (
    <Toolbar>
      <ToolButton
        icon={faPlusSquare}
        width={120}
        onClick={() => modsEventBus.emitResourcelistAddArchive()}
      >
        {t("mods.resourceListTab.toolbar.addArchiveName")}
      </ToolButton>
      <ToolButton
        icon={faMagnifyingGlass}
        width={120}
        onClick={() => modsEventBus.emitResourcelistAddUnlistedArchives()}
      >
        {t("mods.resourceListTab.toolbar.addUnlisted")}
      </ToolButton>
      <ToolButton
        icon={faBroom}
        width={120}
        onClick={() => modsEventBus.emitResourcelistRemoveNonExistantArchives()}
      >
        {t("mods.resourceListTab.toolbar.removeUnavailable")}
      </ToolButton>
    </Toolbar>
  );
}
