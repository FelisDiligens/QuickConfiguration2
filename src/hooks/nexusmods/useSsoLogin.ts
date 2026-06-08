import { AnyError } from "@/commands/errors";
import NexusMods from "@/commands/nexusmods";
import { useNexusModsStore } from "@/stores/nexusmods";
import { useState } from "react";
import useListen from "../useListen";

export default function useSsoLogin(options: { onSuccess: () => void }) {
  const setApiKey = useNexusModsStore((store) => store.setApiKey);

  const [error, setError] = useState<AnyError>(null);
  const [isPending, setIsPending] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Login with SSO:
  function login() {
    if (isPending) return;
    console.log("Logging in to NexusMods via SSO");
    setIsPending(true);
    setShowModal(true);
    setError(null);
    NexusMods.loginViaSso().catch((reason) => {
      console.error(reason);
      setIsPending(false);
      setShowModal(false);
      setError(reason);
    });
  }

  function abortLogin() {
    console.log("Aborting the NexusMods SSO login");
    NexusMods.events.ssoAbort.emit().catch(console.error);
  }

  useListen(NexusMods.events.ssoUpdate, (event) => {
    console.log("Received SSO event:", event);
    if (event.payload === "canceled") {
      setIsPending(false);
      setShowModal(false);
      setError("Login aborted by user.");
    } else if ("error" in event.payload) {
      const error = event.payload.error;
      setIsPending(false);
      setShowModal(false);
      setError(error);
    } else if ("apiKey" in event.payload) {
      const apiKey = event.payload.apiKey;
      setIsPending(false);
      setShowModal(false);
      setError(null);
      setApiKey(apiKey);
      options.onSuccess();
    }
  });

  return {
    error,
    isPending,
    showModal,
    login,
    abortLogin,
  };
}
