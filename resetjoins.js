const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { resetJoins, getJoinCount } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetjoins')
    .setDescription('Reset the join counter to 0 (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const old = getJoinCount();
    resetJoins();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARN)
          .setDescription(`🔄 Join counter reset. Was **${old}**, now **0**.`),
      ],
      ephemeral: true,
    });
  },
};
