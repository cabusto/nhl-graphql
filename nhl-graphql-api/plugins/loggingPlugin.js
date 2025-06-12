/**
 * Apollo Server plugin for logging GraphQL requests
 * Tracks endpoint name, API key validation status, and access time
 */

// Track operation counts for basic metrics
const metrics = {
    totalRequests: 0,
    requestsByEndpoint: {},
    errors: 0,
    lastReset: Date.now()
};

// Reset metrics every 24 hours
setInterval(() => {
    console.log('Resetting metrics...');
    console.log(`Total requests in the last 24h: ${metrics.totalRequests}`);
    console.log('Requests by endpoint:', metrics.requestsByEndpoint);
    metrics.totalRequests = 0;
    metrics.requestsByEndpoint = {};
    metrics.errors = 0;
    metrics.lastReset = Date.now();
}, 24 * 60 * 60 * 1000);

// Helper to extract the operation name from the GraphQL query
function extractEndpointName(request) {
    const operationName = request.operationName || 'anonymous';
    const query = request.query || '';

    // If operationName is provided, use it
    if (operationName !== 'anonymous') {
        return operationName;
    }

    // Otherwise try to extract the first query field name
    const queryMatch = query.match(/{\s*([a-zA-Z0-9_]+)/);
    return queryMatch && queryMatch[1] ? queryMatch[1] : 'unknown';
}

// Create the logging plugin
const loggingPlugin = {
    async requestDidStart(requestContext) {
        const startTime = Date.now();
        const endpoint = extractEndpointName(requestContext.request);

        // Update metrics
        metrics.totalRequests++;
        metrics.requestsByEndpoint[endpoint] = (metrics.requestsByEndpoint[endpoint] || 0) + 1;

        console.log(`[${new Date().toISOString()}] Request started: ${endpoint}`);

        // Return handlers for the request lifecycle
        return {
            // Log when a parsing error occurs
            async didEncounterErrors(requestContext) {
                metrics.errors++;
                const duration = Date.now() - startTime;
                console.error(`[${new Date().toISOString()}] Request failed: ${endpoint}
  - Duration: ${duration}ms
  - Errors: ${requestContext.errors.map(err => err.message).join(', ')}`);
            },

            // Log before sending the response
            async willSendResponse(responseContext) {
                const duration = Date.now() - startTime;
                const { customer, apiKey, error } = responseContext.contextValue || {};
                const keyValid = !!customer;

                // Record metrics for this request
                if (error) metrics.errors++;

                console.log(`[${new Date().toISOString()}] Request completed: ${endpoint}
  - Duration: ${duration}ms
  - API Key: ${apiKey ? `${apiKey.substring(0, 6)}...` : 'none'} 
  - Valid: ${keyValid}
  - User: ${customer?.name || 'Anonymous'}
  - Plan: ${customer?.plan || 'N/A'}
  - Error: ${error || 'None'}`);
            }
        };
    }
};

// Export the plugin
module.exports = loggingPlugin;

// Export metrics accessor if needed
module.exports.getMetrics = () => ({ ...metrics });