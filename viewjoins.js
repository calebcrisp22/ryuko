const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getJoinCount } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewjoins')
    .setDescription('View total server joins tracked by the bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const count = getJoinCount();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.STOCK)
          .setTitle('👥 Server Joins')
          .setDescription(`**${count}** member(s) have joined since last reset.`)
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
