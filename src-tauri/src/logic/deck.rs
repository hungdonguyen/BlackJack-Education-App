use rand::seq::SliceRandom;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Card {
    pub suit: String,
    pub rank: String,
    pub value: u8,
    #[serde(rename = "isHidden")]
    pub is_hidden: bool,
}

impl Card {
    fn new(suit: &str, rank: &str, value: u8) -> Self {
        Self {
            suit: suit.to_string(),
            rank: rank.to_string(),
            value,
            is_hidden: false,
        }
    }
}

pub fn create_deck(omit_tens: bool) -> Vec<Card> {
    let suits = vec!["HEARTS", "DIAMONDS", "CLUBS", "SPADES"];
    let mut deck = Vec::new();

    for suit in suits {
        deck.push(Card::new(suit, "ACE", 11));
        deck.push(Card::new(suit, "2", 2));
        deck.push(Card::new(suit, "3", 3));
        deck.push(Card::new(suit, "4", 4));
        deck.push(Card::new(suit, "5", 5));
        deck.push(Card::new(suit, "6", 6));
        deck.push(Card::new(suit, "7", 7));
        deck.push(Card::new(suit, "8", 8));
        deck.push(Card::new(suit, "9", 9));
        
        if !omit_tens {
            deck.push(Card::new(suit, "10", 10));
        }
        
        deck.push(Card::new(suit, "JACK", 10));
        deck.push(Card::new(suit, "QUEEN", 10));
        deck.push(Card::new(suit, "KING", 10));
    }
    deck
}

pub fn create_shoe(num_decks: u8, omit_tens: bool) -> Vec<Card> {
    let mut shoe = Vec::new();
    for _ in 0..num_decks {
        shoe.append(&mut create_deck(omit_tens));
    }
    shoe
}

pub fn shuffle_shoe(mut shoe: Vec<Card>) -> Vec<Card> {
    let mut rng = rand::rng();
    shoe.shuffle(&mut rng);
    shoe
}

