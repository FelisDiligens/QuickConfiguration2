//! Utility functions used in the generation of TypeScript bindings with Tauri Specta.

use std::{
    env,
    path::{Path, PathBuf},
};
use std::{fs, io};

use anyhow::Result;

pub fn add_skip_typecheck_directives<P: AsRef<Path>>(file_path: P) -> io::Result<()> {
    let file_content = fs::read_to_string(file_path.as_ref())?;
    let header = "/* eslint-disable */\n// @ts-nocheck\n";
    fs::write(file_path.as_ref(), format!("{}{}", header, file_content))?;
    Ok(())
}

pub fn get_export_path() -> Result<PathBuf> {
    // Find project path:
    let project_dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("couldn't get parent of src-tauri");

    // Based on project path, return export path:
    Ok(project_dir.join("src/commands/bindings.ts"))
}
