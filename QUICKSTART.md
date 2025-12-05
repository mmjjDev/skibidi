# Quick Start Guide 🚀

Get your Discord betting bot up and running in 5 minutes!

## Prerequisites

- Node.js 18 or newer installed
- A Discord account
- Basic knowledge of Discord bot setup

## Step-by-Step Setup

### 1. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Copy your bot token (you'll need this later)

### 2. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd discord-betting-bot

# Install dependencies
npm install
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

Add your bot token:
```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
RAPIDAPI_KEY=your_rapidapi_key_here  # Optional - for real matches
```

**Where to find these values:**
- `BOT_TOKEN`: From Discord Developer Portal > Bot section
- `CLIENT_ID`: From Discord Developer Portal > OAuth2 > General
- `GUILD_ID`: Right-click your Discord server > Copy ID (enable Developer Mode first)
- `RAPIDAPI_KEY`: (Optional) From [RapidAPI API-Football](https://rapidapi.com/api-sports/api/api-football)

### 4. Invite Bot to Server

Generate invite link with required permissions:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your actual client ID and visit the link to invite the bot.

### 5. Register Commands

```bash
npm run deploy
```

Wait for "Successfully reloaded X application (/) commands" message.

### 6. Start the Bot

```bash
npm start
```

You should see:
```
✅ Loaded command: balance
✅ Loaded command: mecze
...
✅ Zalogowano jako YourBot#1234
✅ Database initialized successfully
🎲 Bot jest gotowy do działania!
```

## Testing

1. In Discord, type `/pomoc` to see all available commands
2. Type `/balance` to check your initial balance
3. Send some messages and wait 5 minutes - you'll earn points!
4. Type `/mecze` to see mock matches (or real ones if you added API key)

## Troubleshooting

**Bot doesn't respond to commands:**
- Make sure you ran `npm run deploy`
- Check if bot has proper permissions on your server
- Verify the bot token is correct in `.env`

**Commands not showing up:**
- Wait a few minutes (Discord can take time to update)
- Try kicking and re-inviting the bot
- Run `npm run deploy` again

**Points not being awarded:**
- Make sure Privileged Gateway Intents are enabled
- Check bot has permission to read messages
- Look at console for any error messages

**Database errors:**
- Delete `bot.db` file and restart the bot
- Make sure you have write permissions in the directory

## What's Next?

- Invite friends to your server
- Start betting on matches!
- Customize ranks in `ranks/thresholds.js`
- Modify point rewards in `config.json`
- Add your RapidAPI key for real match data

## Need Help?

Check the full [README.md](README.md) for detailed documentation.

---

**Happy betting! ⚽🎲**
