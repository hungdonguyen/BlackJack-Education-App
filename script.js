const fs = require('fs');
const path = require('path');
const dir = 'src/utils/tutorials';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

function replaceAll(str, find, replace) {
    return str.split(find).join(replace);
}

files.forEach(file => {
    let filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');

    content = replaceAll(content, 'â€”', '—');
    content = replaceAll(content, 'â†’', '?');
    content = replaceAll(content, 'â‰¥', '?');
    content = replaceAll(content, 'â?¡', '?');
    content = replaceAll(content, 'â€“', '-');
    content = replaceAll(content, '\u00E2\u20AC\u201C', '—'); 

    content = replaceAll(content, 'Welcome to Playing with pair!', 'Welcome to Pair Splitting!');
    content = replaceAll(content, 'cost 100$', 'cost ');
    content = replaceAll(content, 'cost 100script.js', 'cost '); // Clean double fixes if any
    content = replaceAll(content, 'You got a Natural Blackjack (21)! Since 21 is the maximum points', 'You got a Natural Blackjack! Since 21 is the maximum score');
    content = replaceAll(content, 'Hard 16 vs Dealer 9', "Hard 16 vs the Dealer's 9");

    const mapTap = [
        ["Click 'Rule & Strategy'", "Tap 'Rule & Strategy'"],
        ["click 'Rule & Strategy'", "tap 'Rule & Strategy'"],
        ["Click the HARD tab", "Tap the HARD tab"],
        ["Click the SOFT tab", "Tap the SOFT tab"],
        ["Click the PAIRS tab", "Tap the PAIRS tab"],
        ["Click 'DEAL'", "Tap 'DEAL'"],
        ["click 'DEAL'", "tap 'DEAL'"],
        ["Let's explore the tools. Click", "Let's explore the tools. Tap"],
        ["Click anywhere to continue", "Tap anywhere to continue"]
    ];

    mapTap.forEach(([f, r]) => {
        content = replaceAll(content, f, r);
    });

    fs.writeFileSync(filePath, content);
});

console.log('All replacements done');
