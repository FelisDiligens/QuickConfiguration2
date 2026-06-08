pub mod archive2;
pub mod args;
pub mod game;
pub mod github;
pub mod linkhandler;
pub mod mods;
pub mod nexusmods;
pub mod resourcelists;
pub mod screenshots;
pub mod sevenzip;
pub mod steam;
pub mod stores;
pub mod translations;

#[cfg(not(target_os = "windows"))]
pub mod wine;
