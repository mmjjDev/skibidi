import { Events } from 'discord.js';
import { awardMessagePoints } from '../services/pointsService.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bots
    if (message.author.bot) return;
    
    // Ignore system messages
    if (message.system) return;
    
    // Ignore DMs
    if (!message.guild) return;
    
    try {
      // Award points silently (no notification to user)
      await awardMessagePoints(message.author.id, message.author);
    } catch (error) {
      console.error('Error in messageCreate event:', error);
    }
  }
};
