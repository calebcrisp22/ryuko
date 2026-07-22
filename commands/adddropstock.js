const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addDropAccounts, parseAccountLine } = require('../database');
const { COLORS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adddropstock')
    .setDescription('Add accounts to the drop pool (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('accounts')
        .setDescription('Accounts one per line: email:pass|username|level|items|2fa|banned|renown|credits')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const raw   = interaction.options.getString('accounts');
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    const valid   = [];
    const invalid = [];

    for (const line of lines) {
      const acc = parseAccountLine(line, 'drop');
      if (acc) valid.push(acc);
      else invalid.push(line);
    }

    if (valid.length === 0) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.ERROR)
            .setDescription('❌ No valid accounts found.'),
        ],
      });
    }

    // Strip 'category' field — drop table doesn't have it
    const dropAccs = valid.map(({ category, ...rest }) => rest);
    addDropAccounts(dropAccs);

    let desc = `✅ Added **${valid.length}** account(s) to the drop pool.`;
    if (invalid.length) desc += `\n⚠️ ${invalid.length} line(s) skipped (invalid format).`;

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(desc)],
    });
  },
};
