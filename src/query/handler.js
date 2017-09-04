/**
 * Created by pubudud on 8/30/17.
 */

import worker from './worker';
import builder from './builder';
import dbManager from '../dbManager';

/**
 * This module handles and distribute work associated with single query execution tasks
 */
class QueryHandler {

    /**
     * Obtains a connection pool from the corresponding connection pool and executes any given mysql query
     *
     * @param {object} options - options object
     *      @param {string} options.query - QueryHandler to be executed
     *      @param {Array} [options.args] - Arguments to the query if it is a prepared statement
     *      @param {string} [options.pool = DEFAULT]  - Mysql connection pool
     *      @param {boolean} [options.lengthConstraint] - Whether or not the group concat max length constraint should be applied
     * @returns {Promise} - result
     */
    executeQuery(options) {
        return new Promise((resolve, reject) => {

            const connectionPool = dbManager.getConnectionPool(options.pool);

            // Check if the specified pool is a valid one
            if (!connectionPool) {
                const err = new Error('Invalid pool type');
                err.appendDetails('QueryHandler', 'executeQuery', `Pool: ${options.pool}`);
                return reject(err);
            }

            const {query, args} = builder.parseQuery(options);

            connectionPool.getConnection((err, conn) => {
                if (err) {
                    err.appendDetails('QueryHandler', 'executeQuery', '[MySQL]Error getting connection from pool');
                    return reject(err);
                }

                worker.setSession(conn, options)
                    .then(() => worker.execute(conn, query, args))
                    .then(resolve)
                    .catch((err) => {
                        err.appendDetails('QueryHandler', 'executeQuery', '[MySQL]Error setting group_concat_max_len to 55555');
                        return reject(err);
                    });
            });
        });
    }

}

export default new QueryHandler();
