const fs = require('fs');
const path = require('path');

const tutorialDir = 'c:\\Users\\Maytinh\\Desktop\\BlackJack_Web\\src\\utils\\tutorials';
const files = fs.readdirSync(tutorialDir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
    const filePath = path.join(tutorialDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Standardize language to "Tap"
    content = content.replace(/Click/g, 'Tap');
    content = content.replace(/click/g, 'tap');
    
    // Fix Deal Button ID
    content = content.replace(/['"]deal-button['"]/g, "'action-button-deal'");

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
