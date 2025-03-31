const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateNextHandler } = require('@as-integrations/next');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const { typeDefs, resolvers } = require('../index');
const { getCustomerByApiKey, checkRateLimit } = require('../auth');

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

// Export the Next.js API handler with auth context
module.exports = startServerAndCreateNextHandler(server, {
    context: async (req) => {
        // Get the API key from the Authorization header
        const apiKey = req.headers.authorization?.replace(/bearer\s+/i, '') || '';

        if (!apiKey) {
            throw new Error('API key is required');
        }

        // Verify the API key against Firebase
        const customer = await getCustomerByApiKey(apiKey);
        console.log('Checking customer from firebase:', customer);

        if (!customer) {
            throw new Error('Invalid API key');
        }

        // Check rate limits
        const withinLimits = await checkRateLimit(customer);
        if (!withinLimits) {
            throw new Error('Rate limit exceeded for your plan');
        }

        // Add customer info to the context
        return {
            customer,
            apiKey
        };
    }
});