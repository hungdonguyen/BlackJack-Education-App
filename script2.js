const fs = require('fs');
let code = fs.readFileSync('src/utils/tutorials/double.ts', 'utf-8');
code = code.replace(/It cost  \(your original bet\)/g, 'It costs cost 100 (your original bet)');
fs.writeFileSync('src/utils/tutorials/double.ts', code);
console.log('Fixed double.ts');
