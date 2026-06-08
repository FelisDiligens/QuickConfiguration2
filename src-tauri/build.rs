fn main() {
    // Expose some values of `tauri.conf.json`, so they can be consumed with `env!`:
    let tauri_conf =
        std::fs::read_to_string("tauri.conf.json").expect("Failed to read tauri.conf.json");
    let tauri_conf: serde_json::Value =
        serde_json::from_str(&tauri_conf).expect("Failed to parse tauri.conf.json");

    let product_name = tauri_conf["productName"]
        .as_str()
        .expect("productName not set in tauri.conf.json");
    println!("cargo:rustc-env=TAURI_APP_PRODUCT_NAME={}", product_name);

    let identifier = tauri_conf["identifier"]
        .as_str()
        .expect("identifier not set in tauri.conf.json");
    println!("cargo:rustc-env=TAURI_APP_IDENTIFIER={}", identifier);

    tauri_build::build()
}
