import { Events } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        
        const errorMessage = {
          content: '❌ Wystąpił błąd podczas wykonywania komendy.',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }
    
    // Handle button interactions for betting
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('place_bet_')) {
        await handleBetButton(interaction);
      }
    }
    
    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith('bet_modal_')) {
        await handleBetModal(interaction);
      }
    }
  }
};

async function handleBetButton(interaction) {
  const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
  const parts = interaction.customId.split('_');
  const fixtureId = parts[2];
  const betType = parts[3];
  const odds = parts[4];

  // Create modal for bet amount
  const modal = new ModalBuilder()
    .setCustomId(`bet_modal_${fixtureId}_${betType}_${odds}`)
    .setTitle('Postaw zakład');

  const amountInput = new TextInputBuilder()
    .setCustomId('bet_amount')
    .setLabel('Ile punktów chcesz postawić?')
    .setPlaceholder('Minimalna stawka: 10 punktów')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(10);

  const actionRow = new ActionRowBuilder().addComponents(amountInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function handleBetModal(interaction) {
  const { EmbedBuilder } = await import('discord.js');
  const { getUser } = await import('../services/database.js');
  const { placeBet } = await import('../services/bettingService.js');
  const { getFixtureById } = await import('../services/footballApi.js');
  const { formatPoints, formatOdds, createErrorEmbed } = await import('../utils/formatters.js');

  const parts = interaction.customId.split('_');
  const fixtureId = parseInt(parts[2]);
  const betType = parts[3];
  const odds = parseFloat(parts[4]);

  const amount = parseInt(interaction.fields.getTextInputValue('bet_amount'));

  if (isNaN(amount) || amount < 10) {
    await interaction.reply({
      embeds: [createErrorEmbed('Minimalna stawka to 10 punktów!')],
      ephemeral: true
    });
    return;
  }

  const userId = interaction.user.id;
  const user = getUser(userId);

  if (user.balance < amount) {
    await interaction.reply({
      embeds: [createErrorEmbed(`Nie masz wystarczającej ilości punktów!\nTwój balans: **${formatPoints(user.balance)}** punktów`)],
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const fixture = await getFixtureById(fixtureId);

  if (!fixture) {
    await interaction.editReply({
      embeds: [createErrorEmbed('Nie znaleziono meczu.')]
    });
    return;
  }

  const potentialWin = amount * odds;

  const result = placeBet(userId, {
    matchId: `${fixture.teams.home.name}_vs_${fixture.teams.away.name}`,
    fixtureId,
    betType,
    amount,
    odds,
    potentialWin
  });

  if (!result.success) {
    await interaction.editReply({
      embeds: [createErrorEmbed(result.message)]
    });
    return;
  }

  const betTypeNames = {
    home: 'Wygrana gospodarzy 🏠',
    draw: 'Remis 🤝',
    away: 'Wygrana gości ✈️'
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
        value: formatOdds(odds),
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
}
