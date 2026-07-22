const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cleardropstock')
    .setDescription('Clear all accounts from the drop pool (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const count = db.prepare('SELECT COUNT(*) as cnt FROM drop_accounts').get().cnt;
    db.prepare('DELETE FROM drop_accounts').run();

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARN)
          .setDescription(`🗑️ Cleared **${count}** account(s) from the drop pool.`),
      ],
      ephemeral: true,
    });
  },
};
