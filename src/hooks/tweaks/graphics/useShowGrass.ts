import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

export default function useShowGrass() {
  const defaultValue = true;

  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Grass",
        "bAllowCreateGrass",
        defaultValue,
      ),
    (value) => ini.setBoolean("Custom", "Grass", "bAllowCreateGrass", value),
    defaultValue,
  );
}
