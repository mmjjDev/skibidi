import rankThresholds from './thresholds.js';

/**
 * Calculate user's rank based on total points
 * @param {number} totalPoints - Total lifetime points earned
 * @returns {object} Rank object with name, emoji, threshold, color
 */
export function calculateRank(totalPoints) {
  // Find the highest rank the user qualifies for
  let currentRank = rankThresholds[0];
  
  for (const rank of rankThresholds) {
    if (totalPoints >= rank.threshold) {
      currentRank = rank;
    } else {
      break;
    }
  }
  
  return currentRank;
}

/**
 * Get the next rank after current total points
 * @param {number} totalPoints - Current total points
 * @returns {object|null} Next rank object or null if at max rank
 */
export function getNextRank(totalPoints) {
  for (const rank of rankThresholds) {
    if (totalPoints < rank.threshold) {
      return rank;
    }
  }
  return null; // User is at max rank
}

/**
 * Check if user should be promoted
 * @param {number} oldTotalPoints - Previous total points
 * @param {number} newTotalPoints - New total points
 * @returns {object|null} New rank if promoted, null otherwise
 */
export function checkPromotion(oldTotalPoints, newTotalPoints) {
  const oldRank = calculateRank(oldTotalPoints);
  const newRank = calculateRank(newTotalPoints);
  
  if (oldRank.threshold < newRank.threshold) {
    return newRank;
  }
  
  return null;
}
