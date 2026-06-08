import { Profile } from "@/commands/bindings";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import PageContainer from "@/components/common/PageContainer";
import PageContent from "@/components/common/PageContent";
import PageTitle from "@/components/common/PageTitle";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import * as profilesService from "@/services/profiles";
import { useProfilesStore } from "@/stores/profiles";
import {
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RefObject, useRef, useState } from "react";
import { Button, ListGroup } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import EditProfileModal from "./EditProfileModal";
import ProfileListRow from "./ProfileListRow";

function useProfiles(dndParentRef: RefObject<HTMLElement | null>) {
  const { t } = useTranslation();

  const profiles = useProfilesStore((store) => store.profiles);
  const setProfiles = useProfilesStore((store) => store.setProfiles);
  const setSelectedIndex = useProfilesStore((store) => store.setSelectedIndex);
  const selectedIndex = useProfilesStore((store) => store.getSelectedIndex());
  const selectedKey = useProfilesStore((store) => store.selected);
  const selectedProfile = useProfilesStore((store) =>
    store.getSelectedProfile(),
  );

  const getProfileByKey = useProfilesStore((store) => store.getProfileByKey);
  const updateProfile = useProfilesStore((store) => store.updateProfile);
  const addProfile = useProfilesStore((store) => store.addProfile);
  const deleteProfile = useProfilesStore((store) => store.deleteProfile);
  const moveProfileUp = useProfilesStore((store) => store.moveProfileUp);
  const moveProfileDown = useProfilesStore((store) => store.moveProfileDown);

  const deleteSelectedProfile = () => deleteProfile(selectedIndex);
  const addNewProfile = async () => {
    let title = t("common.unnamedProfile");
    let num = 1;
    while (profiles.find((profile) => profile.title == title) !== undefined) {
      title = `${t("common.unnamedProfile")} ${++num}`;
    }
    let profile;
    try {
      profile =
        await profilesService.createProfileWithAutoDetectedDefaults(title);
    } catch (reason) {
      console.error(
        `Couldn't auto detect configuration for new profile: ${reason}`,
      );
      profile = profilesService.createProfileWithDefaults(
        title,
        "Unknown",
        "",
        "",
      );
    }
    addProfile(profile);
    return profile;
  };

  useDragAndDrop(profiles, setProfiles, dndParentRef, {
    onDragend: (event) => {
      // https://github.com/formkit/drag-and-drop/issues/132
      // For some reason, the z-index does not reset which interferes with the dialog:
      event.draggedNode.el.style.zIndex = "auto";
    },
  });

  return {
    profiles,
    selectedIndex,
    selectedKey,
    selectedProfile,
    deleteSelectedProfile,
    addNewProfile,
    getProfileByKey,
    updateProfile,
    setSelectedIndex,
    moveProfileUp,
    moveProfileDown,
  };
}

export default function ProfilesView() {
  const { t } = useTranslation();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalKey, setEditModalKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedProfile, setEditedProfile] = useState<
    Profile | undefined | null
  >(null);

  const dndParentRef = useRef<HTMLDivElement | null>(null);
  const {
    profiles,
    selectedIndex,
    selectedKey,
    selectedProfile,
    deleteSelectedProfile,
    addNewProfile,
    getProfileByKey,
    updateProfile,
    setSelectedIndex,
    moveProfileUp,
    moveProfileDown,
  } = useProfiles(dndParentRef);

  function openEditProfileModal(key: string) {
    setEditedProfile(getProfileByKey(key));
    setEditModalKey((prevValue) => prevValue + 1); // Force edit modal component to reset state
    setShowEditModal(true);
  }

  function openConfirmDeleteModal() {
    if (profiles.length > 1) setShowDeleteModal(true);
  }

  function onDelete() {
    deleteSelectedProfile();
    setShowDeleteModal(false);
  }

  function onAdd() {
    addNewProfile()
      .then((profile) => openEditProfileModal(profile.key))
      .catch(console.error);
  }

  function onEdit() {
    openEditProfileModal(selectedKey);
  }

  function onEditModalSave(profile: Profile) {
    updateProfile(profile);
    setShowEditModal(false);
  }

  function onSelect(index: number) {
    setSelectedIndex(index);
  }

  function onMoveUp(index: number) {
    moveProfileUp(index);
  }

  function onMoveDown(index: number) {
    moveProfileDown(index);
  }

  const listItems = profiles.map((profile, index) => {
    return (
      <ProfileListRow
        key={profile.key}
        onSelect={() => onSelect(index)}
        onMoveUp={() => onMoveUp(index)}
        onMoveDown={() => onMoveDown(index)}
        active={index == selectedIndex}
        profileName={profile.title}
        gameEdition={profile.gameEdition}
      />
    );
  });

  return (
    <PageContainer>
      <PageTitle>{t("profiles.title")}</PageTitle>
      <PageContent>
        <FlexRow gap="1rem">
          <FlexCol grow>
            {listItems.length > 0 ? (
              <ListGroup ref={dndParentRef}>{listItems}</ListGroup>
            ) : (
              <p>{t("profiles.noProfileFound")}</p>
            )}
          </FlexCol>
          <FlexCol gap="1rem">
            <Button
              variant="outline-primary"
              title={t("profiles.addButton")}
              onClick={onAdd}
            >
              <FontAwesomeIcon icon={faPlus} />
            </Button>
            <Button
              variant="outline-primary"
              title={t("profiles.editButton")}
              onClick={onEdit}
              disabled={profiles.length == 0}
            >
              <FontAwesomeIcon icon={faPenToSquare} />
            </Button>
            <Button
              variant={
                "outline-" + (profiles.length <= 1 ? "secondary" : "danger")
              }
              title={t("profiles.deleteButton")}
              onClick={openConfirmDeleteModal}
              disabled={profiles.length <= 1}
            >
              <FontAwesomeIcon icon={faTrash} />
            </Button>
          </FlexCol>
        </FlexRow>
      </PageContent>
      {selectedProfile && (
        <ConfirmModal
          title={t("profiles.confirmDeleteModal.title", {
            profile: selectedProfile.title,
          })}
          show={showDeleteModal}
          onConfirm={onDelete}
          onAbort={() => setShowDeleteModal(false)}
        >
          <p>
            {t("profiles.confirmDeleteModal.text", {
              profile: selectedProfile.title,
            })}
          </p>
        </ConfirmModal>
      )}
      {editedProfile && (
        <EditProfileModal
          show={showEditModal}
          key={editModalKey}
          onHide={() => setShowEditModal(false)}
          onSave={onEditModalSave}
          profile={editedProfile}
        />
      )}
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = ProfilesView;
Component.displayName = "ProfilesView";
