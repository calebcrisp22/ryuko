const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set bot channels (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Which channel to set')
        .setRequired(true)
        .addChoices(
          { name: 'Gen Channel (public generate announcements)', value: 'gen_channel' },
          { name: 'Log Channel (admin logs)', value: 'log_channel' },
        )
    )
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('The channel').setRequired(true)
    ),

  async execute(interaction) {
    const type    = interaction.options.getString('type');
    const channel = interaction.options.getChannel('channel');

    setSetting(type, channel.id);

    const label = type === 'gen_channel' ? 'Gen Channel' : 'Log Channel';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`✅ **${label}** set to ${channel}`),
      ],
      ephemeral: true,
    });
  },
};
