import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../services/database.js';
import { calculateRank } from '../ranks/rankCalculator.js';
import { formatPoints } from '../utils/formatters.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Zobacz ranking graczy'),

  async execute(interaction) {
    try {
      // Get top 10 users by total points
      const stmt = db.prepare(`
        SELECT user_id, balance, total_points, current_rank 
        FROM users 
        ORDER BY total_points DESC 
        LIMIT 10
      `);
      const topUsers = [];
      
      while (stmt.step()) {
        topUsers.push(stmt.getAsObject());
      }
      stmt.free();

      if (!topUsers || topUsers.length === 0) {
        await interaction.reply({
          content: '❌ Brak danych w rankingu.',
          ephemeral: true
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🏆 Ranking Graczy')
        .setDescription('Top 10 graczy według łącznej sumy punktów')
        .setTimestamp()
        .setFooter({ text: 'Ranking aktualizuje się na żywo' });

      const medals = ['🥇', '🥈', '🥉'];
      
      for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const rank = calculateRank(user.total_points);
        const medal = i < 3 ? medals[i] : `**${i + 1}.**`;
        
        try {
          const discordUser = await interaction.client.users.fetch(user.user_id);
          embed.addFields({
            name: `${medal} ${discordUser.username}`,
            value: `${rank.emoji} ${rank.name} • ${formatPoints(user.total_points)} punktów • Balans: ${formatPoints(user.balance)}`,
            inline: false
          });
        } catch (error) {
          embed.addFields({
            name: `${medal} Użytkownik nieznany`,
            value: `${rank.emoji} ${rank.name} • ${formatPoints(user.total_points)} punktów`,
            inline: false
          });
        }
      }

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in ranking command:', error);
      await interaction.reply({
        content: '❌ Wystąpił błąd podczas pobierania rankingu.',
        ephemeral: true
      });
    }
  }
};
