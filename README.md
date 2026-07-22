# Generator Bot 🎮

A Discord R6 account generator bot matching the DOKKAEBI-style UI shown in the screenshots.

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env` and fill in:
```
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_client_id   ← found at discord.com/developers → your app → OAuth2
OWNER_ID=your_discord_user_id
```

### 3. Set gen image (optional)
The bot defaults to a placeholder image. Use `/edit` → **Free Gen Image URL** / **Premium Gen Image URL**
to set a real R6 Siege Dokkaebi image URL (e.g. from imgur).

### 4. Deploy slash commands
```bash
npm run deploy
```
> Global commands take up to 1 hour. For instant testing during dev, add `GUILD_ID` to .env and update deploy.js to use `Routes.applicationGuildCommands`.

### 5. Start the bot
```bash
npm start
```

---

## Commands

### User Commands
| Command | Description |
|---------|-------------|
| `/generate [Free\|Premium]` | Generate an account — DMs you the details |
| `/viewstock` | View Free & Premium stock counts |
| `/vouch @user message` | Vouch for a user |
| `/invites` | View your active invites |

### Admin Commands (Manage Server)
| Command | Description |
|---------|-------------|
| `/addstock [free\|premium] accounts` | Add accounts to stock |
| `/setsubscription @user duration` | Grant Premium (e.g. `7d`, `30d`, `12h`) |
| `/setcooldown [free\|premium] seconds` | Set generate cooldown |
| `/setchannel [gen\|log] #channel` | Set gen / log channels |
| `/checkchannel` | View configured channels |
| `/adddropstock accounts` | Add to drop pool |
| `/viewdropstock` | View drop pool count |
| `/cleardropstock` | Clear drop pool |
| `/dropstart [count]` | Start a drop event |
| `/dropstatus` | Check drop event status |
| `/createinvite` | Create a server invite |
| `/edit setting value` | Edit bot settings (image, footer, bot name) |
| `/vouches @user` | View vouches for a user |
| `/deletevouch id` | Delete a vouch by ID |
| `/viewjoins` | View join counter |
| `/resetjoins` | Reset join counter |

### Owner Only
| Command | Description |
|---------|-------------|
| `/sync` | Force re-sync all slash commands |

---

## Adding Stock

Use `/addstock` with accounts **one per line** in this format:
```
email:password|username|level|items|2fa|banned|renown|credits|platforms|lastplayed|ranks|wanteditems
```

**Example:**
```
user@example.com:Pass123|Nptnz|125|364|Yes/No|No|20394|20|[PSN Linkable]|7 days ago|Platinum (Neon Dawn), Gold (Chimera)|None
```

All fields after `email:password` are optional — missing fields default to `Unknown` / `0`.

---

## Database
SQLite file `bot.db` is created automatically in the bot folder. No setup needed.

---

## Required Bot Permissions
- Read Messages / View Channels
- Send Messages
- Embed Links
- Create Invites
- Manage Guild (for admin commands)

## Required Privileged Intents (discord.com/developers)
- ✅ Server Members Intent
- ✅ Message Content Intent
