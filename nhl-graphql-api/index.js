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

  type Query {
    games: [Game]
    upcomingGames: [Game]
    gamesByDateRange(startDate: String!, endDate: String!, team: String): [Game]
    team(name: String!): Team
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