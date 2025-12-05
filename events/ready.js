import { Events, ActivityType } from 'discord.js';
import { initializeDatabase } from '../services/database.js';
import { settlePendingBets } from '../services/bettingService.js';
import config from '../config.json' assert { type: 'json' };

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Zalogowano jako ${client.user.tag}`);
    
    // Initialize database
    initializeDatabase();
    
    // Set bot presence
    client.user.setActivity(config.botPresence, { type: ActivityType.Watching });
    
    // Start bet settlement checker (every 10 minutes)
    setInterval(async () => {
      try {
        console.log('🔍 Sprawdzanie zakończonych meczów...');
        const results = await settlePendingBets();
        if (results.settled > 0) {
          console.log(`✅ Rozliczono ${results.settled} zakładów (${results.wins} wygranych, ${results.losses} przegranych)`);
        }
      } catch (error) {
        console.error('Error in bet settlement:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes
    
    console.log('🎲 Bot jest gotowy do działania!');
  }
};
