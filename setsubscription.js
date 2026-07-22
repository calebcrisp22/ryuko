const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setSubscription } = require('../database');
const { COLORS } = require('../config');

function parseDuration(str) {
  // e.g. 7d, 30d, 2h, 60m
  const match = str.match(/^(\d+)(d|h|m|s)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'd') return n * 86400000;
  if (unit === 'h') return n * 3600000;
  if (unit === 'm') return n * 60000;
  if (unit === 's') return n * 1000;
  return null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setsubscription')
    .setDescription('Grant a user a Premium subscription (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to grant subscription').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duration').setDescription('Duration (e.g. 7d, 30d, 2h)').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const target   = interaction.options.getUser('user');
    const durStr   = interaction.options.getString('duration');
    const durMs    = parseDuration(durStr);

    if (!durMs) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ Invalid duration. Use formats like `7d`, `30d`, `12h`, `60m`.'),
        ],
      });
    }

    const expiresAt = setSubscription(target.id, durMs, interaction.user.username);
    const expiresDate = new Date(expiresAt);

    // Format time remaining
    const totalSecs = Math.floor(durMs / 1000);
    const days  = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    const mins  = Math.floor((totalSecs % 3600) / 60);
    const secs  = totalSecs % 60;
    const timeStr = `${days}d ${hours}h ${mins}m ${secs}s`;

    // DM the user
    const dmEmbed = new EmbedBuilder()
      .setColor(COLORS.PREMIUM)
      .setTitle('💎 Premium Subscription Activated!')
      .setDescription(
        `You now have **Premium** access to the account generator!\n\n` +
        `🕐 **Duration**\n${durStr}\n` +
        `⏳ **Time Left**\n${timeStr}\n` +
        `📋 **How to use**\nUse \`/generate Premium\` to get premium accounts!\n\n` +
        `Granted by ${interaction.user.username}`
      )
      .setTimestamp();

    try {
      await target.send({ embeds: [dmEmbed] });
    } catch {
      // DMs closed
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`✅ Granted **${durStr}** Premium subscription to ${target}.`),
      ],
    });
  },
};
