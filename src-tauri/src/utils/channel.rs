use std::fmt::Debug;

use tap::TapFallible;
use tokio::sync::mpsc::Sender;
use tokio::sync::mpsc::error::{SendError, TrySendError};

/// Calls `blocking_send` on the Sender, logs any errors and returns the result.
pub fn blocking_send<T: Debug + Send + 'static>(
    tx: &Sender<T>,
    scope: &str,
    msg: T,
) -> Result<(), SendError<T>> {
    tx.blocking_send(msg).tap_err(|e| {
        log::warn!("[{scope}] Couldn't send message on channel: {e:?}");
    })
}

/// Calls `blocking_send` on the Sender if `tx` is Some, logs any errors and returns the result.
/// If `tx` is None, returns `Ok(())`.
pub fn blocking_send_opt<T: Debug + Send + 'static>(
    tx: &Option<Sender<T>>,
    scope: &str,
    msg: T,
) -> Result<(), SendError<T>> {
    let Some(tx) = tx else {
        log::trace!("[{scope}] Would've send message but sender is None: {msg:?}");
        return Ok(());
    };
    tx.blocking_send(msg).tap_err(|e| {
        log::warn!("[{scope}] Couldn't send message on channel: {e:?}");
    })
}

/// Calls `try_send` on the Sender, logs any errors and returns the result.
pub fn try_send<T: Debug + Send + 'static>(
    tx: &Sender<T>,
    scope: &str,
    msg: T,
) -> Result<(), TrySendError<T>> {
    tx.try_send(msg).tap_err(|e| match e {
        TrySendError::Full(msg) => log::warn!(
            "[{scope}] Couldn't send message because the channel buffer is full: {msg:?}"
        ),
        TrySendError::Closed(msg) => {
            log::error!("[{scope}] Couldn't send message because the channel is closed: {msg:?}")
        }
    })
}

/// Calls `send` on the Sender, logs any errors and returns the result.
pub async fn send<T: Debug + Send + 'static>(
    tx: &Sender<T>,
    scope: &str,
    msg: T,
) -> Result<(), SendError<T>> {
    tx.send(msg).await.tap_err(|e| {
        log::warn!("[{scope}] Couldn't send message on channel: {e:?}");
    })
}

/// Calls `send` on the Sender if `tx` is Some, logs any errors and returns the result.
/// If `tx` is None, returns `Ok(())`.
pub async fn send_opt<T: Debug + Send + 'static>(
    tx: &Option<Sender<T>>,
    scope: &str,
    msg: T,
) -> Result<(), SendError<T>> {
    let Some(tx) = tx else {
        log::trace!("[{scope}] Would've send message but sender is None: {msg:?}");
        return Ok(());
    };
    tx.send(msg).await.tap_err(|e| {
        log::warn!("[{scope}] Couldn't send message on channel: {e:?}");
    })
}
