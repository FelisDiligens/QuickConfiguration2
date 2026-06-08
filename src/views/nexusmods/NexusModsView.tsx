import { NexusModsAccountInfo } from "@/commands/bindings";
import ButtonRow from "@/components/common/ButtonRow";
import EntryRow from "@/components/common/EntryRow";
import { PageErrorAlert } from "@/components/common/ErrorAlert";
import LoadingAlert, {
  PageLoadingAlert,
} from "@/components/common/LoadingAlert";
import PageContainer from "@/components/common/PageContainer";
import PageTitle from "@/components/common/PageTitle";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import useAccountInfo from "@/hooks/nexusmods/useAccountInfo";
import useSsoLogin from "@/hooks/nexusmods/useSsoLogin";
import { urls } from "@/info";
import { useNexusModsStore } from "@/stores/nexusmods";
import { css } from "@emotion/react";
import {
  faRightFromBracket,
  faRightToBracket,
  faRotate,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { open } from "@tauri-apps/plugin-shell";
import { useState } from "react";
import { Button, Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import Profile from "./Profile";

function SSOLoginModal(props: { show: boolean; abort: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal show={props.show} backdrop="static" centered>
      <Modal.Header>
        <Modal.Title>
          <span
            css={css`
              font-weight: bold;
            `}
          >
            {t("nexusmods.loginModal.title")}
          </span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <LoadingAlert>{t("nexusmods.loginModal.subtitle")}</LoadingAlert>
        <span
          css={css`
            padding-top: 0;
            font-size: 0.9em;
          `}
        >
          {t("nexusmods.loginModal.text")}
        </span>
      </Modal.Body>
      <Modal.Footer
        css={css`
          justify-content: center;
        `}
      >
        <Button
          variant="danger"
          css={css`
            min-width: 200px;
            border-radius: 9999px;
          `}
          onClick={props.abort}
        >
          {t("nexusmods.loginModal.abort")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function LoggedOutState(props: {
  login: () => void;
  fetchAccount: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const apiKey = useNexusModsStore((store) => store.apiKey || "");
  const setApiKey = useNexusModsStore((store) => store.setApiKey);
  const [showManualLogin, setShowManualLogin] = useState(false);
  const loginWithApiKey = () => props.fetchAccount();
  const openApiKeyHelp = () => open(urls.wiki.pages.nexusmodsLoginFailed);
  return (
    <>
      <div css={css`height: 30px;`} />
      <PreferencesGroup subtitle={t("nexusmods.login.notLoggedIn")}>
        <ButtonRow center onClick={props.login} disabled={props.isLoading}>
          <FontAwesomeIcon icon={faRightToBracket} />
          <span
            css={css`
              margin-left: 10px;
            `}
          >
            {t("nexusmods.login.login")}
          </span>
        </ButtonRow>
      </PreferencesGroup>
      {showManualLogin ? (
        <>
          <PreferencesGroup subtitle={t("nexusmods.login.tryApiKeyLink")}>
            <EntryRow
              title={t("nexusmods.login.apiKey")}
              type="password"
              value={apiKey}
              onChange={setApiKey}
              disabled={props.isLoading}
            />
            <ButtonRow
              center
              onClick={loginWithApiKey}
              disabled={props.isLoading}
            >
              <FontAwesomeIcon icon={faRightToBracket} />
              <span
                css={css`
                  margin-left: 10px;
                `}
              >
                {t("nexusmods.login.loginWithApiKey")}
              </span>
            </ButtonRow>
          </PreferencesGroup>
          <PreferencesGroup noShadow>
            <a href="#" onClick={openApiKeyHelp}>
              {t("nexusmods.login.howToUseApiKeyLink")}
            </a>
          </PreferencesGroup>
        </>
      ) : (
        <PreferencesGroup noShadow>
          <a
            href="#"
            css={css`
              font-size: 0.8em;
            `}
            onClick={() => setShowManualLogin(true)}
          >
            {t("nexusmods.login.tryApiKeyLink")}
          </a>
        </PreferencesGroup>
      )}
    </>
  );
}

function LoggedInState(props: {
  account: NexusModsAccountInfo;
  logout: () => void;
  fetchAccount: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const fetchAccount = () => props.fetchAccount();
  return (
    <>
      <Profile account={props.account} />
      <PreferencesGroup>
        <ButtonRow center onClick={fetchAccount} disabled={props.isLoading}>
          <FontAwesomeIcon icon={faRotate} />
          <span
            css={css`
              margin-left: 10px;
            `}
          >
            {t("nexusmods.profile.updateProfile")}
          </span>
        </ButtonRow>
        <ButtonRow
          center
          variant="danger"
          onClick={props.logout}
          disabled={props.isLoading}
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
          <span
            css={css`
              margin-left: 10px;
            `}
          >
            {t("nexusmods.profile.logout")}
          </span>
        </ButtonRow>
      </PreferencesGroup>
    </>
  );
}

export default function NexusModsView() {
  const { t } = useTranslation();

  const { error, isPending, account, fetchAccount, logout } = useAccountInfo();
  const {
    error: ssoError,
    showModal: showSsoModal,
    login,
    abortLogin,
  } = useSsoLogin({ onSuccess: () => fetchAccount() });

  return (
    <PageContainer>
      <PageTitle>{t("nexusmods.title")}</PageTitle>
      {error && <PageErrorAlert reason={error} />}
      {ssoError && <PageErrorAlert reason={ssoError} />}
      {isPending && <PageLoadingAlert>{t("common.loading")}</PageLoadingAlert>}
      {account ? (
        <LoggedInState
          account={account}
          logout={logout}
          fetchAccount={fetchAccount}
          isLoading={isPending}
        />
      ) : (
        <>
          <SSOLoginModal show={showSsoModal} abort={abortLogin} />
          <LoggedOutState
            login={login}
            fetchAccount={fetchAccount}
            isLoading={isPending}
          />
        </>
      )}
    </PageContainer>
  );
}

// Stub for React Router v6
export const Component: React.FC = NexusModsView;
Component.displayName = "NexusModsView";
