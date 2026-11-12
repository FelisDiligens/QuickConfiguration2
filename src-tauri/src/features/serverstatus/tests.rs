#![cfg(test)]

use super::ServerStatusAPI;
use super::models::{LocizeResponse, ServerStatus, StatusResponse};

use indoc::indoc;
use wiremock::{
    Mock, MockServer, ResponseTemplate,
    matchers::{method, path},
};

// Truncated response from "https://status.bethesda.net/en/status/api/statuses"
const BETHESDA_STATUS_OPERATIONAL: &str = indoc! {r#"
    {
      "components": [
        {
          "id": "someothercomponent",
          "name": "The Elder Scrolls Online",
          "status": "major_outage",
          "created_at": "2018-11-12T09:11:48.315-05:00",
          "updated_at": "2024-01-30T12:50:50.468-05:00",
          "position": 7,
          "description": null,
          "showcase": true,
          "start_date": null,
          "group_id": "b4fdxf1pnz4v",
          "page_id": "p6r5nl77dwjf",
          "group": false,
          "only_show_if_degraded": false
        },
        {
          "id": "m39k311rzvkg",
          "name": "Fallout 76",
          "status": "operational",
          "created_at": "2018-11-12T09:11:48.315-05:00",
          "updated_at": "2024-01-30T12:50:50.468-05:00",
          "position": 8,
          "description": null,
          "showcase": true,
          "start_date": null,
          "group_id": "b4fdxf1pnz4v",
          "page_id": "p6r5nl77dwjf",
          "group": false,
          "only_show_if_degraded": false
        }
      ]
    }
"#};

// Truncated response from "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/en/status"
const LOCIZE_ENGLISH: &str = indoc! {r#"
    {
      "statusKey": {
        "degraded": "Degraded Performance",
        "information": "Information/No Impact",
        "maintenance": "Maintenance",
        "major": "Outage",
        "operational": "Operational",
        "partial": "Partial Outage",
        "title": "Service Status Key"
      }
    }
"#};

// Truncated response from "https://api.locize.app/657e9e0e-8225-4266-88dd-75f047f1a2b3/live/de/status"
const LOCIZE_GERMAN: &str = indoc! {r#"
    {
      "statusKey": {
        "degraded": "Herabgesetzte Performance",
        "information": "Informationen/Keine Auswirkungen",
        "maintenance": "Wartung",
        "major": "Ausfall",
        "operational": "Funktionsfähig",
        "partial": "Teilweiser Ausfall",
        "title": "Dienst-Statussymbole"
      }
    }
"#};

#[test]
fn test_status_response_json_load() {
    let result: Result<StatusResponse, serde_json::Error> =
        serde_json::from_str(BETHESDA_STATUS_OPERATIONAL);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let response: StatusResponse = result.unwrap();
    assert_eq!(response.components.len(), 2);

    let first = &response.components[0];
    assert_eq!(first.id, "someothercomponent");
    assert_eq!(first.name, "The Elder Scrolls Online");
    assert_eq!(first.status, "major_outage");

    let second = &response.components[1];
    assert_eq!(second.id, "m39k311rzvkg");
    assert_eq!(second.name, "Fallout 76");
    assert_eq!(second.status, "operational");
}

#[test]
fn test_locize_response_json_load() {
    let result: Result<LocizeResponse, serde_json::Error> = serde_json::from_str(LOCIZE_ENGLISH);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let response: LocizeResponse = result.unwrap();
    let status_keys = response.status_key.unwrap();
    assert_eq!(status_keys.len(), 7);
    assert_eq!(
        status_keys.get("operational"),
        Some(&"Operational".to_string())
    );
    assert_eq!(status_keys.get("major"), Some(&"Outage".to_string()));
    assert_eq!(
        status_keys.get("title"),
        Some(&"Service Status Key".to_string())
    );
}

#[test]
fn test_locize_response_empty_json_load() {
    // The server returns an empty JSON object {} if the translation does not exist:
    let result: Result<LocizeResponse, serde_json::Error> = serde_json::from_str("{}");
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let response: LocizeResponse = result.unwrap();
    assert!(response.status_key.is_none());
}

#[test]
fn test_server_status_from_api_status() {
    assert_eq!(
        ServerStatus::from_api_status("operational"),
        Some(ServerStatus::Operational)
    );
    assert_eq!(
        ServerStatus::from_api_status("all_systems_operational"),
        Some(ServerStatus::Operational)
    );
    assert_eq!(
        ServerStatus::from_api_status("maintenance"),
        Some(ServerStatus::Maintenance)
    );
    assert_eq!(
        ServerStatus::from_api_status("under_maintenance"),
        Some(ServerStatus::Maintenance)
    );
    assert_eq!(
        ServerStatus::from_api_status("service_under_maintenance"),
        Some(ServerStatus::Maintenance)
    );
    assert_eq!(
        ServerStatus::from_api_status("degraded_performance"),
        Some(ServerStatus::DegradedPerformance)
    );
    assert_eq!(
        ServerStatus::from_api_status("partially_degraded_service"),
        Some(ServerStatus::DegradedPerformance)
    );
    assert_eq!(
        ServerStatus::from_api_status("partial_outage"),
        Some(ServerStatus::PartialOutage)
    );
    assert_eq!(
        ServerStatus::from_api_status("partial_system_outage"),
        Some(ServerStatus::PartialOutage)
    );
    assert_eq!(
        ServerStatus::from_api_status("minor_service_outage"),
        Some(ServerStatus::PartialOutage)
    );
    assert_eq!(
        ServerStatus::from_api_status("major_outage"),
        Some(ServerStatus::MajorOutage)
    );
    assert_eq!(
        ServerStatus::from_api_status("major_system_outage"),
        Some(ServerStatus::MajorOutage)
    );
    assert_eq!(ServerStatus::from_api_status("something_unknown"), None);
}

#[test]
fn test_server_status_key() {
    assert_eq!(ServerStatus::Operational.status_key(), "operational");
    assert_eq!(ServerStatus::Maintenance.status_key(), "maintenance");
    assert_eq!(ServerStatus::DegradedPerformance.status_key(), "degraded");
    assert_eq!(ServerStatus::PartialOutage.status_key(), "partial");
    assert_eq!(ServerStatus::MajorOutage.status_key(), "major");
}

async fn mount_bethesda_status(mock_server: &MockServer, body: &'static str) {
    Mock::given(method("GET"))
        .and(path("/en/status/api/statuses"))
        .respond_with(ResponseTemplate::new(200).set_body_string(body))
        .mount(mock_server)
        .await;
}

async fn mount_locize(mock_server: &MockServer, language: &'static str, body: &'static str) {
    Mock::given(method("GET"))
        .and(path(format!("/live/{language}/status")))
        .respond_with(ResponseTemplate::new(200).set_body_string(body))
        .mount(mock_server)
        .await;
}

#[tokio::test]
async fn test_fetch_localized_server_status() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(&mock_server, BETHESDA_STATUS_OPERATIONAL).await;
    mount_locize(&mock_server, "de", LOCIZE_GERMAN).await;

    let result = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("de")
        .await
        .unwrap();

    assert_eq!(result.status, ServerStatus::Operational);
    assert_eq!(result.message, "Funktionsfähig");
}

#[tokio::test]
async fn test_fetch_localized_server_status_matches_component_by_name() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(
        &mock_server,
        indoc! {r#"
            {
              "components": [
                {
                  "id": "someotherid",
                  "name": "Fallout 76",
                  "status": "major_outage"
                }
              ]
            }
        "#},
    )
    .await;
    mount_locize(&mock_server, "en", LOCIZE_ENGLISH).await;

    let result = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("en")
        .await
        .unwrap();

    assert_eq!(result.status, ServerStatus::MajorOutage);
    assert_eq!(result.message, "Outage");
}

#[tokio::test]
async fn test_fetch_localized_server_status_maps_api_status_aliases() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(
        &mock_server,
        indoc! {r#"
            {
              "components": [
                {
                  "id": "m39k311rzvkg",
                  "name": "Fallout 76",
                  "status": "under_maintenance"
                }
              ]
            }
        "#},
    )
    .await;
    mount_locize(&mock_server, "en", LOCIZE_ENGLISH).await;

    let result = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("en")
        .await
        .unwrap();

    assert_eq!(result.status, ServerStatus::Maintenance);
    assert_eq!(result.message, "Maintenance");
}

#[tokio::test]
async fn test_fetch_localized_server_status_falls_back_to_english() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(&mock_server, BETHESDA_STATUS_OPERATIONAL).await;
    // The locize API returns an empty JSON object {} for languages without translations:
    mount_locize(&mock_server, "de", "{}").await;
    mount_locize(&mock_server, "en", LOCIZE_ENGLISH).await;

    let result = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("de")
        .await
        .unwrap();

    assert_eq!(result.status, ServerStatus::Operational);
    assert_eq!(result.message, "Operational");
}

#[tokio::test]
async fn test_fetch_localized_server_status_uses_raw_status_when_locize_fails() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(&mock_server, BETHESDA_STATUS_OPERATIONAL).await;
    Mock::given(method("GET"))
        .and(path("/live/de/status"))
        .respond_with(ResponseTemplate::new(500).set_body_string("Internal Server Error"))
        .mount(&mock_server)
        .await;

    let result = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("de")
        .await
        .unwrap();

    assert_eq!(result.status, ServerStatus::Operational);
    assert_eq!(result.message, "operational");
}

#[tokio::test]
async fn test_fetch_server_status_fallout76_not_found() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(
        &mock_server,
        indoc! {r#"
            {
              "components": [
                {
                  "id": "someothercomponent",
                  "name": "The Elder Scrolls Online",
                  "status": "operational"
                }
              ]
            }
        "#},
    )
    .await;

    let err = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_server_status()
        .await
        .unwrap_err();

    assert!(
        err.to_string().contains("Fallout 76 not found"),
        "unexpected error: {err}"
    );
}

#[tokio::test]
async fn test_fetch_localized_server_status_unknown_status() {
    let mock_server = MockServer::start().await;
    mount_bethesda_status(
        &mock_server,
        indoc! {r#"
            {
              "components": [
                {
                  "id": "m39k311rzvkg",
                  "name": "Fallout 76",
                  "status": "something_unknown"
                }
              ]
            }
        "#},
    )
    .await;

    let err = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("en")
        .await
        .unwrap_err();

    assert!(
        err.to_string()
            .contains("Unknown status: something_unknown"),
        "unexpected error: {err}"
    );
}

#[tokio::test]
async fn test_fetch_localized_server_status_request_fails() {
    let mock_server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/en/status/api/statuses"))
        .respond_with(ResponseTemplate::new(500).set_body_string("Internal Server Error"))
        .mount(&mock_server)
        .await;

    let err = ServerStatusAPI::new()
        .with_host(mock_server.uri())
        .fetch_localized_server_status("en")
        .await
        .unwrap_err();

    assert!(!err.to_string().is_empty());
}
