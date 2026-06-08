#![cfg(test)]

use tauri::async_runtime;
use tokio::net::TcpListener;

use crate::features::nexusmods::sso::SSOLoginResult;
use crate::utils::open;
use crate::utils::test_utils::setup_stdout_logger;

use super::mock;
use super::{ConnectionData, ServerResponse, ServerResponseData, sso_login};

#[tokio::test]
async fn test_sso_login() {
    setup_stdout_logger(); // log crate outputs to stdout

    // Mock open::open_path(&str):
    let _m = open::MOCK_MUTEX.lock();
    let open_ctx = open::open_path_context();
    open_ctx.expect().returning(|_| Ok(())).times(1);

    // Open local WebSocket server on a free port:
    let (_cancel_tx, cancel_rx) = async_runtime::channel::<bool>(size_of::<bool>());
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    // Start server and client:
    let (server_result, client_result) = tokio::join!(
        mock::nexusmods_sso_mock(listener),
        sso_login(Some(format!("ws://127.0.0.1:{port}")), cancel_rx)
    );

    // Expect server and client to have communicated successfully:
    server_result.unwrap();
    assert!(matches!(client_result.unwrap(), SSOLoginResult::ApiKey(_)))
}

#[tokio::test]
async fn test_sso_login_cancel() {
    setup_stdout_logger(); // log crate outputs to stdout

    // Open local WebSocket server on a free port:
    let (cancel_tx, cancel_rx) = async_runtime::channel::<bool>(size_of::<bool>());
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    // Start server and client:
    let (server_result, client_result, cancel_result) = tokio::join!(
        mock::mute_server_mock(listener),
        sso_login(Some(format!("ws://127.0.0.1:{port}")), cancel_rx),
        cancel_tx.send(true) // Send cancellation signal
    );

    // Expect client to have cancelled the operation:
    server_result.unwrap();
    cancel_result.unwrap();
    assert!(matches!(client_result.unwrap(), SSOLoginResult::Canceled))
}

#[tokio::test]
async fn test_sso_login_unexpected() {
    setup_stdout_logger(); // log crate outputs to stdout

    // Open local WebSocket server on a free port:
    let (_cancel_tx, cancel_rx) = async_runtime::channel::<bool>(size_of::<bool>());
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    // Start server and client:
    let (_, client_result) = tokio::join!(
        mock::unexpected_server_mock(listener),
        sso_login(Some(format!("ws://127.0.0.1:{port}")), cancel_rx),
    );

    // Expect client to return an error:
    assert!(client_result.is_err())
}

#[test]
fn connection_data_json_stringify() {
    assert_eq!(
        serde_json::to_string(&ConnectionData {
            id: "1fcef413-6ca5-47ab-9704-6d1701b3a89c".to_string(),
            token: None,
            protocol: 2,
        })
        .unwrap(),
        r#"{"id":"1fcef413-6ca5-47ab-9704-6d1701b3a89c","token":null,"protocol":2}"#
    );
}

#[test]
fn server_response_json_parse() {
    let resp: ServerResponse = serde_json::from_str(
            r#"{"success":true,"data":{"api_key":"<<api_key>>","unrelated_data":"should_ignore"},"error":null}"#,
        )
        .unwrap();

    match resp.data {
        Some(ServerResponseData::ApiKey { api_key }) => {
            assert_eq!(api_key, "<<api_key>>".to_string())
        }
        _ => panic!("expected ApiKey, got other variant"),
    }
}
