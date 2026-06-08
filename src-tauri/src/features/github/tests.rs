#![cfg(test)]

use super::models::{
    Commit, RateLimitResponse, Release, RepositoryContents, RepositoryContentsType,
};

use indoc::indoc;

#[test]
fn test_rate_limit_response_json_load() {
    let test_str = indoc! {r#"
        {
          "resources": {
            "code_search": {
              "limit": 60,
              "remaining": 60,
              "reset": 1779539196,
              "used": 0,
              "resource": "code_search"
            },
            "core": {
              "limit": 60,
              "remaining": 60,
              "reset": 1779539196,
              "used": 0,
              "resource": "core"
            },
            "graphql": {
              "limit": 0,
              "remaining": 0,
              "reset": 1779539196,
              "used": 0,
              "resource": "graphql"
            },
            "integration_manifest": {
              "limit": 5000,
              "remaining": 5000,
              "reset": 1779539196,
              "used": 0,
              "resource": "integration_manifest"
            },
            "search": {
              "limit": 10,
              "remaining": 10,
              "reset": 1779535656,
              "used": 0,
              "resource": "search"
            }
          },
          "rate": {
            "limit": 60,
            "remaining": 60,
            "reset": 1779539196,
            "used": 0,
            "resource": "core"
          }
        }
    "#};

    let result: Result<RateLimitResponse, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let rate_limit_response: RateLimitResponse = result.unwrap();

    // Check core rate limit
    let core = &rate_limit_response.resources.core;
    assert_eq!(core.limit, 60);
    assert_eq!(core.remaining, 60);
    assert_eq!(core.reset, 1779539196);
    assert_eq!(core.used, 0);

    // Check other resources exist
    assert_eq!(
        rate_limit_response
            .resources
            .code_search
            .as_ref()
            .unwrap()
            .limit,
        60
    );
    assert_eq!(
        rate_limit_response
            .resources
            .graphql
            .as_ref()
            .unwrap()
            .limit,
        0
    );
    assert_eq!(
        rate_limit_response
            .resources
            .integration_manifest
            .as_ref()
            .unwrap()
            .limit,
        5000
    );
    assert_eq!(
        rate_limit_response.resources.search.as_ref().unwrap().limit,
        10
    );

    // Check rate field
    assert_eq!(rate_limit_response.rate.limit, 60);
    assert_eq!(rate_limit_response.rate.remaining, 60);
    assert_eq!(rate_limit_response.rate.reset, 1779539196);
    assert_eq!(rate_limit_response.rate.used, 0);
}

#[test]
fn test_latest_release_response_json_load() {
    let test_str = indoc! {r#"
      {
        "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/233771006",
        "assets_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/233771006/assets",
        "upload_url": "https://uploads.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/233771006/assets{?name,label}",
        "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/tag/v1.12.9",
        "id": 233771006,
        "author": {
          "login": "FelisDiligens",
          "id": 47528453,
          "node_id": "MDQ6VXNlcjQ3NTI4NDUz",
          "avatar_url": "https://avatars.githubusercontent.com/u/47528453?v=4",
          "gravatar_id": "",
          "url": "https://api.github.com/users/FelisDiligens",
          "html_url": "https://github.com/FelisDiligens",
          "followers_url": "https://api.github.com/users/FelisDiligens/followers",
          "following_url": "https://api.github.com/users/FelisDiligens/following{/other_user}",
          "gists_url": "https://api.github.com/users/FelisDiligens/gists{/gist_id}",
          "starred_url": "https://api.github.com/users/FelisDiligens/starred{/owner}{/repo}",
          "subscriptions_url": "https://api.github.com/users/FelisDiligens/subscriptions",
          "organizations_url": "https://api.github.com/users/FelisDiligens/orgs",
          "repos_url": "https://api.github.com/users/FelisDiligens/repos",
          "events_url": "https://api.github.com/users/FelisDiligens/events{/privacy}",
          "received_events_url": "https://api.github.com/users/FelisDiligens/received_events",
          "type": "User",
          "user_view_type": "public",
          "site_admin": false
        },
        "node_id": "RE_kwDOD2ZFrs4N7w_-",
        "tag_name": "v1.12.9",
        "target_commitish": "master",
        "name": "v1.12.9",
        "draft": false,
        "immutable": false,
        "prerelease": false,
        "created_at": "2025-07-20T19:44:04Z",
        "updated_at": "2025-07-20T19:46:36Z",
        "published_at": "2025-07-20T19:46:36Z",
        "assets": [
          {
            "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/assets/274683353",
            "id": 274683353,
            "node_id": "RA_kwDOD2ZFrs4QX1XZ",
            "name": "Setup_v1.12.9.exe",
            "label": null,
            "uploader": {
              "login": "FelisDiligens",
              "id": 47528453,
              "node_id": "MDQ6VXNlcjQ3NTI4NDUz",
              "avatar_url": "https://avatars.githubusercontent.com/u/47528453?v=4",
              "gravatar_id": "",
              "url": "https://api.github.com/users/FelisDiligens",
              "html_url": "https://github.com/FelisDiligens",
              "followers_url": "https://api.github.com/users/FelisDiligens/followers",
              "following_url": "https://api.github.com/users/FelisDiligens/following{/other_user}",
              "gists_url": "https://api.github.com/users/FelisDiligens/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/FelisDiligens/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/FelisDiligens/subscriptions",
              "organizations_url": "https://api.github.com/users/FelisDiligens/orgs",
              "repos_url": "https://api.github.com/users/FelisDiligens/repos",
              "events_url": "https://api.github.com/users/FelisDiligens/events{/privacy}",
              "received_events_url": "https://api.github.com/users/FelisDiligens/received_events",
              "type": "User",
              "user_view_type": "public",
              "site_admin": false
            },
            "content_type": "application/x-msdownload",
            "state": "uploaded",
            "size": 18830734,
            "digest": "sha256:e1e6aaeb250736186ae96bc4a3f5a67ab2aaa137834f5a96f903ad8f2e0c2011",
            "download_count": 1985,
            "created_at": "2025-07-20T19:45:16Z",
            "updated_at": "2025-07-20T19:45:21Z",
            "browser_download_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/Setup_v1.12.9.exe"
          },
          {
            "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/assets/274683361",
            "id": 274683361,
            "node_id": "RA_kwDOD2ZFrs4QX1Xh",
            "name": "v1.12.9.zip",
            "label": null,
            "uploader": {
              "login": "FelisDiligens",
              "id": 47528453,
              "node_id": "MDQ6VXNlcjQ3NTI4NDUz",
              "avatar_url": "https://avatars.githubusercontent.com/u/47528453?v=4",
              "gravatar_id": "",
              "url": "https://api.github.com/users/FelisDiligens",
              "html_url": "https://github.com/FelisDiligens",
              "followers_url": "https://api.github.com/users/FelisDiligens/followers",
              "following_url": "https://api.github.com/users/FelisDiligens/following{/other_user}",
              "gists_url": "https://api.github.com/users/FelisDiligens/gists{/gist_id}",
              "starred_url": "https://api.github.com/users/FelisDiligens/starred{/owner}{/repo}",
              "subscriptions_url": "https://api.github.com/users/FelisDiligens/subscriptions",
              "organizations_url": "https://api.github.com/users/FelisDiligens/orgs",
              "repos_url": "https://api.github.com/users/FelisDiligens/repos",
              "events_url": "https://api.github.com/users/FelisDiligens/events{/privacy}",
              "received_events_url": "https://api.github.com/users/FelisDiligens/received_events",
              "type": "User",
              "user_view_type": "public",
              "site_admin": false
            },
            "content_type": "application/x-zip-compressed",
            "state": "uploaded",
            "size": 21992914,
            "digest": "sha256:96136360450148f6f62d0a68b0f342d2b4f7e8ae05b2c24f9f2f4ef2fdf03823",
            "download_count": 15921,
            "created_at": "2025-07-20T19:45:21Z",
            "updated_at": "2025-07-20T19:45:27Z",
            "browser_download_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/v1.12.9.zip"
          }
        ],
        "tarball_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/tarball/v1.12.9",
        "zipball_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/zipball/v1.12.9",
        "body": "Added/fixed a few tweaks and fixed the NexusMods profile picture not loading in.\r\n\r\n- Added new tweaks\r\n  - Added \"Quick Heal Stimpak Priority\" dropdown to \"General\" tab\r\n  - Added \"Toggle Aim\" checkbox to \"Controls\" tab\r\n  - Added \"Viewmodel FOV\" slider (with screenshots) to \"Camera\" tab\r\n- Fixed the \"Skip splash screen with news on startup\" tweak\r\n- Fixed small oversights in new tweaks from v1.12.8\r\n- Fixed the NexusMods profile picture not loading anymore\r\n- Resized NexusMods profile picture from 128px down to 100px to match image resolution\r\n- Added dependency to Magick.NET image library for conversion of image formats\r\n\r\n---\r\n\r\n<p>\r\n    <img src=\"https://img.shields.io/badge/-Download:-222222?style=for-the-badge\" style=\"cursor: default\"/>\r\n    <a href=\"https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/Setup_v1.12.9.exe\">\r\n        <img src=\"https://img.shields.io/badge/-Setup *.exe-2981ff?style=for-the-badge\"/>\r\n    </a>\r\n    <a href=\"https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/v1.12.9.zip\">\r\n        <img src=\"https://img.shields.io/badge/-Portable *.zip-2981ff?style=for-the-badge\"/>\r\n    </a>\r\n</p>",
        "reactions": {
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/releases/233771006/reactions",
          "total_count": 1,
          "+1": 0,
          "-1": 0,
          "laugh": 0,
          "hooray": 0,
          "confused": 0,
          "heart": 1,
          "rocket": 0,
          "eyes": 0
        }
      }
    "#};

    let result: Result<Release, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let release: Release = result.unwrap();

    // Check basic release info
    assert_eq!(release.id, 233771006);
    assert_eq!(release.tag_name, "v1.12.9");
    assert_eq!(release.name, Some("v1.12.9".to_string()));
    assert_eq!(release.prerelease, false);
    assert_eq!(release.draft, false);

    // Check author
    assert_eq!(release.author.login, "FelisDiligens");
    assert_eq!(release.author.id, 47528453);

    // Check assets
    assert_eq!(release.assets.len(), 2);

    let first_asset = &release.assets[0];
    assert_eq!(first_asset.name, "Setup_v1.12.9.exe");
    assert_eq!(first_asset.content_type, "application/x-msdownload");
    assert_eq!(
        first_asset.browser_download_url,
        "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/Setup_v1.12.9.exe"
    );
    assert_eq!(first_asset.size, 18830734);

    let second_asset = &release.assets[1];
    assert_eq!(second_asset.name, "v1.12.9.zip");
    assert_eq!(second_asset.content_type, "application/x-zip-compressed");
    assert_eq!(
        second_asset.browser_download_url,
        "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/releases/download/v1.12.9/v1.12.9.zip"
    );
    assert_eq!(second_asset.size, 21992914);
}

#[test]
fn test_commits_response_json_load() {
    let test_str = indoc! {r#"
      [
        {
          "sha": "a4ab564a67a89e19f86a68562fcb68a35f34b2c4",
          "node_id": "C_kwDOD2ZFrtoAKGE0YWI1NjRhNjdhODllMTlmODZhNjg1NjJmY2I2OGEzNWYzNGIyYzQ",
          "commit": {
            "author": {
              "name": "FelisDiligens",
              "email": "47528453+FelisDiligens@users.noreply.github.com",
              "date": "2025-12-19T12:29:31Z"
            },
            "committer": {
              "name": "FelisDiligens",
              "email": "47528453+FelisDiligens@users.noreply.github.com",
              "date": "2025-12-19T12:29:31Z"
            },
            "message": "Added Ukrainian translation by EzioBugmaker",
            "tree": {
              "sha": "6b116e76c5938a81d70c492a1fbff02ddd56a166",
              "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/trees/6b116e76c5938a81d70c492a1fbff02ddd56a166"
            },
            "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/commits/a4ab564a67a89e19f86a68562fcb68a35f34b2c4",
            "comment_count": 0,
            "verification": {
              "verified": false,
              "reason": "unsigned",
              "signature": null,
              "payload": null,
              "verified_at": null
            }
          },
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/a4ab564a67a89e19f86a68562fcb68a35f34b2c4",
          "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/commit/a4ab564a67a89e19f86a68562fcb68a35f34b2c4",
          "comments_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/a4ab564a67a89e19f86a68562fcb68a35f34b2c4/comments",
          "author": {
            "login": "FelisDiligens",
            "id": 47528453,
            "node_id": "MDQ6VXNlcjQ3NTI4NDUz",
            "avatar_url": "https://avatars.githubusercontent.com/u/47528453?v=4",
            "gravatar_id": "",
            "url": "https://api.github.com/users/FelisDiligens",
            "html_url": "https://github.com/FelisDiligens",
            "followers_url": "https://api.github.com/users/FelisDiligens/followers",
            "following_url": "https://api.github.com/users/FelisDiligens/following{/other_user}",
            "gists_url": "https://api.github.com/users/FelisDiligens/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/FelisDiligens/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/FelisDiligens/subscriptions",
            "organizations_url": "https://api.github.com/users/FelisDiligens/orgs",
            "repos_url": "https://api.github.com/users/FelisDiligens/repos",
            "events_url": "https://api.github.com/users/FelisDiligens/events{/privacy}",
            "received_events_url": "https://api.github.com/users/FelisDiligens/received_events",
            "type": "User",
            "user_view_type": "public",
            "site_admin": false
          },
          "committer": {
            "login": "FelisDiligens",
            "id": 47528453,
            "node_id": "MDQ6VXNlcjQ3NTI4NDUz",
            "avatar_url": "https://avatars.githubusercontent.com/u/47528453?v=4",
            "gravatar_id": "",
            "url": "https://api.github.com/users/FelisDiligens",
            "html_url": "https://github.com/FelisDiligens",
            "followers_url": "https://api.github.com/users/FelisDiligens/followers",
            "following_url": "https://api.github.com/users/FelisDiligens/following{/other_user}",
            "gists_url": "https://api.github.com/users/FelisDiligens/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/FelisDiligens/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/FelisDiligens/subscriptions",
            "organizations_url": "https://api.github.com/users/FelisDiligens/orgs",
            "repos_url": "https://api.github.com/users/FelisDiligens/repos",
            "events_url": "https://api.github.com/users/FelisDiligens/events{/privacy}",
            "received_events_url": "https://api.github.com/users/FelisDiligens/received_events",
            "type": "User",
            "user_view_type": "public",
            "site_admin": false
          },
          "parents": [
            {
              "sha": "85d48ffcbd6761bc832f07857a0900e7c885a276",
              "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/85d48ffcbd6761bc832f07857a0900e7c885a276",
              "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/commit/85d48ffcbd6761bc832f07857a0900e7c885a276"
            }
          ]
        },
        {
          "sha": "85d48ffcbd6761bc832f07857a0900e7c885a276",
          "node_id": "C_kwDOD2ZFrtoAKDg1ZDQ4ZmZjYmQ2NzYxYmM4MzJmMDc4NTdhMDkwMGU3Yzg4NWEyNzY",
          "commit": {
            "author": {
              "name": "Redacted",
              "email": "redacted@email.com",
              "date": "2025-07-22T01:21:37Z"
            },
            "committer": {
              "name": "GitHub",
              "email": "noreply@github.com",
              "date": "2025-07-22T01:21:37Z"
            },
            "message": "Russian language updated for 1.12.9",
            "tree": {
              "sha": "dbdde9313c84cf07b75ee75e7d9b689859dbdc2a",
              "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/trees/dbdde9313c84cf07b75ee75e7d9b689859dbdc2a"
            },
            "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/commits/85d48ffcbd6761bc832f07857a0900e7c885a276",
            "comment_count": 0,
            "verification": {
              "verified": true,
              "reason": "valid",
              "signature": "-----BEGIN PGP SIGNATURE-----\n\nwsFcBAABCAAQBQJofueiCRC1aQ7uu5UhlAAAhwYQAJpW7fgxaELQM4xrY8iLFM6g\nkHTWbsaJKtlx2ERK8Tot968Hnt0i6itlllyYSbG/NIkhL6CPzB2gp26eMo4W+LQe\nZc0T8gMlZFtYFBjZTog7QBnn/vuskUuwDgg3pzB4Swv7NDKkW7/Z/YAPigGn6t3d\n+7J8Vex/WTLBEGoNGQ6iwqHEbGeEa/qBjpVU/kvLE6kGzf0uEvNOlv/mpiaCG0ZJ\nril9fEYOqJWvnj+a3YJIbEqyVc/GcICsBNPMGsdFRUCHHRVd96uYgqmSv4h84SLV\nbq6FTUVeDkkMZeGLKOFaGZLrAGCXHPPmvdBiro5sVOkO/Te7D2YWs0Vs8WLJQDP3\n6tTac8FN2H4kGT2ygeekmDQV19tmQwW6ZwT9wImdpc5KjURda17K0I1uj963QdFP\nf0s9opAu89Lh7D9DJATjbgQHZra9pDnh6JrN+qXyF99XfLlRVM4C2KP//LOA3uC/\n4T8zE3PlI2l+4/bVNFtRwKY7F7bTclHOg+ghwqDPdG7EqbIu9VqIlDBiObYXKsEe\n1F/IJV9MCw+XIc6uuBSnwR9+XB+/Ekmi6zFIhOLVQU2wLyUE8VqPydkaI0Zpv4MJ\nEMQMF3uL657iL8uQFMeHRiuhf5GPVSfu0YPSKR9b99lC6boLrBlQqPAnQUAVnyy3\nzmf19l9NaqTOQjtO5Q+y\n=3Bu6\n-----END PGP SIGNATURE-----\n",
              "payload": "tree dbdde9313c84cf07b75ee75e7d9b689859dbdc2a\nparent 2fe304c9eec0e08e939319fb2adfbce905e93846\nauthor Sergey <sondju@ya.ru> 1753147297 +0700\ncommitter GitHub <noreply@github.com> 1753147297 +0700\n\nRussian language updated for 1.12.9",
              "verified_at": "2025-07-22T01:21:38Z"
            }
          },
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/85d48ffcbd6761bc832f07857a0900e7c885a276",
          "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/commit/85d48ffcbd6761bc832f07857a0900e7c885a276",
          "comments_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/85d48ffcbd6761bc832f07857a0900e7c885a276/comments",
          "author": {
            "login": "Sondju",
            "id": 6428387,
            "node_id": "MDQ6VXNlcjY0MjgzODc=",
            "avatar_url": "https://avatars.githubusercontent.com/u/6428387?v=4",
            "gravatar_id": "",
            "url": "https://api.github.com/users/Sondju",
            "html_url": "https://github.com/Sondju",
            "followers_url": "https://api.github.com/users/Sondju/followers",
            "following_url": "https://api.github.com/users/Sondju/following{/other_user}",
            "gists_url": "https://api.github.com/users/Sondju/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/Sondju/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/Sondju/subscriptions",
            "organizations_url": "https://api.github.com/users/Sondju/orgs",
            "repos_url": "https://api.github.com/users/Sondju/repos",
            "events_url": "https://api.github.com/users/Sondju/events{/privacy}",
            "received_events_url": "https://api.github.com/users/Sondju/received_events",
            "type": "User",
            "user_view_type": "public",
            "site_admin": false
          },
          "committer": {
            "login": "web-flow",
            "id": 19864447,
            "node_id": "MDQ6VXNlcjE5ODY0NDQ3",
            "avatar_url": "https://avatars.githubusercontent.com/u/19864447?v=4",
            "gravatar_id": "",
            "url": "https://api.github.com/users/web-flow",
            "html_url": "https://github.com/web-flow",
            "followers_url": "https://api.github.com/users/web-flow/followers",
            "following_url": "https://api.github.com/users/web-flow/following{/other_user}",
            "gists_url": "https://api.github.com/users/web-flow/gists{/gist_id}",
            "starred_url": "https://api.github.com/users/web-flow/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/web-flow/subscriptions",
            "organizations_url": "https://api.github.com/users/web-flow/orgs",
            "repos_url": "https://api.github.com/users/web-flow/repos",
            "events_url": "https://api.github.com/users/web-flow/events{/privacy}",
            "received_events_url": "https://api.github.com/users/web-flow/received_events",
            "type": "User",
            "user_view_type": "public",
            "site_admin": false
          },
          "parents": [
            {
              "sha": "2fe304c9eec0e08e939319fb2adfbce905e93846",
              "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/commits/2fe304c9eec0e08e939319fb2adfbce905e93846",
              "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/commit/2fe304c9eec0e08e939319fb2adfbce905e93846"
            }
          ]
        }
      ]
    "#};

    let result: Result<Vec<Commit>, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let commits: Vec<Commit> = result.unwrap();
    assert_eq!(commits.len(), 2);

    // Check first commit
    let first_commit = &commits[0];
    assert_eq!(first_commit.sha, "a4ab564a67a89e19f86a68562fcb68a35f34b2c4");
    assert_eq!(
        first_commit.commit.message,
        "Added Ukrainian translation by EzioBugmaker"
    );

    // Check commit author/committer dates
    let committer = first_commit.commit.committer.as_ref().unwrap();
    assert_eq!(committer.name, "FelisDiligens");
    assert_eq!(
        committer.email,
        "47528453+FelisDiligens@users.noreply.github.com"
    );
    assert_eq!(committer.date, "2025-12-19T12:29:31Z");

    // Check second commit
    let second_commit = &commits[1];
    assert_eq!(
        second_commit.sha,
        "85d48ffcbd6761bc832f07857a0900e7c885a276"
    );
    assert_eq!(
        second_commit.commit.message,
        "Russian language updated for 1.12.9"
    );

    // Check second commit author
    let author = second_commit.commit.author.as_ref().unwrap();
    assert_eq!(author.name, "Redacted");
    assert_eq!(author.email, "redacted@email.com");
    assert_eq!(author.date, "2025-07-22T01:21:37Z");

    // Check second commit committer (GitHub)
    let committer = second_commit.commit.committer.as_ref().unwrap();
    assert_eq!(committer.name, "GitHub");
    assert_eq!(committer.email, "noreply@github.com");
}

#[test]
fn test_repository_contents_response_json_load() {
    let test_str = indoc! {r#"
      [
        {
          "name": "comment.txt",
          "path": "Fo76ini/languages/comment.txt",
          "sha": "f98a9d604ec07fe17f67f8770a5563bb8101f08e",
          "size": 229,
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages/comment.txt?ref=master",
          "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/comment.txt",
          "git_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/blobs/f98a9d604ec07fe17f67f8770a5563bb8101f08e",
          "download_url": "https://raw.githubusercontent.com/FelisDiligens/Fallout76-QuickConfiguration/master/Fo76ini/languages/comment.txt",
          "type": "file",
          "_links": {
            "self": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages/comment.txt?ref=master",
            "git": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/blobs/f98a9d604ec07fe17f67f8770a5563bb8101f08e",
            "html": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/comment.txt"
          }
        },
        {
          "name": "de-DE.xml",
          "path": "Fo76ini/languages/de-DE.xml",
          "sha": "4183cfdc21d038959337a858623fec4d4aafe3a5",
          "size": 87469,
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages/de-DE.xml?ref=master",
          "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/de-DE.xml",
          "git_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/blobs/4183cfdc21d038959337a858623fec4d4aafe3a5",
          "download_url": "https://raw.githubusercontent.com/FelisDiligens/Fallout76-QuickConfiguration/master/Fo76ini/languages/de-DE.xml",
          "type": "file",
          "_links": {
            "self": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages/de-DE.xml?ref=master",
            "git": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/blobs/4183cfdc21d038959337a858623fec4d4aafe3a5",
            "html": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/de-DE.xml"
          }
        },
        {
          "name": "languages",
          "path": "Fo76ini/languages",
          "sha": "aa8c803e09a00943f96c05a1c1fdc002624dba73",
          "size": 0,
          "url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages?ref=master",
          "html_url": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/tree/master/Fo76ini/languages",
          "git_url": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/trees/aa8c803e09a00943f96c05a1c1fdc002624dba73",
          "download_url": null,
          "type": "dir",
          "_links": {
            "self": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/contents/Fo76ini/languages?ref=master",
            "git": "https://api.github.com/repos/FelisDiligens/Fallout76-QuickConfiguration/git/trees/aa8c803e09a00943f96c05a1c1fdc002624dba73",
            "html": "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/tree/master/Fo76ini/languages"
          }
        }
      ]
    "#};

    let result: Result<Vec<RepositoryContents>, serde_json::Error> = serde_json::from_str(test_str);
    assert!(result.is_ok(), "{}", result.unwrap_err());

    let contents: Vec<RepositoryContents> = result.unwrap();
    assert_eq!(contents.len(), 3);

    let first = &contents[0];
    assert_eq!(first.name, "comment.txt");
    assert_eq!(first.path, "Fo76ini/languages/comment.txt");
    assert_eq!(first.sha, "f98a9d604ec07fe17f67f8770a5563bb8101f08e");
    assert_eq!(first.size, 229);
    assert_eq!(
        first.html_url,
        "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/comment.txt"
    );
    assert_eq!(
        first.download_url,
        Some("https://raw.githubusercontent.com/FelisDiligens/Fallout76-QuickConfiguration/master/Fo76ini/languages/comment.txt".to_string())
    );
    assert_eq!(first.r#type, RepositoryContentsType::File);

    let second = &contents[1];
    assert_eq!(second.name, "de-DE.xml");
    assert_eq!(second.path, "Fo76ini/languages/de-DE.xml");
    assert_eq!(second.sha, "4183cfdc21d038959337a858623fec4d4aafe3a5");
    assert_eq!(second.size, 87469);
    assert_eq!(
        second.html_url,
        "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/blob/master/Fo76ini/languages/de-DE.xml"
    );
    assert_eq!(
        second.download_url,
        Some("https://raw.githubusercontent.com/FelisDiligens/Fallout76-QuickConfiguration/master/Fo76ini/languages/de-DE.xml".to_string())
    );
    assert_eq!(second.r#type, RepositoryContentsType::File);

    let third = &contents[2];
    assert_eq!(third.name, "languages");
    assert_eq!(third.path, "Fo76ini/languages");
    assert_eq!(third.sha, "aa8c803e09a00943f96c05a1c1fdc002624dba73");
    assert_eq!(third.size, 0);
    assert_eq!(
        third.html_url,
        "https://github.com/FelisDiligens/Fallout76-QuickConfiguration/tree/master/Fo76ini/languages"
    );
    assert_eq!(third.download_url, None);
    assert_eq!(third.r#type, RepositoryContentsType::Dir);
}
