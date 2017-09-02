/**
 * Created by pubudud on 8/30/17.
 */

/**
 * This module does all the parsing and modifying the query tasks
 */
class QueryBuilder {

    /**
     * Constructor
     */
    constructor() {
        this.middleware = [];
    }

    /**
     * Save a middleware to be used before executing a query
     * @param {string} key - field of the options object that will be used to identify applicable middleware
     * @param {Object} middleware - actual query modifying middleware
     */
    use(key, middleware) {
        this.middleware.push({key, middleware});
    }

    /**
     * Remove a middleware from the list using given key
     * @param {string} key - middleware key
     */
    removeMiddleware(key) {
        this.middleware = this.middleware.filter((middleware) => middleware.key !== key);
    }

    /**
     * Build merchant type check query suffix based on the dashboard and development values
     *
     * @param {Object} options - Same as the options object received by executeQuery method
     * @returns {object} - Processed QueryHandler and Args
     */
    parseQuery(options = {}) {
        // Parameter destructing
        const {query} = options;

        // If the query was not sent, we generate a new error
        if (!query) {
            const err = new Error('query cannot be undefined');
            err.appendDetails('QueryBuilder', 'parseQuery', 'QueryHandler is undefined');
            throw err;
        }

        const updatedOptions = this.applyMiddleware(options) || options;

        return {query: updatedOptions.query, args: updatedOptions.args};
    }

    /**
     * Use middleware as applicable
     * @param {Object} options - query execution configs
     * @returns {Object} <- updated options object
     */
    applyMiddleware(options) {
        return this.middleware.reduce((updatedOptions, {key, middleware}) => {
            if (options[key]) {
                return middleware(updatedOptions);
            }
            return updatedOptions;
        }, options);
    }
}

export default new QueryBuilder();
