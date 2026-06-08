use std::fmt;

use serde::{Deserialize, Serialize};
use specta::Type;

use crate::features::mods::models::xml;

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct Archive2Info {
    pub compression: Archive2Compression,
    pub format: Archive2Format,
    pub num_of_files: u32,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub enum Archive2Preset {
    /// General / Meshes / Materials / Animations
    General,
    /// Textures (*.dds files)
    Textures,
    /// Sound FX and Music / Interface and HUD
    AudioAndUI,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Type)]
pub enum Archive2Compression {
    /// Uncompressed
    None,
    /// Compressed
    Default,
    XBox,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Type)]
pub enum Archive2Format {
    General,
    /// Textures (DX10)
    DDS,
    XBoxDDS,
    GNF,
}

impl fmt::Display for Archive2Compression {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Archive2Compression::None => write!(f, "None"),
            Archive2Compression::Default => write!(f, "Default"),
            Archive2Compression::XBox => write!(f, "XBox"),
        }
    }
}

impl fmt::Display for Archive2Format {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Archive2Format::General => write!(f, "General"),
            Archive2Format::DDS => write!(f, "DDS"),
            Archive2Format::XBoxDDS => write!(f, "XBoxDDS"),
            Archive2Format::GNF => write!(f, "GNF"),
        }
    }
}

impl Archive2Preset {
    pub fn into_format_and_compression(&self) -> (Archive2Format, Archive2Compression) {
        match self {
            Archive2Preset::General => (Archive2Format::General, Archive2Compression::Default),
            Archive2Preset::Textures => (Archive2Format::DDS, Archive2Compression::Default),
            Archive2Preset::AudioAndUI => (Archive2Format::General, Archive2Compression::None),
        }
    }
}

impl TryFrom<xml::ArchiveCompression> for Archive2Compression {
    type Error = anyhow::Error;

    fn try_from(value: xml::ArchiveCompression) -> Result<Self, Self::Error> {
        match value {
            xml::ArchiveCompression::Compressed => Ok(Archive2Compression::Default),
            xml::ArchiveCompression::Uncompressed => Ok(Archive2Compression::None),
            xml::ArchiveCompression::Auto => Err(anyhow::anyhow!(
                "Cannot convert xml::ArchiveCompression::Auto to Archive2Compression"
            )),
        }
    }
}

impl TryFrom<xml::ArchiveFormat> for Archive2Format {
    type Error = anyhow::Error;

    fn try_from(value: xml::ArchiveFormat) -> Result<Self, Self::Error> {
        match value {
            xml::ArchiveFormat::General => Ok(Archive2Format::General),
            xml::ArchiveFormat::Textures => Ok(Archive2Format::DDS),
            xml::ArchiveFormat::Auto => Err(anyhow::anyhow!(
                "Cannot convert xml::ArchiveFormat::Auto to Archive2Format"
            )),
        }
    }
}
