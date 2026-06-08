mod download;
mod errors;
mod models;

pub use download::*;
pub use errors::*;
pub use models::*;

use std::{fs, path::Path};

use camino::Utf8PathBuf;
use tap::TapFallible;

use crate::utils::{fs_util, paths::get_translation_folder_path};

fn get_key_from_path<P: AsRef<Path>>(path: P) -> TranslationResult<String> {
    Ok(path
        .as_ref()
        .file_name()
        .ok_or(anyhow::anyhow!("Couldn't get file name"))?
        .to_str()
        .ok_or(anyhow::anyhow!("Couldn't get file name as Unicode"))?
        .strip_suffix(".json")
        .ok_or(anyhow::anyhow!(
            "Couldn't strip '.json' ending from file name"
        ))?
        .to_string())
}

/// Returns all json files found in the translations folder as a list of "keys",
/// e.g. `["en", "de", ...]`
pub fn get_translation_keys() -> TranslationResult<Vec<String>> {
    let path = get_translation_folder_path().ok_or(anyhow::anyhow!(
        "Translation folder path could not be determined."
    ))?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    fs_util::list_files_with_ext(&path, "json")?
        .map(get_key_from_path)
        .collect()
}

pub fn save_translation<S: AsRef<str>>(
    file_name: S,
    translation: Translation,
) -> anyhow::Result<()> {
    let path = get_translation_folder_path().ok_or(anyhow::anyhow!(
        "Translation folder path could not be determined."
    ))?;
    fs::create_dir_all(&path)?;
    let file_path = path.join(file_name.as_ref());
    fs_util::write_to_file(&file_path, serde_json::to_string_pretty(&translation)?)?;
    log::trace!("Created {file_path:?}");
    Ok(())
}

/// Load a translation json file (`{key}.json`) from the translations folder.
pub fn load_translation<S: AsRef<str>>(key: S) -> TranslationResult<Translation> {
    let path: Utf8PathBuf = get_translation_folder_path()
        .ok_or(anyhow::anyhow!(
            "Translation folder path could not be determined."
        ))?
        .try_into()
        .map_err(anyhow::Error::from)?;
    let key = key.as_ref();
    let file_path = path.join(key).with_extension("json");
    let file_name = file_path.file_name().ok_or(anyhow::anyhow!(
        "File name could not be determined: {file_path:?}"
    ))?;
    log::trace!("Loading translation \"{key}\" from {file_path:?}");
    let contents = fs::read_to_string(&file_path)
        .tap_err(|e| log::error!("Couldn't read {file_path:?}: {e}"))?;
    serde_json::from_str::<TranslationJson>(&contents)
        .map(|json| Translation::new(key.to_string(), json))
        .tap_err(|e| log::error!("Couldn't deserialize translation {file_path:?}: {e}"))
        .map_err(|e| TranslationError::parse_error(key, file_name, file_path.as_str(), e))
}

/// Load a translation json file (`{key}.json`) from the translations folder, but only return meta data.
pub fn load_translation_metadata<S: AsRef<str>>(key: S) -> TranslationResult<TranslationMeta> {
    Ok(load_translation(key)?.into())
}

/// Loads all translation json files from the translations folder.
/// Returns `Err` on I/O errors or other critical errors. Otherwise returns a `Vec` of `Result`s where `Err` means there was a parsing error.
pub fn load_all_translations() -> TranslationResult<Vec<TranslationResult<Translation>>> {
    let path = get_translation_folder_path().ok_or(anyhow::anyhow!(
        "Translation folder path could not be determined."
    ))?;
    if !path.exists() {
        log::warn!("Folder does not exist: {path:?}");
        return Ok(Vec::new());
    }
    log::trace!("Looking for translations in {path:?}");
    let mut translations = Vec::new();
    for file_path in fs_util::list_files_with_ext(&path, "json")? {
        let key = get_key_from_path(&file_path)?;
        let file_path: Utf8PathBuf = file_path.try_into().map_err(anyhow::Error::from)?;
        let file_name = file_path.file_name().ok_or(anyhow::anyhow!(
            "File name could not be determined: {file_path:?}"
        ))?;
        if file_name.ends_with(".template.json") {
            // Skip template files
            continue;
        }
        log::trace!("Found {file_name:?}");
        let contents = fs::read_to_string(&file_path)?;
        let translation = serde_json::from_str::<TranslationJson>(&contents)
            .map(|json| Translation::new(key.clone(), json))
            .tap_err(|e| log::error!("Couldn't deserialize translation {file_name:?}: {e}"))
            .map_err(|e| {
                TranslationError::parse_error(key.as_str(), file_name, file_path.as_str(), e)
            });
        translations.push(translation);
    }
    Ok(translations)
}

/// Loads all translation json files from the translations folder, but only return the meta data.
/// Returns `Err` on I/O errors or other critical errors. Otherwise returns a `Vec` of `Result`s where `Err` means there was a parsing error.
pub fn load_all_translation_metadata() -> TranslationResult<Vec<TranslationResult<TranslationMeta>>>
{
    let path = get_translation_folder_path().ok_or(anyhow::anyhow!(
        "Translation folder path could not be determined."
    ))?;
    if !path.exists() {
        log::warn!("Folder does not exist: {path:?}");
        return Ok(Vec::new());
    }
    log::trace!("Looking for translations in {path:?}");
    let mut translations = Vec::new();
    for file_path in fs_util::list_files_with_ext(&path, "json")? {
        let key = get_key_from_path(&file_path)?;
        let file_path: Utf8PathBuf = file_path.try_into().map_err(anyhow::Error::from)?;
        let file_name = file_path.file_name().ok_or(anyhow::anyhow!(
            "File name could not be determined: {file_path:?}"
        ))?;
        if file_name.ends_with(".template.json") {
            // Skip template files
            continue;
        }
        log::trace!("Found {file_name:?}");
        let contents = fs::read_to_string(&file_path)?;
        let translation = serde_json::from_str::<TranslationJson>(&contents)
            .map(|json| Translation::new(key.clone(), json))
            .map(TranslationMeta::from)
            .tap_err(|e| log::error!("Couldn't deserialize translation {file_name:?}: {e}"))
            .map_err(|e| {
                TranslationError::parse_error(key.as_str(), file_name, file_path.as_str(), e)
            });
        translations.push(translation);
    }
    Ok(translations)
}
