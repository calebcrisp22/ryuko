const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addAccounts, parseAccountLine } = require('../database');
const { COLORS } = require('../config');

// Format per line:
// email:pass|username|level|items|2fa|banned|renown|credits|platforms|lastplayed|ranks|wanteditems
// Minimum: email:pass  (all others default to Unknown/0)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Add accounts to stock (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('free or premium')
        .setRequired(true)
        .addChoices(
          { name: 'Free', value: 'free' },
          { name: 'Premium', value: 'premium' },
        )
    )
    .addStringOption(opt =>
      opt.setName('accounts')
        .setDescription('Accounts format: email:pass|user|level|items|2fa|banned|renown|credits|platforms|lastplayed|ranks')
        .setRequired(false)
    )
    .addAttachmentOption(opt =>
      opt.setName('file')
        .setDescription('A .txt or .csv file containing accounts, one per line')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const category   = interaction.options.getString('category');
    const raw        = interaction.options.getString('accounts');
    const attachment = interaction.options.getAttachment('file');

    if (!raw && !attachment) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ You must provide either the `accounts` text option or a `file` attachment.'),
        ],
      });
    }

    let content = raw;

    if (attachment) {
      const name = attachment.name || '';
      if (!name.toLowerCase().endsWith('.txt') && !name.toLowerCase().endsWith('.csv')) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.ERROR)
              .setDescription('❌ Only `.txt` or `.csv` files are supported.'),
          ],
        });
      }

      try {
        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        content = await res.text();
      } catch (err) {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(COLORS.ERROR)
              .setDescription('❌ Failed to download or read the attached file.'),
          ],
        });
      }
    }

    const lines = (content || '').split('\n').map(l => l.trim()).filter(Boolean);

    const valid   = [];
    const invalid = [];

    for (const line of lines) {
      const acc = parseAccountLine(line, category);
      if (acc) valid.push(acc);
      else invalid.push(line);
    }

    if (valid.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ No valid accounts found. Format: `email:pass|username|level|...`'),
        ],
      });
    }

    addAccounts(valid);

    let desc = `✅ Added **${valid.length}** ${category} account(s) to stock.`;
    if (invalid.length > 0) desc += `\n⚠️ ${invalid.length} line(s) were invalid and skipped.`;

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setDescription(desc),
      ],
    });
  },
};
