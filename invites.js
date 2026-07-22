const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invites')
    .setDescription('View your server invites'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    if (!guild) return interaction.editReply({ content: '❌ Guild not found.' });

    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(COLORS.ERROR).setDescription('❌ Could not fetch invites (missing permissions).'),
        ],
      });
    }

    const userInvites = invites.filter(inv => inv.inviter?.id === interaction.user.id);

    if (userInvites.size === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARN)
            .setDescription('📨 You have no active invites.'),
        ],
      });
    }

    const lines = userInvites.map(inv =>
      `**${inv.code}** — Uses: **${inv.uses}** | Max: ${inv.maxUses || '∞'}`
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.STOCK)
          .setTitle('📨 Your Invites')
          .setDescription(lines.join('\n'))
          .setTimestamp(),
      ],
    });
  },
};
