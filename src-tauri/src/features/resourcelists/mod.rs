#[cfg(test)]
pub mod tests;

mod models;

use std::{
    fs, io,
    path::{Path, PathBuf},
};

use ini::Ini;
use itertools::Itertools;
pub use models::*;

use crate::utils::{fs_util, ini::IniAccessors};

/// Legacy resources file: "Fallout76\Mods\resources.txt".
pub fn get_legacy_mods_resources_path<P: AsRef<Path>>(mods_path: P) -> PathBuf {
    mods_path.as_ref().join("resources.txt")
}

impl ResourceList {
    pub fn new<S: AsRef<str>>(list: &[S]) -> Self {
        Self {
            resources: list
                .iter()
                .map(|resource| resource.as_ref().trim().to_owned())
                .unique()
                .collect(),
        }
    }

    /// Parses a raw string by splitting it by newlines and commas (`,`).
    /// Normalizes newlines (`\r\n` -> `\n`), trims strings, removes empty strings, removes duplicates.
    pub fn parse<S: AsRef<str>>(raw_list: S) -> Self {
        Self {
            resources: raw_list
                .as_ref()
                .replace("\r\n", "\n")
                .split("\n")
                .flat_map(|line| line.split(","))
                .map(|resource| resource.trim().to_owned())
                .filter(|resource| !resource.is_empty())
                .unique()
                .collect(),
        }
    }

    pub fn serialize(&self, sep: &str) -> String {
        self.resources.join(sep).to_string()
    }

    /// Reads and parses from a text file.
    pub fn load_from_file<P: AsRef<Path>>(file_path: P) -> io::Result<Self> {
        let path = file_path.as_ref().to_path_buf();
        let raw_list = fs::read_to_string(&path)?;
        Ok(Self::parse(raw_list))
    }

    /// Gets and parses from an INI file.
    pub fn load_from_ini(ini_file: &Ini, section: Option<String>, key: String) -> Self {
        let raw_list = ini_file
            .get_from(section.as_ref(), &key)
            .unwrap_or_default();
        Self::parse(raw_list)
    }

    /// Saves to a text file, newline-separated
    pub fn save_to_file<P: AsRef<Path>>(&self, file_path: P) -> io::Result<()> {
        fs::write(file_path, self.serialize("\n"))
    }

    /// Saves to ini struct, comma-separated
    pub fn save_to_ini(&self, ini_file: &mut Ini, section: Option<&str>, key: &str) {
        ini_file.set_string(section, key, &self.serialize(","));
    }

    pub fn prepend<I: Iterator<Item = String>>(&mut self, iter: I) {
        self.resources = iter.chain(self.resources.clone()).unique().collect();
    }

    pub fn append<I: Iterator<Item = String>>(&mut self, iter: I) {
        // TODO: List should add the resources to the end of the list and dedup it?
        self.resources = self
            .resources
            .clone()
            .into_iter()
            .chain(iter)
            .unique()
            .collect();
    }

    pub fn remove_many(&mut self, items: &[String]) {
        self.resources = self
            .resources
            .clone()
            .into_iter()
            .filter(|r| !items.contains(r))
            .unique()
            .collect();
    }

    pub fn remove<S: AsRef<str>>(&mut self, archive_name: S) {
        self.resources = self
            .resources
            .clone()
            .into_iter()
            .filter(|r| r != archive_name.as_ref())
            .unique()
            .collect();
    }

    /// Search `parent_path` for archives that are not included in the resource list.
    /// Excludes any archive starting with "SeventySix - " (as we don't want to add the game's archives).
    /// Returns the list of archives.
    #[function_name::named]
    pub fn get_unlisted_archives<P: AsRef<Path>>(&self, parent_path: P) -> io::Result<Vec<String>> {
        log::trace!(
            "[{}] Searching for archives in `{:?}`",
            function_name!(),
            parent_path.as_ref()
        );
        Ok(fs_util::list_files_with_ext(parent_path.as_ref(), "ba2")?
            .filter_map(|file_path| file_path.file_name().map(|p| p.to_os_string()))
            .filter_map(|file_name| file_name.to_str().map(|s| s.to_owned()))
            .filter(|file_name| !file_name.starts_with("SeventySix - "))
            .filter(|file_name| !self.resources.contains(file_name))
            .unique()
            .collect())
    }

    /// Search `parent_path` for archives that are not included in the resource list and appends them to it.
    /// Excludes any archive starting with "SeventySix - " (as we don't want to add the game's archives).
    /// Modifies the resource list in place.
    #[function_name::named]
    pub fn add_unlisted_archives<P: AsRef<Path>>(&mut self, parent_path: P) -> io::Result<()> {
        let mut resources = self.get_unlisted_archives(parent_path)?;
        log::trace!("[{}] Found resources: {:?}", function_name!(), resources);
        self.resources.append(&mut resources);
        self.resources = self.resources.clone().into_iter().unique().collect();
        Ok(())
    }

    /// Checks if all archives in the resource list exist in `parent_path`.
    /// If not, they will be discarded (removed from the list).
    /// Modifies the resource list in place.
    #[function_name::named]
    pub fn remove_non_existant_archives<P: AsRef<Path>>(&mut self, parent_path: P) {
        log::trace!(
            "[{}] Validating archives exist in `{:?}`",
            function_name!(),
            parent_path.as_ref()
        );
        let mut resources = Vec::new();
        for resource in self.resources.iter() {
            let resource_path = parent_path.as_ref().join(resource);
            if resource_path.is_file() {
                log::trace!("[{}] Found: {:?}", function_name!(), resource);
                resources.push(resource.clone());
            } else {
                log::trace!("[{}] Discarded: {:?}", function_name!(), resource);
            }
        }
        self.resources = resources;
    }
}
