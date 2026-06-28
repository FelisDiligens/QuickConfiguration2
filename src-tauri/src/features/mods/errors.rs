use std::{io, path::StripPrefixError};

use thiserror::Error;

use crate::features::{archive2::Archive2Error, sevenzip::SevenzipError};

pub type ModActionResult<T> = Result<T, ModActionError>;

#[derive(Error, Debug, strum::AsRefStr)]
pub enum ModActionError {
    #[error("Folder already exists at destination path: {0}")]
    FolderAlreadyExists(String),
    #[error("Invalid folder name: {0}")]
    InvalidFolderName(String),
    #[error("The given path does not point to a file: {0}")]
    NotAFile(String),
    #[error("The given path does not point to a folder: {0}")]
    NotAFolder(String),
    #[error("The given path does not exist: {0}")]
    NotFound(String),
    #[error("Couldn't get file/folder name for path: {0}")]
    NoBasename(String),
    #[error("The path or part of it could not be converted into a UTF-8 string: {0}")]
    PathUtf8Converation(String),
    #[error("Mod not found, key: {0}")]
    ModNotFound(String),
    #[error("The mod path is not a folder: {0}")]
    InvalidModFolderPath(String),
    #[error("The destination path is not a folder: {0}")]
    InvalidModTargetPath(String),
    #[error(transparent)]
    PathStripPrefix(#[from] StripPrefixError),
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error(transparent)]
    Sevenzip(#[from] SevenzipError),
    #[error(transparent)]
    Archive2(#[from] Archive2Error),
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
    #[error(transparent)]
    Regex(#[from] regex::Error),
}

impl From<camino::FromPathError> for ModActionError {
    fn from(value: camino::FromPathError) -> Self {
        Self::PathUtf8Converation(value.to_string())
    }
}

impl From<camino::FromPathBufError> for ModActionError {
    fn from(value: camino::FromPathBufError) -> Self {
        Self::PathUtf8Converation(value.to_string())
    }
}

impl From<camino::FromOsStrError> for ModActionError {
    fn from(value: camino::FromOsStrError) -> Self {
        Self::PathUtf8Converation(value.to_string())
    }
}

impl From<camino::FromOsStringError> for ModActionError {
    fn from(value: camino::FromOsStringError) -> Self {
        Self::PathUtf8Converation(value.to_string())
    }
}
