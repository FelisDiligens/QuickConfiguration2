import packageInfo from "@/../package.json";
import {
  BethNet16Icon,
  Nexus16Icon,
  NukaCrypt16Icon,
  NukesDragons16Icon,
  XTranslator16Icon,
} from "@/assets/img";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import Spacer from "@/components/common/Spacer";
import { AppTheme } from "@/components/MyThemeProvider";
import { info, urls } from "@/info";
import { useTranslationsStore } from "@/lib/i18n/store";
import { css } from "@emotion/react";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import {
  faBug,
  faFile,
  faInfoCircle,
  faMap,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import DonateButton from "./DonateButton";
import { ServerStatusRow } from "./ServerStatus";
import WebLink from "./WebLink";

interface Props {
  onWhatsNewClick: () => void;
}

export default function Welcome(props: Props) {
  const { t, i18n } = useTranslation();
  const version = info.version;
  const author = info.author;
  const translation = useTranslationsStore((s) =>
    s.getTranslation(i18n.language),
  );
  return (
    <FlexCol
      css={css`
        padding: 10px 10px 0px 20px;
        overflow-x: hidden;
      `}
    >
      <FlexCol>
        <span
          css={(theme: AppTheme) => css`
            font-family: ${theme.titleFontFamily};
            font-size: 20pt;
            color: ${theme.fontColor};
          `}
        >
          {t("home.title")}
        </span>
        <p className="mt-0 fs-6">{t("home.subtitle")}</p>
      </FlexCol>
      <FlexRow>
        <FlexCol grow>
          <table
            css={css`
              width: 0;
              & * {
                white-space: nowrap;
              }
              & th {
                padding: 0 50px 0 0;
                height: 28px;
                vertical-align: middle;
              }
              & td {
                padding: 0 10px 0 0;
                vertical-align: middle;
              }
              & button {
                height: 28px;
                padding: 2px 10px;
              }
            `}
          >
            <tbody>
              <tr>
                <th>{t("home.version")}:</th>
                <td>
                  <span>{version}</span>&nbsp;
                  <Badge bg="warning">{t("home.prerelease")}</Badge>
                </td>
              </tr>
              <tr>
                <th>{t("home.author")}:</th>
                <td>
                  <span>{author}</span>
                </td>
              </tr>
              {translation?.author &&
                translation.author !== packageInfo.author && (
                  <tr>
                    <th>{t("home.translationAuthor")}:</th>
                    <td>
                      <span>{translation.author}</span>
                    </td>
                  </tr>
                )}
              <ServerStatusRow />
            </tbody>
          </table>
          <br />
          <a href="#/" onClick={props.onWhatsNewClick}>
            <FontAwesomeIcon icon={faFile} />
            &nbsp; {t("home.whatsNew")}
          </a>
        </FlexCol>
        <FlexCol gap="4px">
          <span className="fw-bold">{t("home.links.title")}</span>
          <WebLink href={urls.nexusmods.home}>
            <img src={Nexus16Icon} />
            <span>{t("home.links.nexusmods")}</span>
          </WebLink>
          <WebLink href={urls.github.repo}>
            <FontAwesomeIcon icon={faGithub} />
            <span>{t("home.links.github")}</span>
          </WebLink>
          <WebLink href={urls.wiki.home}>
            <FontAwesomeIcon icon={faInfoCircle} color="CornflowerBlue" />
            <span>{t("home.links.wiki")}</span>
          </WebLink>
          <WebLink href={urls.nexusmods.bugs}>
            <FontAwesomeIcon icon={faBug} color="OrangeRed" />
            <span>{t("home.links.bugs")}</span>
          </WebLink>
          <Spacer />
          <WebLink href={urls.other.bethesdaStatus}>
            <img src={BethNet16Icon} />
            <span>{t("home.links.bethesdaNetStatus")}</span>
          </WebLink>
          <Spacer />
          <WebLink href={urls.other.nukesAndDragonsBuildPlanner}>
            <img src={NukesDragons16Icon} />
            <span>{t("home.links.nukesAndDragonsBuildPlanner")}</span>
          </WebLink>
          <WebLink href={urls.other.nukacrypt}>
            <img src={NukaCrypt16Icon} />
            <span>{t("home.links.nukacrypt")}</span>
          </WebLink>
          <WebLink href={urls.other.map76}>
            <FontAwesomeIcon icon={faMap} />
            <span>{t("home.links.map76")}</span>
          </WebLink>
          <WebLink href={urls.other.xTranslator}>
            <img src={XTranslator16Icon} />
            <span>{t("home.links.xTranslator")}</span>
          </WebLink>
          <DonateButton />
        </FlexCol>
      </FlexRow>
    </FlexCol>
  );
}
