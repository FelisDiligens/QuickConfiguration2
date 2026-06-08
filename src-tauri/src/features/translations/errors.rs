use std::{fmt, io};

pub type TranslationResult<T> = Result<T, TranslationError>;

/// Translation JSON file could not be parsed
#[derive(Debug)]
pub struct TranslationParseError {
    pub key: String,
    pub file_name: String,
    pub file_path: String,
    pub line: usize,
    pub column: usize,
    pub message: String,
}

impl TranslationParseError {
    pub fn new<S: AsRef<str>>(
        key: S,
        file_name: S,
        file_path: S,
        error: serde_json::Error,
    ) -> Self {
        Self {
            key: key.as_ref().to_string(),
            file_name: file_name.as_ref().to_string(),
            file_path: file_path.as_ref().to_string(),
            line: error.line(),
            column: error.column(),
            message: error.to_string(),
        }
    }
}

impl fmt::Display for TranslationParseError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "Error in file {}, line {}, column {}: {}",
            self.file_name, self.line, self.column, self.message
        )
    }
}

#[derive(thiserror::Error, Debug)]
pub enum TranslationError {
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
    #[error(transparent)]
    Io(#[from] io::Error),
    #[error("{0}")]
    Parse(TranslationParseError),
}

impl TranslationError {
    pub fn parse_error<S: AsRef<str>>(
        key: S,
        file_name: S,
        file_path: S,
        error: serde_json::Error,
    ) -> Self {
        Self::Parse(TranslationParseError::new(key, file_name, file_path, error))
    }
}
