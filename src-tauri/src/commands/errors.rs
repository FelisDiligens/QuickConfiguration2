use std::{num::TryFromIntError, path::StripPrefixError};

use serde::Serialize;
use specta::Type;
use tap::TapFallible;
use thiserror::Error;

use crate::features::{
    archive2::{Archive2Error, Archive2ReadError},
    linkhandler::error::NXMError,
    mods::errors::ModActionError,
    sevenzip::SevenzipError,
    translations::{TranslationError, TranslationResult},
};
use crate::utils::download::DownloadError;

pub type CommandResult<T> = Result<T, CommandError>;

/*
  If the following enum shows the error "expected Expr",
  add this to your `.vscode/settings.json`:
  {
    // specta::Type shows error `expected Expr`
    // see: https://github.com/specta-rs/specta/issues/387#issuecomment-3236342068
    "rust-analyzer.procMacro.ignored": {
      "specta_macros": ["Type"]
    }
  }

  Or running `rustup update` seems to fix this.
*/

#[derive(Debug, Serialize, Error, Type)]
#[serde(tag = "type")]
pub enum CommandError {
    #[error("{message}")]
    String { message: String },
    #[error("{message}")]
    Anyhow { message: String },
    #[error("{message}")]
    UnsupportedPlatform { message: String },
    #[error("{message}")]
    Io { message: String },
    #[error("{message}")]
    PathError { message: String, variant: String },
    #[error("{message}")]
    Utf8Error { message: String },
    #[error("{message}")]
    SevenzipError { message: String, variant: String },
    #[error("{message}")]
    Archive2Error { message: String, variant: String },
    #[error("{message}")]
    Archive2ReadError { message: String, variant: String },
    #[error("{message}")]
    MutexLock { message: String },
    #[error("{message}")]
    TauriError { message: String },
    #[error("{message}")]
    TokioError { message: String },
    #[error("{message}")]
    DowncastError { message: String },
    #[error("{message}")]
    WindowsError { message: String },
    #[error("{message}")]
    ReqwestError { message: String },
    #[error("{message}")]
    DownloadError { message: String, variant: String },
    #[error("{message}")]
    ModActionError { message: String, variant: String },
    #[error("{file_name:?} {line}:{col} {msg}")]
    #[serde(rename_all = "camelCase")]
    IniParseError {
        file_name: Option<String>,
        line: u32,
        col: u32,
        msg: String,
    },
    #[error("{file_name} {line}:{column} {message}")]
    #[serde(rename_all = "camelCase")]
    TranslationParseError {
        key: String,
        file_path: String,
        file_name: String,
        line: u32,
        column: u32,
        message: String,
    },
    #[error("{message}")]
    UrlParseError { message: String },
}

// NOTE:
// Manually implementing the From traits,
// because using thiserror's `#[from]` causes a compile error when deriving `specta::Type`.

/// Implements the `From` trait by simply calling `to_string()` and wrapping the `String` in the given enum variant.
macro_rules! impl_from_for_error {
    ($error_type:ty, $enum_variant:ident) => {
        impl From<$error_type> for CommandError {
            fn from(value: $error_type) -> Self {
                Self::$enum_variant {
                    message: value.to_string(),
                }
            }
        }
    };
}

macro_rules! impl_from_for_error_with_variant {
    ($error_type:ty, $enum_variant:ident) => {
        impl From<$error_type> for CommandError {
            fn from(value: $error_type) -> Self {
                let variant: &'_ str = value.as_ref();
                Self::$enum_variant {
                    message: value.to_string(),
                    variant: variant.to_owned(),
                }
            }
        }
    };
}

impl_from_for_error!(&str, String);
impl_from_for_error!(String, String);
impl_from_for_error!(anyhow::Error, Anyhow);
impl_from_for_error!(std::io::Error, Io);
impl_from_for_error!(tauri::Error, TauriError);
impl_from_for_error!(tokio::task::JoinError, TokioError);
impl_from_for_error!(TryFromIntError, DowncastError);
impl_from_for_error_with_variant!(Archive2Error, Archive2Error);
impl_from_for_error_with_variant!(Archive2ReadError, Archive2ReadError);
impl_from_for_error!(camino::FromPathError, Utf8Error);
impl_from_for_error!(camino::FromPathBufError, Utf8Error);
impl_from_for_error!(camino::FromOsStrError, Utf8Error);
impl_from_for_error!(camino::FromOsStringError, Utf8Error);
impl_from_for_error!(url::ParseError, UrlParseError);
#[cfg(target_os = "windows")]
impl_from_for_error!(windows_result::Error, WindowsError);

impl From<std::borrow::Cow<'_, &str>> for CommandError {
    fn from(value: std::borrow::Cow<'_, &str>) -> Self {
        Self::String {
            message: value.to_string(),
        }
    }
}

impl<T> From<std::sync::PoisonError<T>> for CommandError {
    fn from(value: std::sync::PoisonError<T>) -> Self {
        Self::MutexLock {
            message: value.to_string(),
        }
    }
}

impl From<ini::Error> for CommandError {
    fn from(value: ini::Error) -> Self {
        match value {
            ini::Error::Io(err) => err.into(),
            ini::Error::Parse(err) => err.into(),
        }
    }
}

impl From<StripPrefixError> for CommandError {
    fn from(value: StripPrefixError) -> Self {
        Self::PathError {
            message: value.to_string(),
            variant: "StripPrefixError".to_string(),
        }
    }
}

impl From<SevenzipError> for CommandError {
    fn from(value: SevenzipError) -> Self {
        match value {
            SevenzipError::SevenzipNotFound => Self::SevenzipError {
                message: value.to_string(),
                variant: value.as_ref().to_owned(),
            },
            SevenzipError::Io(error) => error.into(),
            SevenzipError::DestinationNotFound(ref destination) => Self::SevenzipError {
                message: destination.to_string(),
                variant: value.as_ref().to_owned(),
            },
        }
    }
}

impl From<NXMError> for CommandError {
    fn from(value: NXMError) -> Self {
        match value {
            NXMError::UnsupportedPlatform => CommandError::UnsupportedPlatform {
                message: "unsupported platform".to_string(),
            },
            NXMError::Io(err) => err.into(),
            #[cfg(target_os = "windows")]
            NXMError::Windows(err) => err.into(),
            #[cfg(target_os = "linux")]
            NXMError::Ini(err) => err.into(),
            #[cfg(target_os = "linux")]
            NXMError::ParseIni(err) => err.into(),
        }
    }
}

impl From<ModActionError> for CommandError {
    fn from(value: ModActionError) -> Self {
        match value {
            ModActionError::FolderAlreadyExists(_)
            | ModActionError::InvalidFolderName(_)
            | ModActionError::NotAFile(_)
            | ModActionError::NotAFolder(_)
            | ModActionError::NotFound(_)
            | ModActionError::ModNotFound(_)
            | ModActionError::InvalidModFolderPath(_)
            | ModActionError::InvalidModTargetPath(_) => Self::ModActionError {
                message: value.to_string(),
                variant: value.as_ref().to_owned(),
            },
            ModActionError::Io(error) => error.into(),
            ModActionError::PathUtf8Converation(error) => Self::Utf8Error {
                message: error.to_string(),
            },
            ModActionError::NoBasename(ref error) => Self::PathError {
                message: error.to_string(),
                variant: value.as_ref().to_owned(),
            },
            ModActionError::PathStripPrefix(error) => error.into(),
            ModActionError::Sevenzip(error) => error.into(),
            ModActionError::Archive2(error) => error.into(),
            ModActionError::Anyhow(error) => error.into(),
        }
    }
}

impl From<DownloadError> for CommandError {
    fn from(value: DownloadError) -> Self {
        match value {
            DownloadError::Io(err) => err.into(),
            DownloadError::Reqwest(err) => Self::ReqwestError {
                message: err.to_string(),
            },
            DownloadError::SendError => Self::DownloadError {
                message: value.to_string(),
                variant: value.as_ref().to_owned(),
            },
            DownloadError::ContentLengthUnknown => Self::DownloadError {
                message: value.to_string(),
                variant: value.as_ref().to_owned(),
            },
            DownloadError::FileNameUnknown => Self::DownloadError {
                message: value.to_string(),
                variant: value.as_ref().to_owned(),
            },
        }
    }
}

impl From<ini::ParseError> for CommandError {
    fn from(value: ini::ParseError) -> Self {
        Self::IniParseError {
            file_name: None,
            line: u32::try_from(value.line)
                .tap_err(|err| {
                    log::warn!("Couldn't convert ini::ParseError.line from usize to u32: {err}\nFallback to 0")
                })
                .unwrap_or_default(),
            col: u32::try_from(value.col)
                .tap_err(|err| {
                    log::warn!("Couldn't convert ini::ParseError.col from usize to u32: {err}\nFallback to 0")
                })
                .unwrap_or_default(),
            msg: value.msg.to_string(),
        }
    }
}

impl From<TranslationError> for CommandError {
    fn from(value: TranslationError) -> Self {
        match value {
            TranslationError::Io(err) => err.into(),
            TranslationError::Anyhow(err) => err.into(),
            TranslationError::Parse(err) => Self::TranslationParseError {
                key: err.key,
                file_path: err.file_path,
                file_name: err.file_name,
                line: err.line.try_into().unwrap_or(0),
                column: err.column.try_into().unwrap_or(0),
                message: err.message,
            },
        }
    }
}

impl CommandError {
    pub fn with_file_name(self, file_name: String) -> Self {
        if let Self::IniParseError { line, col, msg, .. } = self {
            Self::IniParseError {
                file_name: Some(file_name),
                line,
                col,
                msg,
            }
        } else {
            self
        }
    }
}

#[derive(Debug, Serialize, Type)]
#[serde(tag = "status", content = "value")]
pub enum SerializableCommandResult<T> {
    #[serde(rename = "ok")]
    Ok(T),
    #[serde(rename = "error")]
    Err(CommandError),
}

impl<T> From<TranslationResult<T>> for SerializableCommandResult<T> {
    fn from(result: TranslationResult<T>) -> Self {
        match result {
            Ok(value) => SerializableCommandResult::Ok(value),
            Err(error) => SerializableCommandResult::Err(error.into()),
        }
    }
}
