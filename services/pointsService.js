import { getUser, addPoints, updateLastMessagePoints, updateRank } from './database.js';
import { checkPromotion } from '../ranks/rankCalculator.js';
import { EmbedBuilder } from 'discord.js';
import config from '../config.json' with { type: 'json' };

/**
 * Award points for message (with cooldown)
 * @param {string} userId - Discord user ID
 * @param {object} discordUser - Discord user object
 * @returns {object|null} Promotion info if user was promoted
 */
export async function awardMessagePoints(userId, discordUser) {
  const user = getUser(userId);
  const now = Math.floor(Date.now() / 1000);
  const cooldownSeconds = config.messageCooldownMinutes * 60;
  
  // Check cooldown
  if (user.last_message_points && (now - user.last_message_points) < cooldownSeconds) {
    return null;
  }
  
  const oldTotalPoints = user.total_points;
  
  // Add points
  addPoints(userId, config.pointsPerMessage);
  updateLastMessagePoints(userId, now);
  
  const updatedUser = getUser(userId);
  
  // Check for rank promotion
  const promotion = checkPromotion(oldTotalPoints, updatedUser.total_points);
  
  if (promotion) {
    updateRank(userId, promotion.name);
    
    // Send DM notification
    try {
      const embed = new EmbedBuilder()
        .setColor(promotion.color)
        .setTitle(`${promotion.emoji} Awans na nową rangę!`)
        .setDescription(`Gratulacje! Właśnie awansowałeś na rangę **${promotion.name}**!`)
        .addFields(
          { name: 'Nowa ranga', value: `${promotion.emoji} ${promotion.name}`, inline: true },
          { name: 'Twoje punkty', value: `${updatedUser.total_points} punktów`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Gratulacje awansu!' });
      
      await discordUser.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to send promotion DM to ${userId}:`, error.message);
    }
    
    return promotion;
  }
  
  return null;
}

/**
 * Award points for voice activity
 * @param {string} userId - Discord user ID
 * @param {number} minutes - Minutes spent in voice
 * @param {object} discordUser - Discord user object
 * @returns {object|null} Promotion info if user was promoted
 */
export async function awardVoicePoints(userId, minutes, discordUser) {
  const pointsToAward = Math.floor(minutes / 5);
  
  if (pointsToAward === 0) return null;
  
  const user = getUser(userId);
  const oldTotalPoints = user.total_points;
  
  addPoints(userId, pointsToAward);
  
  const updatedUser = getUser(userId);
  
  // Check for rank promotion
  const promotion = checkPromotion(oldTotalPoints, updatedUser.total_points);
  
  if (promotion) {
    updateRank(userId, promotion.name);
    
    // Send DM notification
    try {
      const embed = new EmbedBuilder()
        .setColor(promotion.color)
        .setTitle(`${promotion.emoji} Awans na nową rangę!`)
        .setDescription(`Gratulacje! Właśnie awansowałeś na rangę **${promotion.name}**!`)
        .addFields(
          { name: 'Nowa ranga', value: `${promotion.emoji} ${promotion.name}`, inline: true },
          { name: 'Twoje punkty', value: `${updatedUser.total_points} punktów`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Gratulacje awansu!' });
      
      await discordUser.send({ embeds: [embed] });
    } catch (error) {
      console.error(`Failed to send promotion DM to ${userId}:`, error.message);
    }
    
    return promotion;
  }
  
  return null;
}
