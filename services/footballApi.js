import axios from 'axios';
import config from '../config.json' assert { type: 'json' };

const API_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

// For development/testing, we'll use a fallback that doesn't require API key
const USE_MOCK_DATA = !process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here';

/**
 * Get upcoming fixtures for supported competitions
 * @returns {Promise<array>} Array of fixtures
 */
export async function getUpcomingFixtures() {
  if (USE_MOCK_DATA) {
    return getMockFixtures();
  }

  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const from = today.toISOString().split('T')[0];
    const to = nextWeek.toISOString().split('T')[0];
    
    const fixtures = [];
    
    for (const leagueId of config.supportedCompetitions) {
      const response = await axios.get(`${API_BASE_URL}/fixtures`, {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        },
        params: {
          league: leagueId,
          from,
          to,
          timezone: 'Europe/Warsaw'
        }
      });
      
      if (response.data.response) {
        fixtures.push(...response.data.response);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return fixtures.slice(0, 25); // Limit to 25 matches
  } catch (error) {
    console.error('Error fetching fixtures:', error.message);
    return getMockFixtures();
  }
}

/**
 * Get fixture by ID
 * @param {number} fixtureId - Fixture ID
 * @returns {Promise<object>} Fixture data
 */
export async function getFixtureById(fixtureId) {
  if (USE_MOCK_DATA) {
    const fixtures = getMockFixtures();
    return fixtures.find(f => f.fixture.id === fixtureId) || null;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/fixtures`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      params: {
        id: fixtureId
      }
    });
    
    return response.data.response[0] || null;
  } catch (error) {
    console.error('Error fetching fixture:', error.message);
    return null;
  }
}

/**
 * Get odds for a fixture
 * @param {number} fixtureId - Fixture ID
 * @returns {Promise<object>} Odds data
 */
export async function getFixtureOdds(fixtureId) {
  if (USE_MOCK_DATA) {
    return {
      home: 2.10,
      draw: 3.40,
      away: 3.20
    };
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/odds`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      },
      params: {
        fixture: fixtureId,
        bet: 1 // Match Winner
      }
    });
    
    if (response.data.response && response.data.response[0]) {
      const bookmaker = response.data.response[0].bookmakers[0];
      const bet = bookmaker.bets.find(b => b.name === 'Match Winner');
      
      if (bet && bet.values) {
        return {
          home: parseFloat(bet.values.find(v => v.value === 'Home')?.odd || '2.00'),
          draw: parseFloat(bet.values.find(v => v.value === 'Draw')?.odd || '3.00'),
          away: parseFloat(bet.values.find(v => v.value === 'Away')?.odd || '2.00')
        };
      }
    }
    
    // Default odds if not available
    return {
      home: 2.00,
      draw: 3.00,
      away: 2.00
    };
  } catch (error) {
    console.error('Error fetching odds:', error.message);
    return {
      home: 2.00,
      draw: 3.00,
      away: 2.00
    };
  }
}

/**
 * Check if match is finished and get result
 * @param {number} fixtureId - Fixture ID
 * @returns {Promise<object|null>} Result object or null if not finished
 */
export async function checkMatchResult(fixtureId) {
  const fixture = await getFixtureById(fixtureId);
  
  if (!fixture) return null;
  
  if (fixture.fixture.status.short !== 'FT') {
    return null; // Match not finished
  }
  
  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;
  
  let winner = 'draw';
  if (homeGoals > awayGoals) {
    winner = 'home';
  } else if (awayGoals > homeGoals) {
    winner = 'away';
  }
  
  return {
    finished: true,
    winner,
    score: `${homeGoals}:${awayGoals}`
  };
}

/**
 * Get mock fixtures for testing/development
 * @returns {array} Mock fixtures
 */
function getMockFixtures() {
  const now = Date.now();
  const fixtures = [];
  
  const teams = [
    { name: 'Manchester City', logo: '⚽' },
    { name: 'Liverpool', logo: '⚽' },
    { name: 'Real Madrid', logo: '⚽' },
    { name: 'Barcelona', logo: '⚽' },
    { name: 'Bayern Munich', logo: '⚽' },
    { name: 'PSG', logo: '⚽' },
    { name: 'Inter Milan', logo: '⚽' },
    { name: 'AC Milan', logo: '⚽' },
    { name: 'Legia Warszawa', logo: '⚽' },
    { name: 'Lech Poznań', logo: '⚽' }
  ];
  
  for (let i = 0; i < 10; i++) {
    const home = teams[i];
    const away = teams[(i + 1) % teams.length];
    const matchDate = new Date(now + (i + 1) * 24 * 60 * 60 * 1000);
    
    fixtures.push({
      fixture: {
        id: 1000 + i,
        date: matchDate.toISOString(),
        status: {
          short: 'NS',
          long: 'Not Started'
        },
        venue: {
          name: `Stadium ${i + 1}`
        }
      },
      league: {
        id: config.supportedCompetitions[i % config.supportedCompetitions.length],
        name: config.supportedCompetitionNames[config.supportedCompetitions[i % config.supportedCompetitions.length]],
        country: 'Various',
        logo: '🏆'
      },
      teams: {
        home: {
          id: 100 + i,
          name: home.name,
          logo: home.logo
        },
        away: {
          id: 200 + i,
          name: away.name,
          logo: away.logo
        }
      },
      goals: {
        home: null,
        away: null
      }
    });
  }
  
  return fixtures;
}

export default {
  getUpcomingFixtures,
  getFixtureById,
  getFixtureOdds,
  checkMatchResult
};
