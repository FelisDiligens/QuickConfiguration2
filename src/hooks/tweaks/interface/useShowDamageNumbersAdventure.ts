import ini from "@/commands/ini";
import useTweak from "@/hooks/tweaks/useTweak";

/*
 * There seems to be three variants:
 * [Adventure] bShowDamageNumbers
 * [Survival] bShowDamageNumbers
 * [NuclearWinter] bShowDamageNumbers
 */
export default function useShowDamageNumbersAdventure() {
  const defaultValue = true;
  return useTweak<boolean>(
    () =>
      ini.findBooleanWithDefault(
        ["Custom", "Prefs"],
        "Adventure",
        "bShowDamageNumbers",
        defaultValue,
      ),
    async (value) => {
      await ini.setBoolean("Prefs", "Adventure", "bShowDamageNumbers", value);
      await ini.setBooleanIfPresent(
        "Custom",
        "Adventure",
        "bShowDamageNumbers",
        value,
      );
    },
    defaultValue,
  );
}
