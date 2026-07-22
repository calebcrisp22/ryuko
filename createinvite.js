const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createinvite')
    .setDescription('Create a server invite (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName('max_uses')
        .setDescription('Max uses (0 = unlimited)')
        .setMinValue(0)
        .setMaxValue(100)
    )
    .addIntegerOption(opt =>
      opt.setName('max_age')
        .setDescription('Expires after (hours, 0 = never)')
        .setMinValue(0)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const maxUses = interaction.options.getInteger('max_uses') ?? 0;
    const maxAge  = (interaction.options.getInteger('max_age') ?? 0) * 3600;

    const channel = interaction.channel;
    if (!channel) return interaction.editReply({ content: '❌ Cannot create invite here.' });

    const invite = await channel.createInvite({
      maxUses,
      maxAge,
      unique: true,
    }).catch(() => null);

    if (!invite) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(COLORS.ERROR).setDescription('❌ Failed to create invite (missing permissions).'),
        ],
      });
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle('📨 Invite Created')
          .setDescription(`**Link:** https://discord.gg/${invite.code}`)
          .addFields(
            { name: 'Max Uses', value: maxUses === 0 ? 'Unlimited' : String(maxUses), inline: true },
            { name: 'Expires', value: maxAge === 0 ? 'Never' : `${interaction.options.getInteger('max_age')}h`, inline: true },
          )
          .setTimestamp(),
      ],
    });
  },
};
