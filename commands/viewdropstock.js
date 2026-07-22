const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getDropStock } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewdropstock')
    .setDescription('View drop event stock count')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const count = getDropStock();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.DROP)
          .setTitle('🎁 Drop Stock')
          .setDescription(`**${count}** account(s) ready in the drop pool.`),
      ],
      ephemeral: true,
    });
  },
};
