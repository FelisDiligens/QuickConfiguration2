import Toasts from "@/components/Toasts";
import UpdateProgressModal from "@/components/UpdateProgressModal";
import FirstRunModal from "@/components/modals/FirstRunModal";
import PrereleaseModal from "@/components/modals/PrereleaseModal";
import Navigation from "@/components/navigation/Navigation";
import { useNxmRedirect } from "@/hooks/nxm";
import useShowToastOnIniSaveError from "@/hooks/tweaks/useShowToastOnIniSaveError";
import { useUpdateCheckOnStart } from "@/hooks/updater";
import { useBlockFileDragAndDrop } from "@/hooks/useBlockFileDragAndDrop";
import useSyncTranslation from "@/hooks/useSyncTranslation";
import { css } from "@emotion/react";
import { Outlet } from "react-router-dom";

function Globals() {
  useSyncTranslation();
  useNxmRedirect();
  useBlockFileDragAndDrop();
  useUpdateCheckOnStart();
  useShowToastOnIniSaveError();
  return (
    <>
      <FirstRunModal />
      <PrereleaseModal />
      <UpdateProgressModal />
      <Toasts />
    </>
  );
}

export default function Layout() {
  return (
    <div
      css={css`
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        width: 100%;
        height: 100%;
        overflow-x: hidden;
      `}
    >
      <div
        css={css`
          display: flex;
          flex: 0 0 auto;
          flex-wrap: nowrap;
          flex-direction: column;
          flex-shrink: 0;
          width: auto;
          padding: 0;
          /* If the z-index isn't set here, then the dropdown will be underneath UI elements: */
          z-index: 3;
        `}
      >
        <Navigation />
      </div>
      <div
        css={css`
          display: flex;
          flex: 1 0 0;
          flex-grow: 1;
          flex-wrap: nowrap;
          flex-direction: column;
          min-width: 0;
          height: 100%;
          padding: 0;
        `}
      >
        <Outlet />
      </div>
      <Globals />
    </div>
  );
}
