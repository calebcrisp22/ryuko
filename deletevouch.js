const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { deleteVouch } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletevouch')
    .setDescription('Delete a vouch by ID (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName('id').setDescription('Vouch ID (use /vouches to find it)').setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const id = interaction.options.getInteger('id');
    deleteVouch(id);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARN)
          .setDescription(`🗑️ Vouch **#${id}** deleted.`),
      ],
      ephemeral: true,
    });
  },
};
