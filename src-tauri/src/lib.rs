use serde::Serialize;
use sysinfo::System;

#[derive(Serialize, Debug)]
struct Proc {
    pid: u32,
    name: String,
    user: String,
    parent: String,
    memory: String,
    cpu: String,
}

impl Proc {
    fn new(
        pid: &sysinfo::Pid,
        proc: &sysinfo::Process,
        sys: &System,
        mem: u64,
        cpu: usize,
    ) -> Proc {
        let users = sysinfo::Users::new_with_refreshed_list();
        let user: String = match proc.user_id() {
            Some(id) => match users.get_user_by_id(id) {
                Some(u) => u.name().to_string(),
                None => "Unknown".to_string(),
            },
            None => "Unknown".to_string(),
        };

        let parent = match proc.parent() {
            Some(pid) => match sys.process(pid) {
                Some(p) => match p.name().to_str() {
                    Some(name) => name.to_string(),
                    None => "Not Found".to_string(),
                },
                None => "Not Found".to_string(),
            },
            None => "Not Found".to_string(),
        };

        Proc {
            pid: pid.as_u32(),
            name: match proc.name().to_str() {
                Some(name) => name.to_string(),
                None => "Unknown Name".to_string(),
            },
            user,
            parent,
            memory: format!("{:.2} %", (proc.memory() as f32 / mem as f32) * 100.0),
            cpu: format!("{:.2} %", proc.cpu_usage() / cpu as f32),
        }
    }
}

#[tauri::command]
fn kill_process(id: u32) -> bool {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();
    if let Some(p) = sys.process(sysinfo::Pid::from_u32(id)) {
        p.kill()
    } else {
        println!("not found");
        false
    }
}

#[tauri::command]
fn get_processes() -> Vec<Proc> {
    let mut sys = sysinfo::System::new_all();
    let mut procs: Vec<Proc> = Vec::new();
    let cpu_count = sys.cpus().len();
    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    sys.refresh_all();
    for (pid, proc) in sys.processes() {
        procs.push(Proc::new(pid, proc, &sys, sys.total_memory(), cpu_count));
    }
    procs
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![get_processes, kill_process])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
