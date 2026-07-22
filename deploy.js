require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const TOKEN    = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

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
    console.log(`\n🔄 Deploying ${commands.length} slash commands globally...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log(`✅ Successfully deployed ${commands.length} commands!`);
    console.log('\nNote: Global commands may take up to 1 hour to appear everywhere.');
    console.log('For instant testing, use guild commands by passing a GUILD_ID env var.');
  } catch (err) {
    console.error('❌ Deploy failed:', err);
  }
})();
