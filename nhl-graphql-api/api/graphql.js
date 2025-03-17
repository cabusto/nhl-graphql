const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { typeDefs, resolvers } = require('../index');

// Create a new Apollo Server instance for the API route
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
        ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            includeCookies: true
        })
    ]
});

// Export the Next.js API handler
module.exports = startServerAndCreateNextHandler(server);