import { Archive2Info } from "@/commands/bindings";

export interface ExtendedArchive2Info extends Archive2Info {
  fileSize: number;
  filePath: string;
}
