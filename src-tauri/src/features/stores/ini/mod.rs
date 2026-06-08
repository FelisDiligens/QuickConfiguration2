use std::sync::{Arc, Mutex};

use ini::Ini;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Type)]
pub enum IniFile {
    Main,
    Prefs,
    Custom,
}

pub struct IniFiles {
    pub main: Arc<Mutex<Ini>>,
    pub prefs: Arc<Mutex<Ini>>,
    pub custom: Arc<Mutex<Ini>>,
}

impl Default for IniFiles {
    fn default() -> Self {
        Self {
            main: Arc::new(Mutex::new(Ini::new())),
            prefs: Arc::new(Mutex::new(Ini::new())),
            custom: Arc::new(Mutex::new(Ini::new())),
        }
    }
}

impl IniFiles {
    pub fn get_file(&self, ini_file: IniFile) -> &Mutex<Ini> {
        match ini_file {
            IniFile::Main => &self.main,
            IniFile::Prefs => &self.prefs,
            IniFile::Custom => &self.custom,
        }
    }
}
