import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { getUpcomingFixtures, getFixtureOdds } from '../services/footballApi.js';
import { formatDate, formatOdds } from '../utils/formatters.js';
import config from '../config.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName('mecze')
    .setDescription('Zobacz nadchodzące mecze piłkarskie'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const fixtures = await getUpcomingFixtures();
      
      if (!fixtures || fixtures.length === 0) {
        await interaction.editReply({
          content: '❌ Brak nadchodzących meczów.'
        });
        return;
      }

      // Show first 10 matches
      const matchesToShow = fixtures.slice(0, 10);
      
      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle('⚽ Nadchodzące mecze')
        .setDescription('Wybierz mecz, aby obstawić zakład')
        .setTimestamp()
        .setFooter({ text: 'System zakładów piłkarskich' });

      // Create buttons for each match (max 5 per row, max 25 total)
      const rows = [];
      let currentRow = new ActionRowBuilder();
      let buttonCount = 0;

      for (const fixture of matchesToShow) {
        const matchLabel = `${fixture.teams.home.name.substring(0, 15)} vs ${fixture.teams.away.name.substring(0, 15)}`;
        
        embed.addFields({
          name: `${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          value: `🏆 ${fixture.league.name}\n📅 ${formatDate(fixture.fixture.date)}\n🏟️ ${fixture.fixture.venue?.name || 'N/A'}`,
          inline: false
        });

        const button = new ButtonBuilder()
          .setCustomId(`bet_${fixture.fixture.id}`)
          .setLabel(matchLabel.substring(0, 80))
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚽');

        currentRow.addComponents(button);
        buttonCount++;

        if (buttonCount % 5 === 0 || buttonCount === matchesToShow.length) {
          rows.push(currentRow);
          currentRow = new ActionRowBuilder();
        }

        if (rows.length >= 5) break; // Discord limit
      }

      const response = await interaction.editReply({
        embeds: [embed],
        components: rows
      });

      // Collect button interactions
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutes
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: '❌ To nie twoja interakcja!',
            ephemeral: true
          });
          return;
        }

        const fixtureId = parseInt(i.customId.split('_')[1]);
        const fixture = fixtures.find(f => f.fixture.id === fixtureId);

        if (!fixture) {
          await i.reply({
            content: '❌ Nie znaleziono meczu.',
            ephemeral: true
          });
          return;
        }

        // Show betting options for this match
        await showBettingOptions(i, fixture);
      });

      collector.on('end', () => {
        // Disable all buttons after timeout
        rows.forEach(row => {
          row.components.forEach(button => button.setDisabled(true));
        });
        
        interaction.editReply({ components: rows }).catch(() => {});
      });

    } catch (error) {
      console.error('Error in mecze command:', error);
      await interaction.editReply({
        content: '❌ Wystąpił błąd podczas pobierania meczów.'
      });
    }
  }
};

async function showBettingOptions(interaction, fixture) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const odds = await getFixtureOdds(fixture.fixture.id);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('⚽ Obstawianie meczu')
      .setDescription(`**${fixture.teams.home.name}** vs **${fixture.teams.away.name}**`)
      .addFields(
        {
          name: '🏆 Liga',
          value: fixture.league.name,
          inline: true
        },
        {
          name: '📅 Data',
          value: formatDate(fixture.fixture.date),
          inline: true
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: true
        },
        {
          name: '🏠 Wygrana gospodarzy',
          value: `Kurs: **${formatOdds(odds.home)}**`,
          inline: true
        },
        {
          name: '🤝 Remis',
          value: `Kurs: **${formatOdds(odds.draw)}**`,
          inline: true
        },
        {
          name: '✈️ Wygrana gości',
          value: `Kurs: **${formatOdds(odds.away)}**`,
          inline: true
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Wybierz typ zakładu poniżej' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`place_bet_${fixture.fixture.id}_home_${odds.home}`)
          .setLabel('Wygrana gospodarzy')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🏠'),
        new ButtonBuilder()
          .setCustomId(`place_bet_${fixture.fixture.id}_draw_${odds.draw}`)
          .setLabel('Remis')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🤝'),
        new ButtonBuilder()
          .setCustomId(`place_bet_${fixture.fixture.id}_away_${odds.away}`)
          .setLabel('Wygrana gości')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✈️')
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });

  } catch (error) {
    console.error('Error showing betting options:', error);
    await interaction.editReply({
      content: '❌ Wystąpił błąd podczas wyświetlania opcji zakładów.'
    });
  }
}
