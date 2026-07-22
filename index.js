require('dotenv').config();

const {
  Client, GatewayIntentBits, Collection, Events,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
  REST, Routes,
} = require('discord.js');

const fs   = require('fs');
const path = require('path');
const { TOKEN, CLIENT_ID, OWNER_ID, COLORS } = require('./config');

const GUILD_ID = process.env.GUILD_ID;
const {
  getSetting, confirmClaim, incrementJoins, getSubscription, isPremium,
} = require('./database');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (!fs.existsSync(commandsPath)) {
  console.warn(`⚠️  Commands directory not found at ${commandsPath}, creating it.`);
  fs.mkdirSync(commandsPath, { recursive: true });
}

if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const command = require(path.join(commandsPath, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  c.user.setActivity('/generate', { type: 3 }); // Watching

  // ── Auto-deploy slash commands so they always stay in sync with Discord ──
  if (!CLIENT_ID || !GUILD_ID) {
    console.warn('⚠️  Skipping command auto-deploy: missing CLIENT_ID or GUILD_ID in .env');
  } else {
    try {
      const commands = client.commands.map(cmd => cmd.data.toJSON());
      const rest = new REST().setToken(TOKEN);
      console.log(`🔄 Auto-deploying ${commands.length} slash commands to guild ${GUILD_ID}...`);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✅ Successfully deployed ${commands.length} commands to guild ${GUILD_ID}!`);
    } catch (err) {
      console.error('❌ Auto-deploy of commands failed:', err);
    }
  }
});

// Track joins
client.on(Events.GuildMemberAdd, () => {
  incrementJoins();
});

// ── Slash command handler ────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`Error in /${interaction.commandName}:`, err);
      const msg = { content: '❌ An error occurred running that command.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
    return;
  }

  // ── Button handler ───────────────────────────────────────────────────────
  if (interaction.isButton()) {
    const [action, ...args] = interaction.customId.split(':');

    if (action === 'copy_creds') {
      const creds = Buffer.from(args[0], 'base64').toString('utf8');
      await interaction.reply({
        content: `\`\`\`${creds}\`\`\`\nCopy the credentials above. Do NOT share them!`,
        ephemeral: true,
      });
      return;
    }

    if (action === 'how_to_link') {
      const howTo = getSetting('how_to_link') || 'Link instructions not configured. Ask an admin.';
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.PREMIUM)
            .setTitle('❓ How to Link')
            .setDescription(howTo)
            .setFooter({ text: getSetting('bot_name') || 'Generator' }),
        ],
        ephemeral: true,
      });
      return;
    }
  }
});

client.login(TOKEN);
