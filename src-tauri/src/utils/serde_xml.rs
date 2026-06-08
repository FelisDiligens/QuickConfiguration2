use std::{
    fmt,
    fs::File,
    io::{BufRead, BufReader, Write},
    path::Path,
};

use serde::{Deserialize, Serialize, de::DeserializeOwned};

/// Deserialize an instance of type `T` from a file.
pub fn xml_from_file<P, T>(path: P) -> anyhow::Result<T>
where
    P: AsRef<Path>,
    T: DeserializeOwned,
{
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Ok(quick_xml::de::from_reader(reader)?)
}

/// Deserialize an instance of type `T` from a reader.
pub fn xml_from_reader<R, T>(reader: &mut R) -> Result<T, quick_xml::DeError>
where
    R: BufRead,
    T: DeserializeOwned,
{
    quick_xml::de::from_reader(reader)
}

/// Deserialize an instance of type `T` from a string of XML text.
pub fn xml_from_str<'de, T>(xml: &'de str) -> Result<T, quick_xml::DeError>
where
    T: Deserialize<'de>,
{
    quick_xml::de::from_str::<T>(xml)
}

/// Pretty-formats the serializable data of type  `T` to XML with an indent of 2 spaces.
pub fn xml_to_writer_pretty<W, T>(writer: &mut W, value: &T) -> Result<(), quick_xml::DeError>
where
    W: fmt::Write,
    T: ?Sized + Serialize,
{
    // Theoretically, quick_xml can emit a `quick_xml::events::BytesDecl` but I couldn't figure out how to write it with `quick_xml::se::Serializer`, so...
    writeln!(writer, "<?xml version=\"1.0\" encoding=\"utf-8\"?>")?;
    let mut serializer = quick_xml::se::Serializer::new(writer);
    serializer.indent(' ', 2);
    serializer.expand_empty_elements(true);
    value.serialize(serializer)
}

/// Pretty-formats the serializable data of type  `T` to XML with an indent of 2 spaces.
pub fn xml_to_string_pretty<T>(value: &T) -> Result<String, quick_xml::DeError>
where
    T: ?Sized + Serialize,
{
    let mut buffer = String::new();
    match xml_to_writer_pretty(&mut buffer, value) {
        Ok(_) => Ok(buffer),
        Err(e) => Err(e),
    }
}

/// Pretty-formats the serializable data of type  `T` to XML with an indent of 2 spaces.
pub fn xml_to_file_pretty<P, T>(path: P, value: &T) -> anyhow::Result<()>
where
    P: AsRef<Path>,
    T: ?Sized + Serialize,
{
    let mut file = File::create(path)?;
    write!(file, "{}", xml_to_string_pretty(value)?)?;
    Ok(())
}
