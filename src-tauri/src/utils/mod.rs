//! Contains stateless utility functions that can be used everywhere.

#[cfg(debug_assertions)]
pub mod bindings;

#[cfg(target_os = "windows")]
pub mod windows;

pub mod channel;
pub mod download;
pub mod fs_util;
pub mod ini;
pub mod macros;
pub mod open;
pub mod paths;
pub mod serde_xml;
pub mod test_utils;
