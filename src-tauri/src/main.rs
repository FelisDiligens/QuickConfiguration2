// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tap::TapFallible;
use tauri::{Emitter, Manager};
use tauri_specta::{ErrorHandlingMode, collect_commands, collect_events};

use crate::commands::nxm::{NXM_NEW_LINK_EVENT, NXMNewLink};
use crate::features::args::Arguments;
use crate::features::stores::ini::IniFiles;
use crate::utils::paths::get_logs_path;

pub mod commands;
pub mod features;
pub mod info;
pub mod utils;

fn main() {
    let builder = tauri_specta::Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            commands::is_debug,
            commands::is_prerelease,
            commands::open::open_special_path,
            commands::open::open_path_in_file_explorer,
            commands::open::open_log_file,
            commands::paths::is_file,
            commands::paths::is_directory,
            commands::paths::get_file_size,
            commands::paths::path_strip_prefix,
            commands::paths::detect_ini_path,
            commands::paths::detect_ini_prefix,
            commands::paths::detect_game_path,
            commands::paths::validate_game_path,
            commands::paths::get_config_path,
            commands::screenshots::get_screenshots,
            commands::settings::get_settings,
            commands::settings::save_settings,
            commands::profiles::get_profiles,
            commands::profiles::save_profiles,
            commands::game::launch_game,
            commands::ini::ini_load,
            commands::ini::ini_save,
            commands::ini::ini_create_files,
            commands::ini::ini_get_error_context,
            commands::ini::ini_get_string,
            commands::ini::ini_set_string,
            commands::ini::ini_get_int,
            commands::ini::ini_set_int,
            commands::ini::ini_get_float,
            commands::ini::ini_set_float,
            commands::ini::ini_get_boolean,
            commands::ini::ini_set_boolean,
            commands::ini::ini_delete_key,
            commands::ini::ini_has_key,
            commands::nexusmods::nexusmods_api_validate,
            commands::nexusmods::nexusmods_api_retrieve_modinfo,
            commands::nexusmods::nexusmods_api_endorse,
            commands::nexusmods::nexusmods_api_abstain,
            commands::nexusmods::nexusmods_api_list_mod_files,
            commands::nexusmods::nexusmods_api_request_download_links,
            commands::nexusmods::nexusmods_get_account_info,
            commands::nexusmods::nexusmods_set_account_info,
            commands::nexusmods::nexusmods_delete_account_info,
            commands::nexusmods::nexusmods_get_modinfos,
            commands::nexusmods::nexusmods_set_modinfos,
            commands::nexusmods::nexusmods_login_via_sso,
            commands::nexusmods::nexusmods_extract_ids_from_url,
            commands::nexusmods::nexusmods_extract_details_from_nxm_url,
            commands::mods::mods_load_metadata,
            commands::mods::mods_load_metadata_or_default,
            commands::mods::mods_save_metadata,
            commands::mods::mods_create_temp_folder_from_files_or_folders,
            commands::mods::mods_create_temp_folder_from_file_or_archive,
            commands::mods::mods_create_temp_folder_from_folder_contents,
            commands::mods::mods_delete_temp_folder,
            commands::mods::mods_install_from_temp_folder,
            commands::mods::mods_install_from_existing_archives,
            commands::mods::mods_list_temp_folder_contents,
            commands::mods::mods_uninstall_mod,
            commands::mods::mods_deploy,
            commands::mods::mods_rename_mod_folder,
            commands::mods::mods_uncheck_unneeded_entries,
            commands::mods::mods_detect_root_folder,
            commands::mods::mods_diagnose_issues,
            commands::mods::mods_detect_migration_state,
            commands::mods::mods_migrate_legacy_managed_mods,
            commands::mods::mods_remove_legacy_managed_mods,
            commands::mods::mods_utils_pack_ba2_archives,
            commands::mods::mods_utils_get_conflicting_files,
            commands::mods::mods_utils_get_deployed_archives,
            commands::resourcelists::resourcelist_load_from_ini,
            commands::resourcelists::resourcelist_save_to_ini,
            commands::resourcelists::resourcelist_load_from_text_file,
            commands::resourcelists::resourcelist_save_to_text_file,
            commands::resourcelists::resourcelist_get_unlisted_archives,
            commands::resourcelists::resourcelist_add_unlisted_archives,
            commands::resourcelists::resourcelist_remove_non_existant_archives,
            commands::archive2::archive2_open_program,
            commands::archive2::archive2_explore_archive,
            commands::archive2::archive2_extract_archive,
            commands::archive2::archive2_create_archive,
            commands::archive2::archive2_read_archive,
            commands::nxm::nxm_get_current,
            commands::nxm::nxm_register,
            commands::nxm::nxm_unregister,
            commands::nxm::nxm_is_registered,
            commands::translations::get_translations,
            commands::translations::save_translation,
            commands::translations::load_translation,
            commands::translations::load_all_translations,
            commands::translations::load_translation_metadata,
            commands::translations::load_all_translation_metadata,
            commands::translations::check_for_translation_updates,
            commands::translations::download_translations,
            commands::download::download_with_progress,
        ])
        .events(collect_events![
            commands::nexusmods::SSOUpdate,
            commands::nexusmods::SSOAbort,
            commands::mods::ModsDeployProgressUpdate,
            features::mods::legacy::ModsMigrationProgress,
            commands::nxm::NXMNewLink,
            commands::download::DownloadProgress,
        ])
        // Tell Tauri Specta to prefer throwing errors in commands instead of returning a `Result<T, E>` union type:
        // (this is more in line with JavaScript's error handling)
        .error_handling(ErrorHandlingMode::Throw);

    // Check for nxm:// link in the CLI arguments:
    let args: Vec<String> = std::env::args().map(|arg| arg.to_string()).collect();

    // Export TypeScript bindings in debug mode:
    #[cfg(debug_assertions)]
    {
        // Print info:
        if std::env::args().any(|arg| arg == "--info") {
            println!("{}", crate::info::APP_NAME);
            if crate::info::is_prerelease() {
                println!("Pre-release version {}\n", crate::info::APP_VERSION);
            } else {
                println!("Version {}\n", crate::info::APP_VERSION);
            }
            println!(
                "Build config: {}",
                if crate::info::is_debug() {
                    "Debug"
                } else {
                    "Release"
                }
            );
            println!("OS name:      {}", std::env::consts::OS);
            println!("Product name: {}", crate::info::TAURI_APP_PRODUCT_NAME);
            println!("Identifier:   {}", crate::info::TAURI_APP_IDENTIFIER);
            println!("API Slug:     {}", crate::info::NEXUSMODS_API_SLUG);
            println!("User Agent:   {}", crate::info::user_agent());
            return;
        }

        // If the app was opened with an nxm link, don't export bindings. Otherwise the page reloads.
        let nxm_link = commands::nxm::get_url_from_args(args.iter());
        if nxm_link.is_none() {
            export_bindings(&builder);

            // If we only want to export bindings, then just return here:
            if std::env::args().any(|arg| arg == "--export-bindings") {
                return;
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(move |app, args, cwd| {
            log::trace!(
                "A second instance was opened\nwith arguments: {}\nwith working directory: {}",
                args.join(" "),
                cwd
            );

            // Focus window of the running instance when user tries to open a new instance:
            if let Some(window) = app.get_webview_window("main") {
                log::trace!("Focusing app window");
                let _ = window
                    .set_focus()
                    .tap_err(|e| println!("Could not focus window: {e:?}"));
            }

            // Emit new url event when nxm:// link was passed as an argument:
            let nxm_link = commands::nxm::get_url_from_args(args.iter());
            if let Some(ref url) = nxm_link {
                log::trace!("Sending nxm link event: {url}");
                let _ = app
                    .emit(NXM_NEW_LINK_EVENT, NXMNewLink(url.to_string()))
                    .tap_err(|e| println!("Could not emit nxm link event: {e:?}"));
            }
        }))
        .plugin(build_log_plugin())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .manage(IniFiles::default())
        .manage(Arguments(args))
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            log::info!(
                "Starting {} {} on {}{}",
                crate::info::APP_NAME,
                crate::info::APP_VERSION,
                std::env::consts::OS,
                if crate::info::is_appimage() {
                    " (AppImage)"
                } else {
                    ""
                }
            );
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(debug_assertions)]
fn export_bindings(builder: &tauri_specta::Builder) {
    use specta_typescript::Typescript;

    let export_path =
        utils::bindings::get_export_path().expect("Failed to determine export path for bindings.");

    builder
        .export(Typescript::default(), &export_path)
        .expect("Failed to export TypeScript bindings.");

    utils::bindings::add_skip_typecheck_directives(&export_path)
        .expect("Failed to add typecheck ignore directives to bindings.");

    println!(
        "[*] Exported Typescript bindings to `{}`",
        export_path.to_string_lossy()
    );
}

fn build_log_plugin<R>() -> tauri::plugin::TauriPlugin<R>
where
    R: tauri::Runtime,
{
    let log_plugin = tauri_plugin_log::Builder::new()
        // hide dependencies that are logging lots of messages:
        .level_for(
            "tao::platform_impl::platform::event_loop::runner",
            log::LevelFilter::Error,
        )
        .level_for("tao::platform_impl::platform", log::LevelFilter::Warn)
        .level_for("tokio_tungstenite", log::LevelFilter::Debug)
        .target(tauri_plugin_log::Target::new(
            tauri_plugin_log::TargetKind::Folder {
                path: get_logs_path().expect("couldn't find logs path"),
                file_name: None,
            },
        ))
        .max_file_size(50_000 /* bytes */)
        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepSome(3))
        .format(move |out, message, record| {
            let mut target = record.target().to_string();
            if !target.starts_with("webview:")
                && let Some(file) = record.file()
                && let Some(line) = record.line()
            {
                target = format!("{target}@{file}:{line}");
            }
            out.finish(format_args!(
                "{} {:5} [{}] {}",
                chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                record.level(),
                target,
                message
            ))
        })
        .build();
    log_panics::init(); // Log panics with backtrace
    log_plugin
}
