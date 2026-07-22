const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getSetting, setSetting, getDropStock, claimDropAccount } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dropstart')
    .setDescription('Start a drop event — gives out accounts from drop pool (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('How many accounts to drop (leave blank for all)')
        .setMinValue(1)
    ),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const genChannelId = getSetting('gen_channel');
    if (!genChannelId) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ Gen channel not set. Use `/setchannel` first.'),
        ],
      });
    }

    const genChannel = interaction.guild?.channels.cache.get(genChannelId);
    if (!genChannel?.isTextBased()) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(COLORS.ERROR).setDescription('❌ Gen channel not found or not a text channel.'),
        ],
      });
    }

    const total   = getDropStock();
    const count   = interaction.options.getInteger('count') ?? total;
    const toDrop  = Math.min(count, total);
    const botName = getSetting('bot_name') || 'Generator';
    const imageUrl = getSetting('gen_image_free') || null;

    if (toDrop === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setColor(COLORS.ERROR).setDescription('❌ No accounts in the drop pool.'),
        ],
      });
    }

    setSetting('drop_active', '1');

    // Announce drop start
    const announceEmbed = new EmbedBuilder()
      .setColor(COLORS.DROP)
      .setTitle('🎁 DROP STARTING!')
      .setDescription(`**${toDrop}** account(s) are being dropped! Claim yours with \`/generate Free\`!`)
      .setTimestamp();

    await genChannel.send({ embeds: [announceEmbed] });

    // Drop accounts one by one with 2-second delay
    let dropped = 0;
    for (let i = 0; i < toDrop; i++) {
      const acc = claimDropAccount();
      if (!acc) break;

      const creds     = `${acc.email}:${acc.password}`;
      const footerText = getSetting('footer_free') || `${botName.toUpperCase()}⭐`;

      const dropEmbed = new EmbedBuilder()
        .setColor(COLORS.GEN)
        .setTitle('🎮 Account Dropped!')
        .setDescription(
          `**Username** ➡️ ${acc.username}\n` +
          `**Level** ➡️ ${acc.level}\n` +
          `**Items** ➡️ ${acc.items}\n` +
          `**2FA/Phone** ➡️ ${acc.twofa}\n` +
          `**Banned** ➡️ ${acc.banned}\n` +
          `**Renown** ➡️ ${acc.renown}\n` +
          `**Credits** ➡️ ${acc.credits}\n` +
          `**Platforms** ➡️ ${acc.platforms}\n` +
          `**Last Played** ➡️ ${acc.last_played}\n` +
          `**Wanted Ranks** ➡️ ${acc.wanted_ranks}\n` +
          `**Wanted Items** ➡️ ${acc.wanted_items}\n\n` +
          `🔑 **Credentials**\n\`\`\`${creds}\`\`\``
        )
        .setFooter({ text: footerText })
        .setTimestamp();

      if (imageUrl) dropEmbed.setImage(imageUrl);

      await genChannel.send({ embeds: [dropEmbed] });
      dropped++;

      if (i < toDrop - 1) await new Promise(r => setTimeout(r, 1500));
    }

    setSetting('drop_active', '0');

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(`✅ Drop complete! **${dropped}** account(s) sent.`),
      ],
    });
  },
};
