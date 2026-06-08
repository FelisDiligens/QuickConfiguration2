#![cfg(test)]

use crate::features::nexusmods::models::json::Membership;

use super::*;

use indoc::indoc;
use wiremock::{
    Mock, MockServer, ResponseTemplate,
    matchers::{method, path},
};

#[tokio::test]
async fn test_validate() {
    let mock_server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/v1/users/validate.json"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_string(indoc! {r#"
                    {
                        "user_id": 12345678,
                        "key": "apikey",
                        "name": "username",
                        "is_premium?": true,
                        "is_supporter?": true,
                        "email": "username@email.com",
                        "profile_url": "https://avatars.nexusmods.com/12345678/100",
                        "is_supporter": true,
                        "is_premium": true
                    }
                "#})
                .append_headers(vec![
                    ("x-rl-daily-limit", "20000"),
                    ("x-rl-daily-remaining", "500"),
                    ("x-rl-daily-reset", "2026-03-14 18:39:03 +0000"),
                    ("x-rl-hourly-limit", "20000"),
                    ("x-rl-hourly-remaining", "500"),
                    ("x-rl-hourly-reset", "2026-03-13 19:00:00 +0000"),
                ]),
        )
        .mount(&mock_server)
        .await;

    let info = NexusModsAPI::new("apikey")
        .with_host(mock_server.uri())
        .validate()
        .await
        .unwrap();

    assert_eq!(info.profile.api_key, "apikey");
    assert_eq!(info.profile.name, "username");
    assert_eq!(info.profile.email, "username@email.com");
    assert_eq!(info.profile.membership, Membership::Premium);
    assert_eq!(
        info.profile.profile_url,
        "https://avatars.nexusmods.com/12345678/100"
    );

    assert_eq!(info.rate_limit.daily_limit, 20000);
    assert_eq!(info.rate_limit.daily_remaining, 500);
    assert_eq!(
        info.rate_limit.daily_reset,
        chrono::DateTime::parse_from_rfc3339("2026-03-14T18:39:03Z").unwrap()
    );
    assert_eq!(info.rate_limit.hourly_limit, 20000);
    assert_eq!(info.rate_limit.hourly_remaining, 500);
    assert_eq!(
        info.rate_limit.hourly_reset,
        chrono::DateTime::parse_from_rfc3339("2026-03-13T19:00:00Z").unwrap()
    );
}
