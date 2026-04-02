import re
with open('src/utils/tutorials/strategy.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'message: "Master Basic Strategy to minimize losses and maximize wins over time! Tap \'FINISH TUTORIAL\'\.",\n\s*condition: \(s: GameState\) => s\.gamePhase === GamePhase\.PAYOUT,\n\s*targetElementId: \'finish-tutorial-button\'',
    '''message: "Master Basic Strategy to minimize losses and maximize wins over time! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button' ''',
    content, count=1
)
with open('src/utils/tutorials/strategy.ts', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/utils/tutorials/uk.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'message: "You lose your original \ bet, but notice your double bet \(\\) was returned to you\. That\'s the Original Bets Only \(OBO\) rule protecting you from the dealer\'s Blackjack! Tap NEW ROUND\.",\n\s*condition: \(s: GameState\) => s\.gamePhase === GamePhase\.PAYOUT,\n\s*targetElementId: \'finish-tutorial-button\'',
    '''message: "You lose your original  bet, but notice your double bet () was returned to you. That's the Original Bets Only (OBO) rule protecting you from the dealer's Blackjack! Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button' ''',
    content
)

content = re.sub(
    r'message: "OBO kicks in: your original hand loses, but the split hand is REFUNDED\. This is why splitting 8s vs 10 is OK in UK rules\. Tap FINISH TUTORIAL\.",\n\s*condition: \(s: GameState\) => s\.gamePhase === GamePhase\.PAYOUT,\n\s*targetElementId: \'finish-tutorial-button\'',
    '''message: "OBO kicks in: your original hand loses, but the split hand is REFUNDED. This is why splitting 8s vs 10 is OK in UK rules. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button' ''',
    content
)

with open('src/utils/tutorials/uk.ts', 'w', encoding='utf-8') as f:
    f.write(content)
