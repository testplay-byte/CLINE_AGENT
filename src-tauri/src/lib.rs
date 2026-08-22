//! ACUTE-CODE desktop shell (Tauri 2).
//! Owns ONLY the window and sidecar process lifecycle: no SQLite, no API keys,
//! no LLM traffic (ARCHITECTURE.md sections 1 and 4).

use std::net::TcpListener;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::Manager;

/// Keeps the spawned sidecar child reachable so it can be killed at exit.
struct SidecarChild(Mutex<Option<Child>>);

/// Reserve a free localhost port by binding an ephemeral listener, reading its
/// port, then dropping the listener.
/// [ASSUMPTION] bind-then-release race accepted for v0; the launch-token
/// handshake (ARCHITECTURE.md section 4) narrows the window later.
fn reserve_free_port() -> Option<u16> {
    let listener = TcpListener::bind(("127.0.0.1", 0)).ok()?;
    listener.local_addr().ok().map(|addr| addr.port())
}

/// Spawn `node agent-core/dist/src/server.js` with ACUTE_PORT set.
/// Any failure is non-fatal: the UI still opens and its boot-splash health
/// polling simply reports degraded state until a sidecar shows up.
fn spawn_sidecar(app: &tauri::AppHandle) {
    let Some(port) = reserve_free_port() else {
        eprintln!("[acute-code] could not reserve a localhost port; starting without sidecar");
        return;
    };
    // Path is relative to the repo root, where `pnpm tauri dev` runs.
    match Command::new("node")
        .arg("agent-core/dist/src/server.js")
        .env("ACUTE_PORT", port.to_string())
        .spawn()
    {
        Ok(child) => {
            println!("[acute-code] sidecar spawning on port {port}");
            app.manage(SidecarChild(Mutex::new(Some(child))));
        }
        Err(err) => {
            eprintln!("[acute-code] sidecar spawn failed ({err}); continuing without it");
        }
    }
}

/// Entry point used by src/main.rs.
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            spawn_sidecar(app.handle());
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("fatal: failed to build the acute-code application")
        .run(|app_handle, event| {
            // Kill-on-exit so the sidecar never outlives the shell (NFR-005).
            // TODO(phase-1): Windows Job Object with kill-on-close covers hard
            // crashes too; graceful-exit kill is the v0 skeleton.
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<SidecarChild>() {
                    if let Ok(mut guard) = state.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                            let _ = child.wait();
                        }
                    }
                }
            }
        });
}