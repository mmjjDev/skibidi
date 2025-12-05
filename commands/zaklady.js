import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getActiveBets } from '../services/bettingService.js';
import { formatPoints, formatOdds, formatDate } from '../utils/formatters.js';
import config from '../config.json' with { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('zakłady')
    .setDescription('Zobacz swoje aktywne zakłady'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const bets = getActiveBets(userId);

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('🎲 Twoje aktywne zakłady')
        .setTimestamp()
        .setFooter({ text: 'System zakładów' });

      if (!bets || bets.length === 0) {
        embed.setDescription('Nie masz aktywnych zakładów.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const betTypeNames = {
        home: 'Wygrana gospodarzy 🏠',
        draw: 'Remis 🤝',
        away: 'Wygrana gości ✈️'
      };

      let totalStaked = 0;
      let totalPotential = 0;

      for (const bet of bets) {
        totalStaked += bet.amount;
        totalPotential += Math.floor(bet.potential_win);

        const betDate = new Date(bet.created_at * 1000);
        
        embed.addFields({
          name: `Zakład #${bet.bet_id}`,
          value: `**Mecz:** ${bet.match_id}\n` +
                 `**Typ:** ${betTypeNames[bet.bet_type]}\n` +
                 `**Stawka:** ${formatPoints(bet.amount)} punktów\n` +
                 `**Kurs:** ${formatOdds(bet.odds)}\n` +
                 `**Potencjalna wygrana:** ${formatPoints(Math.floor(bet.potential_win))} punktów\n` +
                 `**Data:** ${formatDate(betDate)}`,
          inline: false
        });
      }

      embed.setDescription(
        `Masz **${bets.length}** aktywny${bets.length === 1 ? '' : 'ch'} zakład${bets.length === 1 ? '' : 'ów'}.\n\n` +
        `💰 Łączna stawka: **${formatPoints(totalStaked)}** punktów\n` +
        `🎁 Potencjalna wygrana: **${formatPoints(totalPotential)}** punktów`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in zakłady command:', error);
      await interaction.reply({
        content: '❌ Wystąpił błąd podczas pobierania zakładów.',
        ephemeral: true
      });
    }
  }
};
