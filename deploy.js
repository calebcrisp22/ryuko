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

if (!GUILD_ID) {
  console.error('❌ Missing GUILD_ID in .env');
  console.error('This bot only deploys commands to a single guild to avoid duplicate commands.');
  console.error('Set GUILD_ID in your .env to the ID of the guild you want to deploy commands to.');
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
    console.log(`\n🔄 Deploying ${commands.length} slash commands to guild ${GUILD_ID} (instant sync)...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ Successfully deployed ${commands.length} commands to guild ${GUILD_ID}!`);
    console.log('\nCommands are only deployed to this guild, so there will be no duplicates.');
  } catch (err) {
    console.error('❌ Deploy failed:', err);
  }
})();
