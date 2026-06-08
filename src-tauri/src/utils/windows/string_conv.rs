/// Convenience trait to convert from wchar_t* to String quickly.
pub trait StringConversions {
    fn decode_to_string(&self) -> String;
}

impl StringConversions for Vec<u16> {
    fn decode_to_string(&self) -> String {
        // If the string is null-terminated, search first null and slice the vec:
        let mut v = self.clone();
        if let Some(nul_index) = v.iter().position(|&r| r == 0) {
            v = v[0..nul_index].to_vec();
        }

        // Decode UTF-16 to UTF-8 and return String, replacing invalid characters with 0xFFFD
        String::from_utf16_lossy(&v)
    }
}
