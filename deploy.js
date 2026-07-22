require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID in .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) {
    commands.push(cmd.data.toJSON());
    console.log(`  ✓ Loaded: /${cmd.data.name}`);
  }
}

const rest = new REST().setToken(TOKEN);

(async () => {
  try {
    if (GUILD_ID) {
      console.log(`\n🔄 Deploying ${commands.length} slash commands to guild ${GUILD_ID} (instant sync)...`);
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log(`✅ Successfully deployed ${commands.length} commands to guild ${GUILD_ID}!`);
      console.log('\nGuild commands update instantly and are perfect for testing.');
      console.log('Remove GUILD_ID from your .env to deploy globally for production instead.');
    } else {
      console.log(`\n🔄 Deploying ${commands.length} slash commands globally...`);
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log(`✅ Successfully deployed ${commands.length} commands!`);
      console.log('\nNote: Global commands may take up to 1 hour to appear everywhere.');
      console.log('For instant testing, set a GUILD_ID env var to deploy to a single guild instead.');
    }
  } catch (err) {
    console.error('❌ Deploy failed:', err);
  }
})();
