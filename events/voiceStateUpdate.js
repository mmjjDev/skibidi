import { Events } from 'discord.js';
import { trackVoiceJoin, trackVoiceLeave } from '../services/database.js';
import { awardVoicePoints } from '../services/pointsService.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      const userId = newState.member.id;
      
      // User joined a voice channel
      if (!oldState.channelId && newState.channelId) {
        trackVoiceJoin(userId, newState.channelId);
        console.log(`👤 ${newState.member.user.tag} dołączył do kanału głosowego`);
      }
      
      // User left a voice channel
      if (oldState.channelId && !newState.channelId) {
        const pointsAwarded = trackVoiceLeave(userId);
        
        if (pointsAwarded > 0) {
          console.log(`✅ ${oldState.member.user.tag} otrzymał ${pointsAwarded} punktów za aktywność głosową`);
          
          // Check for rank promotion
          await awardVoicePoints(userId, pointsAwarded * 5, newState.member.user);
        }
      }
      
      // User switched voice channels
      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        const pointsAwarded = trackVoiceLeave(userId);
        
        if (pointsAwarded > 0) {
          console.log(`✅ ${oldState.member.user.tag} otrzymał ${pointsAwarded} punktów za aktywność głosową`);
          await awardVoicePoints(userId, pointsAwarded * 5, newState.member.user);
        }
        
        trackVoiceJoin(userId, newState.channelId);
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate event:', error);
    }
  }
};
