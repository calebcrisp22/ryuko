require('dotenv').config();

module.exports = {
  TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  OWNER_ID: process.env.OWNER_ID || '1523163587810693292',
  COLORS: {
    GEN: 0xE8272A,       // R6 red for public gen embed
    DM: 0x2ECC71,        // Green for DM embed
    STOCK: 0x5865F2,     // Discord blurple for stock
    PREMIUM: 0x5865F2,   // Blurple for premium
    ERROR: 0xFF0000,
    WARN: 0xFF8C00,
    SUCCESS: 0x00FF7F,
    DROP: 0xFFD700,
  },
};
