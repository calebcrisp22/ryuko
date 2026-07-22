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
        .setDescription('Accounts (one per line: email:pass|username|level|items|2fa|banned|renown|credits|platforms|lastplayed|ranks|wanteditems)')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const category = interaction.options.getString('category');
    const raw      = interaction.options.getString('accounts');
    const lines    = raw.split('\n').map(l => l.trim()).filter(Boolean);

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
