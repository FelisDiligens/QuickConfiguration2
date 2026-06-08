import { commands } from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import { useEffect, useState } from "react";

/**
 * Dynamically (at runtime) registers and unregisters `nxm://` URLs to the app.
 * Dynamic registration works only on Windows and Linux. macOS uses different mechanisms and is therefore unsupported.
 * Also checks whether it is already registered or not.
 */
export function useNxmRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<AnyError>(null);

  useEffect(() => {
    commands
      .nxmIsRegistered()
      .then((isRegistered) => setIsRegistered(isRegistered))
      .catch((error) => {
        console.error(
          "Failed to check if NXM protocol is already registered:",
          commandErrorToString(error),
        );
        setError(error);
      });
  }, []);

  const register = () => {
    setIsPending(true);
    commands
      .nxmRegister()
      .then(() => {
        console.log("NXM protocol registered.");
        setIsRegistered(true);
      })
      .catch((error) => {
        console.error(
          "Could not register NXM protocol:",
          commandErrorToString(error),
        );
        setError(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  const unregister = () => {
    commands
      .nxmUnregister()
      .then(() => {
        console.log("NXM protocol unregistered.");
        setIsRegistered(false);
      })
      .catch((error) => {
        console.error(
          "Could not unregister NXM protocol:",
          commandErrorToString(error),
        );
        setError(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return {
    isRegistered,
    isPending,
    error,
    register,
    unregister,
  };
}
