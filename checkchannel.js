const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkchannel')
    .setDescription('Check configured channels (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const genId = getSetting('gen_channel');
    const logId = getSetting('log_channel');

    const gen = genId ? `<#${genId}>` : '`Not set`';
    const log = logId ? `<#${logId}>` : '`Not set`';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.STOCK)
          .setTitle('📋 Channel Configuration')
          .addFields(
            { name: '🎮 Gen Channel', value: gen, inline: true },
            { name: '📝 Log Channel', value: log, inline: true },
          ),
      ],
      ephemeral: true,
    });
  },
};
