
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod logic;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // initialization
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            shuffle_and_deal,
            calculate_true_count_rust,
            logic::store::secure_save,
            logic::store::secure_load
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn shuffle_and_deal(num_decks: u8, omit_tens: bool) -> Vec<logic::deck::Card> {
    let shoe = logic::deck::create_shoe(num_decks, omit_tens);
    logic::deck::shuffle_shoe(shoe)
}

#[tauri::command]
fn calculate_true_count_rust(
    shoe: Vec<logic::deck::Card>,
    dealer_cards: Vec<logic::deck::Card>,
    seats: Vec<logic::counting::Seat>,
    num_decks: u8,
    system: String,
    omit_tens: bool,
) -> logic::counting::TrueCountResult {
    logic::counting::calculate_true_count(shoe, dealer_cards, seats, num_decks, system, omit_tens)
}

