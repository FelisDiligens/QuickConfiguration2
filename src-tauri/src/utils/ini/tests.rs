#![cfg(test)]

use indoc::indoc;
use ini::Ini;

use crate::utils::ini::{IniAccessors, escape_windows_path_separators};

#[test]
fn getting_i32() {
    let mut conf = Ini::new();
    conf.with_section(Some("Test")).set("iTest1", "42");
    conf.with_section(Some("Test")).set("iTest2", "42.0");
    conf.with_section(Some("Test")).set("iTest3", "33.99");
    conf.with_section(Some("Test")).set("iTest4", "-42");
    conf.with_section(Some("Test")).set("iTest5", "");

    assert_eq!(
        conf.i32(Some("Test"), "iTest1"),
        Some(42),
        "Expected integer number to be parsed",
    );
    assert_eq!(
        conf.i32(Some("Test"), "iTest2"),
        Some(42),
        "Expected floating point number to be parsed",
    );
    assert_eq!(
        conf.i32(Some("Test"), "iTest3"),
        Some(33),
        "Expected floating point number to be rounded down",
    );
    assert_eq!(
        conf.i32(Some("Test"), "iTest4"),
        Some(-42),
        "Expected negative integer number to be parsed",
    );
    assert_eq!(
        conf.i32(Some("Test"), "iTest5"),
        Some(0),
        "Expected empty string to be parsed to zero",
    );
}

#[test]
fn setting_i32() {
    let mut conf = Ini::new();
    conf.set_i32(Some("Test"), "iTest1", 42);
    conf.set_i32(Some("Test"), "iTest2", -42);
    assert_eq!(conf.get_from(Some("Test"), "iTest1"), Some("42"));
    assert_eq!(conf.get_from(Some("Test"), "iTest2"), Some("-42"));
}

#[test]
fn getting_f32() {
    let mut conf = Ini::new();
    conf.with_section(Some("Test")).set("fTest1", "42");
    conf.with_section(Some("Test")).set("fTest2", "42.5");
    conf.with_section(Some("Test")).set("fTest3", "-42.42");
    conf.with_section(Some("Test")).set("fTest4", ".5");
    conf.with_section(Some("Test")).set("fTest5", "2.");
    conf.with_section(Some("Test")).set("fTest6", "");

    assert_eq!(
        conf.f32(Some("Test"), "fTest1"),
        Some(42.0),
        "Expected integer number \"42\" to be parsed",
    );
    assert_eq!(
        conf.f32(Some("Test"), "fTest2"),
        Some(42.5),
        "Expected floating point number \"42.5\" to be parsed",
    );
    assert_eq!(
        conf.f32(Some("Test"), "fTest3"),
        Some(-42.42),
        "Expected abbreviated floating point number \"-42.42\" to be parsed",
    );
    assert_eq!(
        conf.f32(Some("Test"), "fTest4"),
        Some(0.5),
        "Expected floating point number with leading decimal point \".5\" to be parsed",
    );
    assert_eq!(
        conf.f32(Some("Test"), "fTest5"),
        Some(2.0),
        "Expected floating point number with trailing decimal point \"2.\" to be parsed",
    );
    assert_eq!(
        conf.f32(Some("Test"), "fTest6"),
        Some(0.0),
        "Expected empty string to be parsed to zero",
    );
}

#[test]
fn setting_f32() {
    let mut conf = Ini::new();
    conf.set_f32(Some("Test"), "fTest1", 42.0);
    conf.set_f32(Some("Test"), "fTest2", 42.00001);
    conf.set_f32(Some("Test"), "fTest3", -42.0);
    conf.set_f32(Some("Test"), "fTest4", 0.0);
    assert_eq!(conf.get_from(Some("Test"), "fTest1"), Some("42"));
    assert_eq!(conf.get_from(Some("Test"), "fTest2"), Some("42.00001")); // test fails if we go further than the 5th digit after the point
    assert_eq!(conf.get_from(Some("Test"), "fTest3"), Some("-42"));
    assert_eq!(conf.get_from(Some("Test"), "fTest4"), Some("0"));
}

#[test]
fn getting_bool() {
    let mut conf = Ini::new();
    conf.with_section(Some("Test")).set("bEmpty", "");
    conf.with_section(Some("Test")).set("bTrue", "1");
    conf.with_section(Some("Test")).set("bFalse", "0");

    assert_eq!(
        conf.bool(Some("Test"), "bEmpty"),
        Some(false),
        "Expected empty string to be interpreted as false",
    );
    assert_eq!(
        conf.bool(Some("Test"), "bTrue"),
        Some(true),
        "Expected \"1\" to be interpreted as true",
    );
    assert_eq!(
        conf.bool(Some("Test"), "bFalse"),
        Some(false),
        "Expected \"0\" to be interpreted as false",
    );
}

#[test]
fn setting_bool() {
    let mut conf = Ini::new();
    conf.set_bool(Some("Test"), "bTrue", true);
    conf.set_bool(Some("Test"), "bFalse", false);
    assert_eq!(conf.get_from(Some("Test"), "bTrue"), Some("1"));
    assert_eq!(conf.get_from(Some("Test"), "bFalse"), Some("0"));
}

#[test]
fn getting_list() {
    let mut conf = Ini::new();
    conf.with_section(Some("Test")).set(
        "sResourceArchive2List",
        "File.ba2,File2.ba2, File with spaces.ba2 ,File.ba2",
    );
    conf.with_section(Some("Test"))
        .set("MimeType", "application/json;application/yaml");
    conf.with_section(Some("Test"))
        .set("EmptyItems", "application/json;;application/yaml;");

    assert_eq!(
        conf.list(Some("Test"), "sResourceArchive2List", ","),
        Some(vec![
            "File.ba2".to_string(),
            "File2.ba2".to_string(),
            "File with spaces.ba2".to_string(),
            "File.ba2".to_string(),
        ])
    );
    assert_eq!(
        conf.list(Some("Test"), "MimeType", ";"),
        Some(vec![
            "application/json".to_string(),
            "application/yaml".to_string(),
        ])
    );
    assert_eq!(
        conf.list(Some("Test"), "EmptyItems", ";"),
        Some(vec![
            "application/json".to_string(),
            "application/yaml".to_string(),
        ])
    );
}

#[test]
fn setting_list() {
    let mut conf = Ini::new();
    conf.set_list(
        Some("Test"),
        "sResourceArchive2List",
        ",",
        vec![
            "File.ba2".to_string(),
            "File2.ba2".to_string(),
            "File.ba2".to_string(),
        ],
    );
    assert_eq!(
        conf.get_from(Some("Test"), "sResourceArchive2List"),
        Some("File.ba2,File2.ba2,File.ba2")
    );
}

#[test]
fn case_insensitive_sections() {
    // Note: Duplicate sections behave a bit weird... `get_from` and `section` only search/return the first matching section.
    let result = Ini::load_from_str(indoc! {"
        [Gameplay]
        uVATSGrenadeMineTargetingMode = 2
    "});
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let conf = result.unwrap();
    println!("{:?}", conf);
    assert_eq!(
        conf.i32(Some("Gameplay"), "uVATSGrenadeMineTargetingMode"),
        Some(2),
        "should get [Gameplay] uVATSGrenadeMineTargetingMode (original case)"
    );
    assert_eq!(
        conf.i32(Some("GamePlay"), "uVATSGrenadeMineTargetingMode"),
        Some(2),
        "should get [GamePlay] uVATSGrenadeMineTargetingMode (differing case)"
    );
}

#[test]
fn successful_parse() {
    let result = Ini::load_from_str(indoc! {"
        bVal1 = 1

        ; This comment should be ignored
            \t; Spaces before comments shouldn't matter
        [Section1]
        iVal2 = 42 ; Inline comments should also be ignored
        sVal3 = mySecure123PasswordWith;Special#Characters
    "});
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let conf = result.unwrap();
    assert_eq!(conf.bool(None, "bVal1"), Some(true));
    assert_eq!(conf.i32(Some("Section1"), "iVal2"), Some(42));
    assert_eq!(
        conf.string(Some("Section1"), "sVal3"),
        Some("mySecure123PasswordWith;Special#Characters".to_string())
    );
}

#[test]
fn failed_parse() {
    let result = Ini::load_from_str(indoc! {"
        [Section
        = broken
    "});
    assert!(result.is_err());
}

#[test]
fn escape_backslashes_in_ini() {
    let result = Ini::load_from_str(&escape_windows_path_separators(indoc! {r#"
        path = C:\Users\username\Downloads
    "#}));
    assert!(result.is_ok());

    let conf = result.unwrap();
    assert_eq!(
        conf.string(None, "path").unwrap(),
        r"C:\Users\username\Downloads"
    );
}
