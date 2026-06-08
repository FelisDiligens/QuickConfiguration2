use crate::features::nexusmods::nxm::parse_nxm_link;

#[test]
pub fn test_parse_nxm_link() {
    let link = "nxm://fallout76/mods/124/files/13539?key=J_5JcycEZ32XNFuKn-gcXg&expires=1779733241&user_id=41275740";
    let details = parse_nxm_link(link).unwrap();
    assert_eq!(details.game_domain, "fallout76");
    assert_eq!(details.game_scoped_id, 124);
    assert_eq!(details.file_id, 13539);
    assert_eq!(details.key, "J_5JcycEZ32XNFuKn-gcXg");
    assert_eq!(details.expires, 1779733241);
    assert_eq!(details.user_id, 41275740);
}
