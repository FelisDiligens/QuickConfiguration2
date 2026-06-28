import {
  ModCopyMethod,
  ResourceInsertionPosition,
  commands,
} from "@/commands/bindings";
import { AnyError, commandErrorToString } from "@/commands/errors";
import Mods from "@/commands/mods";
import ComboRow from "@/components/common/ComboRow";
import PageAlert from "@/components/common/PageAlert";
import PathEntryRow from "@/components/common/PathEntryRow";
import PreferencesGroup from "@/components/common/PreferencesGroup";
import RadioRow from "@/components/common/RadioRow";
import RadioRowGroup from "@/components/common/RadioRowGroup";
import SwitchRow from "@/components/common/SwitchRow";
import { useNxmRegistration } from "@/hooks/nxm";
import { useProfilesStore } from "@/stores/profiles";
import {
  resourceListStoreSync,
  useResourceListStore,
} from "@/stores/resourceList";
import { useSettingsStore } from "@/stores/settings";
import { Trans, useTranslation } from "react-i18next";

export default function SettingsTab() {
  const { t } = useTranslation();
  const settings = useSettingsStore((s) => s.modManager);
  const setSettings = useSettingsStore((s) => s.setModManagerSettings);
  const nxm = useNxmRegistration();

  /**
   * Switches the ini keys around, then saves the ini file.
   * Existing resource lists will be merged in order to avoid data loss.
   */
  async function switchResourcelist(newIniKey: string) {
    try {
      const resources = useResourceListStore.getState().resources;
      const oldIniKey = useSettingsStore.getState().modManager.resourceList;
      const iniPath = useProfilesStore.getState().getIniPath();
      const iniPrefix = useProfilesStore.getState().getIniPrefix();
      if (!iniPath || !iniPrefix)
        throw new Error(t("mods.errors.unsetIniPathOrIniPrefix"));

      const newResources = await Mods.resourceList.switchIniKeys(
        resources,
        "Custom",
        "Archive",
        oldIniKey,
        newIniKey,
      );
      useResourceListStore.getState().setResources(newResources);
      resourceListStoreSync.cancelSave();

      console.log("Saving ini file after resource list switch");
      await commands.iniSave(iniPath, iniPrefix);
    } catch (error) {
      console.error(
        "Error while switching resource list:",
        commandErrorToString(error as AnyError),
      );
    }
    // Changing the settings here will cause the resource list store to reload:
    // (this is why saving the ini file beforehand is important)
    setSettings((settings) => ({ ...settings, resourceList: newIniKey }));
  }

  return (
    <div>
      <PageAlert>
        <Trans
          t={t}
          i18nKey="mods.settingsTab.noteDeployMods"
          components={{ b: <b /> }}
        />
      </PageAlert>
      <PreferencesGroup title={t("mods.settingsTab.copyMethodGroup")}>
        <RadioRowGroup
          name="copyFileMethod"
          value={settings.copyMethod}
          onChange={(copyMethod) =>
            setSettings((settings) => ({
              ...settings,
              copyMethod: copyMethod as ModCopyMethod,
            }))
          }
        >
          <RadioRow
            title={t("mods.settingsTab.makeHardLinksOption")}
            subtitle={t("mods.settingsTab.makeHardLinksOptionSubtitle")}
            id="hardlink"
          />
          <RadioRow
            title={t("mods.settingsTab.makeSymlinksOption")}
            subtitle={t("mods.settingsTab.makeSymlinksOptionSubtitle")}
            id="symlink"
          />
          <RadioRow
            title={t("mods.settingsTab.copyFilesOption")}
            subtitle={t("mods.settingsTab.copyFilesOptionSubtitle")}
            id="copy"
          />
        </RadioRowGroup>
      </PreferencesGroup>

      <PreferencesGroup title={t("mods.settingsTab.deploymentBehavior")}>
        <ComboRow
          title={t("mods.settingsTab.resourceListOption")}
          value={settings.resourceList}
          onChange={(resourceList) =>
            switchResourcelist(resourceList).catch(console.error)
          }
        >
          <option value="sResourceArchive2List">
            [Archive] sResourceArchive2List ({t("mods.settingsTab.default")})
          </option>
          <option value="sResourceIndexFileList">
            [Archive] sResourceIndexFileList
          </option>
        </ComboRow>
        <SwitchRow
          title={t("mods.settingsTab.keepConfigFiles")}
          subtitle={t("mods.settingsTab.keepConfigFilesSubtitle", {
            extensions: [
              "*.ini",
              "*.json",
              "*.jsonc",
              "*.yaml",
              "*.yml",
              "*.xml",
              "*.toml",
              "*.conf",
              "*.cfg",
            ].join(", "),
          })}
          checked={settings.keepConfigFiles}
          onChange={(keepConfigFiles) =>
            setSettings((settings) => ({ ...settings, keepConfigFiles }))
          }
        />
        <ComboRow
          title={t("mods.settingsTab.resourceInsertionPosition")}
          value={settings.resourceInsertionPosition}
          onChange={(position) =>
            setSettings((settings) => ({
              ...settings,
              resourceInsertionPosition: position as ResourceInsertionPosition,
            }))
          }
        >
          <option value="append">
            {t("mods.settingsTab.resourceInsertionPositionAppend")}
          </option>
          <option value="prepend">
            {t("mods.settingsTab.resourceInsertionPositionPrepend")}
          </option>
        </ComboRow>
      </PreferencesGroup>
      <PreferencesGroup title={t("mods.settingsTab.nexusmodsGroup")}>
        <PathEntryRow
          title={t("mods.settingsTab.downloadsFolder")}
          value={settings.downloadPath}
          onChange={(downloadPath) =>
            setSettings((settings) => ({ ...settings, downloadPath }))
          }
          onValidate={commands.isDirectory}
        />
        <SwitchRow
          title={t("mods.settingsTab.associateNxmUrl")}
          subtitle={t("mods.settingsTab.associateNxmUrlSubtitle")}
          errorText={nxm.error ? commandErrorToString(nxm.error) : undefined}
          checked={nxm.isRegistered}
          disabled={nxm.isPending}
          onChange={(value) => {
            if (value) nxm.register();
            else nxm.unregister();
          }}
        />
        <SwitchRow
          title={t("mods.settingsTab.showNexusModsTitle")}
          subtitle={t("mods.settingsTab.showNexusModsTitleSubtitle")}
          checked={settings.showNexusModsTitle}
          onChange={(showNexusModsTitle) =>
            setSettings((settings) => ({ ...settings, showNexusModsTitle }))
          }
        />
      </PreferencesGroup>
    </div>
  );
}
