require('dotenv').config();

const {
  Client, GatewayIntentBits, Collection, Events,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} = require('discord.js');

const fs   = require('fs');
const path = require('path');
const { TOKEN, OWNER_ID, COLORS } = require('./config');
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

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  c.user.setActivity('/generate', { type: 3 }); // Watching
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
