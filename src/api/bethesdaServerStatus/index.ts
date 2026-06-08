// TODO: Move implementation of API call to Rust using reqwest and expose as a Tauri command

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export enum Status {
  Operational,
  Maintenance,
  DegradedPerformance,
  ParialOutage,
  MajorOutage,
}

interface StatusResponse {
  components: {
    id: string;
    name: string;
    status:
      | "operational"
      | "partial"
      | "degraded"
      | "information"
      | "maintenance"
      | "major";
  }[];
}

interface LocizeResponse {
  statusKey?: Record<string, string>;
}

export function getStatus(status: string) {
  switch (status) {
    case "operational":
    case "all_systems_operational":
      return Status.Operational;
    case "maintenance":
    case "under_maintenance":
    case "service_under_maintenance":
      return Status.Maintenance;
    case "degraded_performance":
    case "partially_degraded_service":
      return Status.DegradedPerformance;
    case "partial_outage":
    case "partial_system_outage":
    case "minor_service_outage":
      return Status.ParialOutage;
    case "major_outage":
    case "major_system_outage":
      return Status.MajorOutage;
  }
}

export function getKeyFromStatus(status: Status) {
  switch (status) {
    case Status.Operational:
      return "operational";
    case Status.Maintenance:
      return "maintenance";
    case Status.DegradedPerformance:
      return "degraded";
    case Status.ParialOutage:
      return "partial";
    case Status.MajorOutage:
      return "major";
  }
}

async function fetchServerStatus(): Promise<string> {
  const response = await tauriFetch(
    "https://status.bethesda.net/en/status/api/statuses",
  );
  const json = (await response.json()) as StatusResponse;
  for (const component of json.components) {
    if (component.id == "m39k311rzvkg" || component.name == "Fallout 76") {
      return component.status;
    }
  }
  throw new Error("Fallout 76 not found in API response.");
}

async function fetchLocalizedStatusMessage(
  language: string,
  statusKey: string,
): Promise<string | undefined> {
  const response = await tauriFetch(
    `https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/${language.toLowerCase()}/status`,
  );
  const json = (await response.json()) as LocizeResponse;
  const statusKeys = json.statusKey;
  if (!statusKeys || !(statusKey in statusKeys)) {
    // If translation does not exist, the server returns an empty JSON object {}
    // In this situation, fallback to English:
    if (language != "en") {
      return await fetchLocalizedStatusMessage("en", statusKey);
    } else {
      throw new Error("statusKey not found in localization.");
    }
  } else {
    return statusKeys[statusKey];
  }
}

export async function fetchLocalizedServerStatus(language: string) {
  const statusString = await fetchServerStatus();
  const status = getStatus(statusString);
  if (status === undefined) {
    throw new Error("Unknown status: " + statusString);
  }
  const statusKey = getKeyFromStatus(status);
  let message = statusString;
  try {
    message =
      (await fetchLocalizedStatusMessage(language, statusKey)) || statusString;
  } catch (e) {
    if (e instanceof Error)
      console.error("Couldn't fetch localized message: " + e.message);
    else console.error("Couldn't fetch localized message: " + e);
  }
  return {
    status,
    message,
  };
}
