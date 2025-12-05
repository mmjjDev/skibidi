import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import { getUser } from '../services/database.js';
import { placeBet } from '../services/bettingService.js';
import { getFixtureById } from '../services/footballApi.js';
import { formatPoints, formatOdds, createErrorEmbed, createSuccessEmbed } from '../utils/formatters.js';

export default {
  data: new SlashCommandBuilder()
    .setName('postaw')
    .setDescription('Postaw zakład na mecz')
    .addIntegerOption(option =>
      option
        .setName('mecz_id')
        .setDescription('ID meczu (z /mecze)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('typ')
        .setDescription('Typ zakładu')
        .setRequired(true)
        .addChoices(
          { name: 'Wygrana gospodarzy', value: 'home' },
          { name: 'Remis', value: 'draw' },
          { name: 'Wygrana gości', value: 'away' }
        )
    )
    .addIntegerOption(option =>
      option
        .setName('stawka')
        .setDescription('Ilość punktów do postawienia (min. 10)')
        .setRequired(true)
        .setMinValue(10)
    ),

  async execute(interaction) {
    try {
      const fixtureId = interaction.options.getInteger('mecz_id');
      const betType = interaction.options.getString('typ');
      const amount = interaction.options.getInteger('stawka');
      const userId = interaction.user.id;

      await interaction.deferReply({ ephemeral: true });

      // Get user balance
      const user = getUser(userId);

      if (user.balance < amount) {
        await interaction.editReply({
          embeds: [createErrorEmbed(`Nie masz wystarczającej ilości punktów!\nTwój balans: **${formatPoints(user.balance)}** punktów`)]
        });
        return;
      }

      // Get fixture details
      const fixture = await getFixtureById(fixtureId);

      if (!fixture) {
        await interaction.editReply({
          embeds: [createErrorEmbed('Nie znaleziono meczu o podanym ID.')]
        });
        return;
      }

      // Check if match hasn't started yet
      if (fixture.fixture.status.short !== 'NS' && fixture.fixture.status.short !== 'TBD') {
        await interaction.editReply({
          embeds: [createErrorEmbed('Ten mecz już się rozpoczął lub zakończył!')]
        });
        return;
      }

      // Get odds (simplified - you should get real odds from API)
      const odds = {
        home: 2.10,
        draw: 3.40,
        away: 3.20
      };

      const betOdds = odds[betType];
      const potentialWin = amount * betOdds;

      // Place the bet
      const result = placeBet(userId, {
        matchId: `${fixture.teams.home.name}_vs_${fixture.teams.away.name}`,
        fixtureId,
        betType,
        amount,
        odds: betOdds,
        potentialWin
      });

      if (!result.success) {
        await interaction.editReply({
          embeds: [createErrorEmbed(result.message)]
        });
        return;
      }

      // Success embed
      const betTypeNames = {
        home: 'Wygrana gospodarzy',
        draw: 'Remis',
        away: 'Wygrana gości'
      };

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Zakład postawiony!')
        .setDescription(`**${fixture.teams.home.name}** vs **${fixture.teams.away.name}**`)
        .addFields(
          {
            name: '🎯 Typ zakładu',
            value: betTypeNames[betType],
            inline: true
          },
          {
            name: '💰 Stawka',
            value: `${formatPoints(amount)} punktów`,
            inline: true
          },
          {
            name: '📊 Kurs',
            value: formatOdds(betOdds),
            inline: true
          },
          {
            name: '🎁 Potencjalna wygrana',
            value: `${formatPoints(Math.floor(potentialWin))} punktów`,
            inline: true
          },
          {
            name: '💎 Nowy balans',
            value: `${formatPoints(user.balance - amount)} punktów`,
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({ text: 'Powodzenia!' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in postaw command:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Wystąpił błąd podczas stawiania zakładu.')]
      });
    }
  }
};
