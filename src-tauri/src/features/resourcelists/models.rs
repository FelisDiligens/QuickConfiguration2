use serde::{Deserialize, Serialize};
use specta::Type;

use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone, Default, Type)]
#[repr(transparent)]
#[serde(transparent)]
pub struct ResourceList {
    pub resources: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, Default, Type)]
#[repr(transparent)]
#[serde(transparent)]
pub struct ResourceLists {
    pub lists: HashMap<String, ResourceList>,
}
