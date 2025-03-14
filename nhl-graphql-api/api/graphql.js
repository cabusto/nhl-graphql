const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const fs = require('fs');
const path = require('path');

// Import your schema and resolvers
const { typeDefs, resolvers, getGames } = require('../index.js'); // Adjust if needed

// Create Apollo Server
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Required for Apollo Studio
    playground: true, // Disable built-in playground in favor of Apollo Studio
});

// Export the handler
module.exports = startServerAndCreateNextHandler(server, {
    context: async (req, res) => ({
        req,
        res,
        // Add any context you might need
    })
});