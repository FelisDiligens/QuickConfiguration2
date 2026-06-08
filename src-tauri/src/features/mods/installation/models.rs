use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::mods::errors::{ModActionError, ModActionResult};
use crate::utils::fs_util;

#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "lowercase", tag = "type")]
pub enum DirEntry {
    #[serde(rename_all = "camelCase")]
    File { path: String, name: String },
    #[serde(rename_all = "camelCase")]
    Folder {
        path: String,
        name: String,
        contents: Vec<DirEntry>,
    },
}

impl DirEntry {
    fn new<P: AsRef<Path>, S: AsRef<str>>(path: P, parent_path: S) -> ModActionResult<Self> {
        let path: camino::Utf8PathBuf = path.as_ref().to_path_buf().try_into()?;
        let name = path
            .file_name()
            .ok_or(ModActionError::NoBasename(path.to_string()))?
            .to_string();
        let relative_path = camino::Utf8Path::new(parent_path.as_ref())
            .join(&name)
            .to_string();
        Ok(if path.is_file() {
            Self::File {
                name,
                path: relative_path,
            }
        } else {
            Self::Folder {
                name,
                contents: fs_util::list_entries(&path)?
                    .map(|path| DirEntry::new(&path, &relative_path))
                    .collect::<Result<Vec<_>, _>>()?,
                path: relative_path,
            }
        })
    }
}

impl TryFrom<PathBuf> for DirEntry {
    type Error = ModActionError;

    fn try_from(path: PathBuf) -> Result<Self, Self::Error> {
        DirEntry::new(path, ".")
    }
}
