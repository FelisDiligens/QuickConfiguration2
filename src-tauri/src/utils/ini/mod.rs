#[cfg(test)]
pub mod tests;

use ini::Ini;

pub trait IniAccessors {
    fn string(&self, section: Option<&str>, key: &str) -> Option<String>;
    fn set_string(&mut self, section: Option<&str>, key: &str, value: &str);

    fn i32(&self, section: Option<&str>, key: &str) -> Option<i32>;
    fn set_i32(&mut self, section: Option<&str>, key: &str, value: i32);

    fn usize(&self, section: Option<&str>, key: &str) -> Option<usize>;
    fn set_usize(&mut self, section: Option<&str>, key: &str, value: usize);

    fn f32(&self, section: Option<&str>, key: &str) -> Option<f32>;
    fn set_f32(&mut self, section: Option<&str>, key: &str, value: f32);

    fn bool(&self, section: Option<&str>, key: &str) -> Option<bool>;
    fn set_bool(&mut self, section: Option<&str>, key: &str, value: bool);

    fn list(&self, section: Option<&str>, key: &str, sep: &str) -> Option<Vec<String>>;
    fn set_list(&mut self, section: Option<&str>, key: &str, sep: &str, value: Vec<String>);
}

impl IniAccessors for Ini {
    fn string(&self, section: Option<&str>, key: &str) -> Option<String> {
        self.get_from(section, key).map(|value| value.to_string())
    }

    fn set_string(&mut self, section: Option<&str>, key: &str, value: &str) {
        self.with_section(section).set(key, value);
    }

    fn i32(&self, section: Option<&str>, key: &str) -> Option<i32> {
        let value = self.get_from(section, key)?;
        if value.is_empty() {
            return Some(0);
        }
        match value.parse::<f32>() {
            Ok(number) => Some(number.floor() as i32),
            Err(_) => None,
        }
    }

    fn set_i32(&mut self, section: Option<&str>, key: &str, value: i32) {
        self.with_section(section).set(key, value.to_string());
    }

    fn usize(&self, section: Option<&str>, key: &str) -> Option<usize> {
        let value = self.get_from(section, key)?;
        if value.is_empty() {
            return Some(0);
        }
        value.parse::<usize>().ok()
    }

    fn set_usize(&mut self, section: Option<&str>, key: &str, value: usize) {
        self.with_section(section).set(key, value.to_string());
    }

    fn f32(&self, section: Option<&str>, key: &str) -> Option<f32> {
        let value = self.get_from(section, key)?;
        if value.is_empty() {
            return Some(0.0);
        }
        value.parse().ok()
    }

    fn set_f32(&mut self, section: Option<&str>, key: &str, value: f32) {
        self.with_section(section).set(key, value.to_string());
    }

    fn bool(&self, section: Option<&str>, key: &str) -> Option<bool> {
        let value = self.get_from(section, key)?;
        if value.is_empty() {
            Some(false)
        } else if let Ok(boolean_value) = value.parse::<bool>() {
            Some(boolean_value)
        } else if let Ok(number) = value.parse::<u64>() {
            Some(number > 0)
        } else {
            None
        }
    }

    fn set_bool(&mut self, section: Option<&str>, key: &str, value: bool) {
        self.with_section(section)
            .set(key, if value { "1" } else { "0" });
    }

    fn list(&self, section: Option<&str>, key: &str, sep: &str) -> Option<Vec<String>> {
        let value = self.get_from(section, key)?;
        Some(
            value
                .split(sep)
                .map(|item| item.trim().to_string())
                .filter(|item| !item.is_empty())
                .collect(),
        )
    }

    fn set_list(&mut self, section: Option<&str>, key: &str, sep: &str, value: Vec<String>) {
        self.with_section(section).set(key, value.join(sep));
    }
}

// https://github.com/zonyitoo/rust-ini/issues/130
/// Fixes issue #130 (Windows Path \ gets lost after parsing) for rust-ini,
/// by simply replacing all occurrences of `\` with `\\`.
/// Use this function before calling `Ini::load_from_str`.
pub fn escape_windows_path_separators<S: AsRef<str>>(s: S) -> String {
    let mut result = String::with_capacity(s.as_ref().len());
    for line in s.as_ref().lines() {
        if line.trim().contains("=") {
            let mut splits = line.splitn(2, "=");
            if let Some(_key) = splits.next()
                && let Some(value) = splits.next()
            {
                let transformed_value = value.replace(r"\", r"\\");
                let transformed_line = line.replacen(value, &transformed_value, 1);
                result.push_str(&transformed_line);
                result.push_str("\n");
                continue;
            }
        }
        result.push_str(&line);
        result.push_str("\n");
    }
    result
}
