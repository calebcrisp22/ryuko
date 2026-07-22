const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVouches, getSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouches')
    .setDescription('View vouches for a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to check').setRequired(true)
    ),

  async execute(interaction) {
    const target  = interaction.options.getUser('user');
    const vouches = getVouches(target.id);
    const botName = getSetting('bot_name') || 'Generator';

    if (vouches.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARN)
            .setDescription(`❌ No vouches found for ${target}.`),
        ],
        ephemeral: true,
      });
    }

    const lines = vouches.map((v, i) =>
      `**#${v.id}** — <@${v.from_user}>: ${v.message}`
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.STOCK)
          .setTitle(`📋 Vouches for ${target.username}`)
          .setDescription(lines.join('\n'))
          .setFooter({ text: `${vouches.length} vouch(es) | ${botName}` })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
