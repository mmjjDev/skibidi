import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../services/database.js';
import { getUser } from '../services/database.js';
import { calculateRank } from '../ranks/rankCalculator.js';
import { formatPoints } from '../utils/formatters.js';

export default {
  data: new SlashCommandBuilder()
    .setName('statystyki')
    .setDescription('Zobacz swoje statystyki zakładów'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId);

      // Get betting statistics
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_bets,
          SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
          SUM(CASE WHEN result = 'win' THEN potential_win ELSE 0 END) as total_won,
          SUM(CASE WHEN result = 'loss' THEN amount ELSE 0 END) as total_lost,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM bets 
        WHERE user_id = ?
      `).get(userId);

      const currentRank = calculateRank(user.total_points);
      
      const totalSettled = (stats.wins || 0) + (stats.losses || 0);
      const winRate = totalSettled > 0 ? ((stats.wins || 0) / totalSettled * 100).toFixed(1) : 0;
      const profit = (stats.total_won || 0) - (stats.total_lost || 0);

      const embed = new EmbedBuilder()
        .setColor(currentRank.color)
        .setTitle('📊 Twoje Statystyki')
        .setDescription(`Statystyki gracza ${interaction.user.username}`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          {
            name: '💰 Profil',
            value: `**Ranga:** ${currentRank.emoji} ${currentRank.name}\n` +
                   `**Balans:** ${formatPoints(user.balance)} punktów\n` +
                   `**Suma punktów:** ${formatPoints(user.total_points)} punktów`,
            inline: false
          },
          {
            name: '🎲 Zakłady',
            value: `**Łącznie postawionych:** ${stats.total_bets || 0}\n` +
                   `**Rozliczone:** ${totalSettled}\n` +
                   `**Oczekujące:** ${(stats.total_bets || 0) - totalSettled}`,
            inline: true
          },
          {
            name: '📈 Wyniki',
            value: `**Wygrane:** ${stats.wins || 0} ✅\n` +
                   `**Przegrane:** ${stats.losses || 0} ❌\n` +
                   `**Skuteczność:** ${winRate}%`,
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: true
          },
          {
            name: '💎 Bilans zakładów',
            value: `**Wygrane punkty:** ${formatPoints(Math.floor(stats.total_won || 0))}\n` +
                   `**Przegrane punkty:** ${formatPoints(stats.total_lost || 0)}\n` +
                   `**Zysk/Strata:** ${profit >= 0 ? '+' : ''}${formatPoints(Math.floor(profit))}`,
            inline: true
          },
          {
            name: '⏳ Aktywne zakłady',
            value: `**Wartość:** ${formatPoints(stats.pending_amount || 0)} punktów`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: 'Statystyki zakładów' });

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Error in statystyki command:', error);
      await interaction.reply({
        content: '❌ Wystąpił błąd podczas pobierania statystyk.',
        ephemeral: true
      });
    }
  }
};
