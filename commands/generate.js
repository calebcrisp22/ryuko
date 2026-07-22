const {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle,
} = require('discord.js');
const {
  getSetting, claimAccount, confirmClaim,
  getCooldown, setCooldown, isPremium,
} = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Generate an account from the stock')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Account category')
        .setRequired(true)
        .addChoices(
          { name: 'Free', value: 'free' },
          { name: 'Premium', value: 'premium' },
        )
    ),

  async execute(interaction, client) {
    await interaction.deferReply();

    const channel = interaction.channel;
    await channel.sendTyping();

    const category = interaction.options.getString('category');
    const userId   = interaction.user.id;
    const botName  = getSetting('bot_name') || 'Generator';

    // Premium gate
    if (category === 'premium' && !isPremium(userId)) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ You do not have a **Premium** subscription.\nContact an admin to get one.'),
        ],
      });
    }

    // Cooldown check
    const cooldownKey  = category;
    const cooldownSecs = parseInt(getSetting(`${cooldownKey}_cooldown`) || '300');
    const cd           = getCooldown(userId, category);
    if (cd) {
      const elapsed = Math.floor((Date.now() - cd.last_used) / 1000);
      const remaining = cooldownSecs - elapsed;
      if (remaining > 0) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.WARN)
              .setDescription(`🕐 Cooldown: **${remaining} seconds**`),
          ],
        });
      }
    }

    try {
      await interaction.user.send('⏳ Adding account to API...');
    } catch {}

    // Keep showing Discord's native typing indicator while we process
    const typingInterval = setInterval(() => {
      channel.sendTyping().catch(() => {});
    }, 5000);

    // Claim account
    const acc = claimAccount(category);
    if (!acc) {
      clearInterval(typingInterval);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription(`❌ No **${category}** accounts in stock right now. Check back later!`),
        ],
      });
    }

    // Confirm claim & set cooldown
    confirmClaim(acc.id, userId);
    setCooldown(userId, category);

    // Simulate processing time before revealing account details
    await new Promise(resolve => setTimeout(resolve, 10000));

    clearInterval(typingInterval);

    // ── Simple loading indicator in gen channel ─────────────────────────────
    const genChannelId = getSetting('gen_channel');

    if (genChannelId) {
      const genChannel = interaction.guild?.channels.cache.get(genChannelId);
      if (genChannel?.isTextBased()) {
        await genChannel.send('⏳ Generating `●●●`').catch(() => {});
      }
    }

    // ── DM embed ────────────────────────────────────────────────────────────
    const creds      = `${acc.email}:${acc.password}`;
    const credsB64   = Buffer.from(creds).toString('base64');
    const dmImageUrl = getSetting(`gen_image_${category}`) || null;

    const dmEmbed = new EmbedBuilder()
      .setColor(COLORS.DM)
      .setTitle(`Generated Account — ${acc.username}`)
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
        `🔑 **Login Credentials**\n\`\`\`${creds}\`\`\``
      )
      .setFooter({ text: `${botName} • Do NOT share your credentials with anyone` })
      .setTimestamp();

    if (dmImageUrl) {
      try {
        // Basic sanity check that the URL is well-formed before using it
        new URL(dmImageUrl);
        dmEmbed.setImage(dmImageUrl);
      } catch (err) {
        console.error(`[generate] Skipping invalid gen image URL for "${category}":`, err.message);
      }
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`copy_creds:${credsB64}`)
        .setLabel('Copy Email:Pass')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('how_to_link')
        .setLabel('How to Link')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Danger),
    );

    let dmSent = true;
    try {
      await interaction.user.send({ embeds: [dmEmbed], components: [row] });
    } catch {
      dmSent = false;
    }

    // Reply to user
    if (dmSent) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setDescription('✅ Your account has been sent to your DMs!'),
        ],
      });
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.WARN)
            .setTitle(`Generated Account — ${acc.username}`)
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
              `🔑 **Login Credentials**\n\`\`\`${creds}\`\`\`\n⚠️ Enable DMs to receive this in future.`
            )
            .setFooter({ text: `${botName} • Do NOT share your credentials with anyone` }),
        ],
        components: [row],
      });
    }
  },
};
