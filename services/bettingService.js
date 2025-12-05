import { getUser, updateBalance, createBet, getUserActiveBets, getAllPendingBets, settleBet } from './database.js';
import { checkMatchResult } from './footballApi.js';

/**
 * Place a bet
 * @param {string} userId - Discord user ID
 * @param {object} betData - Bet data
 * @returns {object} Result object with success status and message
 */
export function placeBet(userId, betData) {
  const user = getUser(userId);
  
  // Check if user has enough balance
  if (user.balance < betData.amount) {
    return {
      success: false,
      message: 'Nie masz wystarczającej ilości punktów!'
    };
  }
  
  // Check minimum bet
  if (betData.amount < 10) {
    return {
      success: false,
      message: 'Minimalna stawka to 10 punktów!'
    };
  }
  
  // Deduct bet amount from balance
  updateBalance(userId, -betData.amount);
  
  // Create bet record
  const bet = createBet({
    userId,
    matchId: betData.matchId,
    fixtureId: betData.fixtureId,
    betType: betData.betType,
    amount: betData.amount,
    odds: betData.odds,
    potentialWin: betData.amount * betData.odds
  });
  
  return {
    success: true,
    message: 'Zakład został pomyślnie postawiony!',
    bet
  };
}

/**
 * Get user's active bets with details
 * @param {string} userId - Discord user ID
 * @returns {array} Array of active bets
 */
export function getActiveBets(userId) {
  return getUserActiveBets(userId);
}

/**
 * Settle all pending bets (check if matches are finished)
 * @returns {Promise<object>} Settlement results
 */
export async function settlePendingBets() {
  const pendingBets = getAllPendingBets();
  
  const results = {
    checked: 0,
    settled: 0,
    wins: 0,
    losses: 0,
    voids: 0
  };
  
  for (const bet of pendingBets) {
    results.checked++;
    
    try {
      const matchResult = await checkMatchResult(bet.fixture_id);
      
      if (!matchResult) {
        continue; // Match not finished yet
      }
      
      // Determine bet result
      let betResult = 'loss';
      
      if (bet.bet_type === 'home' && matchResult.winner === 'home') {
        betResult = 'win';
      } else if (bet.bet_type === 'draw' && matchResult.winner === 'draw') {
        betResult = 'win';
      } else if (bet.bet_type === 'away' && matchResult.winner === 'away') {
        betResult = 'win';
      }
      
      // Settle the bet
      settleBet(bet.bet_id, betResult);
      results.settled++;
      
      if (betResult === 'win') {
        results.wins++;
      } else if (betResult === 'loss') {
        results.losses++;
      } else {
        results.voids++;
      }
      
      console.log(`✅ Settled bet ${bet.bet_id}: ${betResult} (${matchResult.score})`);
    } catch (error) {
      console.error(`Error settling bet ${bet.bet_id}:`, error.message);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Get bet type display name in Polish
 * @param {string} betType - Bet type
 * @returns {string} Display name
 */
export function getBetTypeDisplay(betType) {
  const types = {
    home: 'Wygrana gospodarzy',
    draw: 'Remis',
    away: 'Wygrana gości'
  };
  return types[betType] || betType;
}

export default {
  placeBet,
  getActiveBets,
  settlePendingBets,
  getBetTypeDisplay
};
