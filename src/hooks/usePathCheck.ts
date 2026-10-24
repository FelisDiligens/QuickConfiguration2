import { commands } from "@/commands/bindings";
import { useAsync } from "@/hooks/async";

export type PathCheckState =
  "checking" | "not-set" | "invalid" | "missing" | "ok";

/**
 * Checks whether a path is set, contains only valid characters and points to an existing directory.
 * Returns "checking" while the check is running and re-runs it whenever the path changes.
 */
export default function usePathCheck(path: string | undefined): PathCheckState {
  const { data, isPending } = useAsync({
    promiseFn: async () => {
      if (!path) return "not-set" as PathCheckState;
      if (!(await commands.isPathValid(path)))
        return "invalid" as PathCheckState;
      if (!(await commands.isDirectory(path)))
        return "missing" as PathCheckState;
      return "ok" as PathCheckState;
    },
    watch: [path],
    initialValue: "checking" as PathCheckState,
  });

  if (!path) return "not-set";
  if (isPending) return "checking";
  return data ?? "checking";
}
