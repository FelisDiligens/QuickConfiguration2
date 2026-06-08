; https://github.com/tauri-apps/tauri/blob/dev/crates/tauri-bundler/src/bundle/windows/nsis/installer.nsi
!macro NSIS_HOOK_POSTUNINSTALL
  ; Delete the config folder if the checkbox is checked
  ${If} $DeleteAppDataCheckboxState = ${BST_CHECKED}
    SetShellVarContext current
    RmDir /r "$LOCALAPPDATA\Fallout 76 Quick Configuration"
  ${EndIf}
!macroend