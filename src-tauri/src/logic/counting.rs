use serde::{Deserialize, Serialize};

use super::deck::Card;

#[derive(Debug, Serialize, Deserialize)]
pub struct Hand {
    pub id: String,
    pub cards: Vec<Card>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Seat {
    pub id: u8,
    pub hands: Vec<Hand>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TrueCountResult {
    #[serde(rename = "runningCount")]
    pub running_count: i32,
    #[serde(rename = "decksRemaining")]
    pub decks_remaining: f32,
    #[serde(rename = "trueCountRaw")]
    pub true_count_raw: f32,
    #[serde(rename = "trueCount")]
    pub true_count: f32,
}

pub fn get_card_value(rank: &str, system: &str) -> i32 {
    if system == "Katarina Walker" {
        match rank {
            "2" | "3" | "6" => 1,
            "4" | "5" => 2,
            "7" | "8" => 0,
            "9" | "10" | "JACK" | "QUEEN" | "KING" | "ACE" => -1,
            _ => 0,
        }
    } else {
        // Hi-Lo
        match rank {
            "2" | "3" | "4" | "5" | "6" => 1,
            "7" | "8" | "9" => 0,
            "10" | "JACK" | "QUEEN" | "KING" | "ACE" => -1,
            _ => 0,
        }
    }
}

pub fn get_initial_deck_sum(system: &str, omit_tens: bool) -> i32 {
    if system == "Katarina Walker" {
        if omit_tens { 8 } else { 4 }
    } else {
        0
    }
}

pub fn calculate_running_count_from_shoe(
    shoe: &[Card],
    dealer_cards: &[Card],
    seats: &[Seat],
    num_decks: u8,
    system: &str,
    omit_tens: bool,
) -> i32 {
    let mut shoe_sum = 0;
    for card in shoe {
        shoe_sum += get_card_value(&card.rank, system);
    }

    let initial_deck_sum = get_initial_deck_sum(system, omit_tens);
    let initial_shoe_sum = (num_decks as i32) * initial_deck_sum;
    let mut running_count = initial_shoe_sum - shoe_sum;

    for card in dealer_cards {
        if card.is_hidden {
            running_count -= get_card_value(&card.rank, system);
        }
    }

    for seat in seats {
        for hand in &seat.hands {
            for card in &hand.cards {
                if card.is_hidden {
                    running_count -= get_card_value(&card.rank, system);
                }
            }
        }
    }

    running_count
}

pub fn calculate_true_count(
    shoe: Vec<Card>,
    dealer_cards: Vec<Card>,
    seats: Vec<Seat>,
    num_decks: u8,
    system: String,
    omit_tens: bool,
) -> TrueCountResult {
    let running_count = calculate_running_count_from_shoe(
        &shoe,
        &dealer_cards,
        &seats,
        num_decks,
        &system,
        omit_tens,
    );

    let cards_per_deck = if omit_tens { 48.0 } else { 52.0 };
    let mut decks_remaining = (shoe.len() as f32) / cards_per_deck;
    if decks_remaining < 0.5 {
        decks_remaining = 0.5;
    }

    let true_count_raw = (running_count as f32) / decks_remaining;
    let true_count = (true_count_raw * 10.0).round() / 10.0;

    TrueCountResult {
        running_count,
        decks_remaining,
        true_count_raw,
        true_count,
    }
}