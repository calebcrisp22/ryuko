const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addVouch, getSetting } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Vouch for a user')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to vouch for').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('message').setDescription('Vouch message').setRequired(true)
    ),

  async execute(interaction) {
    const target  = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    if (target.id === interaction.user.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(COLORS.ERROR).setDescription('❌ You cannot vouch for yourself.'),
        ],
        ephemeral: true,
      });
    }

    addVouch(interaction.user.id, target.id, message);

    const botName = getSetting('bot_name') || 'Generator';

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('✅ Vouch Added')
          .setDescription(`${interaction.user} vouched for ${target}\n\n> ${message}`)
          .setFooter({ text: botName })
          .setTimestamp(),
      ],
    });
  },
};
