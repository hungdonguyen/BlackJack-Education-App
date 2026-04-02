const fs = require('fs');
let content = fs.readFileSync('src/store/bettingSlice.ts', 'utf8');

if (!content.includes('isExchangeRoomId = (id: string)')) {
    content = content.replace(/const EXCHANGE_ROOM_ID = 'exchange_21';/g, "const EXCHANGE_ROOM_ID = 'exchange_21';\nconst isExchangeRoomId = (id: string) => id === EXCHANGE_ROOM_ID || id === 'tutorial_exchange';");

    content = content.replace(/roomId === EXCHANGE_ROOM_ID/g, "isExchangeRoomId(roomId)");
    content = content.replace(/state\.currentRoom === EXCHANGE_ROOM_ID/g, "isExchangeRoomId(state.currentRoom)");
    
    // I already did a manual replace for the cap via replace_string_in_file but let's make sure it handles generic case if missing.
}

fs.writeFileSync('src/store/bettingSlice.ts', content);
console.log('patched');
