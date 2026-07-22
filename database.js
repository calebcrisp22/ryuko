const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'bot.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    username TEXT DEFAULT 'Unknown',
    level INTEGER DEFAULT 0,
    items INTEGER DEFAULT 0,
    twofa TEXT DEFAULT 'Unknown',
    banned TEXT DEFAULT 'No',
    renown INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    platforms TEXT DEFAULT 'Unknown',
    last_played TEXT DEFAULT 'Unknown',
    wanted_ranks TEXT DEFAULT 'None',
    wanted_items TEXT DEFAULT 'None',
    claimed INTEGER DEFAULT 0,
    claimed_by TEXT,
    claimed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS drop_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    password TEXT NOT NULL,
    username TEXT DEFAULT 'Unknown',
    level INTEGER DEFAULT 0,
    items INTEGER DEFAULT 0,
    twofa TEXT DEFAULT 'Unknown',
    banned TEXT DEFAULT 'No',
    renown INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    platforms TEXT DEFAULT 'Unknown',
    last_played TEXT DEFAULT 'Unknown',
    wanted_ranks TEXT DEFAULT 'None',
    wanted_items TEXT DEFAULT 'None'
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    user_id TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL,
    granted_by TEXT
  );

  CREATE TABLE IF NOT EXISTS cooldowns (
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    last_used INTEGER NOT NULL,
    PRIMARY KEY (user_id, category)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS vouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user TEXT NOT NULL,
    to_user TEXT NOT NULL,
    message TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS joins (
    id INTEGER PRIMARY KEY,
    count INTEGER DEFAULT 0
  );

  INSERT OR IGNORE INTO joins (id, count) VALUES (1, 0);
  INSERT OR IGNORE INTO settings (key, value) VALUES ('free_cooldown', '300');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('premium_cooldown', '60');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('gen_channel', NULL);
  INSERT OR IGNORE INTO settings (key, value) VALUES ('log_channel', NULL);
  INSERT OR IGNORE INTO settings (key, value) VALUES ('drop_active', '0');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('gen_image_free', 'https://i.imgur.com/RqGMZxH.png');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('gen_image_premium', 'https://i.imgur.com/RqGMZxH.png');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('footer_free', 'GENERATOR⭐');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('footer_premium', 'GENERATOR💎');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('how_to_link', 'Go to https://www.ubisoft.com/en-us/help and link your account using the provided credentials.');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('bot_name', 'Generator');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_image', NULL);
`);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

function setImageUrl(url) {
  setSetting('banner_image', url);
}

function getImageUrl() {
  return getSetting('banner_image');
}

function getFreeStock() {
  return db.prepare("SELECT COUNT(*) as cnt FROM accounts WHERE category = 'free' AND claimed = 0").get().cnt;
}

function getPremiumStock() {
  return db.prepare("SELECT COUNT(*) as cnt FROM accounts WHERE category = 'premium' AND claimed = 0").get().cnt;
}

function getDropStock() {
  return db.prepare('SELECT COUNT(*) as cnt FROM drop_accounts').get().cnt;
}

function claimAccount(category) {
  const acc = db.prepare("SELECT * FROM accounts WHERE category = ? AND claimed = 0 ORDER BY id ASC LIMIT 1").get(category);
  if (!acc) return null;
  db.prepare('UPDATE accounts SET claimed = 1, claimed_by = ?, claimed_at = ? WHERE id = ?').run('pending', Date.now(), acc.id);
  return acc;
}

function confirmClaim(id, userId) {
  db.prepare('UPDATE accounts SET claimed_by = ? WHERE id = ?').run(userId, id);
}

function claimDropAccount() {
  const acc = db.prepare('SELECT * FROM drop_accounts ORDER BY id ASC LIMIT 1').get();
  if (!acc) return null;
  db.prepare('DELETE FROM drop_accounts WHERE id = ?').run(acc.id);
  return acc;
}

function addAccounts(accounts) {
  const stmt = db.prepare(`
    INSERT INTO accounts (category, email, password, username, level, items, twofa, banned, renown, credits, platforms, last_played, wanted_ranks, wanted_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((list) => {
    for (const a of list) stmt.run(a.category, a.email, a.password, a.username, a.level, a.items, a.twofa, a.banned, a.renown, a.credits, a.platforms, a.last_played, a.wanted_ranks, a.wanted_items);
  });
  insertMany(accounts);
}

function addDropAccounts(accounts) {
  const stmt = db.prepare(`
    INSERT INTO drop_accounts (email, password, username, level, items, twofa, banned, renown, credits, platforms, last_played, wanted_ranks, wanted_items)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertMany = db.transaction((list) => {
    for (const a of list) stmt.run(a.email, a.password, a.username, a.level, a.items, a.twofa, a.banned, a.renown, a.credits, a.platforms, a.last_played, a.wanted_ranks, a.wanted_items);
  });
  insertMany(accounts);
}

function getCooldown(userId, category) {
  return db.prepare('SELECT last_used FROM cooldowns WHERE user_id = ? AND category = ?').get(userId, category);
}

function setCooldown(userId, category) {
  db.prepare('INSERT OR REPLACE INTO cooldowns (user_id, category, last_used) VALUES (?, ?, ?)').run(userId, category, Date.now());
}

function isPremium(userId) {
  const sub = db.prepare('SELECT expires_at FROM subscriptions WHERE user_id = ?').get(userId);
  if (!sub) return false;
  if (sub.expires_at < Date.now()) {
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);
    return false;
  }
  return true;
}

function setSubscription(userId, durationMs, grantedBy) {
  const expiresAt = Date.now() + durationMs;
  db.prepare('INSERT OR REPLACE INTO subscriptions (user_id, expires_at, granted_by) VALUES (?, ?, ?)').run(userId, expiresAt, grantedBy);
  return expiresAt;
}

function getSubscription(userId) {
  return db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').get(userId);
}

function addVouch(fromUser, toUser, message) {
  db.prepare('INSERT INTO vouches (from_user, to_user, message, created_at) VALUES (?, ?, ?, ?)').run(fromUser, toUser, message, Date.now());
}

function getVouches(toUser) {
  return db.prepare('SELECT * FROM vouches WHERE to_user = ? ORDER BY created_at DESC LIMIT 20').all(toUser);
}

function deleteVouch(id) {
  db.prepare('DELETE FROM vouches WHERE id = ?').run(id);
}

function getJoinCount() {
  return db.prepare('SELECT count FROM joins WHERE id = 1').get().count;
}

function incrementJoins() {
  db.prepare('UPDATE joins SET count = count + 1 WHERE id = 1').run();
}

function resetJoins() {
  db.prepare('UPDATE joins SET count = 0 WHERE id = 1').run();
}

// Parse account line format:
// email:pass|username|level|items|2fa|banned|renown|credits|platforms|lastplayed|ranks|wanteditems
function safeParseInt(value, fieldName) {
  const trimmed = (value ?? '').toString().trim();
  const parsed = parseInt(trimmed, 10);
  if (trimmed !== '' && Number.isNaN(parsed)) {
    console.warn(`[parseAccountLine] Failed to parse integer for field "${fieldName}": "${value}" — defaulting to 0.`);
    return 0;
  }
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseAccountLine(line, category) {
  if (!line || typeof line !== 'string') {
    console.warn('[parseAccountLine] Empty or invalid line received.');
    return null;
  }

  const trimmedLine = line.trim();

  // Must contain the email:password prefix before any '|' delimited fields.
  const firstPipeIndex = trimmedLine.indexOf('|');
  const credPart = firstPipeIndex === -1 ? trimmedLine : trimmedLine.slice(0, firstPipeIndex);

  if (!credPart.includes(':')) {
    console.warn(`[parseAccountLine] Line missing "email:password" prefix: "${trimmedLine}"`);
    return null;
  }

  const fields = trimmedLine.split('|').map(f => f.trim());

  const [
    cred,
    username,
    level,
    items,
    twofa,
    banned,
    renown,
    credits,
    platforms,
    last_played,
    wanted_ranks,
    wanted_items,
  ] = fields;

  if (!cred || !cred.includes(':')) {
    console.warn(`[parseAccountLine] Invalid credentials segment: "${cred}"`);
    return null;
  }

  // Split email:password on the FIRST colon only, joining the rest back
  // together in case the password itself contains colons.
  const colonIndex = cred.indexOf(':');
  const email = cred.slice(0, colonIndex).trim();
  const password = cred.slice(colonIndex + 1).trim();

  if (!email || !password) {
    console.warn(`[parseAccountLine] Missing email or password after split: email="${email}" password="${password}"`);
    return null;
  }

  const parsed = {
    category,
    email,
    password,
    username: username?.trim() || 'Unknown',
    level: safeParseInt(level, 'level'),
    items: safeParseInt(items, 'items'),
    twofa: twofa?.trim() || 'Unknown',
    banned: banned?.trim() || 'No',
    renown: safeParseInt(renown, 'renown'),
    credits: safeParseInt(credits, 'credits'),
    platforms: platforms?.trim() || 'Unknown',
    last_played: last_played?.trim() || 'Unknown',
    wanted_ranks: wanted_ranks?.trim() || 'None',
    wanted_items: wanted_items?.trim() || 'None',
  };

  console.log(`[parseAccountLine] Parsed account: ${JSON.stringify({ ...parsed, password: '***' })}`);

  return parsed;
}

module.exports = {
  db, getSetting, setSetting,
  setImageUrl, getImageUrl,
  getFreeStock, getPremiumStock, getDropStock,
  claimAccount, confirmClaim, claimDropAccount,
  addAccounts, addDropAccounts,
  getCooldown, setCooldown,
  isPremium, setSubscription, getSubscription,
  addVouch, getVouches, deleteVouch,
  getJoinCount, incrementJoins, resetJoins,
  parseAccountLine,
};
