use std::ffi::{OsStr, OsString};

/// Concatenates `OsStr`s to a new `OsString`.
#[macro_export]
macro_rules! osstring_concat {
    ($($params:expr),+) => {
        $crate::utils::macros::osstring_concat::osstring_concat(&[$($params),+])
    };
}

/// Concatenates `OsStr`s to a new `OsString`.
pub fn osstring_concat<S: AsRef<OsStr>>(args: &[S]) -> OsString {
    let capacity = args.iter().map(|s| s.as_ref().len()).sum();
    let mut concatenated = OsString::with_capacity(capacity);
    for arg in args {
        concatenated.push(arg.as_ref());
    }
    concatenated
}
