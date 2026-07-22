const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const { TOKEN, OWNER_ID, COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Force sync all slash commands (Owner only)'),

  async execute(interaction) {
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ This command is restricted to the bot owner.'),
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const commands = [];
    const commandsPath = path.join(__dirname);
    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
      const cmd = require(path.join(commandsPath, file));
      if (cmd.data) commands.push(cmd.data.toJSON());
    }

    const rest = new REST().setToken(TOKEN);
    await rest.put(
      Routes.applicationCommands(interaction.client.user.id),
      { body: commands }
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`✅ Synced **${commands.length}** slash command(s) globally.`),
      ],
    });
  },
};
