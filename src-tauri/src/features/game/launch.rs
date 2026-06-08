use std::io;
use std::path::PathBuf;

use duct;
use tap::TapFallible;

use crate::features::stores::profiles::models::{enums::LaunchOption, json::Profile};
use crate::utils::open::open_path;

pub fn launch_game(profile: Profile) -> io::Result<()> {
    match profile.launch_option {
        LaunchOption::OpenURL => {
            log::trace!("Launching game (\"OpenURL\"): {:?}", profile.launcher_url);
            open_path(&profile.launcher_url)
                .tap_err(|e| log::error!("Error when launching game (\"OpenURL\"): {e:?}"))?;
        }
        LaunchOption::RunExec => {
            let path = PathBuf::from(profile.installation_path).join(profile.executable_name);
            let args = profile.exec_parameters.split(" "); // TODO: Do proper splitting taking `"` quotes into account. (perhaps with shlex parse?)
            let cmd = duct::cmd(path, args);
            log::trace!("Launching game (\"RunExec\"): {:?}", cmd);
            cmd.start()
                .tap_err(|e| log::error!("Error when launching game (\"RunExec\"): {e:?}"))?;
        }
    };
    Ok(())
}
