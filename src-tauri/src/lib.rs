pub mod port_scanner;

use port_scanner::{get_listening_ports, kill_process, scan_ports};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_ports,
            get_listening_ports,
            kill_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn tauri_context_version_matches_package_json() {
        let context: tauri::Context<tauri::Wry> = tauri::generate_context!();
        let pkg_json: serde_json::Value =
            serde_json::from_str(include_str!("../../package.json")).unwrap();
        assert_eq!(
            context.package_info().version.to_string(),
            pkg_json["version"].as_str().unwrap()
        );
    }
}
