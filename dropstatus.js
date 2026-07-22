const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getSetting, getDropStock } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dropstatus')
    .setDescription('Check drop event status')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const active = getSetting('drop_active') === '1';
    const count  = getDropStock();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(active ? COLORS.DROP : COLORS.STOCK)
          .setTitle('🎁 Drop Status')
          .addFields(
            { name: 'Status', value: active ? '🟢 Active' : '🔴 Inactive', inline: true },
            { name: 'Accounts in Pool', value: String(count), inline: true },
          ),
      ],
      ephemeral: true,
    });
  },
};
