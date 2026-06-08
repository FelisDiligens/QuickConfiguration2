import { useModsStore } from "@/stores/mods";
import { css } from "@emotion/react";
import {
  faCheck,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMemo } from "react";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export default function StatusRow() {
  const { t } = useTranslation();
  const mods = useModsStore((store) => store.mods);
  const deploymentNecessary = useModsStore((store) =>
    store.isDeploymentNecessary(),
  );
  const globalEnabled = useModsStore((store) => store.enabled);
  const installedModCount = useMemo(() => mods?.length || 0, [mods]);
  const enabledModCount = useMemo(
    () => mods?.filter((mod) => mod.enabled)?.length || 0,
    [mods],
  );
  return (
    <div
      css={css`
        display: flex;
        flex: 0 0 auto;
        padding: 5px;
        gap: 10px;
        overflow-x: auto;
        height: 30px;
        background-color: var(--bs-tertiary-bg);
      `}
    >
      {deploymentNecessary && (
        <Badge bg="warning">
          <FontAwesomeIcon icon={faTriangleExclamation} />
          &nbsp;
          {t("mods.modOrderTab.statusbar.deploymentNecessary")}
        </Badge>
      )}
      <Badge bg="secondary">
        {t("mods.modOrderTab.statusbar.modsInstalled", {
          count: installedModCount,
        })}
      </Badge>
      <Badge bg="secondary">
        {t("mods.modOrderTab.statusbar.modsEnabled", {
          count: enabledModCount,
        })}
      </Badge>
      {globalEnabled ? (
        <Badge bg="success">
          <FontAwesomeIcon icon={faCheck} />
          &nbsp;
          {t("mods.modOrderTab.statusbar.modsEnabled")}
        </Badge>
      ) : (
        <Badge bg="danger">
          <FontAwesomeIcon icon={faXmark} />
          &nbsp;
          {t("mods.modOrderTab.statusbar.modsDisabled")}
        </Badge>
      )}
    </div>
  );
}
