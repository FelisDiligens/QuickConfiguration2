import { Status, fetchLocalizedServerStatus } from "@/api/bethesdaServerStatus";
import {
  StatusMaintenance24Icon,
  StatusMajorOutage24Icon,
  StatusOperational24Icon,
  StatusPartialOutage24Icon,
} from "@/assets/img";
import { isRelease } from "@/commands/additions";
import { commands } from "@/commands/bindings";
import useTheme from "@/hooks/useTheme";
import { useSettingsStore } from "@/stores/settings";
import { css } from "@emotion/react";
import {
  faCircleQuestion,
  faExclamationCircle,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

enum State {
  Uninitialized,
  Loading,
  Failed,
  Finished,
}

const statusAtom = atom<Status | null>(null);
const statusMessageAtom = atom<string | null>(null);
const stateAtom = atom(State.Uninitialized);
const buttonDisabledAtom = atom(false);

export function ServerStatusRow() {
  const { t } = useTranslation();
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const fetchServerStatusOnStart = useSettingsStore(
    (s) => s.fetchServerStatusOnStart,
  );

  const [status, setStatus] = useAtom(statusAtom);
  const [statusMessage, setStatusMessage] = useAtom(statusMessageAtom);
  const [state, setState] = useAtom(stateAtom);
  const [isButtonDisabled, setButtonDisabled] = useAtom(buttonDisabledAtom);

  async function fetchStatus() {
    setState(State.Loading);
    setStatus(null);
    setStatusMessage(t("home.serverStatus.loading"));
    setButtonDisabled(true);
    try {
      const { status, message } = await fetchLocalizedServerStatus(
        language || "en",
      );
      setState(State.Finished);
      setStatus(status);
      setStatusMessage(message);

      if (await commands.isDebug()) {
        setButtonDisabled(false); // in debug mode, allow another request immediately (for unit tests)
      } else {
        setTimeout(() => setButtonDisabled(false), 60 * 1000); // prevent user from spamming requests
      }
    } catch (reason) {
      console.error("Failed to fetch server status:", reason);
      setState(State.Failed);
      setStatusMessage(t("home.serverStatus.error"));
      if (await commands.isDebug()) {
        setButtonDisabled(false); // in debug mode, allow another request immediately (for unit tests)
      } else {
        setTimeout(() => setButtonDisabled(false), 5 * 1000); // prevent user from spamming requests
      }
    }
  }

  useEffect(() => {
    const load = async () => {
      if (
        (await isRelease()) &&
        fetchServerStatusOnStart &&
        state == State.Uninitialized
      ) {
        // in release mode, fetch status on app start if user has enabled that in the settings
        // in debug mode, hot reload would send too many requests unnecessarily and it makes unit tests difficult
        await fetchStatus();
      }
    };
    load().catch(console.error);
  }, []);

  return (
    <tr>
      <th>{t("home.serverStatus.label")}:</th>
      <td>
        {state == State.Failed && (
          <FontAwesomeIcon icon={faExclamationCircle} />
        )}
        {state == State.Loading && (
          <Spinner
            animation="border"
            css={css`
              height: 20px;
              width: 20px;
            `}
          />
        )}
        {state == State.Uninitialized && (
          <FontAwesomeIcon icon={faCircleQuestion} />
        )}
        {status == Status.Operational && <img src={StatusOperational24Icon} />}
        {status == Status.Maintenance && <img src={StatusMaintenance24Icon} />}
        {status == Status.DegradedPerformance && (
          <img src={StatusPartialOutage24Icon} />
        )}
        {status == Status.ParialOutage && (
          <img src={StatusPartialOutage24Icon} />
        )}
        {status == Status.MajorOutage && <img src={StatusMajorOutage24Icon} />}
        <span
          css={css`
            margin-left: 10px;
          `}
        >
          {statusMessage || t("home.serverStatus.refresh")}
        </span>
      </td>
      <td>
        <Button
          variant={theme}
          onClick={fetchStatus}
          disabled={isButtonDisabled}
        >
          <FontAwesomeIcon icon={faRefresh} />
        </Button>
      </td>
    </tr>
  );
}
