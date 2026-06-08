use std::env;

/// The application name.
pub const APP_NAME: &str = "Fallout 76 Quick Configuration";
/// The name of the binary. The package name from Cargo.toml is used.
pub const APP_BINARY_NAME: &str = env!("CARGO_PKG_NAME");
/// The application version. It is a semver version number. The version number from Cargo.toml is used.
pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
/// The application product name. The productName from tauri.conf.json is used.
pub const TAURI_APP_PRODUCT_NAME: &str = env!("TAURI_APP_PRODUCT_NAME");
/// The application identifier in reverse domain name notation (e.g. `com.tauri.example`). The identifier from tauri.conf.json is used.
pub const TAURI_APP_IDENTIFIER: &str = env!("TAURI_APP_IDENTIFIER");
/// The application's NexusMods API slug.
pub const NEXUSMODS_API_SLUG: &str = "fo76quickconfiguration";

pub fn user_agent() -> String {
    format!(
        "Fo76QuickConfiguration/{} ({})",
        APP_VERSION,
        env::consts::OS,
    )
}

pub fn is_debug() -> bool {
    cfg!(debug_assertions)
}

/// Parses the app's version and checks for the presence of a pre-release identifier such as `-alpha.1`, `-beta.2`, `-rc.3`, etc.
pub fn is_prerelease() -> bool {
    if let Some(pre) = semver::Version::parse(APP_VERSION)
        .ok()
        .map(|version| version.pre)
    {
        return !pre.is_empty();
    }
    false
}

pub fn is_appimage() -> bool {
    cfg!(target_os = "linux") && std::env::var("APPIMAGE").is_ok()
}
