# Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Discord Server                           │
│  ┌───────────────┐  ┌─────────────┐  ┌────────────────────┐   │
│  │  Text Channel │  │ Voice Channel│  │  User Interactions │   │
│  │   Messages    │  │   Activity   │  │  Slash Commands    │   │
│  └───────┬───────┘  └──────┬──────┘  └─────────┬──────────┘   │
└──────────┼──────────────────┼──────────────────┼───────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Discord Bot (index.js)                    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Event Handlers                        │  │
│  │  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │messageCreate│ │voiceStateUpdate│ │interactionCreate│  │  │
│  │  └──────┬──────┘ └──────┬────────┘ └────────┬─────────┘  │  │
│  └─────────┼───────────────┼──────────────────┼────────────┘  │
│            │               │                  │                │
│            ▼               ▼                  ▼                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                  Service Layer                           │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │  │
│  │  │pointsService │ │bettingService│ │   footballApi   │ │  │
│  │  └──────┬───────┘ └──────┬───────┘ └────────┬────────┘ │  │
│  └─────────┼────────────────┼──────────────────┼──────────┘  │
│            │                │                  │               │
│            └────────────────┴──────────────────┘               │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │            Database Service (database.js)                │  │
│  │  ┌────────┐  ┌──────┐  ┌─────────────────┐             │  │
│  │  │ Users  │  │ Bets │  │ Voice Activity  │             │  │
│  │  └────────┘  └──────┘  └─────────────────┘             │  │
│  └──────────────────────┬──────────────────────────────────┘  │
│                         ▼                                      │
│               ┌──────────────────┐                            │
│               │   bot.db (SQLite)│                            │
│               └──────────────────┘                            │
└───────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Entry Point
- **index.js**: Bot initialization, command and event loading, Discord client setup

### Commands (7 total)
```
commands/
├── balance.js      → Show user balance, points, and rank
├── mecze.js        → Display upcoming football matches
├── postaw.js       → Place a bet on a match
├── zaklady.js      → Show user's active bets
├── statystyki.js   → Show user betting statistics
├── ranking.js      → Display top 10 players
└── pomoc.js        → Help and bot information
```

### Events (4 handlers)
```
events/
├── ready.js              → Bot startup, database init, bet settlement scheduler
├── messageCreate.js      → Award points for messages (with cooldown)
├── voiceStateUpdate.js   → Track voice activity, award points on leave
└── interactionCreate.js  → Handle commands, buttons, modals
```

### Services (4 modules)
```
services/
├── database.js       → SQLite operations, user/bet management
├── pointsService.js  → Points awarding logic, rank promotion checks
├── bettingService.js → Bet placement, settlement, statistics
└── footballApi.js    → Match data fetching, odds retrieval
```

### Supporting Modules
```
ranks/
├── thresholds.js     → Rank definitions with thresholds and colors
└── rankCalculator.js → Rank calculation and promotion detection

utils/
└── formatters.js     → Date, points, odds formatting utilities
```

## Data Flow Examples

### 1. User Sends Message
```
User types message
    ↓
messageCreate event
    ↓
pointsService.awardMessagePoints()
    ↓
Check cooldown (5 min)
    ↓
database.addPoints()
    ↓
rankCalculator.checkPromotion()
    ↓
If promoted → Send DM
```

### 2. User Places Bet
```
User clicks /mecze
    ↓
Display matches with buttons
    ↓
User clicks bet button
    ↓
Show modal for amount
    ↓
User submits amount
    ↓
bettingService.placeBet()
    ↓
Validate balance
    ↓
database.createBet()
    ↓
Deduct points from balance
    ↓
Show confirmation embed
```

### 3. Voice Activity
```
User joins voice
    ↓
voiceStateUpdate event
    ↓
database.trackVoiceJoin()
    ↓
... user stays in voice ...
    ↓
User leaves voice
    ↓
voiceStateUpdate event
    ↓
Calculate minutes
    ↓
Award points (1 per 5 min)
    ↓
Check for rank promotion
    ↓
If promoted → Send DM
```

### 4. Bet Settlement
```
Every 10 minutes (timer)
    ↓
bettingService.settlePendingBets()
    ↓
footballApi.checkMatchResult()
    ↓
For each finished match:
    - Determine winner
    - Check bet result
    - Award winnings if won
    - Update bet status
    ↓
database.settleBet()
```

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  balance INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  current_rank TEXT DEFAULT 'Brąz',
  last_message_points INTEGER DEFAULT 0,
  last_voice_check INTEGER DEFAULT 0,
  created_at INTEGER
);

-- Bets table
CREATE TABLE bets (
  bet_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  match_id TEXT NOT NULL,
  fixture_id INTEGER NOT NULL,
  bet_type TEXT NOT NULL,        -- 'home', 'draw', 'away'
  amount INTEGER NOT NULL,
  odds REAL NOT NULL,
  potential_win REAL NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'settled'
  result TEXT,                   -- 'win', 'loss', 'void'
  created_at INTEGER,
  settled_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Voice activity tracking
CREATE TABLE voice_activity (
  user_id TEXT PRIMARY KEY,
  channel_id TEXT,
  join_time INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

## Configuration Files

### config.json
- Points per message
- Message cooldown
- Voice points interval
- Supported leagues/competitions
- Embed colors
- Bot presence

### ranks/thresholds.js
- Rank definitions
- Point thresholds
- Colors and emojis

## External Dependencies

- **discord.js** (v14.14.1): Discord API wrapper
- **sql.js** (v1.10.2): SQLite database (pure JavaScript)
- **axios** (v1.6.5): HTTP client for API calls
- **dotenv** (v16.3.1): Environment variable management

## Error Handling Strategy

1. **Command Level**: Try-catch in each command's execute()
2. **Service Level**: Validation before operations
3. **Database Level**: Transaction safety, foreign keys
4. **API Level**: Fallback to mock data if API fails
5. **Discord Level**: Error embeds for user feedback

## Security Measures

- ✅ Environment variables for sensitive data
- ✅ Input validation on all user inputs
- ✅ Minimum bet requirements
- ✅ Balance checks before betting
- ✅ Rate limiting via cooldowns
- ✅ No SQL injection (prepared statements)
- ✅ No token exposure in code

---

**Design Philosophy**: Clean, modular, maintainable, and user-friendly
