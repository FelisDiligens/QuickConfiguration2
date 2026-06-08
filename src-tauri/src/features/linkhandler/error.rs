#[derive(Debug, thiserror::Error)]
pub enum NXMError {
    #[error("unsupported platform")]
    UnsupportedPlatform,
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[cfg(target_os = "windows")]
    #[error(transparent)]
    Windows(#[from] windows_result::Error),
    #[cfg(target_os = "linux")]
    #[error(transparent)]
    Ini(#[from] ini::Error),
    #[cfg(target_os = "linux")]
    #[error(transparent)]
    ParseIni(#[from] ini::ParseError),
}
