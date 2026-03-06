// ============================================
// Blackjack Game Enums
// ============================================

export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Rank {
  ACE = 'ACE',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'JACK',
  QUEEN = 'QUEEN',
  KING = 'KING',
}

export enum HandStatus {
  PLAYING = 'PLAYING',
  BUST = 'BUST',
  STAND = 'STAND',
  WON = 'WON',
  LOST = 'LOST',
  PUSH = 'PUSH',
  BLACKJACK = 'BLACKJACK',
  SURRENDERED = 'SURRENDERED',
}

export enum GamePhase {
  BETTING = 'BETTING',
  DEALING = 'DEALING',
  INSURANCE = 'INSURANCE',
  PLAYER_TURN = 'PLAYER_TURN',
  DEALER_TURN = 'DEALER_TURN',
  PAYOUT = 'PAYOUT',
}
