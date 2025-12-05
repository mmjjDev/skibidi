import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '..', 'bot.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database tables
 */
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      balance INTEGER DEFAULT 0,
      total_points INTEGER DEFAULT 0,
      current_rank TEXT DEFAULT 'Brąz',
      last_message_points INTEGER DEFAULT 0,
      last_voice_check INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Bets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      bet_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      match_id TEXT NOT NULL,
      fixture_id INTEGER NOT NULL,
      bet_type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      odds REAL NOT NULL,
      potential_win REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT DEFAULT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      settled_at INTEGER DEFAULT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  // Voice activity tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS voice_activity (
      user_id TEXT PRIMARY KEY,
      channel_id TEXT,
      join_time INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  console.log('✅ Database initialized successfully');
}

/**
 * Get or create user
 * @param {string} userId - Discord user ID
 * @returns {object} User object
 */
export function getUser(userId) {
  let user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  
  if (!user) {
    db.prepare('INSERT INTO users (user_id) VALUES (?)').run(userId);
    user = db.prepare('SELECT * FROM users WHERE user_id = ?').get(userId);
  }
  
  return user;
}

/**
 * Update user balance
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to add (can be negative)
 */
export function updateBalance(userId, amount) {
  db.prepare('UPDATE users SET balance = balance + ? WHERE user_id = ?').run(amount, userId);
}

/**
 * Update user total points and balance
 * @param {string} userId - Discord user ID
 * @param {number} points - Points to add
 * @returns {object} Updated user
 */
export function addPoints(userId, points) {
  db.prepare(`
    UPDATE users 
    SET balance = balance + ?, 
        total_points = total_points + ? 
    WHERE user_id = ?
  `).run(points, points, userId);
  
  return getUser(userId);
}

/**
 * Update user rank
 * @param {string} userId - Discord user ID
 * @param {string} rankName - New rank name
 */
export function updateRank(userId, rankName) {
  db.prepare('UPDATE users SET current_rank = ? WHERE user_id = ?').run(rankName, userId);
}

/**
 * Update last message points timestamp
 * @param {string} userId - Discord user ID
 * @param {number} timestamp - Unix timestamp
 */
export function updateLastMessagePoints(userId, timestamp) {
  db.prepare('UPDATE users SET last_message_points = ? WHERE user_id = ?').run(timestamp, userId);
}

/**
 * Create a new bet
 * @param {object} betData - Bet data
 * @returns {object} Created bet
 */
export function createBet(betData) {
  const result = db.prepare(`
    INSERT INTO bets (user_id, match_id, fixture_id, bet_type, amount, odds, potential_win)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    betData.userId,
    betData.matchId,
    betData.fixtureId,
    betData.betType,
    betData.amount,
    betData.odds,
    betData.potentialWin
  );
  
  return db.prepare('SELECT * FROM bets WHERE bet_id = ?').get(result.lastInsertRowid);
}

/**
 * Get user's active bets
 * @param {string} userId - Discord user ID
 * @returns {array} Array of bets
 */
export function getUserActiveBets(userId) {
  return db.prepare('SELECT * FROM bets WHERE user_id = ? AND status = ?').all(userId, 'pending');
}

/**
 * Get all pending bets
 * @returns {array} Array of pending bets
 */
export function getAllPendingBets() {
  return db.prepare('SELECT * FROM bets WHERE status = ?').all('pending');
}

/**
 * Settle a bet
 * @param {number} betId - Bet ID
 * @param {string} result - Result ('win', 'loss', 'void')
 */
export function settleBet(betId, result) {
  const bet = db.prepare('SELECT * FROM bets WHERE bet_id = ?').get(betId);
  
  if (!bet) return;
  
  const now = Math.floor(Date.now() / 1000);
  
  if (result === 'win') {
    const winAmount = Math.floor(bet.potential_win);
    updateBalance(bet.user_id, winAmount);
    db.prepare('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?')
      .run('settled', 'win', now, betId);
  } else if (result === 'loss') {
    db.prepare('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?')
      .run('settled', 'loss', now, betId);
  } else if (result === 'void') {
    updateBalance(bet.user_id, bet.amount);
    db.prepare('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?')
      .run('settled', 'void', now, betId);
  }
}

/**
 * Track user joining voice channel
 * @param {string} userId - Discord user ID
 * @param {string} channelId - Voice channel ID
 */
export function trackVoiceJoin(userId, channelId) {
  const now = Math.floor(Date.now() / 1000);
  db.prepare(`
    INSERT OR REPLACE INTO voice_activity (user_id, channel_id, join_time)
    VALUES (?, ?, ?)
  `).run(userId, channelId, now);
}

/**
 * Track user leaving voice channel and award points
 * @param {string} userId - Discord user ID
 * @returns {number} Points awarded
 */
export function trackVoiceLeave(userId) {
  const activity = db.prepare('SELECT * FROM voice_activity WHERE user_id = ?').get(userId);
  
  if (!activity) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  const minutesInVoice = Math.floor((now - activity.join_time) / 60);
  const pointsToAward = Math.floor(minutesInVoice / 5);
  
  if (pointsToAward > 0) {
    addPoints(userId, pointsToAward);
  }
  
  db.prepare('DELETE FROM voice_activity WHERE user_id = ?').run(userId);
  
  return pointsToAward;
}

/**
 * Get all users in voice channels
 * @returns {array} Array of voice activity records
 */
export function getAllVoiceActivity() {
  return db.prepare('SELECT * FROM voice_activity').all();
}

export default db;
