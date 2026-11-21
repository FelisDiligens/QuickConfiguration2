import { NexusModsDownloadLink } from "@/commands/bindings";
import { ActionRow, PreferencesGroup } from "@/components/common";
import { ModalComponentProps } from "@/stores/modals";
import { animationsEnabled } from "@/utils";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface ChooseCDNLinkModalData {
  links: NexusModsDownloadLink[];
}

export default function ChooseCDNLinkModal(
  props: ModalComponentProps<ChooseCDNLinkModalData, NexusModsDownloadLink>,
) {
  const { t } = useTranslation();
  return (
    <Modal
      show={props.isOpen}
      onHide={props.cancel}
      animation={animationsEnabled}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {t("mods.modOrderTab.modals.chooseCDNModal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.chooseCDNModal.description")}</p>
        <PreferencesGroup>
          {props.data.links.map((link) => (
            <ActionRow
              key={link.uri}
              title={link.shortName}
              subtitle={link.name}
            >
              <Button variant="primary" onClick={() => props.close(link)}>
                {t("mods.modOrderTab.modals.chooseCDNModal.pickButton")}
              </Button>
            </ActionRow>
          ))}
        </PreferencesGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={props.cancel}>
          {t("mods.modOrderTab.modals.chooseCDNModal.cancelButton")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
