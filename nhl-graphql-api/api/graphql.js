const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { typeDefs, resolvers } = require('../index');
const { getCustomerByApiKey } = require('../auth');
const loggingPlugin = require('../plugins/loggingPlugin');

// Create a new Apollo Server instance for the API route
const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [
        loggingPlugin,
        ApolloServerPluginLandingPageLocalDefault({
            embed: true,
            includeCookies: true
        })
    ]
});

// Export the Next.js API handler
module.exports = startServerAndCreateNextHandler(server, {
    context: async (req) => {
        try {
            // Log request information
            console.log(`[${new Date().toISOString()}] Incoming request to Vercel function`);

            // Special handling for GraphQL playground and introspection
            const isIntrospection = req.body?.operationName === 'IntrospectionQuery' ||
                req.body?.query?.includes('__schema');

            // Allow introspection and playground without authentication
            if (isIntrospection) {
                console.log('Allowing introspection query without authentication');
                return { customer: { name: 'Introspection', plan: 'unlimited' } };
            }

            // Get API key from header
            const apiKey = req.headers.authorization?.replace(/^bearer\s+/i, '') || '';
            console.log('API Key:', apiKey ? `${apiKey.substring(0, 6)}...` : 'none');

            // Handle no API key case
            if (!apiKey) {
                throw new Error('API key is required');
            }

            // Get customer details
            const customer = await getCustomerByApiKey(apiKey);
            console.log('Customer validation:', customer ? 'Valid' : 'Invalid');

            if (!customer) {
                throw new Error(`Invalid API key: ${apiKey.substring(0, 6)}...`);
            }

            console.log(`Authenticated user: ${customer.name}, Plan: ${customer.plan}`);
            return { customer, apiKey };
        } catch (error) {
            console.error('Authentication error:', error.message);
            throw error;
        }
    }
});