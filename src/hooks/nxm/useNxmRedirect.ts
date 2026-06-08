import { nxmLinksQueueService } from "@/services/nxm";
import { activeTabAtom } from "@/views/mods/ModsView";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Redirect to /mods when nxm:// url was opened.
 */
export function useNxmRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const setModTab = useSetAtom(activeTabAtom);
  useEffect(() => {
    return nxmLinksQueueService.subscribe(() => {
      if (location.pathname !== "/mods") {
        navigate("/mods");
        setModTab("modorder");
        console.log("Navigating to /mods");
      }
    }, true);
  }, []);
}
