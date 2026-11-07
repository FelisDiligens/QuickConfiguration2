import PreferencesGroup from "@/components/common/PreferencesGroup";
import SwitchRow from "@/components/common/SwitchRow";
import useAskScrapFavorite from "@/hooks/tweaks/interface/useAskScrapFavorite";
import useAskScrapLegendary from "@/hooks/tweaks/interface/useAskScrapLegendary";
import useAskScrapPremium from "@/hooks/tweaks/interface/useAskScrapPremium";
import { useTranslation } from "react-i18next";

export default function ItemScrappingOptions() {
  const { t } = useTranslation();

  const [askScrapLegendary, setAskScrapLegendary] = useAskScrapLegendary();
  const [askScrapFavorite, setAskScrapFavorite] = useAskScrapFavorite();
  const [askScrapPremium, setAskScrapPremium] = useAskScrapPremium();

  return (
    <PreferencesGroup title={t("tweaks.general.itemScrappingGroup")}>
      <SwitchRow
        title={t("tweaks.general.askScrapLegendary")}
        subtitle={t("tweaks.general.askScrapLegendarySubtitle")}
        checked={askScrapLegendary}
        onChange={setAskScrapLegendary}
      />
      <SwitchRow
        title={t("tweaks.general.askScrapFavorite")}
        subtitle={t("tweaks.general.askScrapFavoriteSubtitle")}
        checked={askScrapFavorite}
        onChange={setAskScrapFavorite}
      />
      <SwitchRow
        title={t("tweaks.general.askScrapPremium")}
        subtitle={t("tweaks.general.askScrapPremiumSubtitle")}
        checked={askScrapPremium}
        onChange={setAskScrapPremium}
      />
    </PreferencesGroup>
  );
}
