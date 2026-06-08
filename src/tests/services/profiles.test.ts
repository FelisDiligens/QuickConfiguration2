import { commands, Profiles } from "@/commands/bindings";
import * as profilesService from "@/services/profiles";
import { useProfilesStore } from "@/stores/profiles";
import { range } from "@/utils";
import { vi } from "vitest";
import { StateStorage } from "zustand/middleware";

vi.unmock("@/utils/zustand");
vi.mock("@/utils/zustand", () => ({
  syncStore: vi.fn().mockReturnValue({ load: vi.fn().mockResolvedValue(null) }),
  createStorageEngineFactory: vi.fn<() => StateStorage>(() => ({
    getItem: vi.fn((_name: string) => "{ state: {}, version: 0 }"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })),
}));

vi.unmock("@/commands/bindings");
vi.mock("@/commands/bindings", () => ({
  commands: {
    detectIniPrefix: vi.fn(() => Promise.resolve(null)),
    detectGamePath: vi.fn(() => Promise.resolve([])),
    detectIniPath: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.unmock("@tauri-apps/plugin-os");
vi.mock("@tauri-apps/plugin-os", () => ({
  family: vi.fn(() => "unix"),
}));

function createTestState(profileCount: number, selected: number) {
  const profiles = range(0, profileCount).map((i) =>
    profilesService.createProfileWithDefaults(
      `Unnamed ${i}`,
      "Unknown",
      "",
      "",
    ),
  );
  const store: Pick<Profiles, "profiles" | "selected"> = {
    profiles,
    selected: profiles.at(selected)?.key || "",
  };
  useProfilesStore.getState().setStore(store);
}

describe("Profiles", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("newProfileAutoDetect should detect the correct game edition based on ini prefix (Xbox)", async () => {
    const mockedDetectIniPrefix = vi.mocked(commands.detectIniPrefix);
    mockedDetectIniPrefix.mockResolvedValueOnce("Project76");

    const profile =
      await profilesService.createProfileWithAutoDetectedDefaults();

    expect(profile.gameEdition).toBe("Xbox");
  });

  it("newProfileAutoDetect should detect the correct game edition based on ini prefix (Steam)", async () => {
    const mockedDetectIniPrefix = vi.mocked(commands.detectIniPrefix);
    mockedDetectIniPrefix.mockResolvedValueOnce("Fallout76");

    const profile =
      await profilesService.createProfileWithAutoDetectedDefaults();

    expect(profile.gameEdition).toBe("Steam");
  });

  it("newProfileAutoDetect should detect the correct game edition based on game path (Xbox)", async () => {
    // const mockedDetectIniPath = vi.mocked(commands.detectIniPath);
    // mockedDetectIniPath.mockResolvedValueOnce(
    //   "C:\\Users\\steamuser\\Documents\\My Games\\Fallout 76",
    // );
    const mockedDetectGamePath = vi.mocked(commands.detectGamePath);
    mockedDetectGamePath.mockResolvedValue([
      "C:\\XboxGames\\Fallout 76\\Content",
    ]);
    const profile =
      await profilesService.createProfileWithAutoDetectedDefaults();

    expect(profile.gameEdition).toBe("Xbox");
  });

  it("newProfileAutoDetect should detect the correct game edition based on game path (Steam)", async () => {
    const mockedDetectGamePath = vi.mocked(commands.detectGamePath);
    mockedDetectGamePath.mockResolvedValue([
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Fallout 76",
    ]);
    const profile =
      await profilesService.createProfileWithAutoDetectedDefaults();

    expect(profile.gameEdition).toBe("Steam");
  });

  it("newProfileAutoDetect should detect the correct game edition based on game path (Steam PTS)", async () => {
    const mockedDetectGamePath = vi.mocked(commands.detectGamePath);
    mockedDetectGamePath.mockResolvedValue([
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Fallout 76 Playtest",
    ]);
    const profile =
      await profilesService.createProfileWithAutoDetectedDefaults();

    expect(profile.gameEdition).toBe("SteamPTS");
  });

  it("moveProfileUp should move profile up by index - 1", () => {
    createTestState(3, 1);
    const movedProfile = useProfilesStore.getState().profiles.at(1);
    useProfilesStore.getState().moveProfileUp(1);

    expect(movedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.at(0)?.key).toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().profiles.at(1)?.key).not.toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().selected).toBe(movedProfile?.key);
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(0);
  });

  it("moveProfileUp shouldn't move profile if it's already at the top", () => {
    createTestState(3, 1);
    const movedProfile = useProfilesStore.getState().profiles.at(0);
    useProfilesStore.getState().moveProfileUp(0);

    expect(movedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.at(0)?.key).toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(1);
  });

  it("moveProfileDown should move profile down by index + 1", () => {
    createTestState(3, 1);
    const movedProfile = useProfilesStore.getState().profiles.at(1);
    useProfilesStore.getState().moveProfileDown(1);

    expect(movedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.at(2)?.key).toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().profiles.at(1)?.key).not.toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().selected).toBe(movedProfile?.key);
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(2);
  });

  it("moveProfileDown shouldn't move profile if it's already at the bottom", () => {
    createTestState(3, 1);
    const movedProfile = useProfilesStore.getState().profiles.at(2);
    useProfilesStore.getState().moveProfileDown(2);

    expect(movedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.at(2)?.key).toBe(
      movedProfile?.key,
    );
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(1);
  });

  it("deleteProfile should remove profile at specified index", () => {
    createTestState(3, 1);
    const deletedProfile = useProfilesStore.getState().profiles.at(1);
    useProfilesStore.getState().deleteProfile(1);

    expect(deletedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.length).toBe(2);
    expect(useProfilesStore.getState().profiles.at(0)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().profiles.at(1)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(0);
  });

  it("deleteProfile should remove profile at specified index at the start", () => {
    createTestState(3, 1);
    const deletedProfile = useProfilesStore.getState().profiles.at(0);
    const selectedProfile = useProfilesStore.getState().getSelectedProfile();
    useProfilesStore.getState().deleteProfile(0);

    expect(deletedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.length).toBe(2);
    expect(useProfilesStore.getState().profiles.at(0)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().profiles.at(1)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().selected).toBe(selectedProfile?.key);
  });

  it("deleteProfile should remove profile at specified index at the end", () => {
    createTestState(3, 1);
    const deletedProfile = useProfilesStore.getState().profiles.at(2);
    useProfilesStore.getState().deleteProfile(2);

    expect(deletedProfile).toBeTruthy();
    expect(useProfilesStore.getState().profiles.length).toBe(2);
    expect(useProfilesStore.getState().profiles.at(0)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().profiles.at(1)?.key).not.toBe(
      deletedProfile?.key,
    );
    expect(useProfilesStore.getState().getSelectedIndex()).toBe(1);
  });
});
