#![cfg(test)]

use super::*;

#[test]
fn test_convert_path_to_dos() {
    let orig_path = "/media/steamuser/Elements/SteamLibrary";
    let expected_dos_path = r"Z:\media\steamuser\Elements\SteamLibrary";
    assert_eq!(
        convert_path_to_dos(orig_path, 'Z')
            .unwrap()
            .to_string_lossy(),
        expected_dos_path
    );
}

#[test]
fn test_convert_path_to_dos_trailing_slash() {
    let orig_path = "/media/steamuser/Elements/SteamLibrary/";
    let expected_dos_path = r"Z:\media\steamuser\Elements\SteamLibrary\";
    assert_eq!(
        convert_path_to_dos(orig_path, 'Z')
            .unwrap()
            .to_string_lossy(),
        expected_dos_path
    );
}
