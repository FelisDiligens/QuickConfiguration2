import { commands, events } from "./bindings";

/** Wrapper around exported commands from Rust. */
const NexusMods = {
  api: {
    validate: commands.nexusmodsApiValidate,
    retrieveModinfo: commands.nexusmodsApiRetrieveModinfo,
    endorse: commands.nexusmodsApiEndorse,
    abstain: commands.nexusmodsApiAbstain,
    listModFiles: commands.nexusmodsApiListModFiles,
    requestDownloadLinks: commands.nexusmodsApiRequestDownloadLinks,
  },
  getAccountInfo: commands.nexusmodsGetAccountInfo,
  setAccountInfo: commands.nexusmodsSetAccountInfo,
  deleteAccountInfo: commands.nexusmodsDeleteAccountInfo,
  getModInfos: commands.nexusmodsGetModinfos,
  setModInfos: commands.nexusmodsSetModinfos,
  loginViaSso: commands.nexusmodsLoginViaSso,
  extractIdsFromUrl: commands.nexusmodsExtractIdsFromUrl,
  extractDetailsFromNxmUrl: commands.nexusmodsExtractDetailsFromNxmUrl,
  events: {
    ssoAbort: events.ssoAbort,
    ssoUpdate: events.ssoUpdate,
  },
};

export default NexusMods;
