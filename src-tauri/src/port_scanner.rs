use std::net::{IpAddr, SocketAddr, TcpStream, ToSocketAddrs};
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PortScanResult {
    pub port: u16,
    pub open: bool,
    pub latency_ms: Option<u64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ListeningPort {
    pub port: u16,
    pub protocol: String,
    pub address: String,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub user: Option<String>,
}

/// Concurrently scan a list of ports for a given host
#[tauri::command]
pub fn scan_ports(host: String, ports: Vec<u16>, timeout_ms: u64) -> Result<Vec<PortScanResult>, String> {
    if ports.is_empty() {
        return Ok(Vec::new());
    }

    let host_cleaned = host.trim().to_string();
    if host_cleaned.is_empty() {
        return Err("Target host cannot be empty".to_string());
    }

    // Resolve target host once
    let addr_str = format!("{}:{}", host_cleaned, ports[0]);
    let target_ip: IpAddr = match addr_str.to_socket_addrs() {
        Ok(mut addrs) => {
            if let Some(first) = addrs.next() {
                first.ip()
            } else {
                return Err(format!("Could not resolve host: {}", host_cleaned));
            }
        }
        Err(e) => return Err(format!("Invalid host address '{}': {}", host_cleaned, e)),
    };

    let timeout = Duration::from_millis(timeout_ms.clamp(50, 5000));
    let results = Arc::new(Mutex::new(Vec::with_capacity(ports.len())));

    // Process in chunks of 32 concurrent threads using std::thread::scope
    let chunk_size = 32;
    for chunk in ports.chunks(chunk_size) {
        let chunk = chunk.to_vec();
        let results_clone = Arc::clone(&results);

        thread::scope(|s| {
            for port in chunk {
                let results_inner = Arc::clone(&results_clone);
                s.spawn(move || {
                    let socket_addr = SocketAddr::new(target_ip, port);
                    let start = Instant::now();
                    let open = TcpStream::connect_timeout(&socket_addr, timeout).is_ok();
                    let elapsed = start.elapsed().as_millis() as u64;

                    let mut lock = results_inner.lock().unwrap();
                    lock.push(PortScanResult {
                        port,
                        open,
                        latency_ms: if open { Some(elapsed) } else { None },
                    });
                });
            }
        });
    }

    let mut final_results = results.lock().unwrap().clone();
    final_results.sort_by_key(|r| r.port);
    Ok(final_results)
}

/// Detect active listening ports and occupying processes on the local machine
#[tauri::command]
pub fn get_listening_ports() -> Result<Vec<ListeningPort>, String> {
    #[cfg(unix)]
    {
        // 1. Try lsof first (available on macOS and most Linux distributions)
        if let Ok(output) = Command::new("lsof")
            .args(["-nP", "-iTCP", "-sTCP:LISTEN"])
            .output()
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let list = parse_lsof_output(&stdout);
                if !list.is_empty() {
                    let mut sorted = list;
                    sorted.sort_by_key(|p| p.port);
                    return Ok(sorted);
                }
            }
        }

        // 2. Try ss on Linux
        if let Ok(output) = Command::new("ss").args(["-tlnp"]).output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let list = parse_ss_output(&stdout);
                if !list.is_empty() {
                    let mut sorted = list;
                    sorted.sort_by_key(|p| p.port);
                    return Ok(sorted);
                }
            }
        }

        // 3. Fallback: try netstat on Linux
        if let Ok(output) = Command::new("netstat").args(["-tlpn"]).output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let list = parse_ss_output(&stdout); // netstat output has similar LISTEN structure
                let mut sorted = list;
                sorted.sort_by_key(|p| p.port);
                return Ok(sorted);
            }
        }

        Ok(Vec::new())
    }

    #[cfg(windows)]
    {
        if let Ok(output) = Command::new("netstat").args(["-ano", "-p", "tcp"]).output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let mut list = parse_windows_netstat(&stdout);
                list.sort_by_key(|p| p.port);
                return Ok(list);
            }
        }

        Ok(Vec::new())
    }
}

/// Terminate process by PID (Local port conflict resolution)
#[tauri::command]
pub fn kill_process(pid: u32) -> Result<bool, String> {
    if pid <= 1 {
        return Err("Cannot terminate root/system critical process (PID <= 1)".to_string());
    }

    #[cfg(unix)]
    {
        let output = Command::new("kill")
            .arg("-9")
            .arg(pid.to_string())
            .output()
            .map_err(|e| format!("Failed to invoke kill: {}", e))?;

        if output.status.success() {
            Ok(true)
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("Kill failed: {}", err.trim()))
        }
    }

    #[cfg(windows)]
    {
        let output = Command::new("taskkill")
            .args(["/F", "/PID", &pid.to_string()])
            .output()
            .map_err(|e| format!("Failed to invoke taskkill: {}", e))?;

        if output.status.success() {
            Ok(true)
        } else {
            let err = String::from_utf8_lossy(&output.stderr);
            Err(format!("Taskkill failed: {}", err.trim()))
        }
    }
}

#[cfg(unix)]
fn parse_lsof_output(output_str: &str) -> Vec<ListeningPort> {
    let mut list = Vec::new();
    let mut seen_keys = std::collections::HashSet::new();

    for line in output_str.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 9 || parts[0] == "COMMAND" {
            continue;
        }

        let cmd = parts[0];
        let pid: Option<u32> = parts[1].parse().ok();
        let user = Some(parts[2].to_string());

        let mut name_part = "";
        for &p in parts.iter().skip(8) {
            if p.contains(':') && !p.starts_with('(') {
                name_part = p;
                break;
            }
        }

        if name_part.is_empty() {
            for &p in parts.iter() {
                if p.contains(':') && !p.starts_with('(') {
                    name_part = p;
                    break;
                }
            }
        }

        if !name_part.is_empty() {
            if let Some(idx) = name_part.rfind(':') {
                let addr = &name_part[..idx];
                let port_str = &name_part[idx + 1..];
                if let Ok(port) = port_str.parse::<u16>() {
                    let cleaned_addr = if addr == "*" {
                        "0.0.0.0".to_string()
                    } else if addr.starts_with('[') && addr.ends_with(']') {
                        addr[1..addr.len() - 1].to_string()
                    } else {
                        addr.to_string()
                    };

                    let key = (port, pid.unwrap_or(0));
                    if !seen_keys.contains(&key) {
                        seen_keys.insert(key);
                        list.push(ListeningPort {
                            port,
                            protocol: "TCP".to_string(),
                            address: cleaned_addr,
                            pid,
                            process_name: Some(cmd.to_string()),
                            user,
                        });
                    }
                }
            }
        }
    }

    list
}

#[cfg(unix)]
fn parse_ss_output(output_str: &str) -> Vec<ListeningPort> {
    let mut list = Vec::new();
    let mut seen_keys = std::collections::HashSet::new();

    for line in output_str.lines() {
        if !line.contains("LISTEN") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        let mut local_addr_part = "";
        let mut process_part = "";

        for &p in parts.iter() {
            if p.contains(':') && local_addr_part.is_empty() {
                local_addr_part = p;
            } else if p.starts_with("users:(") {
                process_part = &line[line.find("users:(").unwrap_or(0)..];
                break;
            }
        }

        if !local_addr_part.is_empty() {
            if let Some(idx) = local_addr_part.rfind(':') {
                let addr = &local_addr_part[..idx];
                let port_str = &local_addr_part[idx + 1..];
                if let Ok(port) = port_str.parse::<u16>() {
                    let mut pid = None;
                    let mut proc_name = None;

                    if !process_part.is_empty() {
                        if let Some(pid_start) = process_part.find("pid=") {
                            let sub = &process_part[pid_start + 4..];
                            let pid_end = sub.find(|c: char| !c.is_ascii_digit()).unwrap_or(sub.len());
                            pid = sub[..pid_end].parse::<u32>().ok();
                        }
                        if let Some(first_quote) = process_part.find('"') {
                            let sub = &process_part[first_quote + 1..];
                            if let Some(second_quote) = sub.find('"') {
                                proc_name = Some(sub[..second_quote].to_string());
                            }
                        }
                    }

                    let key = (port, pid.unwrap_or(0));
                    if !seen_keys.contains(&key) {
                        seen_keys.insert(key);
                        list.push(ListeningPort {
                            port,
                            protocol: "TCP".to_string(),
                            address: if addr == "*" { "0.0.0.0".to_string() } else { addr.to_string() },
                            pid,
                            process_name: proc_name,
                            user: None,
                        });
                    }
                }
            }
        }
    }

    list
}

#[cfg(windows)]
fn parse_windows_netstat(output_str: &str) -> Vec<ListeningPort> {
    let mut list = Vec::new();
    let mut seen_keys = std::collections::HashSet::new();

    for line in output_str.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 5 && parts[0].eq_ignore_ascii_case("TCP") && parts[3].eq_ignore_ascii_case("LISTENING") {
            let local_addr = parts[1];
            let pid = parts[4].parse::<u32>().ok();

            if let Some(idx) = local_addr.rfind(':') {
                let addr = &local_addr[..idx];
                let port_str = &local_addr[idx + 1..];
                if let Ok(port) = port_str.parse::<u16>() {
                    let key = (port, pid.unwrap_or(0));
                    if !seen_keys.contains(&key) {
                        seen_keys.insert(key);
                        list.push(ListeningPort {
                            port,
                            protocol: "TCP".to_string(),
                            address: addr.to_string(),
                            pid,
                            process_name: None,
                            user: None,
                        });
                    }
                }
            }
        }
    }

    list
}
