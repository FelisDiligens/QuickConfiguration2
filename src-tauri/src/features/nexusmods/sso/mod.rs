#[cfg(test)]
pub mod mock;
#[cfg(test)]
pub mod tests;

use anyhow::{Ok, Result, bail};
use futures_util::sink::SinkExt;
use futures_util::stream::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{async_runtime::Receiver, http::Uri};
use tokio_tungstenite::{connect_async, tungstenite::Message};
use uuid::Uuid;

use crate::{info, utils::open::open_path};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
struct ConnectionData {
    id: String,
    token: Option<String>,
    protocol: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ServerResponse {
    pub success: bool,
    pub data: Option<ServerResponseData>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
#[serde(untagged)]
pub enum ServerResponseData {
    ConnectionToken { connection_token: String },
    ApiKey { api_key: String },
}

pub enum SSOLoginResult {
    ApiKey(String),
    Canceled,
}

pub async fn sso_login(
    url: Option<String>,
    mut cancel_rx: Receiver<bool>,
) -> Result<SSOLoginResult> {
    log::trace!("NexusMods Login – connecting to wss://sso.nexusmods.com");

    // Connect to SSO WebSocket:
    let uri: Uri = url
        .unwrap_or("wss://sso.nexusmods.com".to_string())
        .parse()?;
    let (mut client, _) = connect_async(uri).await?;

    // Send payload:
    let uuid = Uuid::new_v4();
    let connection_data = ConnectionData {
        id: uuid.to_string(),
        token: None,
        protocol: 2,
    };
    let payload = serde_json::to_string(&connection_data)?;
    log::trace!("NexusMods Login – sending payload: {payload}");
    client.send(Message::text(payload.clone())).await?;

    // Wait for either a message from the server or a cancellation signal:
    loop {
        tokio::select! {
            Some(msg) = client.next() => {
                // Get and parse json server response:
                let text = msg?.into_text()?.to_string();
                let resp: ServerResponse = serde_json::from_str(&text)?;

                match resp.data {
                    // Open web browser if connection token was received:
                    Some(ServerResponseData::ConnectionToken { .. }) => {
                        log::trace!("NexusMods Login – connection token received");
                        let url = format!(
                            "https://www.nexusmods.com/sso?id={}&application={}",
                            uuid,
                            info::NEXUSMODS_API_SLUG
                        );
                        open_path(&url)?;
                    }
                    // Return the api key if it was received:
                    Some(ServerResponseData::ApiKey { api_key }) => {
                        client.close(None).await?;
                        return Ok(SSOLoginResult::ApiKey(api_key));
                    }
                    None => {
                        bail!("Unexpected server response: {}", text)
                    }
                };
            }
            Some(_) = cancel_rx.recv() => {
                client.close(None).await?;
                return Ok(SSOLoginResult::Canceled);
            }
        }
    }
}
