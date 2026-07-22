const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcooldown')
    .setDescription('Set generate cooldown in seconds (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Which tier')
        .setRequired(true)
        .addChoices(
          { name: 'Free', value: 'free' },
          { name: 'Premium', value: 'premium' },
        )
    )
    .addIntegerOption(opt =>
      opt.setName('seconds').setDescription('Cooldown in seconds').setRequired(true).setMinValue(0)
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category');
    const seconds  = interaction.options.getInteger('seconds');

    setSetting(`${category}_cooldown`, String(seconds));

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`✅ **${category}** cooldown set to **${seconds}** seconds.`),
      ],
      ephemeral: true,
    });
  },
};
