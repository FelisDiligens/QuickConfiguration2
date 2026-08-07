use std::io;
use std::os::windows::process::CommandExt;

/// "The process is a console application that is being run without a console window."
/// https://learn.microsoft.com/en-us/windows/win32/procthread/process-creation-flags
const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn create_no_window(cmd: &mut std::process::Command) -> Result<(), io::Error> {
    cmd.creation_flags(CREATE_NO_WINDOW);
    Ok(())
}
