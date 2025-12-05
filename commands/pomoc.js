import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pomoc')
    .setDescription('Wyświetla listę dostępnych komend i informacje o bocie'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🤖 Pomoc - System Zakładów Piłkarskich')
      .setDescription('Witaj w systemie zakładów piłkarskich! Oto dostępne komendy:')
      .addFields(
        {
          name: '💰 `/balance`',
          value: 'Sprawdź swój balans punktów, rangę i postęp do następnego poziomu.',
          inline: false
        },
        {
          name: '⚽ `/mecze`',
          value: 'Zobacz listę nadchodzących meczów piłkarskich z możliwością obstawiania.',
          inline: false
        },
        {
          name: '🎲 `/postaw`',
          value: 'Postaw zakład na konkretny mecz (alternatywnie użyj przycisków w `/mecze`).',
          inline: false
        },
        {
          name: '📊 `/zakłady`',
          value: 'Zobacz swoje aktywne zakłady i ich status.',
          inline: false
        },
        {
          name: '📈 `/statystyki`',
          value: 'Zobacz swoje statystyki zakładów (wygrane, przegrane, skuteczność).',
          inline: false
        },
        {
          name: '🏆 `/ranking`',
          value: 'Zobacz ranking TOP 10 graczy według łącznej sumy punktów.',
          inline: false
        },
        {
          name: '❓ `/pomoc`',
          value: 'Wyświetla tę wiadomość pomocy.',
          inline: false
        },
        {
          name: '\u200b',
          value: '\u200b',
          inline: false
        },
        {
          name: '📈 Jak zdobywać punkty?',
          value: '• **Wiadomości**: 1 punkt co 5 minut za aktywność na czacie\n' +
                '• **Kanał głosowy**: 1 punkt za każde 5 minut aktywności głosowej\n' +
                '• Punkty są przyznawane automatycznie i cicho (bez powiadomień)',
          inline: false
        },
        {
          name: '🏆 System Rang',
          value: 'Rangi oparte na **całkowitej sumie zdobytych punktów**:\n' +
                '🥉 Brąz (0) → 🥈 Srebro (100) → 🥇 Złoto (500) → 💎 Platyna (1,500) → ' +
                '💠 Diament (5,000) → 👑 Mistrz (10,000) → ⚡ Legenda (25,000)',
          inline: false
        },
        {
          name: '🎯 Zakłady',
          value: '• Minimalna stawka: **10 punktów**\n' +
                '• Typy: Wygrana gospodarzy, Remis, Wygrana gości\n' +
                '• Zakłady są automatycznie rozliczane po zakończeniu meczu\n' +
                '• Wygrane są dodawane do balansu automatycznie',
          inline: false
        }
      )
      .setTimestamp()
      .setFooter({ text: 'Powodzenia z zakładami! ⚽🎲' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
