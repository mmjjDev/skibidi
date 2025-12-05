import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '..', 'bot.db');

// Initialize SQL.js and database
let SQL;
let db;

async function initDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
}

// Save database to file
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

// Initialize on module load
await initDb();

/**
 * Initialize database tables
 */
export function initializeDatabase() {
  // Users table
  db.run(`
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
  db.run(`
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
  db.run(`
    CREATE TABLE IF NOT EXISTS voice_activity (
      user_id TEXT PRIMARY KEY,
      channel_id TEXT,
      join_time INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(user_id)
    )
  `);

  saveDb();
  console.log('✅ Database initialized successfully');
}

/**
 * Get or create user
 * @param {string} userId - Discord user ID
 * @returns {object} User object
 */
export function getUser(userId) {
  const stmt = db.prepare('SELECT * FROM users WHERE user_id = ?');
  stmt.bind([userId]);
  let user = null;
  
  if (stmt.step()) {
    user = stmt.getAsObject();
  }
  stmt.free();
  
  if (!user) {
    db.run('INSERT INTO users (user_id) VALUES (?)', [userId]);
    saveDb();
    
    const stmt2 = db.prepare('SELECT * FROM users WHERE user_id = ?');
    stmt2.bind([userId]);
    if (stmt2.step()) {
      user = stmt2.getAsObject();
    }
    stmt2.free();
  }
  
  return user;
}

/**
 * Update user balance
 * @param {string} userId - Discord user ID
 * @param {number} amount - Amount to add (can be negative)
 */
export function updateBalance(userId, amount) {
  db.run('UPDATE users SET balance = balance + ? WHERE user_id = ?', [amount, userId]);
  saveDb();
}

/**
 * Update user total points and balance
 * @param {string} userId - Discord user ID
 * @param {number} points - Points to add
 * @returns {object} Updated user
 */
export function addPoints(userId, points) {
  db.run(`
    UPDATE users 
    SET balance = balance + ?, 
        total_points = total_points + ? 
    WHERE user_id = ?
  `, [points, points, userId]);
  saveDb();
  
  return getUser(userId);
}

/**
 * Update user rank
 * @param {string} userId - Discord user ID
 * @param {string} rankName - New rank name
 */
export function updateRank(userId, rankName) {
  db.run('UPDATE users SET current_rank = ? WHERE user_id = ?', [rankName, userId]);
  saveDb();
}

/**
 * Update last message points timestamp
 * @param {string} userId - Discord user ID
 * @param {number} timestamp - Unix timestamp
 */
export function updateLastMessagePoints(userId, timestamp) {
  db.run('UPDATE users SET last_message_points = ? WHERE user_id = ?', [timestamp, userId]);
  saveDb();
}

/**
 * Create a new bet
 * @param {object} betData - Bet data
 * @returns {object} Created bet
 */
export function createBet(betData) {
  db.run(`
    INSERT INTO bets (user_id, match_id, fixture_id, bet_type, amount, odds, potential_win)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    betData.userId,
    betData.matchId,
    betData.fixtureId,
    betData.betType,
    betData.amount,
    betData.odds,
    betData.potentialWin
  ]);
  saveDb();
  
  const stmt = db.prepare('SELECT * FROM bets WHERE bet_id = (SELECT MAX(bet_id) FROM bets)');
  let bet = null;
  if (stmt.step()) {
    bet = stmt.getAsObject();
  }
  stmt.free();
  
  return bet;
}

/**
 * Get user's active bets
 * @param {string} userId - Discord user ID
 * @returns {array} Array of bets
 */
export function getUserActiveBets(userId) {
  const stmt = db.prepare('SELECT * FROM bets WHERE user_id = ? AND status = ?');
  stmt.bind([userId, 'pending']);
  const bets = [];
  
  while (stmt.step()) {
    bets.push(stmt.getAsObject());
  }
  stmt.free();
  
  return bets;
}

/**
 * Get all pending bets
 * @returns {array} Array of pending bets
 */
export function getAllPendingBets() {
  const stmt = db.prepare('SELECT * FROM bets WHERE status = ?');
  stmt.bind(['pending']);
  const bets = [];
  
  while (stmt.step()) {
    bets.push(stmt.getAsObject());
  }
  stmt.free();
  
  return bets;
}

/**
 * Settle a bet
 * @param {number} betId - Bet ID
 * @param {string} result - Result ('win', 'loss', 'void')
 */
export function settleBet(betId, result) {
  const stmt = db.prepare('SELECT * FROM bets WHERE bet_id = ?');
  stmt.bind([betId]);
  let bet = null;
  
  if (stmt.step()) {
    bet = stmt.getAsObject();
  }
  stmt.free();
  
  if (!bet) return;
  
  const now = Math.floor(Date.now() / 1000);
  
  if (result === 'win') {
    const winAmount = Math.floor(bet.potential_win);
    updateBalance(bet.user_id, winAmount);
    db.run('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?',
      ['settled', 'win', now, betId]);
  } else if (result === 'loss') {
    db.run('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?',
      ['settled', 'loss', now, betId]);
  } else if (result === 'void') {
    updateBalance(bet.user_id, bet.amount);
    db.run('UPDATE bets SET status = ?, result = ?, settled_at = ? WHERE bet_id = ?',
      ['settled', 'void', now, betId]);
  }
  saveDb();
}

/**
 * Track user joining voice channel
 * @param {string} userId - Discord user ID
 * @param {string} channelId - Voice channel ID
 */
export function trackVoiceJoin(userId, channelId) {
  const now = Math.floor(Date.now() / 1000);
  db.run(`
    INSERT OR REPLACE INTO voice_activity (user_id, channel_id, join_time)
    VALUES (?, ?, ?)
  `, [userId, channelId, now]);
  saveDb();
}

/**
 * Track user leaving voice channel and award points
 * @param {string} userId - Discord user ID
 * @param {object} discordUser - Discord user object for DM notifications
 * @returns {number} Points awarded
 */
export function trackVoiceLeave(userId, discordUser = null) {
  const stmt = db.prepare('SELECT * FROM voice_activity WHERE user_id = ?');
  stmt.bind([userId]);
  let activity = null;
  
  if (stmt.step()) {
    activity = stmt.getAsObject();
  }
  stmt.free();
  
  if (!activity) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  const minutesInVoice = Math.floor((now - activity.join_time) / 60);
  const pointsToAward = Math.floor(minutesInVoice / 5);
  
  if (pointsToAward > 0) {
    const user = getUser(userId);
    const oldTotalPoints = user.total_points;
    
    addPoints(userId, pointsToAward);
    
    // Check for rank promotion if discordUser provided
    if (discordUser) {
      import('../ranks/rankCalculator.js').then(({ checkPromotion }) => {
        import('discord.js').then(({ EmbedBuilder }) => {
          const updatedUser = getUser(userId);
          const promotion = checkPromotion(oldTotalPoints, updatedUser.total_points);
          
          if (promotion) {
            updateRank(userId, promotion.name);
            
            // Send DM notification
            const embed = new EmbedBuilder()
              .setColor(promotion.color)
              .setTitle(`${promotion.emoji} Awans na nową rangę!`)
              .setDescription(`Gratulacje! Właśnie awansowałeś na rangę **${promotion.name}**!`)
              .addFields(
                { name: 'Nowa ranga', value: `${promotion.emoji} ${promotion.name}`, inline: true },
                { name: 'Twoje punkty', value: `${updatedUser.total_points} punktów`, inline: true }
              )
              .setTimestamp()
              .setFooter({ text: 'Gratulacje awansu!' });
            
            discordUser.send({ embeds: [embed] }).catch(error => {
              console.error(`Failed to send promotion DM to ${userId}:`, error.message);
            });
          }
        });
      });
    }
  }
  
  db.run('DELETE FROM voice_activity WHERE user_id = ?', [userId]);
  saveDb();
  
  return pointsToAward;
}

/**
 * Get all users in voice channels
 * @returns {array} Array of voice activity records
 */
export function getAllVoiceActivity() {
  const stmt = db.prepare('SELECT * FROM voice_activity');
  const activities = [];
  
  while (stmt.step()) {
    activities.push(stmt.getAsObject());
  }
  stmt.free();
  
  return activities;
}

export default db;
