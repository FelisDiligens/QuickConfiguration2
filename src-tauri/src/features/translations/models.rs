use serde::{Deserialize, Serialize};
use specta::Type;

/// Meta data and translation keys.
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct Translation {
    pub key: String,
    pub name: String,
    pub author: String,
    pub translation: serde_json::Map<String, serde_json::Value>,
}

impl Translation {
    pub fn new(key: String, json: TranslationJson) -> Self {
        Self {
            key,
            name: json.name,
            author: json.author,
            translation: json.translation,
        }
    }
}

/// Only meta data without the translation keys.
#[derive(Debug, Serialize, Deserialize, Type)]
pub struct TranslationMeta {
    pub key: String,
    pub name: String,
    pub author: String,
}

impl From<Translation> for TranslationMeta {
    fn from(value: Translation) -> Self {
        Self {
            key: value.key,
            name: value.name,
            author: value.author,
        }
    }
}

/// Contents of the JSON file
#[derive(Debug, Serialize, Deserialize)]
pub struct TranslationJson {
    pub name: String,
    pub author: String,
    pub translation: serde_json::Map<String, serde_json::Value>,
}
