use std::collections::HashSet;

use crate::features::nexusmods::models::json::{ModFile, ModFiles};

/// Starting from a known file ID, attempt to find the latest file based on file updates.
pub fn get_latest_file(file_id: u32, files: &ModFiles) -> Option<&ModFile> {
    let mut curr_file_id = file_id;
    let mut visited_ids = HashSet::new();
    visited_ids.insert(curr_file_id);
    while let Some(update) = files
        .file_updates
        .iter()
        .find(|update| update.old_file_id == curr_file_id)
    {
        curr_file_id = update.new_file_id;
        if visited_ids.contains(&curr_file_id) {
            break;
        }
        visited_ids.insert(curr_file_id);
    }
    if file_id == curr_file_id {
        return None; // Our file is already latest
    }
    files.files.iter().find(|file| file.file_id == curr_file_id)
}
