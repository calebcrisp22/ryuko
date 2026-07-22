const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { setSetting, getSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('edit')
    .setDescription('Edit bot settings (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('setting')
        .setDescription('Which setting to edit')
        .setRequired(true)
        .addChoices(
          { name: 'Free Gen Image URL',     value: 'gen_image_free'    },
          { name: 'Premium Gen Image URL',  value: 'gen_image_premium' },
          { name: 'Free Footer Text',       value: 'footer_free'       },
          { name: 'Premium Footer Text',    value: 'footer_premium'    },
          { name: 'How to Link Message',    value: 'how_to_link'       },
          { name: 'Bot Name',               value: 'bot_name'          },
        )
    )
    .addStringOption(opt =>
      opt.setName('value').setDescription('New value').setRequired(true)
    ),

  async execute(interaction) {
    const setting = interaction.options.getString('setting');
    const value   = interaction.options.getString('value');

    setSetting(setting, value);

    const labels = {
      gen_image_free:    'Free Gen Image URL',
      gen_image_premium: 'Premium Gen Image URL',
      footer_free:       'Free Footer Text',
      footer_premium:    'Premium Footer Text',
      how_to_link:       'How to Link Message',
      bot_name:          'Bot Name',
    };

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('✅ Setting Updated')
          .addFields(
            { name: 'Setting', value: labels[setting] || setting, inline: true },
            { name: 'New Value', value: value.length > 100 ? value.slice(0, 100) + '…' : value, inline: true },
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};
