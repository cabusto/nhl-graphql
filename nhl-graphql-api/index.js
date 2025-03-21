const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const fs = require('fs');
const path = require('path');

// Define your type definitions (schema)
const typeDefs = `
  type Game {
    GameID: Int
    Season: Int
    SeasonType: Int
    Status: String
    Day: String
    DateTime: String
    Updated: String
    IsClosed: Boolean
    AwayTeam: Team
    HomeTeam: Team
    StadiumID: Int
    AwayTeamScore: Int
    HomeTeamScore: Int
    GlobalGameID: Int
    GlobalAwayTeamID: Int
    GlobalHomeTeamID: Int
    GameEndDateTime: String
    NeutralVenue: Boolean
    DateTimeUTC: String
    AwayTeamID: Int
    HomeTeamID: Int
  }

  type Team {
    TeamID: Int
    Name: String
  }

  type GameOpponent {
    opponent: String
    gameDate: String
  }

  type TeamGameCount {
    teamName: String
    gameCount: Int
    homeGames: [GameOpponent]
    awayGames: [GameOpponent]
  }

  type Query {
    games: [Game]
    upcomingGames: [Game]
    gamesByDateRange(startDate: String!, endDate: String!, team: String): [Game]
    team(name: String!): Team
    todaysGames: [Game]
    yesterdayGames: [Game]
    weeklyGameCount(weekNumber: Int!, year: Int): [TeamGameCount]
  }
`;

// URL of your hosted JSON file on GitHub
const JSON_URL = "https://raw.githubusercontent.com/cabusto/nhl-graphql/refs/heads/main/raw.json";
// Cache for JSON data
let gamesCache = null;
let lastFetchTime = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

const getGames = async () => {
  const now = Date.now();

  // Check if cache is valid
  if (gamesCache && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
    return gamesCache;
  }

  try {
    const fetch = await import('node-fetch').then(mod => mod.default);
    const response = await fetch(JSON_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    gamesCache = data;
    lastFetchTime = now;
    console.log('Successfully loaded games data from remote URL');
    return gamesCache;
  } catch (error) {
    console.error('Error fetching games data from remote URL:', error);

    // Fallback to local file if remote fetch fails
    try {
      console.log('Attempting to load data from local file as fallback...');
      const rawData = fs.readFileSync(path.join(__dirname, 'raw.json'));
      gamesCache = JSON.parse(rawData);
      lastFetchTime = now;
      return gamesCache;
    } catch (fallbackError) {
      console.error('Error loading games data from local fallback:', fallbackError);
      return [];
    }
  }
};

// Define your resolvers
const resolvers = {
  Query: {
    games: async () => await getGames(),
    upcomingGames: async () => {
      const games = await getGames();
      return games.filter(game => !game.IsClosed);
    },
    gamesByDateRange: async (_, { startDate, endDate, team }) => {
      const games = await getGames();
      const start = new Date(startDate);
      const end = new Date(endDate);

      return games.filter(game => {
        const gameDate = new Date(game.Day);
        const isWithinDateRange = gameDate >= start && gameDate <= end;

        // Team filtering logic
        const isTeamMatch = !team ||
          game.HomeTeam.Name === team ||
          game.AwayTeam.Name === team;

        return isWithinDateRange && isTeamMatch;
      });
    },
    team: async (_, { name }) => {
      const games = await getGames();
      const teamGame = games.find(game =>
        game.HomeTeam.Name === name ||
        game.AwayTeam.Name === name
      );

      if (teamGame) {
        const teamID = teamGame.HomeTeam.Name === name ?
          teamGame.HomeTeamID :
          teamGame.AwayTeamID;

        return {
          TeamID: teamID,
          Name: name
        };
      }
      return null;
    },
    todaysGames: async () => {
      const games = await getGames();
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      return games.filter(game => {
        const gameDate = new Date(game.Day);
        const gameDateString = gameDate.toISOString().split('T')[0];
        return gameDateString === todayString;
      });
    },
    yesterdayGames: async () => {
      const games = await getGames();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      return games.filter(game => {
        const gameDate = new Date(game.Day);
        const gameDateString = gameDate.toISOString().split('T')[0];
        return gameDateString === yesterdayString;
      });
    },
    weeklyGameCount: async (_, { weekNumber, year }) => {
      const games = await getGames();
      const currentYear = year || new Date().getFullYear();

      // Get first day of the year
      const firstDayOfYear = new Date(currentYear, 0, 1);

      // Calculate the first day of the requested week
      // Adjust to the Monday of week 1, which might be in the previous year
      const firstMondayOfYear = new Date(firstDayOfYear);
      firstMondayOfYear.setDate(firstDayOfYear.getDate() + (8 - firstDayOfYear.getDay()) % 7);

      // Calculate start date (Monday) of the requested week
      const startDate = new Date(firstMondayOfYear);
      startDate.setDate(firstMondayOfYear.getDate() + (weekNumber - 1) * 7);

      // Calculate end date (Sunday) of the requested week
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      // Filter games in the specified week
      const weeklyGames = games.filter(game => {
        const gameDate = new Date(game.Day);
        return gameDate >= startDate && gameDate <= endDate;
      });

      // Initialize team data structure
      const teamData = {};

      weeklyGames.forEach(game => {
        // Get team names with fallbacks
        const homeTeam = game.HomeTeam?.Name || game.HomeTeam || 'Unknown Home Team';
        const awayTeam = game.AwayTeam?.Name || game.AwayTeam || 'Unknown Away Team';
        const gameDate = new Date(game.Day).toISOString().split('T')[0];

        // Initialize team objects if they don't exist
        if (!teamData[homeTeam]) {
          teamData[homeTeam] = {
            teamName: homeTeam,
            gameCount: 0,
            homeGames: [],
            awayGames: []
          };
        }

        if (!teamData[awayTeam]) {
          teamData[awayTeam] = {
            teamName: awayTeam,
            gameCount: 0,
            homeGames: [],
            awayGames: []
          };
        }

        // Update counters and add game details
        teamData[homeTeam].gameCount += 1;
        teamData[homeTeam].homeGames.push({
          opponent: awayTeam,
          gameDate: gameDate
        });

        teamData[awayTeam].gameCount += 1;
        teamData[awayTeam].awayGames.push({
          opponent: homeTeam,
          gameDate: gameDate
        });
      });

      // Convert to array and sort by total game count descending
      const result = Object.values(teamData)
        .sort((a, b) => b.gameCount - a.gameCount);

      return result;
    }
  },
  Game: {
    HomeTeam: (game) => {
      // If game.HomeTeam is already an object with Name property, return as is
      if (game.HomeTeam && typeof game.HomeTeam === 'object' && game.HomeTeam.Name) {
        return game.HomeTeam;
      }
      // Otherwise create a Team object
      return { TeamID: game.HomeTeamID, Name: game.HomeTeam };
    },
    AwayTeam: (game) => {
      // If game.AwayTeam is already an object with Name property, return as is
      if (game.AwayTeam && typeof game.AwayTeam === 'object' && game.AwayTeam.Name) {
        return game.AwayTeam;
      }
      // Otherwise create a Team object
      return { TeamID: game.AwayTeamID, Name: game.AwayTeam };
    }
  }
};

// Export for reuse in API routes
module.exports = {
  typeDefs,
  resolvers,
  getGames
};

// Only create and start server if this file is run directly (not imported)
if (require.main === module) {
  // Create an Apollo Server instance for local development only
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  // Start standalone server for local development
  startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4000 }
  }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
}