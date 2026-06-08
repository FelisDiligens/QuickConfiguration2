import { NexusModsAccountInfo, NexusModsRateLimit } from "@/commands/bindings";
import { FlexCol, FlexRow } from "@/components/common/Flex";
import InfoRow from "@/components/common/InfoRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import { css } from "@emotion/react";
import { useTranslation } from "react-i18next";

function ProfilePicture(props: { pictureUrl: string }) {
  return (
    <div
      css={css`
        width: 100px;
        height: 100px;
        border: 1px solid var(--bs-secondary-border-subtle);
        border-radius: 9999px;
        background-color: var(--bs-secondary-bg);
        background-image: url("${props.pictureUrl}");
        background-size: cover;
      `}
    />
  );
}

function ProfileHero(props: { userName: string; pictureUrl: string }) {
  return (
    <FlexCol
      css={css`
        padding: 20px 0 20px 0;

        & > div {
          justify-content: center;
        }
      `}
    >
      <FlexRow>
        <ProfilePicture pictureUrl={props.pictureUrl} />
      </FlexRow>
      <FlexRow>
        <span
          css={css`
            font-size: 1.5em;
            font-weight: 600;
            text-align: center;
            padding: 10px 0 0 0;
          `}
        >
          {props.userName}
        </span>
      </FlexRow>
    </FlexCol>
  );
}

function ProfileInfo(props: {
  membership: string;
  userId: string;
  rateLimit: NexusModsRateLimit;
}) {
  const { t } = useTranslation();
  return (
    <PreferencesGroup>
      <InfoRow title={t("nexusmods.profile.membership")}>
        {props.membership}
      </InfoRow>
      <InfoRow title={t("nexusmods.profile.userId")}>{props.userId}</InfoRow>
      <InfoRow title={t("nexusmods.profile.hourlyRateLimit.title")}>
        {t("nexusmods.profile.hourlyRateLimit.text", {
          count: props.rateLimit.hourlyRemaining,
          reset: new Date(props.rateLimit.hourlyReset),
          formatParams: {
            reset: {
              hour: "numeric",
              minute: "numeric",
            },
          },
        })}
      </InfoRow>
      <InfoRow title={t("nexusmods.profile.dailyRateLimit.title")}>
        {t("nexusmods.profile.dailyRateLimit.text", {
          count: props.rateLimit.dailyRemaining,
          reset: new Date(props.rateLimit.dailyReset),
          formatParams: {
            reset: {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            },
          },
        })}
      </InfoRow>
    </PreferencesGroup>
  );
}

export default function Profile(props: { account: NexusModsAccountInfo }) {
  return (
    <>
      <ProfileHero
        userName={props.account.profile.name}
        pictureUrl={props.account.profile.profileUrl}
      />
      <ProfileInfo
        membership={props.account.profile.membership}
        userId={props.account.profile.userId.toString()}
        rateLimit={props.account.rateLimit}
      />
    </>
  );
}
