use url::Url;

#[derive(Debug)]
pub struct NXMLinkDetails {
    pub game_domain: String,
    pub game_scoped_id: u64,
    pub file_id: u64,
    pub key: String,
    pub expires: u64,
    pub user_id: u64,
}

pub fn parse_nxm_link<S: AsRef<str>>(link: S) -> anyhow::Result<NXMLinkDetails> {
    let url = Url::parse(link.as_ref())?;

    let game_domain = url
        .host_str()
        .ok_or(anyhow::anyhow!("Missing host"))?
        .to_string();

    let path_segments = url
        .path_segments()
        .ok_or(anyhow::anyhow!("Missing path"))?
        .collect::<Vec<_>>();
    if path_segments.len() != 4 || path_segments[0] != "mods" || path_segments[2] != "files" {
        anyhow::bail!("Invalid NXM link path format");
    }

    let game_scoped_id = path_segments[1].parse::<u64>()?;
    let file_id = path_segments[3].parse::<u64>()?;

    let query: Vec<_> = url.query_pairs().collect();
    let key = query
        .iter()
        .find(|(k, _)| k == "key")
        .ok_or(anyhow::anyhow!("Missing key parameter"))?
        .1
        .to_string();
    let expires = query
        .iter()
        .find(|(k, _)| k == "expires")
        .ok_or(anyhow::anyhow!("Missing expires parameter"))?
        .1
        .parse::<u64>()?;
    let user_id = query
        .iter()
        .find(|(k, _)| k == "user_id")
        .ok_or(anyhow::anyhow!("Missing user_id parameter"))?
        .1
        .parse::<u64>()?;

    Ok(NXMLinkDetails {
        game_domain,
        game_scoped_id,
        file_id,
        key,
        expires,
        user_id,
    })
}
