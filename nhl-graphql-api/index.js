const { ApolloServer, gql } = require('apollo-server');
const fs = require('fs');
const path = require('path');

// Define your type definitions (schema)
const typeDefs = gql`
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

  type TeamGameCount {
    teamName: String
    gameCount: Int
  }

  type Query {
    games: [Game]
    upcomingGames: [Game]
    gamesByDateRange(startDate: String!, endDate: String!, team: String): [Game]
    team(name: String!): Team
    todaysGames: [Game]
    weeklyGameCount(weekNumber: Int!, year: Int): [TeamGameCount]
  }
`;

// Cache for JSON data
let gamesCache = null;
const getGames = () => {
  if (!gamesCache) {
    try {
      const rawData = fs.readFileSync(path.join(__dirname, '../scripts/raw.json'));
      gamesCache = JSON.parse(rawData);
    } catch (error) {
      console.error('Error loading games data:', error);
      return [];
    }
  }
  return gamesCache;
};

// Define your resolvers
const resolvers = {
  Query: {
    games: () => getGames(),
    upcomingGames: () => {
      const games = getGames();
      return games.filter(game => !game.IsClosed);
    },
    gamesByDateRange: (_, { startDate, endDate, team }) => {
      const games = getGames();
      const start = new Date(startDate);
      const end = new Date(endDate);

      return games.filter(game => {
        const gameDate = new Date(game.Day);
        const isWithinDateRange = gameDate >= start && gameDate <= end;

        // Fixed team filtering logic
        const isTeamMatch = !team ||
          game.HomeTeam.Name === team ||
          game.AwayTeam.Name === team;

        return isWithinDateRange && isTeamMatch;
      });
    },
    team: (_, { name }) => {
      const games = getGames();
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
    todaysGames: () => {
      const games = getGames();
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

      return games.filter(game => {
        const gameDate = new Date(game.Day);
        const gameDateString = gameDate.toISOString().split('T')[0];
        return gameDateString === todayString;
      });
    },
    weeklyGameCount: (_, { weekNumber, year }) => {
      const games = getGames();
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

      // Count games per team
      const teamGameCounts = {};

      weeklyGames.forEach(game => {
        // Debug: log the first game object to see its structure
        if (weeklyGames.indexOf(game) === 0) {
          console.log('Sample game object structure:', JSON.stringify(game, null, 2));
        }

        // Use safer access with optional chaining and fallbacks
        const homeTeam = game.HomeTeam?.Name || game.HomeTeam || 'Unknown Home Team';
        const awayTeam = game.AwayTeam?.Name || game.AwayTeam || 'Unknown Away Team';

        console.log(`Processing game: Home team=${homeTeam}, Away team=${awayTeam}`);

        teamGameCounts[homeTeam] = (teamGameCounts[homeTeam] || 0) + 1;
        teamGameCounts[awayTeam] = (teamGameCounts[awayTeam] || 0) + 1;
      });

      // Debug the teamGameCounts object
      console.log('Team game counts object:', JSON.stringify(teamGameCounts, null, 2));

      // Convert to array of objects and sort by game count descending
      const result = Object.keys(teamGameCounts).map(teamName => {
        const count = teamGameCounts[teamName];
        console.log(`Creating result for team ${teamName} with count ${count}`);

        return {
          teamName,
          gameCount: count
        };
      }).sort((a, b) => b.gameCount - a.gameCount);

      // Debug the final result
      console.log('Final result array:', JSON.stringify(result, null, 2));

      return result;
    }
  },
  Game: {
    HomeTeam: (game) => {
      return { TeamID: game.HomeTeamID, Name: game.HomeTeam };
    },
    AwayTeam: (game) => {
      return { TeamID: game.AwayTeamID, Name: game.AwayTeam };
    }
  }
};

// Create an Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: process.env.NODE_ENV !== 'production',
  playground: process.env.NODE_ENV !== 'production'
});

// Start the server
const port = process.env.PORT || 4000;
server.listen(port).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});