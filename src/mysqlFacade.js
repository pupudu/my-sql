/**
 * Created by pubudud on 8/29/17.
 */

import queryHandler from './query/handler';
import transactionHandler from './transaction/handler';
import * as constants from './constants';

/**
 * Proxy module which wraps node-mysql functionality
 */
class MysqlFacade {

    /**
     *
     * @param {string|null|Object} [query] - QueryHandler to be executed
     * @param {Array|Object} [args] - Arguments to the query if it is a prepared statement
     *
     * @param {object} options - options object
     *      @param {string} options.query - QueryHandler to be executed
     *      @param {Array} [options.args] - Arguments to the query if it is a prepared statement
     *      @param {string} [options.pool = DEFAULT]  - Mysql connection pool
     *      @param {boolean} [options.lengthConstraint] - Whether or not the group concat max length constraint should be applied
     *
     * @returns {Promise} <- Query result
     */
    execute(query, args, options) {

        // Base Parameter validation
        if (!query && !args && !options) {
            const err = new Error('Invalid arguments received');
            err.appendDetails('MysqlFacade', 'execute', 'Invalid arguments received');
            return Promise.reject(err);
        }

        if (typeof args === 'object' && !Array.isArray(args)) {
            options = args;
            args = null;
        }

        if (typeof query === 'object') {
            options = query;
            args = null;
            query = null;
        }

        options = {
            ...options,
            query: query || (options || {}).query,
            args: args || (options || {}).args
        };

        return queryHandler.executeQuery(options);
    }

    /**
     * Execute a transaction with any given number of queries
     *
     * @param {Object} options - transaction options.
     *      @param {string} [options.pool] - Mysql connection pool type.
     *      @param {Object[]} options.queries - Object array of query and args pairs -> [{query: query, args:args}^n].
     *      @param {number} [options.queryCountThreshold] - Value to override the default TRANSACTION_QUERY_COUNT_THRESHOLD
     * @returns {Promise} - Transactions results as an object
     */
    executeTransaction(options) {
        // Base Parameter validation
        if (!options) {
            const err = new Error('Invalid arguments received');
            err.appendDetails('TransactionHandler', 'executeTransaction', `options:${options}`);
            return Promise.reject(err);
        }

        const queries = options.queries;

        // If at least one query was not sent, we generate a new error
        if (!queries || !queries.length) {
            const err = new Error('Queries parameter is undefined');
            err.appendDetails('TransactionHandler', 'executeTransaction', `Queries: ${queries}`);
            return Promise.reject(err);
        }

        // Currently allow maximum of 10 queries only.
        const QUERY_COUNT_THRESHOLD = options.queryCountThreshold || constants.TRANSACTION_QUERY_COUNT_THRESHOLD;

        // Check query count threshold
        // This is just an extra precaution. If test results doesn't show any issues, this constraint can be removed
        if (queries.length > QUERY_COUNT_THRESHOLD) {
            const err = new Error('QueryHandler count exceeds threshold');
            err.appendDetails('TransactionHandler', 'executeTransaction', 'QueryHandler count exceeds threshold');
            return Promise.reject(err);
        }

        return transactionHandler.executeTransaction(options);
    }

}

export default new MysqlFacade();
