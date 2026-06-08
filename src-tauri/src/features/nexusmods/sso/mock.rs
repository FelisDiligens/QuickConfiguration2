#![cfg(test)]

use anyhow::bail;
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{WebSocketStream, tungstenite::Message};

use crate::features::nexusmods::sso::{ConnectionData, ServerResponse, ServerResponseData};

async fn serve_websocket(
    listener: TcpListener,
    handler: impl AsyncFn(&mut WebSocketStream<TcpStream>, Message) -> anyhow::Result<()>,
) -> anyhow::Result<()> {
    let (socket, _) = listener.accept().await?;
    let mut ws = tokio_tungstenite::accept_async(socket).await?;
    while let Some(msg) = ws.next().await {
        let msg = msg?;
        handler(&mut ws, msg).await?;
    }
    Ok(())
}

/// Creates a WebSocket server which never responds.
pub async fn mute_server_mock(listener: TcpListener) -> anyhow::Result<()> {
    serve_websocket(listener, async |_, _| {
        /* Do nothing */
        Ok(())
    })
    .await
}

/// Creates a WebSocket server which responds with gibberish.
pub async fn unexpected_server_mock(listener: TcpListener) -> anyhow::Result<()> {
    serve_websocket(listener, async |ws, msg| {
        if msg.is_text() {
            ws.send(Message::Text("something unexpected".into()))
                .await?;
        }
        Ok(())
    })
    .await
}

/// Mocks the SSO WebSocket server of NexusMods for unit tests.
pub async fn nexusmods_sso_mock(listener: TcpListener) -> anyhow::Result<()> {
    serve_websocket(listener, async |ws, msg| {
        if msg.is_text() {
            let request = msg.into_text()?.to_string();
            if let Ok(_) = serde_json::from_str::<ConnectionData>(&request) {
                ws.send(Message::Text(
                    serde_json::to_string(&ServerResponse {
                        success: true,
                        data: Some(ServerResponseData::ConnectionToken {
                            connection_token: "connection_token".to_string(),
                        }),
                        error: None,
                    })?
                    .into(),
                ))
                .await?;
                ws.send(Message::Text(
                    serde_json::to_string(&ServerResponse {
                        success: true,
                        data: Some(ServerResponseData::ApiKey {
                            api_key: "api_key".to_string(),
                        }),
                        error: None,
                    })?
                    .into(),
                ))
                .await?;
            } else {
                bail!("Unexpected client request text: {:?}", request)
            }
        } else if msg.is_binary() {
            bail!("Unexpected client request: {:?}", msg)
        }
        Ok(())
    })
    .await
}
