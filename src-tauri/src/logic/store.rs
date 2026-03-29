use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce // Or `Aes128Gcm`
};
use aes_gcm::aead::rand_core::RngCore;
use std::fs;
use tauri::{AppHandle, Manager};

// 32-byte key for AES-256
const SECRET_KEY: &[u8; 32] = b"bJ1kP9xM4qR7vW2yZ5cL8nE0oA3hF6jT";

#[tauri::command]
pub fn secure_save(app: AppHandle, key: String, content: String) -> Result<(), String> {
    let mut data_dir = app.path().app_config_dir().map_err(|e: tauri::Error| e.to_string())?;
    
    // Ensure dir exists
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir).map_err(|e: std::io::Error| e.to_string())?;
    }
    
    // Create actual path based on the file 'key' (like 'save.json.enc')
    data_dir.push(format!("{}.enc", key));
    
    // Setup Cipher
    let cipher = Aes256Gcm::new(SECRET_KEY.into());
    
    // Generate 12-byte nonce
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // Encrypt
    let ciphertext = cipher.encrypt(nonce, content.as_bytes().as_ref()).map_err(|e: aes_gcm::aead::Error| e.to_string())?;
    
    // Combine nonce + ciphertext
    let mut final_data = nonce_bytes.to_vec();
    final_data.extend_from_slice(&ciphertext);
    
    // Write
    fs::write(data_dir, final_data).map_err(|e: std::io::Error| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub fn secure_load(app: AppHandle, key: String) -> Result<String, String> {
    let mut data_dir = app.path().app_config_dir().map_err(|e: tauri::Error| e.to_string())?;
    data_dir.push(format!("{}.enc", key));
    
    if !data_dir.exists() {
        return Err("File not found".into());
    }
    
    let file_data = fs::read(data_dir).map_err(|e: std::io::Error| e.to_string())?;
    
    if file_data.len() < 12 {
        return Err("Invalid file data".into());
    }
    
    let (nonce_bytes, ciphertext) = file_data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let cipher = Aes256Gcm::new(SECRET_KEY.into());
    let plaintext = cipher.decrypt(nonce, ciphertext).map_err(|e: aes_gcm::aead::Error| e.to_string())?;
    
    let content = String::from_utf8(plaintext).map_err(|e: std::string::FromUtf8Error| e.to_string())?;
    
    Ok(content)
}
