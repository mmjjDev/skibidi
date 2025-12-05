import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser } from '../services/database.js';
import { calculateRank, getNextRank } from '../ranks/rankCalculator.js';
import { formatPoints } from '../utils/formatters.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Sprawdź swój balans punktów i rangę'),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const user = getUser(userId);
      
      const currentRank = calculateRank(user.total_points);
      const nextRank = getNextRank(user.total_points);
      
      const embed = new EmbedBuilder()
        .setColor(currentRank.color)
        .setTitle('💰 Twój Balans')
        .setDescription(`Witaj, ${interaction.user.username}!`)
        .addFields(
          {
            name: '💎 Obecny balans',
            value: `**${formatPoints(user.balance)}** punktów`,
            inline: true
          },
          {
            name: '📊 Suma punktów',
            value: `**${formatPoints(user.total_points)}** punktów`,
            inline: true
          },
          {
            name: '\u200b',
            value: '\u200b',
            inline: true
          },
          {
            name: '🏆 Twoja ranga',
            value: `${currentRank.emoji} **${currentRank.name}**`,
            inline: true
          }
        )
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
        .setFooter({ text: 'System punktów' });
      
      if (nextRank) {
        const pointsNeeded = nextRank.threshold - user.total_points;
        embed.addFields({
          name: '⬆️ Następna ranga',
          value: `${nextRank.emoji} **${nextRank.name}**\nPotrzebujesz jeszcze **${formatPoints(pointsNeeded)}** punktów`,
          inline: true
        });
      } else {
        embed.addFields({
          name: '👑 Status',
          value: '**Maksymalna ranga!**\nJesteś na szczycie!',
          inline: true
        });
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error in balance command:', error);
      await interaction.reply({
        content: '❌ Wystąpił błąd podczas sprawdzania balansu.',
        ephemeral: true
      });
    }
  }
};
