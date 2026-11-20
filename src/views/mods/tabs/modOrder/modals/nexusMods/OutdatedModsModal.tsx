import { MessageModal } from "@/components/modals/MessageModal";
import { modsEventBus } from "@/services/mods";
import { ModalComponentProps } from "@/stores/modals";
import { faCloudArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import type { OutdatedMod } from "./types";

export interface OutdatedModsModalData {
  outdatedMods?: OutdatedMod[] | null;
}

export default function OutdatedModsModal(
  props: ModalComponentProps<OutdatedModsModalData, void>,
) {
  const { t } = useTranslation();
  return (
    <MessageModal
      isOpen={props.isOpen}
      data={{
        title: t("mods.modOrderTab.modals.outdatedModsModal.title"),
        children:
          props.data.outdatedMods && props.data.outdatedMods.length > 0 ? (
            <>
              <p>
                {t("mods.modOrderTab.modals.outdatedModsModal.modsOutdated", {
                  count: props.data.outdatedMods.length,
                })}
              </p>
              <Table>
                <thead>
                  <tr>
                    <th>
                      {t(
                        "mods.modOrderTab.modals.outdatedModsModal.tableHeaderMod",
                      )}
                    </th>
                    <th>
                      {t(
                        "mods.modOrderTab.modals.outdatedModsModal.tableHeaderCurrentVersion",
                      )}
                    </th>
                    <th>
                      {t(
                        "mods.modOrderTab.modals.outdatedModsModal.tableHeaderLatestVersion",
                      )}
                    </th>
                    <th>
                      {t(
                        "mods.modOrderTab.modals.outdatedModsModal.tableHeaderActions",
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(props.data.outdatedMods || []).map((mod) => (
                    <tr key={mod.key}>
                      <td>{mod.title}</td>
                      <td>{mod.currentVersion}</td>
                      <td>{mod.latestVersion}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            props.cancel();
                            modsEventBus.emitNexusModsUpdateMod(mod.key);
                          }}
                        >
                          <FontAwesomeIcon icon={faCloudArrowDown} />
                          &nbsp;
                          {t(
                            "mods.modOrderTab.modals.outdatedModsModal.updateButton",
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : (
            <p>{t("mods.modOrderTab.modals.outdatedModsModal.allUpToDate")}</p>
          ),
      }}
      close={props.cancel}
      cancel={props.cancel}
    />
  );
}
