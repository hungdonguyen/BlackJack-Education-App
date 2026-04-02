const fs = require('fs');
const path = require('path');

const tutorialDir = 'c:\\Users\\Maytinh\\Desktop\\BlackJack_Web\\src\\utils\\tutorials';
const files = fs.readdirSync(tutorialDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(tutorialDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Restore the property name without affecting the message content
    content = content.replace(/requiresTap:/g, 'requiresClick:');
    
    // Safety check: ensure no other non-message "Tap" was introduced
    // (though in this context only requiresClick is the main one)

    fs.writeFileSync(filePath, content);
    console.log(`Restored requiresClick in ${file}`);
});
