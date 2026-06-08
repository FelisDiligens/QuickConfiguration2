import { commands, IniErrorContext } from "@/commands/bindings";
import { AnyError, commandErrorIsIniParseError } from "@/commands/errors";
import { useAsync } from "@/hooks/async";
import { useProfilesStore } from "@/stores/profiles";

/**
 * Load ini files if they haven't been loaded yet.
 * This ensures that components can read and write ini values.
 */
export default function useIni(): [
  isLoading: boolean,
  error: AnyError,
  context: IniErrorContext | null,
  reload: () => void,
] {
  const iniPath = useProfilesStore((store) => store.getIniPath());
  const iniPrefix = useProfilesStore((store) => store.getIniPrefix());

  // Do we have a valid path?
  const canLoadIni = !!iniPath && !!iniPrefix;

  // Load the ini files:
  const { isPending, error, reload } = useAsync({
    promiseFn: async () => {
      if (!iniPath || !iniPrefix)
        throw new Error("iniPath and iniPrefix are required");
      await commands.iniLoad(iniPath, iniPrefix);
      return null;
    },
    watch: [iniPath, iniPrefix],
    enabled: canLoadIni,
  });

  const parseErrorMessage = commandErrorIsIniParseError(error) ? error : null;

  // Attempt to get more information about parse errors when they happen:
  const { data: parseErrorContext } = useAsync({
    promiseFn: () => {
      if (!parseErrorMessage || !parseErrorMessage.fileName)
        throw new Error("No ini parser error available");
      if (!iniPath) throw new Error("iniPath is required");
      return commands.iniGetErrorContext(
        iniPath,
        parseErrorMessage.fileName,
        parseErrorMessage.line,
        parseErrorMessage.msg,
      );
    },
    watch: [iniPath, parseErrorMessage],
    enabled: !!iniPath && !!parseErrorMessage,
  });

  return [isPending, error, parseErrorContext ?? null, reload];
}
