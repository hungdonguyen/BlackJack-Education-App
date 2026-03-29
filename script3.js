const fs = require('fs');
let code = fs.readFileSync('src/utils/tutorials/double.ts', 'utf-8');
code = code.replace(/It costs to double down\.100 \(your original bet\) to double down\./g, 'It costs to double down.100 (your original bet) to double down.');
fs.writeFileSync('src/utils/tutorials/double.ts', code);
