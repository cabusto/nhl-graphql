const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const { typeDefs, resolvers } = require('../index');

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
});

module.exports = startServerAndCreateNextHandler(server);