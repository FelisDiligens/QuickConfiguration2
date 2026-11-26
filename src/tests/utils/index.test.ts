import { pathJoinSync } from "@/utils";
import { vi } from "vitest";

vi.unmock("@tauri-apps/plugin-os");
vi.mock("@tauri-apps/plugin-os", () => ({
  family: vi.fn(() => "windows"),
}));

describe("pathJoinSync", () => {
  it("should remove double back slashes", () => {
    const path = pathJoinSync(
      "C:\\Program Files (x86)\\",
      "\\Steam\\",
      "\\steamapps\\",
      "\\common\\",
      "\\\\Fallout 76",
    );
    expect(path).toBe(
      "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Fallout 76",
    );
  });

  it("should normalize forward and back slashes", () => {
    const path = pathJoinSync("C:/Program Files (x86)/", "Steam");
    expect(path).toBe("C:\\Program Files (x86)\\Steam");
  });

  it("should preserve UNC paths (\\\\?) on Windows.", () => {
    const path = pathJoinSync("\\\\?\\C:\\Windows\\", "System32");
    expect(path).toBe("\\\\?\\C:\\Windows\\System32");
  });
});
