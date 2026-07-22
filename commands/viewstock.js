const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getFreeStock, getPremiumStock } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewstock')
    .setDescription('View current account stock'),

  async execute(interaction) {
    const free    = getFreeStock();
    const premium = getPremiumStock();

    const embed = new EmbedBuilder()
      .setColor(COLORS.STOCK)
      .setTitle('📦 Stock Status')
      .setDescription(
        `🆓 **Free**\n${free}\n\n` +
        `💎 **Premium**\n${premium}`
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
