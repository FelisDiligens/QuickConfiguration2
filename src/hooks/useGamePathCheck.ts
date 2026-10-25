import { commands } from "@/commands/bindings";
import { useAsync } from "@/hooks/async";

export type GamePathCheckState =
  "checking" | "not-set" | "invalid" | "missing" | "not-game" | "ok";

/**
 * Checks whether the game path is set, contains only valid characters, points to an existing directory
 * and points to an actual installation folder of Fallout 76 (containing Data/SeventySix.esm).
 * Returns "checking" while the check is running and re-runs it whenever the path changes.
 */
export default function useGamePathCheck(
  path: string | undefined,
): GamePathCheckState {
  const { data, isPending } = useAsync({
    promiseFn: async () => {
      if (!path) return "not-set" as GamePathCheckState;
      if (!(await commands.isPathValid(path)))
        return "invalid" as GamePathCheckState;
      if (!(await commands.isDirectory(path)))
        return "missing" as GamePathCheckState;
      if (!(await commands.validateGamePath(path)))
        return "not-game" as GamePathCheckState;
      return "ok" as GamePathCheckState;
    },
    watch: [path],
    initialValue: "checking" as GamePathCheckState,
  });

  if (!path) return "not-set";
  if (isPending) return "checking";
  return data ?? "checking";
}
