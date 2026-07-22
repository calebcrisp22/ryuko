const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Configure bot settings (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(opt =>
      opt.setName('gen_channel')
        .setDescription('The channel where generation announcements are posted')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('gen_image_free')
        .setDescription('Banner image URL for free account announcements')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('gen_image_premium')
        .setDescription('Banner image URL for premium account announcements')
        .setRequired(false)
    ),

  async execute(interaction) {
    const genChannel = interaction.options.getChannel('gen_channel');
    const genImageFree = interaction.options.getString('gen_image_free');
    const genImagePremium = interaction.options.getString('gen_image_premium');

    if (!genChannel && !genImageFree && !genImagePremium) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ You must provide at least one setting to update.'),
        ],
        ephemeral: true,
      });
    }

    const updates = [];

    if (genChannel) {
      setSetting('gen_channel', genChannel.id);
      updates.push(`**Gen Channel** set to ${genChannel}`);
    }

    if (genImageFree) {
      setSetting('gen_image_free', genImageFree);
      updates.push(`**Gen Image (Free)** set to ${genImageFree}`);
    }

    if (genImagePremium) {
      setSetting('gen_image_premium', genImagePremium);
      updates.push(`**Gen Image (Premium)** set to ${genImagePremium}`);
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Settings Updated')
      .setDescription(updates.map(u => `• ${u}`).join('\n'));

    if (genImageFree) embed.setImage(genImageFree);
    else if (genImagePremium) embed.setImage(genImagePremium);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
