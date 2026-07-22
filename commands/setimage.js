const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setImageUrl } = require('../database');
const { COLORS } = require('../config');

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setimage')
    .setDescription('Set the banner image used across bot embeds (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addAttachmentOption(opt =>
      opt.setName('image')
        .setDescription('Image file to use as the banner (jpg, jpeg, png, gif, webp)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const attachment = interaction.options.getAttachment('image');

    if (!attachment) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ No image attachment was provided.'),
        ],
      });
    }

    const extension = attachment.name?.split('.').pop()?.toLowerCase();
    const contentType = attachment.contentType?.toLowerCase() || '';

    const validExtension = extension && ALLOWED_EXTENSIONS.includes(extension);
    const validContentType = ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type));

    if (!validExtension && !validContentType) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription(
              `❌ Invalid file type. Please upload one of: **${ALLOWED_EXTENSIONS.join(', ')}**.`
            ),
        ],
      });
    }

    try {
      // Confirm the file is actually reachable/downloadable before saving.
      const response = await fetch(attachment.url);
      if (!response.ok) {
        throw new Error(`Failed to download attachment (status ${response.status})`);
      }

      setImageUrl(attachment.url);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle('✅ Banner Image Updated')
            .setDescription('The banner image has been saved successfully.')
            .setImage(attachment.url),
        ],
      });
    } catch (err) {
      console.error('setimage download error:', err);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ Failed to download the provided image. Please try again with a different file.'),
        ],
      });
    }
  },
};
