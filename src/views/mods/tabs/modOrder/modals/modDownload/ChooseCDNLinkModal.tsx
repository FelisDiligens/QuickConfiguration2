import { NexusModsDownloadLink } from "@/commands/bindings";
import ActionRow from "@/components/common/ActionRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";

interface Props {
  show: boolean;
  onAccept: (link: NexusModsDownloadLink) => void;
  onAbort: () => void;
  links: NexusModsDownloadLink[];
}

export default function ChooseCDNLinkModal(props: Props) {
  const { t } = useTranslation();
  return (
    <Modal show={props.show} onHide={props.onAbort}>
      <Modal.Header closeButton>
        <Modal.Title>
          {t("mods.modOrderTab.modals.chooseCDNModal.title")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t("mods.modOrderTab.modals.chooseCDNModal.description")}</p>
        <PreferencesGroup>
          {props.links.map((link) => (
            <ActionRow
              key={link.uri}
              title={link.shortName}
              subtitle={link.name}
            >
              <Button variant="primary" onClick={() => props.onAccept(link)}>
                {t("mods.modOrderTab.modals.chooseCDNModal.pickButton")}
              </Button>
            </ActionRow>
          ))}
        </PreferencesGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={props.onAbort}>
          {t("mods.modOrderTab.modals.chooseCDNModal.cancelButton")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
