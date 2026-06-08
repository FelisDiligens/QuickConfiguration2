#![cfg(test)]

use std::sync::Once;

use tauri_plugin_log::fern;

static INIT: Once = Once::new();

pub fn setup_stdout_logger() {
    INIT.call_once(|| {
        fern::Dispatch::new()
            .level_for("tungstenite", log::LevelFilter::Debug)
            .level_for("tokio_tungstenite", log::LevelFilter::Debug)
            .chain(std::io::stdout())
            .apply()
            .unwrap()
    });
}
